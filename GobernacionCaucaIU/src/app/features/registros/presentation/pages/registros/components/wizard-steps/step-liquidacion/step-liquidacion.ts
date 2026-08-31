import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { GeneracionLiquidacionFacade } from '../../../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ToastService } from '../../../../../../../../core/services/toast.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-step-liquidacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-liquidacion.html'
})
export class StepLiquidacionComponent implements OnInit {
  wizardService = inject(LiquidacionWizardService);
  generacionFacade = inject(GeneracionLiquidacionFacade);
  solicitudesFacade = inject(SolicitudesLiquidacionFacade);
  toast = inject(ToastService);
  router = inject(Router);

  isGenerating = signal<boolean>(false);
  isSimulating = signal<boolean>(false);
  isCompleting = signal<boolean>(false);

  todayDateFormatted = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
  fechaVencimientoFormatted = computed(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
  });

  // Hash de seguridad institucional
  codigoSeguridadHex = computed(() => {
    const rad = this.wizardService.radicadoGenerado() || 'RAD-0000';
    const id = this.wizardService.solicitudId() || 101;
    return `CAUCA-${id.toString(16).toUpperCase()}-99B2-C10E-${rad.replace(/\D/g, '') || '2026'}`;
  });

  // Código de barras estructurado GS1-128
  codigoBarrasTexto = computed(() => {
    const rad = (this.datosRadicacion().numeroRadicado || '00000000').replace(/\D/g, '').padStart(10, '0');
    const valor = Math.round(this.wizardService.liquidacionSimulada()?.granTotalPagar || 0).toString().padStart(8, '0');
    const fecha = new Date().toISOString().slice(0,10).replace(/-/g, '');
    return `(415)7709998000018(8020)${rad}(3900)${valor}(96)${fecha}`;
  });

  datosContribuyente = computed(() => this.wizardService.paso1Form.value);
  datosDocumento = computed(() => this.wizardService.paso2Form.value);
  datosRadicacion = computed(() => {
    const p1 = this.wizardService.paso1Form.value;
    return {
      numeroRadicado: this.wizardService.radicadoGenerado() || p1.numeroRadicado || 'RAD-000000',
      fechaRadicacion: p1.fechaRadicado || this.wizardService.fechaRadicado() || new Date().toISOString().split('T')[0],
      vigenciaFiscal: p1.vigenciaFiscal || 2026,
      departamento: 'Cauca (Popayán)'
    };
  });

  ngOnInit() {
    // Siempre refrescamos la simulación al entrar al Paso 5 a menos que la liquidación oficial ya haya sido generada
    if (!this.wizardService.liquidacionGeneradaExitosa()) {
      this.cargarSimulacion();
    }
  }

  cargarSimulacion() {
    const solicitudId = this.wizardService.solicitudId();
    if (!solicitudId) return;

    this.isSimulating.set(true);
    this.generacionFacade.simularLiquidacion(solicitudId).pipe(
      finalize(() => this.isSimulating.set(false))
    ).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.wizardService.liquidacionSimulada.set(res.data);
        } else {
          this.toast.error(res.message || 'Error al simular la liquidación');
        }
      },
      error: (err: any) => {
        const msg = err?.error?.message || err?.error?.detail || 'Error de servidor al simular liquidación';
        this.toast.error(msg);
      }
    });
  }

  // Lista consolidada de intervinientes
  intervinientesTotales = computed(() => {
    const actosExp = this.wizardService.actosExpediente();
    const simulacion = this.wizardService.liquidacionSimulada();
    
    const result: Array<{
      actoNombre: string;
      documento: string;
      nombre: string;
      rolNombre: string;
      porcentaje: number;
    }> = [];

    for (const acto of actosExp) {
      for (const inv of (acto.intervinientes || [])) {
        result.push({
          actoNombre: acto.tipoActoNombre,
          documento: inv.documento || 'N/A',
          nombre: inv.nombre,
          rolNombre: inv.rolNombre,
          porcentaje: inv.porcentaje
        });
      }
    }

    if (result.length === 0 && simulacion && simulacion.actos) {
      for (const acto of simulacion.actos) {
        for (const inv of (acto.intervinientes || [])) {
          result.push({
            actoNombre: acto.nombreTipoActo,
            documento: 'N/A',
            nombre: `Contribuyente #${inv.contribuyenteId || 'General'}`,
            rolNombre: inv.nombreRol || 'Interviniente',
            porcentaje: inv.porcentajeParticipacion
          });
        }
      }
    }

    return result;
  });

  // Lista consolidada de exenciones evaluadas con su estado exacto
  exencionesEvaluadasConsolidadas = computed(() => {
    const simulacion = this.wizardService.liquidacionSimulada();
    const actosExp = this.wizardService.actosExpediente();
    const list: Array<{
      actoNombre: string;
      codigo: string;
      nombre: string;
      beneficio: string;
      alcance: string;
      estado: string;
      fueAplicada: boolean;
      valorDescontado?: number;
    }> = [];

    if (simulacion && simulacion.actos) {
      for (const acto of simulacion.actos) {
        if (acto.exencionesEvaluadas && acto.exencionesEvaluadas.length > 0) {
          for (const ex of acto.exencionesEvaluadas) {
            list.push({
              actoNombre: acto.nombreTipoActo,
              codigo: ex.codigo || 'EX',
              nombre: ex.nombre,
              beneficio: ex.beneficio || 'N/A',
              alcance: ex.alcance || 'General',
              estado: ex.estado || (ex.fueAplicada ? 'APLICADA' : 'NO APLICADA'),
              fueAplicada: ex.fueAplicada === true || ex.estado === 'APLICADA',
              valorDescontado: ex.fueAplicada ? (acto.exencionAplicada?.valorDescontado || 0) : 0
            });
          }
        } else if (acto.exencionAplicada) {
            list.push({
              actoNombre: acto.nombreTipoActo,
              codigo: acto.exencionAplicada.codigo,
              nombre: acto.exencionAplicada.nombre,
              beneficio: acto.exencionAplicada.beneficio,
              alcance: acto.exencionAplicada.alcance,
              estado: 'APLICADA',
              fueAplicada: true,
              valorDescontado: acto.exencionAplicada.valorDescontado
            });
        }
      }
    }

    // Fallback con datos locales si aún no retorna lista el backend
    if (list.length === 0) {
      for (const acto of actosExp) {
        if (acto.exencionesNombres && acto.exencionesNombres.length > 0) {
          for (const exName of acto.exencionesNombres) {
            list.push({
              actoNombre: acto.tipoActoNombre,
              codigo: 'EXC',
              nombre: exName,
              beneficio: 'Según norma',
              alcance: 'Evaluada en liquidación',
              estado: 'APLICADA',
              fueAplicada: true
            });
          }
        }
      }
    }

    return list;
  });

  // Subtotal calculado
  subtotalCalculado = computed(() => {
    const sim = this.wizardService.liquidacionSimulada();
    if (!sim) return 0;
    if (sim.subtotal !== undefined && sim.subtotal !== null && sim.subtotal > 0) return sim.subtotal;
    
    return sim.actos.reduce((acc, a) => {
      const bruto = a.valorBruto ?? (a.baseCalculo * (a.tarifaAplicada / 100));
      return acc + (bruto > 0 ? bruto : (a.valorPagar + (a.valorDescontado || 0)));
    }, 0);
  });

  // Total de descuentos calculado
  totalDescuentosCalculado = computed(() => {
    const sim = this.wizardService.liquidacionSimulada();
    if (!sim) return 0;
    if (sim.totalDescuentos !== undefined && sim.totalDescuentos !== null && sim.totalDescuentos > 0) return sim.totalDescuentos;
    return sim.actos.reduce((acc, a) => acc + (a.valorDescontado || 0), 0);
  });

  retroceder() {
    this.wizardService.currentStep.set(4);
  }

  generarLiquidacionOficial() {
    const solicitudId = this.wizardService.solicitudId();
    if (!solicitudId) {
      this.toast.error('No hay solicitud para liquidar.');
      return;
    }

    this.isGenerating.set(true);
    this.generacionFacade.generarLiquidacion({ solicitudId }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.wizardService.liquidacionGeneradaExitosa.set(true);
          this.wizardService.idLiquidacionFinal.set(res.data);
          this.wizardService.estadoSolicitudId.set(4); // 4: LIQUIDADA
          this.wizardService.estadoSolicitudNombre.set('Liquidada');
          this.wizardService.etapaGuardada.set(5);
          this.toast.success(`¡Liquidación oficial generada exitosamente con radicado ${this.wizardService.radicadoGenerado()}!`);
        } else {
          this.toast.error(res.message || 'Error al generar liquidación');
        }
        this.isGenerating.set(false);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.error?.detail || 'Error de servidor al generar liquidación oficial';
        this.toast.error(errorMsg);
        this.isGenerating.set(false);
      }
    });
  }

  descargarLiquidacion() {
    const id = this.wizardService.idLiquidacionFinal();
    if (!id) return;
    
    this.isGenerating.set(true);
    this.generacionFacade.descargarPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Liquidacion_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.toast.success('Descarga iniciada');
        this.isGenerating.set(false);
      },
      error: () => {
        this.toast.error('Error al descargar el PDF');
        this.isGenerating.set(false);
      }
    });
  }

  totalEnLetras = computed(() => {
    const sim = this.wizardService.liquidacionSimulada();
    const valor = sim ? Math.round(sim.granTotalPagar) : 0;
    return this.convertirNumeroALetras(valor);
  });

  imprimirDocumento() {
    window.print();
  }

  private convertirNumeroALetras(numero: number): string {
    if (numero === 0) return 'CERO PESOS M/CTE';
    
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const diezY = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const veinteY = ['VEINTE', 'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const leerGrupo = (n: number): string => {
      let c = Math.floor(n / 100);
      let d = Math.floor((n % 100) / 10);
      let u = n % 10;
      let resultado = '';

      if (n === 100) return 'CIEN';
      if (c > 0) resultado += centenas[c] + ' ';

      if (d === 1) {
        resultado += diezY[u] + ' ';
      } else if (d === 2) {
        resultado += veinteY[u] + ' ';
      } else if (d > 2) {
        resultado += decenas[d];
        if (u > 0) resultado += ' Y ' + unidades[u];
        resultado += ' ';
      } else if (u > 0) {
        resultado += unidades[u] + ' ';
      }

      return resultado.trim();
    };

    let millones = Math.floor(numero / 1000000);
    let miles = Math.floor((numero % 1000000) / 1000);
    let unidadesCientos = numero % 1000;
    let texto = '';

    if (millones > 0) {
      if (millones === 1) texto += 'UN MILLÓN ';
      else texto += leerGrupo(millones) + ' MILLONES ';
    }

    if (miles > 0) {
      if (miles === 1) texto += 'MIL ';
      else texto += leerGrupo(miles) + ' MIL ';
    }

    if (unidadesCientos > 0) {
      texto += leerGrupo(unidadesCientos) + ' ';
    }

    return ('SON: ' + texto.trim() + ' PESOS M/CTE').toUpperCase();
  }

  irABandeja() {
    this.router.navigate(['/registros/liquidaciones']);
  }
}
