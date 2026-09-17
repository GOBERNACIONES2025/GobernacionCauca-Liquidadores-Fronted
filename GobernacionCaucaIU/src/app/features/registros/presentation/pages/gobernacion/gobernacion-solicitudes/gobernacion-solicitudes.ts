import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SolicitudesLiquidacionFacade } from '../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { GeneracionLiquidacionFacade } from '../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { ToastService } from '../../../../../../core/services/toast.service';
import { SolicitudListadoDto, SolicitudLiquidacion } from '../../../../domain/models/Radicacion/solicitud-wizard.model';
import { LiquidacionSimuladaResponse } from '../../../../domain/models/Liquidacion/liquidacion-simulada.model';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';
import { TableSearchComponent } from '../../../shared/components/table-search/table-search';

@Component({
  selector: 'app-gobernacion-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, TableSearchComponent],
  templateUrl: './gobernacion-solicitudes.html',
  styleUrl: './gobernacion-solicitudes.css'
})
export class GobernacionSolicitudesComponent implements OnInit {
  private facade = inject(SolicitudesLiquidacionFacade);
  private generacionFacade = inject(GeneracionLiquidacionFacade);
  private toast = inject(ToastService);
  private router = inject(Router);

  // Estados de fiscalización: 2 = En Revisión Técnica (default), 5 = Devuelta a Notaría, 4 = Liquidada
  activeTab = signal<number>(2);

  solicitudes = signal<SolicitudListadoDto[]>([]);
  totalCount = signal<number>(0);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);

  // Modal de Fiscalización
  showFiscalizarModal = signal<boolean>(false);
  selectedSolicitud = signal<any | null>(null);
  preliquidacion = signal<LiquidacionSimuladaResponse | null>(null);
  isPreliquidando = signal<boolean>(false);
  isAprobando = signal<boolean>(false);

  // Modal Devolver
  showDevolverModal = signal<boolean>(false);
  motivoDevolucion = signal<string>('');

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cambiarPestana(estadoId: number): void {
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
      this.activeTab()
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
        this.toast.error('Error al cargar expedientes fiscales');
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

  abrirFiscalizacion(id: number): void {
    this.isLoading.set(true);
    this.preliquidacion.set(null);
    this.facade.obtenerSolicitudPorId(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) {
          this.selectedSolicitud.set(res.data);
          this.showFiscalizarModal.set(true);
          // Ejecuta preliquidación automática
          this.simularPreliquidacion(id);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('No se pudo cargar el expediente para fiscalización');
      }
    });
  }

  simularPreliquidacion(solicitudId: number): void {
    this.isPreliquidando.set(true);
    this.generacionFacade.simularLiquidacion(solicitudId).subscribe({
      next: (res) => {
        this.isPreliquidando.set(false);
        if (res.data) {
          this.preliquidacion.set(res.data);
        }
      },
      error: () => {
        this.isPreliquidando.set(false);
        this.toast.warning('No se pudo calcular la simulación previa');
      }
    });
  }

  aprobarYGenerarLiquidacion(): void {
    const sol = this.selectedSolicitud();
    if (!sol) return;

    this.isAprobando.set(true);
    this.generacionFacade.generarLiquidacion({ solicitudId: sol.id }).subscribe({
      next: (res) => {
        this.isAprobando.set(false);
        this.toast.success(`¡Liquidación oficial generada exitosamente! ID: ${res.data}`);
        this.showFiscalizarModal.set(false);
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.isAprobando.set(false);
        this.toast.error(err?.error?.message || 'Error al generar la liquidación oficial');
      }
    });
  }

  abrirDevolucion(): void {
    this.motivoDevolucion.set('');
    this.showDevolverModal.set(true);
  }

  confirmarDevolucion(): void {
    const sol = this.selectedSolicitud();
    if (!sol || !this.motivoDevolucion().trim()) {
      this.toast.warning('Por favor escriba las observaciones de devolución técnica');
      return;
    }

    this.facade.devolverSolicitud(sol.id, this.motivoDevolucion()).subscribe({
      next: () => {
        this.toast.success('Expediente devuelto a la entidad externa con requerimiento');
        this.showDevolverModal.set(false);
        this.showFiscalizarModal.set(false);
        this.cargarSolicitudes();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al devolver el expediente')
    });
  }
}
