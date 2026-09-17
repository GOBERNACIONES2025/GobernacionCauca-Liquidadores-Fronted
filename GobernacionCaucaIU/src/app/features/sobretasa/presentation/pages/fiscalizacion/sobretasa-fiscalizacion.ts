import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SobretasaService } from '../../../application/sobretasa.service';
import { DeclaracionSobretasa, DespachoItem } from '../../../domain/models/sobretasa-gasolina.models';
import {
  formatGalones,
  formatMoneyCop,
  TARIFAS_SOBRETASA_2026,
} from '../../../domain/calculator/sobretasa-tax-calculator';
import { SicomValidadorModalComponent } from '../../components/sicom-validador-modal/sicom-validador-modal';
import { FormularioOficialModalComponent } from '../../components/formulario-oficial-modal/formulario-oficial-modal';
import { SobretasaAuditoriaModalComponent } from '../../components/auditoria-modal/auditoria-modal.component';
import { SobretasaAsobancarioModalComponent } from '../../components/asobancario-modal/asobancario-modal.component';
import { SobretasaSubsanarModalComponent } from '../../components/subsanar-modal/subsanar-modal.component';

@Component({
  selector: 'app-sobretasa-fiscalizacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SicomValidadorModalComponent,
    FormularioOficialModalComponent,
    SobretasaAuditoriaModalComponent,
    SobretasaAsobancarioModalComponent,
    SobretasaSubsanarModalComponent,
  ],
  templateUrl: './sobretasa-fiscalizacion.html',
})
export class SobretasaFiscalizacionComponent {
  readonly sobretasaService = inject(SobretasaService);

  tarifas = TARIFAS_SOBRETASA_2026;

  // Notificación
  readonly mensajeExito = signal<string | null>(null);

  // Declaración seleccionada para ver en el panel de detalle
  readonly declaracionSeleccionada = signal<DeclaracionSobretasa | null>(null);

  // Modales
  readonly mostrarModalSicom = signal<boolean>(false);
  readonly mostrarModalAuditoria = signal<boolean>(false);
  readonly mostrarModalFormulario = signal<boolean>(false);
  readonly mostrarModalPse = signal<boolean>(false);
  readonly mostrarModalAsobancario = signal<boolean>(false);
  readonly mostrarModalSubsanar = signal<boolean>(false);

  // Filtros
  filtroEstado = signal<string>('EN_REVISION');
  busquedaTexto = signal<string>('');

  // Conteos
  readonly totalRevision = computed(() => {
    return this.sobretasaService.declaraciones().filter((d) => d.estado === 'EN_REVISION').length;
  });

  readonly totalObservados = computed(() => {
    return this.sobretasaService.declaraciones().filter((d) => d.estado === 'OBSERVADO' || d.estado === 'REQUERIDO').length;
  });

  readonly totalPendientesPago = computed(() => {
    return this.sobretasaService.declaraciones().filter((d) => d.estado === 'PENDIENTE_PAGO').length;
  });

  readonly totalPagados = computed(() => {
    return this.sobretasaService.declaraciones().filter((d) => d.estado === 'PAGADO_APROBADO').length;
  });

  // Lista de declaraciones para fiscalización
  readonly declaracionesFiscalizacion = computed(() => {
    let list = this.sobretasaService.declaraciones();
    const estado = this.filtroEstado();
    const q = this.busquedaTexto().toLowerCase().trim();

    if (estado !== 'TODOS') {
      if (estado === 'OBSERVADO') {
        list = list.filter((d) => d.estado === 'OBSERVADO' || d.estado === 'REQUERIDO');
      } else {
        list = list.filter((d) => d.estado === estado);
      }
    }

    if (q) {
      list = list.filter(
        (d) =>
          d.numeroRadicado.toLowerCase().includes(q) ||
          d.mayorista.razonSocial.toLowerCase().includes(q) ||
          d.mayorista.nit.includes(q) ||
          (d.comprobantePagoRef || '').toLowerCase().includes(q)
      );
    }

    return list;
  });

  ngOnInit(): void {
    const list = this.sobretasaService.declaraciones();
    const primeraRevision = list.find((d) => d.estado === 'EN_REVISION') || list[0];
    if (primeraRevision) {
      this.declaracionSeleccionada.set(primeraRevision);
    }
  }

  setFiltroEstado(estado: string): void {
    this.filtroEstado.set(estado);
  }

  seleccionarDeclaracion(dec: DeclaracionSobretasa): void {
    this.declaracionSeleccionada.set(dec);
  }

  abrirValidacionSicom(): void {
    this.mostrarModalSicom.set(true);
  }

  abrirAuditoriaModal(dec?: DeclaracionSobretasa): void {
    if (dec) this.declaracionSeleccionada.set(dec);
    this.mostrarModalAuditoria.set(true);
  }

  abrirFormulario(dec?: DeclaracionSobretasa): void {
    if (dec) this.declaracionSeleccionada.set(dec);
    this.mostrarModalFormulario.set(true);
  }

  abrirSubsanar(dec?: DeclaracionSobretasa): void {
    if (dec) this.declaracionSeleccionada.set(dec);
    this.mostrarModalSubsanar.set(true);
  }

  abrirAsobancario(dec?: DeclaracionSobretasa): void {
    if (dec) this.declaracionSeleccionada.set(dec);
    this.mostrarModalAsobancario.set(true);
  }

  aprobarDirecto(): void {
    const dec = this.declaracionSeleccionada();
    if (!dec) return;

    this.sobretasaService.aprobarDeclaracion(
      dec.id,
      'Dr. Carlos Alberto Medina (Fiscalizador Rentas)',
      'Declaración aprobada tras verificación documental y técnica satisfactoria.'
    );
    this.actualizarSeleccion(dec.id);
    this.mensajeExito.set(`Declaración ${dec.numeroRadicado} aprobada exitosamente y habilitada para pago oficial.`);
  }

  onAprobarDesdeModal(evt: { id: string; observacion: string }): void {
    this.sobretasaService.aprobarDeclaracion(evt.id, 'Dr. Carlos Alberto Medina (Fiscalizador Rentas)', evt.observacion);
    this.mostrarModalAuditoria.set(false);
    this.actualizarSeleccion(evt.id);
    this.mensajeExito.set(`Declaración aprobada y habilitada para pago.`);
  }

  onRequerirDesdeModal(evt: { id: string; motivo: string }): void {
    this.sobretasaService.observarDeclaracion(evt.id, 'Dr. Carlos Alberto Medina (Fiscalizador Rentas)', evt.motivo);
    this.mostrarModalAuditoria.set(false);
    this.actualizarSeleccion(evt.id);
    this.mensajeExito.set(`Declaración devuelta al mayorista con requerimiento formal de subsanación.`);
  }

  onRechazarDesdeModal(evt: { id: string; motivo: string }): void {
    this.sobretasaService.rechazarDeclaracion(evt.id, evt.motivo, 'Dr. Carlos Alberto Medina (Fiscalizador Rentas)');
    this.mostrarModalAuditoria.set(false);
    this.actualizarSeleccion(evt.id);
    this.mensajeExito.set(`Declaración rechazada formalmente.`);
  }

  onSicomCompletado(): void {
    this.mostrarModalSicom.set(false);
    const dec = this.declaracionSeleccionada();
    if (dec) {
      this.actualizarSeleccion(dec.id);
      this.mensajeExito.set(`Validación SICOM exitosa para el 100% de las guías de transporte.`);
    }
  }

  onPagoPseCompletado(): void {
    this.mostrarModalPse.set(false);
    const dec = this.declaracionSeleccionada();
    if (dec) {
      this.actualizarSeleccion(dec.id);
      this.mensajeExito.set(`Pago PSE confirmado y certificado.`);
    }
  }

  onPagoAsobancario(data: { metodo: 'ASOBANCARIO_VENTANILLA'; banco: string; referencia: string; fecha: string }): void {
    const dec = this.declaracionSeleccionada();
    if (!dec) return;

    this.sobretasaService.procesarPagoAsobancario(dec.id, data);
    this.mostrarModalAsobancario.set(false);
    this.actualizarSeleccion(dec.id);
    this.mensajeExito.set(`Pago por ventanilla bancaria (${data.banco}) relacionado exitosamente.`);
  }

  onSubsanarGuardado(data: { id: string; despachos: DespachoItem[]; motivo: string }): void {
    this.sobretasaService.subsanarDeclaracion(data.id, data.despachos, data.motivo);
    this.mostrarModalSubsanar.set(false);
    this.actualizarSeleccion(data.id);
    this.mensajeExito.set(`Declaración subsanada y actualizada.`);
  }

  private actualizarSeleccion(id: string): void {
    const updated = this.sobretasaService.getDeclaracionById(id);
    if (updated) this.declaracionSeleccionada.set(updated);
  }

  formatCop(val: number): string {
    return formatMoneyCop(val);
  }

  formatGal(val: number): string {
    return formatGalones(val);
  }
}
