import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SolicitudesLiquidacionFacade } from '../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ToastService } from '../../../../../../core/services/toast.service';
import { SolicitudListadoDto } from '../../../../domain/models/Radicacion/solicitud-wizard.model';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';
import { TableSearchComponent } from '../../../shared/components/table-search/table-search';
import { 
  getTramiteStatusConfig, 
  getEtapaWizardLabel, 
  TramiteStatusConfig 
} from '../../../../domain/models/Radicacion/tramite-status-policy';

@Component({
  selector: 'app-entidades-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, TableSearchComponent],
  templateUrl: './entidades-solicitudes.html',
  styleUrl: './entidades-solicitudes.css'
})
export class EntidadesSolicitudesComponent implements OnInit {
  private router = inject(Router);
  public facade = inject(SolicitudesLiquidacionFacade);
  private toast = inject(ToastService);

  // Pestañas especializadas para la entidad
  // null = Todas, 5 = Devuelta (Subsanar), 1 = Borrador/Diligenciamiento, 2 = En Revisión Gobernación, 4 = Liquidada
  activeTab = signal<number | null>(null);

  solicitudes = signal<SolicitudListadoDto[]>([]);
  totalCount = signal<number>(0);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);
  isActionLoading = signal<boolean>(false);

  // Métricas Operativas KPI (Tablero de Control Notarial)
  kpiTotal = signal<number>(0);
  kpiDevueltas = signal<number>(0);
  kpiBorradores = signal<number>(0);
  kpiEnRevision = signal<number>(0);
  kpiLiquidadas = signal<number>(0);

  // Modal para ver requerimiento y observaciones de devolución
  selectedSolicitudDevuelta = signal<SolicitudListadoDto | null>(null);
  showDevolucionModal = signal<boolean>(false);

  // Modal de Confirmación Inteligente: Descartar Borrador
  selectedSolicitudDescartar = signal<SolicitudListadoDto | null>(null);
  showDescartarModal = signal<boolean>(false);
  descartarMotivo = signal<string>('Borrador descartado por la entidad originadora');

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.cargarKpis();
  }

  cargarKpis(): void {
    // 1. Total Global
    this.facade.listarSolicitudes(1, 1).subscribe({
      next: (res) => { if (res?.data) this.kpiTotal.set(res.data.totalCount || 0); }
    });

    // 2. Devueltas (Estado 5 - Urgente)
    this.facade.listarSolicitudes(1, 1, undefined, 5).subscribe({
      next: (res) => { if (res?.data) this.kpiDevueltas.set(res.data.totalCount || 0); }
    });

    // 3. Borradores (Estado 1)
    this.facade.listarSolicitudes(1, 1, undefined, 1).subscribe({
      next: (res) => { if (res?.data) this.kpiBorradores.set(res.data.totalCount || 0); }
    });

    // 4. En Revisión (Estado 2)
    this.facade.listarSolicitudes(1, 1, undefined, 2).subscribe({
      next: (res) => { if (res?.data) this.kpiEnRevision.set(res.data.totalCount || 0); }
    });

    // 5. Liquidadas (Estado 4)
    this.facade.listarSolicitudes(1, 1, undefined, 4).subscribe({
      next: (res) => { if (res?.data) this.kpiLiquidadas.set(res.data.totalCount || 0); }
    });
  }

  cambiarPestana(estadoId: number | null): void {
    this.activeTab.set(estadoId);
    this.pageNumber.set(1);
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.isLoading.set(true);
    this.facade.listarSolicitudes(
      this.pageNumber(),
      this.pageSize(),
      this.searchText(),
      this.activeTab() ?? undefined
    ).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) {
          this.solicitudes.set(res.data.items || []);
          this.totalCount.set(res.data.totalCount || 0);
          
          // Actualizar métrica de la pestaña activa si aplica
          if (this.activeTab() === null && !this.searchText()) {
            this.kpiTotal.set(res.data.totalCount || 0);
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('No fue posible cargar el listado de solicitudes');
      }
    });
  }

  onSearch(term: string): void {
    this.searchText.set(term);
    this.pageNumber.set(1);
    this.cargarSolicitudes();
  }

  limpiarBusqueda(): void {
    this.searchText.set('');
    this.pageNumber.set(1);
    this.cargarSolicitudes();
  }

  onPageChange(page: number): void {
    this.pageNumber.set(page);
    this.cargarSolicitudes();
  }

  continuarWizard(id: number): void {
    this.router.navigate(['/registros/entidades/solicitudes/wizard', id]);
  }

  // --- Subsanación de Devoluciones ---
  verObservacionesDevuelta(sol: SolicitudListadoDto): void {
    this.selectedSolicitudDevuelta.set(sol);
    this.showDevolucionModal.set(true);
  }

  subsanarDesdeModal(): void {
    const sol = this.selectedSolicitudDevuelta();
    if (sol) {
      this.showDevolucionModal.set(false);
      this.continuarWizard(sol.id);
    }
  }

  // --- Prevención de Errores: Descarte Seguro de Borradores ---
  abrirModalDescartar(sol: SolicitudListadoDto): void {
    this.selectedSolicitudDescartar.set(sol);
    this.descartarMotivo.set('Borrador descartado por decisión de la entidad');
    this.showDescartarModal.set(true);
  }

  confirmarDescartar(): void {
    const sol = this.selectedSolicitudDescartar();
    if (!sol) return;

    this.isActionLoading.set(true);
    this.facade.cancelarSolicitud(sol.id, this.descartarMotivo()).subscribe({
      next: () => {
        this.isActionLoading.set(false);
        this.showDescartarModal.set(false);
        this.selectedSolicitudDescartar.set(null);
        this.toast.success(`El borrador ${sol.numeroRadicado} ha sido cancelado.`);
        this.cargarSolicitudes();
        this.cargarKpis();
      },
      error: (err) => {
        this.isActionLoading.set(false);
        this.toast.error(err?.error?.message || 'No fue posible descartar el borrador seleccionado.');
      }
    });
  }

  irALiquidacion(): void {
    this.router.navigate(['/registros/entidades/liquidaciones']);
  }

  // Helpers de Formato y Presentación
  getStatusConfig(estadoId: number): TramiteStatusConfig {
    return getTramiteStatusConfig(estadoId);
  }

  getEtapaLabel(etapa: number): string {
    return getEtapaWizardLabel(etapa);
  }
}
