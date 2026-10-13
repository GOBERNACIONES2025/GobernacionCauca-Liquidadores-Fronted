import { Component, inject, OnInit, OnDestroy, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { VehiculosFacade } from '../../../application/facades/vehiculos.facade';
import { LiquidacionesFacade } from '../../../application/facades/liquidaciones.facade';
import { VehiculoItem } from '../../../domain/models/vehiculo.model';
import { VehiculoWizardComponent } from '../../components/vehiculo-wizard/vehiculo-wizard';
import {
  VehiculosHeaderComponent,
  VehiculosKpiCardsComponent,
  VehiculosTableComponent,
  VehiculosExpedientePanelComponent,
  VehiculosPendientesModalComponent,
  VehiculosAuditoriaModalComponent,
  VehiculosInactivarModalComponent,
  VehiculosRuntModalComponent,
  VehiculosLiquidacionModalComponent
} from '../../components/vehiculos';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    VehiculosHeaderComponent,
    VehiculosKpiCardsComponent,
    VehiculosTableComponent,
    VehiculoWizardComponent,
    VehiculosExpedientePanelComponent,
    VehiculosPendientesModalComponent,
    VehiculosAuditoriaModalComponent,
    VehiculosInactivarModalComponent,
    VehiculosRuntModalComponent,
    VehiculosLiquidacionModalComponent
  ],
  templateUrl: './vehiculos.html'
})
export class Vehiculos implements OnInit, OnDestroy {
  readonly facade = inject(VehiculosFacade);
  readonly liqFacade = inject(LiquidacionesFacade);

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  readonly toastMessage = signal<{ title: string; desc: string; type: 'success' | 'error' | 'info' } | null>(null);
  readonly vehiculoAuditoriaSeleccionado = signal<VehiculoItem | null>(null);

  readonly countActivos = computed<number>(() => {
    const kpiCount = this.facade.kpis().totalVehiculosActivos;
    if (kpiCount !== undefined && kpiCount > 0) return kpiCount;
    return this.facade.vehiculos().filter(v => v.estadoMatricula === 'Matrícula Activa' || v.estadoMatricula === 'Activo').length;
  });

  readonly countInactivos = computed<number>(() => {
    const kpiCount = this.facade.kpis().totalVehiculosInactivos;
    if (kpiCount !== undefined && kpiCount > 0) return kpiCount;
    return this.facade.vehiculos().filter(v => v.estadoMatricula !== 'Matrícula Activa' && v.estadoMatricula !== 'Activo').length;
  });

  ngOnInit(): void {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(text => {
      this.facade.setFiltroTexto(text);
    });
    this.facade.refrescarDashboard();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onFiltroTextoChange(val: string): void {
    this.facade.filtroTexto.set(val);
    this.searchSubject.next(val);
  }

  onSearchVehiculos(term: string): void {
    this.facade.setFiltroTexto(term);
  }

  onFiltrarPorEstado(estado: string): void {
    this.facade.setFiltroEstado(estado);
  }

  // ─── Control de Registro y Edición con Wizard ──────────────────────────────
  onAbrirRegistro(): void {
    this.facade.limpiarBusquedaPropietario();
    this.facade.abrirRegistro();
  }

  onVerDetalleVehiculo(v: VehiculoItem): void {
    this.facade.abrirExpediente(v);
  }

  onEditarVehiculo(v: VehiculoItem): void {
    this.facade.abrirExpediente(v);
  }

  // ─── Control de Auditoría y Pendientes ────────────────────────────────────
  onVerDetallePendiente(item: VehiculoItem): void {
    this.vehiculoAuditoriaSeleccionado.set(item);
  }

  cerrarAuditoriaModal(): void {
    this.vehiculoAuditoriaSeleccionado.set(null);
  }

  onCambiarEstadoAprobacion(event: { id: number; estado: string }): void {
    const { id, estado } = event;
    this.facade.cambiarEstadoAprobacion(id, estado).subscribe({
      next: () => {
        const msgMap: Record<string, string> = {
          'APROBADO': 'Vehículo aprobado exitosamente. Ahora aparece en la lista de vehículos activos.',
          'REVISION': 'Vehículo marcado para revisión de datos.',
          'RECHAZADO': 'Vehículo rechazado.'
        };
        this.toastMessage.set({
          title: 'Estado de Aprobación Actualizado',
          desc: msgMap[estado.toUpperCase()] || `Estado cambiado a ${estado}`,
          type: estado.toUpperCase() === 'APROBADO' ? 'success' : 'info'
        });
      },
      error: (err) => {
        console.error('Error al cambiar estado de aprobación:', err);
        this.toastMessage.set({
          title: 'Error al actualizar estado',
          desc: err.message || 'No se pudo cambiar el estado de aprobación.',
          type: 'error'
        });
      }
    });
  }

  onToast(event: { title: string; desc: string; type: 'success' | 'error' | 'info' }): void {
    this.toastMessage.set(event);
  }

  cerrarToast(): void {
    this.toastMessage.set(null);
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.vehiculoAuditoriaSeleccionado()) {
      this.cerrarAuditoriaModal();
    } else if (this.facade.isInactivarModalOpen()) {
      this.facade.cerrarInactivar();
    } else if (this.facade.isDrawerOpen()) {
      this.facade.cerrarRegistro();
    } else if (this.facade.isRuntModalOpen()) {
      this.facade.cerrarRunt();
    } else if (this.facade.isModalPendientesOpen()) {
      this.facade.cerrarModalPendientes();
    } else if (this.facade.selectedVehiculo()) {
      this.facade.deseleccionarVehiculo();
    }
  }
}
