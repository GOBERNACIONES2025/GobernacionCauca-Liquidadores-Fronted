import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LiquidacionesOficialesFacade } from '../../../application/facades/liquidaciones-oficiales.facade';
import {
  ActoLiquidacionOficial,
  ActoLiquidacionOficialDetalle,
  TabLiquidacionOficial,
  ActualizarTrazabilidadPostalLiqOficialRequest,
} from '../../../domain/models/liquidacion-oficial.model';

@Component({
  selector: 'app-liquidaciones-oficiales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liquidaciones-oficiales.html',
})
export class LiquidacionesOficialesPage implements OnInit {
  readonly facade = inject(LiquidacionesOficialesFacade);
  private sanitizer = inject(DomSanitizer);

  // Filtros de búsqueda
  textoBuscar = '';

  // Formulario local del Modal de Trazabilidad Postal (4-72)
  formNumeroGuia = '';
  formEmpresaEnvio = 'Servicios Postales Nacionales 4-72';
  formFechaEnvio = new Date().toISOString().split('T')[0];
  formFechaEntrega = '';
  formEstadoPostal = 'ENTREGADO';
  formObservacionesPostal = '';

  // Formulario local del Modal de Emisión de Aforo Individual
  formResponsableEmision = 'SUBDIRECCIÓN DE FISCALIZACIÓN Y COBRO';
  formObservacionesEmision = '';

  // Formulario local del Modal de Emisión Masiva
  formResponsableMasivo = 'DIRECCIÓN DE GESTIÓN TRIBUTARIA DEPARTAMENTAL';
  formVigenciaMasiva = 0;

  // Formulario local del Modal de Pérdida de Competencia / Prescripción
  formMotivoPrescripcion = 'Pérdida de competencia por término quinquenal extintivo (ETN Arts. 717 y 817)';
  formFundamentoNormativo = 'Artículo 817 del Estatuto Tributario Nacional y Ordenanza Fiscal Departamental del Cauca.';
  formResponsablePrescripcion = 'SUBDIRECCIÓN DE RENTAS Y COBRO COACTIVO';

  readonly aniosDisponibles = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

  ngOnInit(): void {
    this.facade.cargarActos();
    this.facade.cargarKpis();
  }

  onSelectTab(tab: TabLiquidacionOficial): void {
    this.facade.cambiarTab(tab);
  }

  onBuscar(): void {
    this.facade.buscar.set(this.textoBuscar);
    this.facade.aplicarFiltros();
  }

  onBuscarKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onBuscar();
  }

  onFiltroVigencia(event: Event): void {
    const val = +(event.target as HTMLSelectElement).value;
    this.facade.vigenciaFiltro.set(val);
    this.facade.aplicarFiltros();
  }

  onLimpiarFiltros(): void {
    this.textoBuscar = '';
    this.facade.limpiarFiltros();
  }

  onVerificarEjecutoria(): void {
    this.facade.verificarEjecutoria();
  }

  // ── Emisión Individual ─────────────────────────────────────────────────────
  abrirModalEmitir(acto: ActoLiquidacionOficial): void {
    this.formResponsableEmision = 'SUBDIRECCIÓN DE FISCALIZACIÓN Y COBRO';
    this.formObservacionesEmision = `Liquidación Oficial de Aforo expedida ante el vencimiento del plazo legal del Emplazamiento Previo ${acto.numeroActoEmplazamiento || ''}.`;
    this.facade.abrirEmitirAforo(acto);
  }

  confirmarEmitir(): void {
    this.facade.confirmarEmitirAforo(this.formResponsableEmision, this.formObservacionesEmision);
  }

  cerrarModalEmitir(): void {
    this.facade.cerrarEmitirAforo();
  }

  // ── Emisión Masiva ────────────────────────────────────────────────────────
  abrirModalEmitirMasivo(): void {
    this.formResponsableMasivo = 'DIRECCIÓN DE GESTIÓN TRIBUTARIA DEPARTAMENTAL';
    this.formVigenciaMasiva = 0;
    this.facade.abrirEmitirMasivo();
  }

  confirmarEmitirMasivo(): void {
    this.facade.vigenciaMasivaSeleccionada.set(this.formVigenciaMasiva);
    this.facade.confirmarEmitirMasivo(this.formResponsableMasivo);
  }

  cerrarModalEmitirMasivo(): void {
    this.facade.cerrarEmitirMasivo();
  }

  // ── Trazabilidad Postal ───────────────────────────────────────────────────
  abrirModalPostal(acto: ActoLiquidacionOficial): void {
    this.formNumeroGuia = acto.numeroGuiaPostal || '';
    this.formEmpresaEnvio = acto.empresaEnvio || 'Servicios Postales Nacionales 4-72';
    this.formFechaEnvio = acto.fechaEnvioPostal || new Date().toISOString().split('T')[0];
    this.formFechaEntrega = acto.fechaEntregaNotificacion || '';
    this.formEstadoPostal = acto.estadoPostal || 'ENTREGADO';
    this.formObservacionesPostal = acto.observacionesPostal || '';
    this.facade.abrirPostal(acto);
  }

  guardarPostal(): void {
    const acto = this.facade.actoPostalActivo();
    if (!acto) return;

    const payload: ActualizarTrazabilidadPostalLiqOficialRequest = {
      actoLiquidacionOficialId: acto.id,
      numeroGuiaPostal: this.formNumeroGuia.trim(),
      empresaEnvio: this.formEmpresaEnvio.trim(),
      fechaEnvioPostal: this.formFechaEnvio || undefined,
      fechaEntregaNotificacion: this.formFechaEntrega || undefined,
      estadoPostal: this.formEstadoPostal,
      observacionesPostal: this.formObservacionesPostal.trim(),
    };

    this.facade.guardarPostal(payload);
  }

  cerrarModalPostal(): void {
    this.facade.cerrarPostal();
  }

  // ── Pérdida de Competencia / Prescripción ──────────────────────────────────
  abrirModalPrescribir(acto: ActoLiquidacionOficial): void {
    this.formMotivoPrescripcion = 'Pérdida de competencia por término quinquenal extintivo (ETN Arts. 717 y 817)';
    this.formFundamentoNormativo = 'Artículo 817 del Estatuto Tributario Nacional y Ordenanza Fiscal Departamental del Cauca.';
    this.formResponsablePrescripcion = 'SUBDIRECCIÓN DE RENTAS Y COBRO COACTIVO';
    this.facade.abrirPrescribir(acto);
  }

  confirmarPrescribir(): void {
    this.facade.confirmarPrescribir(
      this.formMotivoPrescripcion,
      this.formFundamentoNormativo,
      this.formResponsablePrescripcion
    );
  }

  cerrarModalPrescribir(): void {
    this.facade.cerrarPrescribir();
  }

  // ── Descarga de PDF y Visualización ────────────────────────────────────────
  descargarResolucionPdf(acto: ActoLiquidacionOficial): void {
    this.facade.descargarResolucionPdf(acto.id, acto.numeroActo);
  }

  descargarPrescripcionPdf(acto: ActoLiquidacionOficial): void {
    this.facade.descargarPrescripcionPdf(acto.id, acto.numeroResolucionPrescripcion || undefined);
  }

  abrirPreviewHtml(acto: ActoLiquidacionOficial): void {
    const titulo = `Resolución de Liquidación Oficial de Aforo - Acto ${acto.numeroActo} (Placa: ${acto.placa})`;
    this.facade.abrirPreviewHtml(acto.id, titulo);
  }

  cerrarPreviewHtml(): void {
    this.facade.cerrarPreviewHtml();
  }

  imprimirPreviewHtml(): void {
    this.facade.imprimirPreviewHtml();
  }

  // ── Acordeón y Selección ──────────────────────────────────────────────────
  toggleDetalle(id: number): void {
    this.facade.toggleDetalle(id);
  }

  isDetalleExpandido(id: number): boolean {
    return this.facade.isDetalleExpandido(id);
  }

  toggleSeleccion(placa: string, id: number): void {
    this.facade.toggleSeleccion(placa, id);
  }

  isSeleccionado(placa: string): boolean {
    return this.facade.isSeleccionado(placa);
  }

  seleccionarTodos(): void {
    this.facade.seleccionarTodos();
  }

  paginaAnterior(): void {
    const p = this.facade.page();
    if (p > 1) this.facade.cambiarPagina(p - 1);
  }

  paginaSiguiente(): void {
    const p = this.facade.page();
    const total = this.facade.totalPages();
    if (p < total) this.facade.cambiarPagina(p + 1);
  }

  getSafeHtml(html: string | null | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html || '');
  }

  // ── Helpers Visuales y Etiquetas ──────────────────────────────────────────
  estadoActoBadge(estado: string): string {
    switch (estado) {
      case 'BORRADOR':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'EMITIDO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'NOTIFICADO':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'EN_RECURSO':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'EJECUTORIADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold';
      case 'PRESCRITO':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-semibold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  estadoActoLabel(estado: string): string {
    switch (estado) {
      case 'BORRADOR': return 'Borrador';
      case 'EMITIDO': return 'Emitido';
      case 'NOTIFICADO': return 'Notificado (En Términos)';
      case 'EN_RECURSO': return 'En Vía Gubernativa';
      case 'EJECUTORIADO': return 'Título en Firme';
      case 'PRESCRITO': return 'Pérdida Competencia';
      default: return estado;
    }
  }

  estadoPostalBadge(estado: string): string {
    switch (estado) {
      case 'PENDIENTE_ENVIO': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'EN_TRANSITO': return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'ENTREGADO': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'DEVUELTO': return 'bg-rose-50 text-rose-800 border-rose-300';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  estadoPostalLabel(estado: string): string {
    switch (estado) {
      case 'PENDIENTE_ENVIO': return 'Pendiente Envío';
      case 'EN_TRANSITO': return 'En Tránsito 4-72';
      case 'ENTREGADO': return 'Entregado / Notificado';
      case 'DEVUELTO': return 'Devuelto';
      default: return estado || 'Sin Notificar';
    }
  }

  vigenciasStr(vigencias: number[] | string): string {
    if (!vigencias) return '—';
    if (Array.isArray(vigencias)) {
      return vigencias.slice().sort((a, b) => a - b).join(', ');
    }
    return vigencias;
  }
}
