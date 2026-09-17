import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estampillas-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border shadow-xs transition-all"
      [ngClass]="badgeClass()"
    >
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClass()"></span>
      {{ label() }}
    </span>
  `
})
export class EstampillasBadgeComponent {
  readonly estado = input.required<string>();

  readonly normalizedEstado = computed(() => (this.estado() || '').toUpperCase().trim());

  readonly label = computed(() => {
    const est = this.normalizedEstado();
    switch (est) {
      case 'PENDIENTE_PAGO':
      case 'PENDIENTE':
        return 'Pendiente de Pago';
      case 'PAGADA':
      case 'APROBADO':
        return 'Pagada / Aprobado';
      case 'GENERADA':
        return 'Generada';
      case 'BORRADOR':
        return 'Borrador';
      case 'ANULADA':
        return 'Anulada';
      case 'VENCIDA':
        return 'Vencida';
      case 'ACTIVO':
      case 'ACTIVA':
        return 'Activo';
      case 'INACTIVO':
      case 'INACTIVA':
        return 'Inactivo';
      case 'EN_EJECUCION':
        return 'En Ejecución';
      case 'LIQUIDADO':
        return 'Liquidado';
      case 'CERRADA':
        return 'Cerrada';
      case 'FUTURA':
        return 'Futura';
      default:
        return this.estado();
    }
  });

  readonly badgeClass = computed(() => {
    const est = this.normalizedEstado();
    switch (est) {
      case 'PAGADA':
      case 'APROBADO':
      case 'ACTIVO':
      case 'ACTIVA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDIENTE_PAGO':
      case 'PENDIENTE':
      case 'EN_EJECUCION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'GENERADA':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'BORRADOR':
      case 'FUTURA':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'ANULADA':
      case 'VENCIDA':
      case 'INACTIVO':
      case 'INACTIVA':
      case 'RECHAZADO':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CERRADA':
      case 'LIQUIDADO':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  });

  readonly dotClass = computed(() => {
    const est = this.normalizedEstado();
    switch (est) {
      case 'PAGADA':
      case 'APROBADO':
      case 'ACTIVO':
      case 'ACTIVA':
        return 'bg-emerald-500';
      case 'PENDIENTE_PAGO':
      case 'PENDIENTE':
      case 'EN_EJECUCION':
        return 'bg-amber-500';
      case 'GENERADA':
        return 'bg-blue-500';
      case 'BORRADOR':
      case 'FUTURA':
        return 'bg-slate-400';
      case 'ANULADA':
      case 'VENCIDA':
      case 'INACTIVO':
      case 'INACTIVA':
      case 'RECHAZADO':
        return 'bg-rose-500';
      case 'CERRADA':
      case 'LIQUIDADO':
        return 'bg-purple-500';
      default:
        return 'bg-slate-400';
    }
  });
}
