import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoVehicularFacade } from '../../../../application/facades/catalogo-vehicular.facade';
import { VehiculosApiService } from '../../../../infrastructure/api/vehiculos-api.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { VehiculoItemDto } from '../../../../domain/interfaces/vehiculo.interface';

@Component({
  selector: 'app-automotores-pendientes-aprobacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6 max-w-7xl mx-auto">
      <!-- HEADER -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div class="flex items-start space-x-3.5">
          <div class="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 shrink-0">
            <i class="fa-solid fa-clipboard-check text-xl"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2 text-[11px] font-medium text-slate-500 mb-0.5">
              <span>Configuración</span>
              <i class="fa-solid fa-chevron-right text-[8px] text-slate-400"></i>
              <span>Control & Auditoría</span>
              <i class="fa-solid fa-chevron-right text-[8px] text-slate-400"></i>
              <span class="text-amber-700 font-semibold">Pendientes por Aprobación</span>
            </div>
            <h1 class="text-lg font-bold text-slate-900 leading-tight flex items-center gap-2.5">
              Vehículos Pendientes por Aprobación
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {{ facade.pendientesAprobacion().length }} pendientes
              </span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Gestión y auditoría de automotores radicados o modificados que requieren visto bueno oficial</p>
          </div>
        </div>

        <button
          (click)="facade.cargarTodos()"
          type="button"
          class="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition cursor-pointer"
        >
          <i class="fa-solid fa-arrows-rotate text-slate-500" [class.fa-spin]="facade.loading()"></i>
          <span>Actualizar</span>
        </button>
      </div>

      <!-- TABLE -->
      <div class="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <th class="px-4 py-3">Placa</th>
                <th class="px-4 py-3">Marca y Línea</th>
                <th class="px-4 py-3">Modelo</th>
                <th class="px-4 py-3">Propietario Principal</th>
                <th class="px-4 py-3">Estado Matrícula</th>
                <th class="px-4 py-3 text-center">Acciones de Auditoría</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              @if (facade.loading()) {
                <tr>
                  <td colspan="6" class="text-center py-12 text-slate-400">
                    <i class="fa-solid fa-circle-notch fa-spin text-2xl text-blue-600 mb-2"></i>
                    <p>Consultando vehículos pendientes...</p>
                  </td>
                </tr>
              } @else if (facade.pendientesAprobacion().length === 0) {
                <tr>
                  <td colspan="6" class="text-center py-12 text-slate-400">
                    <i class="fa-solid fa-circle-check text-4xl text-emerald-400 mb-2"></i>
                    <p class="text-slate-600 font-semibold text-sm">¡Al día! No hay vehículos pendientes por aprobación</p>
                    <p class="text-[11px] text-slate-400">Todos los trámites y radicaciones vehiculares han sido procesados.</p>
                  </td>
                </tr>
              } @else {
                @for (v of facade.pendientesAprobacion(); track v.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center px-2 py-1 bg-yellow-300 text-slate-900 font-mono font-bold rounded border border-slate-400 text-xs shadow-2xs">
                        {{ v.placa }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="font-semibold text-slate-900">{{ v.marca }}</div>
                      <div class="text-[11px] text-slate-500">{{ v.linea }}</div>
                    </td>
                    <td class="px-4 py-3 font-medium text-slate-800">{{ v.modelo }}</td>
                    <td class="px-4 py-3">
                      <div class="font-medium text-slate-800">{{ v.propietario.nombre || v.propietarioNombre || 'No asignado' }}</div>
                      <div class="text-[11px] text-slate-400 font-mono">{{ v.propietario.numeroDocumento || v.propietarioDocumento || '' }}</div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        {{ v.estadoMatricula || 'En Revisión' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <div class="flex items-center justify-center space-x-1.5">
                        <button
                          (click)="cambiarEstado(v.id, 'APROBADO', v.placa)"
                          [disabled]="actionLoading() === v.id"
                          class="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition cursor-pointer disabled:opacity-50"
                        >
                          <i class="fa-solid fa-check mr-1"></i> Aprobar
                        </button>
                        <button
                          (click)="cambiarEstado(v.id, 'RECHAZADO', v.placa)"
                          [disabled]="actionLoading() === v.id"
                          class="px-2.5 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition cursor-pointer disabled:opacity-50"
                        >
                          <i class="fa-solid fa-xmark mr-1"></i> Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class PendientesAprobacionPage {
  public facade = inject(CatalogoVehicularFacade);
  private vehiculosApi = inject(VehiculosApiService);
  private toast = inject(ToastService);

  actionLoading = signal<number | null>(null);

  cambiarEstado(id: number, nuevoEstado: string, placa: string) {
    this.actionLoading.set(id);
    this.vehiculosApi.cambiarEstadoAprobacion(id, nuevoEstado).subscribe({
      next: () => {
        this.toast.success(`Vehículo ${placa} ${nuevoEstado.toLowerCase()} exitosamente`);
        this.facade.cargarTodos();
        this.actionLoading.set(null);
      },
      error: (err: any) => {
        this.toast.error(`Error al procesar vehículo ${placa}`);
        console.error(err);
        this.actionLoading.set(null);
      }
    });
  }
}
