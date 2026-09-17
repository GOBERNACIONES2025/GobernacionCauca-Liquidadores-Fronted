import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SobretasaService } from '../../../application/sobretasa.service';
import {
  DeclaracionSobretasa,
  DespachoItem,
} from '../../../domain/models/sobretasa-gasolina.models';
import {
  formatGalones,
  formatMoneyCop,
  TARIFAS_SOBRETASA_2026,
} from '../../../domain/calculator/sobretasa-tax-calculator';
import { FormularioOficialModalComponent } from '../../components/formulario-oficial-modal/formulario-oficial-modal';
import { DeclaracionWizardComponent } from '../../components/declaracion-wizard/declaracion-wizard';
import { PseModalComponent } from '../../components/pse-modal/pse-modal';
import { SobretasaSubsanarModalComponent } from '../../components/subsanar-modal/subsanar-modal.component';
import { SobretasaAsobancarioModalComponent } from '../../components/asobancario-modal/asobancario-modal.component';
import { SobretasaAuditoriaModalComponent } from '../../components/auditoria-modal/auditoria-modal.component';

export type PortalSobretasaTab = 'inicio' | 'mis-declaraciones' | 'certificados';

@Component({
  selector: 'app-sobretasa-portal-ciudadano',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormularioOficialModalComponent,
    DeclaracionWizardComponent,
    PseModalComponent,
    SobretasaSubsanarModalComponent,
    SobretasaAsobancarioModalComponent,
    SobretasaAuditoriaModalComponent,
  ],
  templateUrl: './portal-ciudadano.html',
})
export class SobretasaPortalCiudadanoComponent {
  private router = inject(Router);
  readonly sobretasaService = inject(SobretasaService);

  tarifas = TARIFAS_SOBRETASA_2026;

  // Estado de navegación
  readonly activeTab = signal<PortalSobretasaTab>('inicio');
  readonly mensajeExito = signal<string | null>(null);

  // Modales
  readonly mostrarWizard = signal<boolean>(false);
  readonly modalActivo = signal<'FORMULARIO' | 'PSE' | 'ASOBANCARIO' | 'SUBSANAR' | 'DETALLE' | null>(null);
  readonly declaracionSeleccionada = signal<DeclaracionSobretasa | null>(null);

  // Consulta por radicado
  numeroConsultaInput = '';
  readonly haConsultado = signal<boolean>(false);
  readonly resultadoConsulta = signal<DeclaracionSobretasa | null>(null);

  // Filtros de tabla
  filtroEstado = 'TODOS';
  filtroMes = 'TODOS';
  terminoBusquedaTabla = '';

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

  readonly declaracionesFiltradas = computed(() => {
    let list = this.sobretasaService.declaracionesMayorista();
    const search = this.terminoBusquedaTabla.trim().toLowerCase();

    if (this.filtroEstado !== 'TODOS') {
      list = list.filter((d) => d.estado === this.filtroEstado);
    }

    if (this.filtroMes !== 'TODOS') {
      const mesNum = parseInt(this.filtroMes, 10);
      list = list.filter((d) => d.periodoMes === mesNum);
    }

    if (search) {
      list = list.filter(
        (d) =>
          d.numeroRadicado.toLowerCase().includes(search) ||
          d.mayorista.razonSocial.toLowerCase().includes(search) ||
          (d.comprobantePagoRef || '').toLowerCase().includes(search)
      );
    }

    return list;
  });

  readonly declaracionesPagadas = computed(() => {
    return this.sobretasaService
      .declaracionesMayorista()
      .filter((d) => d.estado === 'PAGADO_APROBADO');
  });

  cambiarTab(tab: PortalSobretasaTab): void {
    this.activeTab.set(tab);
  }

  cambiarMayorista(id: string): void {
    this.sobretasaService.setSelectedMayorista(id);
    this.resultadoConsulta.set(null);
    this.haConsultado.set(false);
  }

  // --- CONSULTA PUBLICA POR RADICADO ---
  consultarRadicado(): void {
    const term = this.numeroConsultaInput.trim();
    if (!term) return;

    this.haConsultado.set(true);
    const encontrado = this.sobretasaService.buscarPorRadicado(term);
    this.resultadoConsulta.set(encontrado || null);
  }

  cargarEjemplo(radicado: string): void {
    this.numeroConsultaInput = radicado;
    this.consultarRadicado();
  }

  // --- GESTION DE MODALES ---
  abrirWizard(): void {
    this.mostrarWizard.set(true);
  }

  cerrarWizard(): void {
    this.mostrarWizard.set(false);
  }

  onRadicadoCreado(rad: DeclaracionSobretasa): void {
    this.mostrarWizard.set(false);
    this.mensajeExito.set(
      `Declaración radicana con éxito: ${rad.numeroRadicado}. El expediente se encuentra en estado EN REVISIÓN para auditoría fiscal.`
    );
    this.activeTab.set('mis-declaraciones');
  }

  abrirFormulario(dec: DeclaracionSobretasa): void {
    this.declaracionSeleccionada.set(dec);
    this.modalActivo.set('FORMULARIO');
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

  abrirDetalle(dec: DeclaracionSobretasa): void {
    this.declaracionSeleccionada.set(dec);
    this.modalActivo.set('DETALLE');
  }

  cerrarModales(): void {
    this.modalActivo.set(null);
    this.declaracionSeleccionada.set(null);
  }

  onSubsanarGuardado(data: { id: string; despachos: DespachoItem[]; motivo: string }): void {
    this.sobretasaService.subsanarDeclaracion(data.id, data.despachos, data.motivo);
    this.cerrarModales();

    // Actualizar resultado si está en pantalla
    const res = this.resultadoConsulta();
    if (res && res.id === data.id) {
      this.resultadoConsulta.set(this.sobretasaService.getDeclaracionById(data.id) || null);
    }

    this.mensajeExito.set(
      `Requerimiento subsanado exitosamente. La declaración fue corregida y reenviada a fiscalización tributaria.`
    );
  }

  onPagoPseExitoso(pago: any): void {
    this.cerrarModales();
    this.mensajeExito.set(
      `Pago PSE confirmado satisfactoriamente por valor de ${this.formatCop(pago?.valorPagado || 0)}. El Formulario Oficial cuenta con certificación electrónica.`
    );
  }

  onPagoAsobancario(data: { metodo: 'ASOBANCARIO_VENTANILLA'; banco: string; referencia: string; fecha: string }): void {
    const sel = this.declaracionSeleccionada();
    if (!sel) return;

    this.sobretasaService.procesarPagoAsobancario(sel.id, data);
    this.cerrarModales();

    if (this.resultadoConsulta()?.id === sel.id) {
      this.resultadoConsulta.set(this.sobretasaService.getDeclaracionById(sel.id) || null);
    }

    this.mensajeExito.set(
      `Consignación bancaria (${data.banco} - Ref: ${data.referencia}) relacionada y validada exitosamente.`
    );
  }

  salir(): void {
    this.router.navigate(['/']);
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
