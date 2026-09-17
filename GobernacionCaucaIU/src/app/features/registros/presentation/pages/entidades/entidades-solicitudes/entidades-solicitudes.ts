import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SolicitudesLiquidacionFacade } from '../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ToastService } from '../../../../../../core/services/toast.service';
import { SolicitudListadoDto } from '../../../../domain/models/Radicacion/solicitud-wizard.model';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';
import { TableSearchComponent } from '../../../shared/components/table-search/table-search';

@Component({
  selector: 'app-entidades-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, TableSearchComponent],
  templateUrl: './entidades-solicitudes.html',
  styleUrl: './entidades-solicitudes.css'
})
export class EntidadesSolicitudesComponent implements OnInit {
  private router = inject(Router);
  private facade = inject(SolicitudesLiquidacionFacade);
  private toast = inject(ToastService);

  // Pestañas especializadas para la entidad
  // null = Todas, 1 = Borrador/Radicada, 2 = En Revisión Gobernación, 5 = Devuelta (Subsanar), 4 = Liquidada
  activeTab = signal<number | null>(null);

  solicitudes = signal<SolicitudListadoDto[]>([]);
  totalCount = signal<number>(0);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);

  // Modal para ver observaciones de devolución
  selectedSolicitudDevuelta = signal<SolicitudListadoDto | null>(null);
  showDevolucionModal = signal<boolean>(false);

  ngOnInit(): void {
    this.cargarSolicitudes();
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

  onPageChange(page: number): void {
    this.pageNumber.set(page);
    this.cargarSolicitudes();
  }

  continuarWizard(id: number): void {
    this.router.navigate(['/registros/entidades/solicitudes/wizard', id]);
  }

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

  irALiquidacion(): void {
    this.router.navigate(['/registros/entidades/liquidaciones']);
  }
}
