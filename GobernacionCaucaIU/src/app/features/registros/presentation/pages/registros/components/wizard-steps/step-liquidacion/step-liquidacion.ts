import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LiquidacionWizardService } from '../../../services/liquidacion-wizard.service';
import { GeneracionLiquidacionFacade } from '../../../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { SolicitudesLiquidacionFacade } from '../../../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { VigenciasFacade } from '../../../../../../application/facades/Normatividad/vigencias.facade';
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
  vigenciasFacade = inject(VigenciasFacade);
  toast = inject(ToastService);
  router = inject(Router);

  isSimulating = signal<boolean>(false);
  isCompleting = signal<boolean>(false);

  todayDateFormatted = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
  
  fechaVencimientoFormatted = computed(() => {
    const sim = this.wizardService.liquidacionSimulada();
    if (sim?.fechaVencimiento) {
      const parts = sim.fechaVencimiento.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
  });

  fechaLimiteOportunaFormatted = computed(() => {
    const sim = this.wizardService.liquidacionSimulada();
    if (sim?.fechaLimiteOportuna) {
      const parts = sim.fechaLimiteOportuna.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return sim.fechaLimiteOportuna;
    }

    // Fallback de ley (Ley 223 de 1995 Art. 231) calculado a partir de la fecha del documento
    const docFechaStr = this.wizardService.paso2Form.get('fechaDocumento')?.value;
    if (docFechaStr) {
      const [y, m, d] = docFechaStr.split('-').map(Number);
      if (y && m && d) {
        const fechaDoc = new Date(y, m - 1, d);
        const tipoEntidad = (this.wizardService.paso2Form.get('tipoEntidadRegistroNombre')?.value || '').toLowerCase();
        let meses = 2; // Notarías / ORIP (2 meses)
        if (tipoEntidad.includes('camara') || tipoEntidad.includes('comercio')) meses = 1; // Cámara de Comercio (1 mes)
        if (tipoEntidad.includes('exterior') || tipoEntidad.includes('consul')) meses = 3; // Exterior (3 meses)
        
        fechaDoc.setMonth(fechaDoc.getMonth() + meses);
        return fechaDoc.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
      }
    }

    return this.fechaVencimientoFormatted();
  });

  fechaExpedicionFormatted = computed(() => {
    const sim = this.wizardService.liquidacionSimulada();
    if (sim?.fechaExpedicionDocumento) {
      const parts = sim.fechaExpedicionDocumento.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return sim.fechaExpedicionDocumento;
    }
    const docFecha = this.wizardService.paso2Form.get('fechaDocumento')?.value;
    return docFecha ? docFecha : this.todayDateFormatted;
  });

  fechaRadicacionFormatted = computed(() => {
    const sim = this.wizardService.liquidacionSimulada();
    if (sim?.fechaRadicacion) {
      try {
        return new Date(sim.fechaRadicacion).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
      } catch {
        return String(sim.fechaRadicacion).substring(0, 10);
      }
    }
    return this.datosRadicacion().fechaRadicacion;
  });

  // Hash de seguridad institucional
  codigoSeguridadHex = computed(() => {
    const rad = this.wizardService.radicadoGenerado() || 'RAD-0000';
    const id = this.wizardService.solicitudId() || 101;
    return `CAUCA-SIM-${id.toString(16).toUpperCase()}-99B2-C10E-${rad.replace(/\D/g, '') || '2026'}`;
  });

  datosContribuyente = computed(() => this.wizardService.paso1Form.value);
  datosDocumento = computed(() => this.wizardService.paso2Form.value);
  datosRadicacion = computed(() => {
    const p1 = this.wizardService.paso1Form.value;
    const sim = this.wizardService.liquidacionSimulada();

    let anioReal: number | string | null = sim?.vigenciaAnio || this.wizardService.vigenciaAnio() || null;

    const vigenciaId = p1.vigenciaFiscal || sim?.vigenciaId || this.wizardService.vigenciaFiscal();
    if (!anioReal && vigenciaId) {
      if (typeof vigenciaId === 'number' && vigenciaId > 1900) {
        anioReal = vigenciaId;
      } else {
        const vEncontrada = this.vigenciasFacade.vigencias().find(v => v.id === vigenciaId);
        if (vEncontrada) {
          anioReal = vEncontrada.anio;
        }
      }
    }

    if (!anioReal) {
      const fecha = p1.fechaRadicado || this.wizardService.fechaRadicado() || sim?.fechaRadicacion;
      if (fecha) {
        try {
          anioReal = new Date(fecha).getFullYear();
        } catch {
          anioReal = new Date().getFullYear();
        }
      } else {
        anioReal = new Date().getFullYear();
      }
    }

    return {
      numeroRadicado: this.wizardService.radicadoGenerado() || p1.numeroRadicado || 'RAD-000000',
      fechaRadicacion: p1.fechaRadicado || this.wizardService.fechaRadicado() || new Date().toISOString().split('T')[0],
      vigenciaFiscal: anioReal,
      departamento: 'Cauca (Popayán)'
    };
  });

  ngOnInit() {
    if (this.vigenciasFacade.vigencias().length === 0) {
      this.vigenciasFacade.cargarVigencias(1, 100);
    }

    // Refrescar simulación al entrar al paso 5 si no se tiene
    if (!this.wizardService.liquidacionSimulada()) {
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
          this.toast.success('Simulación actualizada.');
        } else {
          this.toast.error(res?.message || 'Error al obtener la simulación.');
        }
      },
      error: (err: any) => {
        const msg = err?.error?.message || err?.error?.detail || 'Error al obtener la simulación.';
        this.toast.error(msg);
      }
    });
  }

  // Lista consolidada de intervinientes
  intervinientesTotales = computed(() => this.intervinientesConsolidados());
  intervinientesConsolidados = computed(() => {
    const simulacion = this.wizardService.liquidacionSimulada();
    const actosExp = this.wizardService.actosExpediente();
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

  // Lista consolidada de exenciones evaluadas
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

  totalEnLetras = computed(() => {
    const sim = this.wizardService.liquidacionSimulada();
    const valor = sim ? Math.round(sim.granTotalPagar) : 0;
    return this.convertirNumeroALetras(valor);
  });

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

  radicarReliquidacion() {
    const liqId = this.wizardService.reliquidacionLiquidacionId();
    this.isCompleting.set(true);

    // Si ya está en trámite (estadoSolicitudId === 3), los actos ya fueron persistidos en BD
    if (this.wizardService.estadoSolicitudId() === 3) {
      this.isCompleting.set(false);
      this.toast.success('Modificaciones registradas exitosamente. El expediente está en revisión por la Gobernación.');
      this.router.navigate(['/registros/entidades/liquidaciones']);
      return;
    }

    if (!liqId) {
      this.isCompleting.set(false);
      this.toast.error('No se encontró el identificador de la liquidación de origen.');
      return;
    }

    const payload = {
      causalReliquidacionId: this.wizardService.reliquidacionCausalId(),
      motivo: this.wizardService.reliquidacionMotivo() || 'Reliquidación modificada a través de Asistente (Wizard)',
      numeroDocumentoAclaratorio: this.wizardService.reliquidacionDoc() || null,
      fechaDocumentoAclaratorio: this.wizardService.reliquidacionFechaDoc() || null,
      nombreArchivoSoporte: this.wizardService.documentoSoporteFile?.name || (this.wizardService.documentoSoporteNombre() || null),
      tipoArchivoSoporte: this.wizardService.documentoSoporteFile?.type || null,
      rutaArchivoSoporte: this.wizardService.documentoSoporteFile ? `ftp://servidor_ftp/reliquidaciones/${Date.now()}_${this.wizardService.documentoSoporteFile.name}` : null
    };

    this.generacionFacade.solicitarReliquidacion(liqId, payload).subscribe({
      next: () => {
        this.isCompleting.set(false);
        this.toast.success('Solicitud de reliquidación radicada exitosamente ante la Gobernación del Cauca.');
        this.router.navigate(['/registros/entidades/liquidaciones']);
      },
      error: (err) => {
        this.isCompleting.set(false);
        if (err?.error?.code === 'Liquidacion.ReliquidacionEnTramite' || err?.error?.message?.includes('en curso') || err?.error?.message?.includes('en trámite')) {
          this.toast.success('Modificaciones registradas. El expediente se encuentra en trámite en la Gobernación.');
          this.router.navigate(['/registros/entidades/liquidaciones']);
        } else {
          this.toast.error(err?.error?.message || 'Error al radicar la solicitud de reliquidación.');
        }
      }
    });
  }

  radicarSolicitud() {
    const solicitudId = this.wizardService.solicitudId();
    if (!solicitudId) {
      this.toast.error('No hay solicitud para radicar.');
      return;
    }

    this.isCompleting.set(true);
    this.solicitudesFacade.completarSolicitud(solicitudId).subscribe({
      next: (res) => {
        if (res.success) {
          this.wizardService.estadoSolicitudId.set(2);
          this.wizardService.estadoSolicitudNombre.set('En Revisión');
          this.toast.success('¡Solicitud radicada exitosamente ante la Gobernación del Cauca para su revisión técnica!');
          this.router.navigate(['/registros/entidades/solicitudes']);
        } else {
          this.toast.error(res.message || 'No se pudo radicar la solicitud.');
        }
        this.isCompleting.set(false);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.error?.detail || 'Error al radicar la solicitud.';
        this.toast.error(errorMsg);
        this.isCompleting.set(false);
      }
    });
  }

  irASolicitudes() {
    this.router.navigate(['/registros/entidades/solicitudes']);
  }

  irALiquidaciones() {
    this.router.navigate(['/registros/entidades/liquidaciones']);
  }
}
