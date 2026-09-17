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
import { FormularioOficialModalComponent } from '../../components/formulario-oficial-modal/formulario-oficial-modal';
import { PseModalComponent } from '../../components/pse-modal/pse-modal';
import { SobretasaAuditoriaModalComponent } from '../../components/auditoria-modal/auditoria-modal.component';
import { SobretasaAsobancarioModalComponent } from '../../components/asobancario-modal/asobancario-modal.component';
import { SobretasaSubsanarModalComponent } from '../../components/subsanar-modal/subsanar-modal.component';

@Component({
  selector: 'app-sobretasa-declaraciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormularioOficialModalComponent,
    PseModalComponent,
    SobretasaAuditoriaModalComponent,
    SobretasaAsobancarioModalComponent,
    SobretasaSubsanarModalComponent,
  ],
  templateUrl: './sobretasa-declaraciones.html',
})
export class SobretasaDeclaracionesComponent {
  readonly sobretasaService = inject(SobretasaService);

  tarifas = TARIFAS_SOBRETASA_2026;

  // Notificación
  readonly mensajeExito = signal<string | null>(null);

  // Modales
  readonly modalActivo = signal<'FORMULARIO' | 'AUDITORIA' | 'PSE' | 'ASOBANCARIO' | 'SUBSANAR' | null>(null);
  readonly declaracionSeleccionada = signal<DeclaracionSobretasa | null>(null);

  // Filtros
  filtroMayorista = 'TODOS';
  filtroEstado = 'TODOS';
  filtroMes = 'TODOS';
  busquedaRadicado = '';

  meses = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' },
  ];

  declaracionesFiltradas = computed(() => {
    let list = this.sobretasaService.declaraciones();

    if (this.filtroMayorista !== 'TODOS') {
      list = list.filter((d) => d.mayoristaId === this.filtroMayorista);
    }

    if (this.filtroEstado !== 'TODOS') {
      if (this.filtroEstado === 'OBSERVADO') {
        list = list.filter((d) => d.estado === 'OBSERVADO' || d.estado === 'REQUERIDO');
      } else {
        list = list.filter((d) => d.estado === this.filtroEstado);
      }
    }

    if (this.filtroMes !== 'TODOS') {
      const mesNum = parseInt(this.filtroMes, 10);
      list = list.filter((d) => d.periodoMes === mesNum);
    }

    if (this.busquedaRadicado.trim()) {
      const q = this.busquedaRadicado.toLowerCase().trim();
      list = list.filter((d) => d.numeroRadicado.toLowerCase().includes(q) || d.mayorista.razonSocial.toLowerCase().includes(q));
    }

    return list;
  });

  abrirFormulario(dec: DeclaracionSobretasa): void {
    this.declaracionSeleccionada.set(dec);
    this.modalActivo.set('FORMULARIO');
  }

  abrirAuditoria(dec: DeclaracionSobretasa): void {
    this.declaracionSeleccionada.set(dec);
    this.modalActivo.set('AUDITORIA');
  }

  abrirPse(dec: DeclaracionSobretasa): void {
    this.declaracionSeleccionada.set(dec);
    this.modalActivo.set('PSE');
  }

  abrirAsobancario(dec: DeclaracionSobretasa): void {
    this.declaracionSeleccionada.set(dec);
    this.modalActivo.set('ASOBANCARIO');
  }

  abrirSubsanar(dec: DeclaracionSobretasa): void {
    this.declaracionSeleccionada.set(dec);
    this.modalActivo.set('SUBSANAR');
  }

  cerrarModales(): void {
    this.modalActivo.set(null);
    this.declaracionSeleccionada.set(null);
  }

  onAprobar(evt: { id: string; observacion: string }): void {
    this.sobretasaService.aprobarDeclaracion(evt.id, 'Dr. Carlos Alberto Medina (Auditor)', evt.observacion);
    this.cerrarModales();
    this.mensajeExito.set(`Declaración aprobada exitosamente.`);
  }

  onRequerir(evt: { id: string; motivo: string }): void {
    this.sobretasaService.observarDeclaracion(evt.id, 'Dr. Carlos Alberto Medina (Auditor)', evt.motivo);
    this.cerrarModales();
    this.mensajeExito.set(`Declaración devuelta al mayorista con requerimiento.`);
  }

  onRechazar(evt: { id: string; motivo: string }): void {
    this.sobretasaService.rechazarDeclaracion(evt.id, evt.motivo, 'Dr. Carlos Alberto Medina (Auditor)');
    this.cerrarModales();
    this.mensajeExito.set(`Declaración rechazada.`);
  }

  onPagoAsobancario(data: { metodo: 'ASOBANCARIO_VENTANILLA'; banco: string; referencia: string; fecha: string }): void {
    const sel = this.declaracionSeleccionada();
    if (!sel) return;

    this.sobretasaService.procesarPagoAsobancario(sel.id, data);
    this.cerrarModales();
    this.mensajeExito.set(`Pago bancario registrado satisfactoriamente.`);
  }

  onSubsanarGuardado(data: { id: string; despachos: DespachoItem[]; motivo: string }): void {
    this.sobretasaService.subsanarDeclaracion(data.id, data.despachos, data.motivo);
    this.cerrarModales();
    this.mensajeExito.set(`Declaración subsanada y actualizada.`);
  }

  exportarCsv(): void {
    const list = this.declaracionesFiltradas();
    const rows = [
      ['Radicado', 'Mayorista', 'NIT', 'Mes', 'Anio', 'Galones_GMC', 'Galones_GME', 'Galones_ACPM', 'Total_Galones', 'Municipal', 'Departamental', 'Total_Pagar', 'Estado', 'Fecha_Radicacion'],
      ...list.map(d => [
        d.numeroRadicado,
        d.mayorista.razonSocial,
        d.mayorista.nit,
        d.periodoMes,
        d.periodoAnio,
        d.totalGalonesGMC,
        d.totalGalonesGME,
        d.totalGalonesACPM,
        d.totalGalonesGeneral,
        d.totalMunicipal,
        d.totalDepartamental,
        d.totalPagar,
        d.estado,
        d.fechaRadicacion
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expediente_sobretasa_cauca_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatCop(val: number): string {
    return formatMoneyCop(val);
  }

  formatGal(val: number): string {
    return formatGalones(val);
  }

  getNombreMes(mes: number): string {
    const m = this.meses.find((item) => item.num === mes);
    return m ? m.nombre : `Mes ${mes}`;
  }
}
