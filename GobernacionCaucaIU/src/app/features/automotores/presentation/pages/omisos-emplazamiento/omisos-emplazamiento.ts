import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OmisosFacade } from '../../../application/facades/omisos.facade';
import { NivelMoraOmiso, VehiculoOmiso, VigenciaOmisoDetalle } from '../../../domain/models/liquidacion.model';

@Component({
  selector: 'app-omisos-emplazamiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './omisos-emplazamiento.html',
})
export class OmisosEmplazamientoPage implements OnInit {
  readonly facade = inject(OmisosFacade);

  /** Texto de búsqueda ligado al input (two-way binding local antes de disparar la búsqueda) */
  textoBuscar = '';

  ngOnInit(): void {
    this.facade.cargarOmisos();
    this.facade.cargarKpis();
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

  // ── Helpers de semáforo para el template ──────────────────────────────────

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

  vigenciasStr(vigencias: number[]): string {
    if (!vigencias?.length) return '—';
    return vigencias.slice().sort((a, b) => a - b).join(', ');
  }

  readonly aniosDisponibles = [2026, 2025, 2024, 2023, 2022, 2021, 2020];
}
