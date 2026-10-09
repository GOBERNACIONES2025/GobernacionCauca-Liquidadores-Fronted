import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { OmisosFacade, TabOmisos } from '../../../application/facades/omisos.facade';
import {
  NivelMoraOmiso,
  VehiculoOmiso,
  VigenciaOmisoDetalle,
  EstadoPostal,
  TrazabilidadPostalRequest
} from '../../../domain/models/liquidacion.model';

@Component({
  selector: 'app-omisos-emplazamiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './omisos-emplazamiento.html',
})
export class OmisosEmplazamientoPage implements OnInit {
  readonly facade = inject(OmisosFacade);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);

  /** Texto de búsqueda ligado al input (two-way binding local antes de disparar la búsqueda) */
  textoBuscar = '';

  // Formulario local del Modal de Trazabilidad Postal
  formNumeroGuia = '';
  formEmpresaEnvio = '';
  formFechaEnvio = '';
  formFechaEntrega = '';
  formEstadoPostal: EstadoPostal = 'ENTREGADO';
  formObservaciones = '';

  ngOnInit(): void {
    this.facade.cargarOmisos();
    this.facade.cargarKpis();
  }

  onSelectTab(tab: TabOmisos): void {
    this.facade.setTab(tab);
  }

  onBuscar(): void {
    this.facade.setBuscar(this.textoBuscar);
  }

  onBuscarKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onBuscar();
  }

  onFiltroNivel(nivel: NivelMoraOmiso | ''): void {
    this.facade.setNivelMora(nivel);
  }

  onFiltroEstado(estado: 'SIN_NOTIFICAR' | 'NOTIFICADO' | 'COBRO_COACTIVO' | ''): void {
    this.facade.setEstadoEmpl(estado);
  }

  onFiltroVigencia(event: Event): void {
    const val = +(event.target as HTMLSelectElement).value;
    this.facade.setVigencia(val);
  }

  onLimpiarFiltros(): void {
    this.textoBuscar = '';
    this.facade.limpiarFiltros();
  }

  onSimular(placa: string): void {
    this.facade.abrirEmplazamiento(placa);
  }

  onEmplazar(placa: string, vigencia?: number): void {
    this.facade.abrirEmplazamiento(placa, vigencia);
  }

  onEmplazarVehiculo(omiso: VehiculoOmiso): void {
    this.facade.abrirEmplazamiento(omiso.placa);
  }

  onEmplazarVigencia(omiso: VehiculoOmiso, v: VigenciaOmisoDetalle): void {
    this.facade.abrirEmplazamiento(omiso.placa, v.anio);
  }

  onEmitirEmplazamiento(placa: string): void {
    this.facade.emitirEmplazamiento(placa);
  }

  onAbrirEmplazamientoMasivo(): void {
    this.facade.abrirEmplazamientoMasivo();
  }

  onConfirmarEmplazamientoMasivo(): void {
    this.facade.confirmarEmplazamientoMasivo();
  }

  onCerrarEmplazamientoMasivo(): void {
    this.facade.cerrarEmplazamientoMasivo();
  }

  onToggleExpandir(placa: string): void {
    this.facade.toggleExpandirPlaca(placa);
  }

  paginaAnterior(): void {
    const p = this.facade.page();
    if (p > 1) this.facade.setPage(p - 1);
  }

  paginaSiguiente(): void {
    const p = this.facade.page();
    const total = this.facade.totalPages();
    if (p < total) this.facade.setPage(p + 1);
  }

  // ── Acciones de Trazabilidad Postal ───────────────────────────────────────
  abrirModalPostal(omiso: VehiculoOmiso): void {
    this.formNumeroGuia = omiso.numeroGuiaPostal || '';
    const emp = omiso.empresaEnvio?.trim() || '';
    this.formEmpresaEnvio = (emp === 'Servicios Postales Nacionales 4-72' && !omiso.numeroGuiaPostal) ? '' : emp;
    this.formFechaEnvio = omiso.fechaEnvioPostal || new Date().toISOString().split('T')[0];
    this.formFechaEntrega = omiso.fechaEntregaNotificacion || '';
    this.formEstadoPostal = omiso.estadoPostal || (omiso.estadoEmplazamiento === 'NOTIFICADO' ? 'ENTREGADO' : 'PENDIENTE_ENVIO');
    this.formObservaciones = '';
    this.facade.abrirModalPostal(omiso);
  }

  cerrarModalPostal(): void {
    this.facade.cerrarModalPostal();
  }

  guardarPostal(): void {
    const veh = this.facade.vehiculoPostalActivo();
    if (!veh) return;

    const payload: TrazabilidadPostalRequest = {
      placa: veh.placa,
      numeroGuiaPostal: this.formNumeroGuia.trim(),
      empresaEnvio: this.formEmpresaEnvio.trim(),
      fechaEnvioPostal: this.formFechaEnvio,
      fechaEntregaNotificacion: this.formFechaEntrega || undefined,
      estadoPostal: this.formEstadoPostal,
      observaciones: this.formObservaciones.trim(),
    };

    this.facade.guardarTrazabilidadPostal(payload);
  }

  // ── Acciones de Notificación por Aviso Web ────────────────────────────────
  abrirModalAviso(omiso: VehiculoOmiso): void {
    this.facade.abrirModalAviso(omiso);
  }

  cerrarModalAviso(): void {
    this.facade.cerrarModalAviso();
  }

  publicarAvisoWeb(placa: string): void {
    this.facade.publicarAvisoWeb(placa);
  }

  descargarAvisoWebPdf(omiso: VehiculoOmiso): void {
    this.facade.descargarAvisoWebPdf(omiso);
  }

  // ── Descarga de PDF Oficial ───────────────────────────────────────────────
  descargarActoPdf(placa: string, vigencia?: number): void {
    this.facade.descargarActoEmplazamientoPdf(placa, vigencia);
  }

  // ── Previsualización y Documentos Oficiales de Fiscalización ──────────────
  previsualizarDossier(placa: string): void {
    this.facade.abrirPreviewDossier(placa);
  }

  cerrarPreviewDossier(): void {
    this.facade.cerrarPreviewDossier();
  }

  descargarPlanillaPostal472(): void {
    this.facade.descargarPlanillaPostalPdf();
  }

  abrirModalPlanillaPostal(): void {
    this.facade.abrirPreviewPlanilla();
  }

  cerrarModalPlanillaPostal(): void {
    this.facade.cerrarPreviewPlanilla();
  }

  seleccionarBloque(cantidad: number): void {
    this.facade.seleccionarBloque(cantidad);
  }

  onOperadorPlanillaChange(operador: string): void {
    this.facade.setOperadorPostalPlanilla(operador);
  }

  onFechaRemesaChange(fecha: string): void {
    this.facade.setFechaRemesaPlanilla(fecha);
  }

  descartarVehiculoDeLote(placa: string): void {
    this.facade.descartarVehiculoDeLoteMasivo(placa);
  }

  descargarAutoCierre(omiso: VehiculoOmiso): void {
    this.facade.descargarAutoCierrePdf(omiso, 'PAGO_TOTAL');
  }

  irALiquidacionOficial(omiso: VehiculoOmiso): void {
    this.router.navigate(['/automotores/cobro-coactivo/aforo'], {
      queryParams: { placa: omiso.placa }
    });
  }

  getSafeHtml(html: string | null | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html || '');
  }

  // ── Helpers visuales para el template ─────────────────────────────────────
  nivelLabel(nivel: NivelMoraOmiso): string {
    return { RECIENTE: 'Reciente', EMPLAZABLE: 'Emplazable', CRITICO: 'Crítico' }[nivel] ?? nivel;
  }

  nivelBadgeClasses(nivel: NivelMoraOmiso): string {
    return {
      RECIENTE:   'bg-yellow-100 text-yellow-800 ring-yellow-200',
      EMPLAZABLE: 'bg-orange-100 text-orange-800 ring-orange-200',
      CRITICO:    'bg-red-100    text-red-800    ring-red-200',
    }[nivel] ?? 'bg-slate-100 text-slate-700';
  }

  nivelDotClasses(nivel: NivelMoraOmiso): string {
    return {
      RECIENTE:   'bg-yellow-400',
      EMPLAZABLE: 'bg-orange-500',
      CRITICO:    'bg-red-600',
    }[nivel] ?? 'bg-slate-400';
  }

  estadoEmplLabel(estado: string): string {
    return {
      SIN_NOTIFICAR:  'Sin Notificar',
      NOTIFICADO:     'Notificado',
      COBRO_COACTIVO: 'Cobro Coactivo',
    }[estado] ?? estado;
  }

  estadoEmplBadge(estado: string): string {
    return {
      SIN_NOTIFICAR:  'bg-slate-100  text-slate-600  ring-slate-200',
      NOTIFICADO:     'bg-blue-100   text-blue-700   ring-blue-200',
      COBRO_COACTIVO: 'bg-purple-100 text-purple-800 ring-purple-200',
    }[estado] ?? 'bg-slate-100 text-slate-600';
  }

  estadoPostalLabel(estado?: EstadoPostal): string {
    if (!estado) return 'Sin Despacho';
    return {
      PENDIENTE_ENVIO: 'Pendiente Envío',
      EN_TRANSITO:     'En Tránsito Postal',
      ENTREGADO:       'Entregado / Notificado',
      NO_ENTREGADO:    'Devuelto / No Entregado',
      DEVUELTO:        'Devuelto / No Entregado',
    }[estado] ?? estado;
  }

  estadoPostalBadge(estado?: EstadoPostal): string {
    if (!estado) return 'bg-slate-100 text-slate-600 border-slate-200';
    return {
      PENDIENTE_ENVIO: 'bg-amber-50 text-amber-800 border-amber-200',
      EN_TRANSITO:     'bg-sky-50 text-sky-800 border-sky-200',
      ENTREGADO:       'bg-emerald-50 text-emerald-800 border-emerald-200',
      NO_ENTREGADO:    'bg-rose-50 text-rose-800 border-rose-300',
      DEVUELTO:        'bg-rose-50 text-rose-800 border-rose-300',
    }[estado] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  }

  vigenciasStr(vigencias: number[]): string {
    if (!vigencias?.length) return '—';
    return vigencias.slice().sort((a, b) => a - b).join(', ');
  }

  readonly aniosDisponibles = [2026, 2025, 2024, 2023, 2022, 2021, 2020];
}
