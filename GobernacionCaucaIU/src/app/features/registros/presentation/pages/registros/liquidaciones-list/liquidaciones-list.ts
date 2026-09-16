import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GeneracionLiquidacionFacade } from '../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { ToastService } from '../../../../../../core/services/toast.service';
import { LiquidacionListadoDto } from '../../../../domain/models/Liquidacion/generacion-liquidacion.model';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';
import { TableSearchComponent } from '../../../shared/components/table-search/table-search';
import { BreadcrumbComponent } from '../../../../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-liquidaciones-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, TableSearchComponent, BreadcrumbComponent],
  templateUrl: './liquidaciones-list.html'
})
export class LiquidacionesListComponent implements OnInit {
  router = inject(Router);
  facade = inject(GeneracionLiquidacionFacade);
  toast = inject(ToastService);

  // Estado
  liquidaciones = signal<LiquidacionListadoDto[]>([]);
  totalCount = signal<number>(0);

  filterStatus = signal<string>('Todas');
  
  searchText = signal<string>('');

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);

  ngOnInit() {
    this.cargarLiquidaciones();
  }

  // Mapeo oficial de estados de liquidación a ID de base de datos
  private readonly ESTADOS_MAP: Record<string, number | null> = {
    'TODAS': null,
    'GENERADA': 2,
    'RELIQUIDADA': 7,
    'PAGADA': 4,
    'DEVUELTA': 5,
    'ANULADA': 6
  };

  obtenerEstadoIdActual(): number | null {
    const status = this.filterStatus().toUpperCase();
    return this.ESTADOS_MAP[status] ?? null;
  }

  cargarLiquidaciones() {
    this.isLoading.set(true);
    const estadoId = this.obtenerEstadoIdActual();
    this.facade.listarLiquidaciones(this.pageNumber(), this.pageSize(), this.searchText(), estadoId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.liquidaciones.set(res.data.items);
          this.totalCount.set(res.data.totalCount);
        } else {
          this.toast.error(res.message || 'Error al cargar liquidaciones');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error de red al cargar liquidaciones');
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.pageNumber.set(page);
    this.cargarLiquidaciones();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.pageNumber.set(1);
    this.cargarLiquidaciones();
  }

  // Ahora la consulta y paginación son 100% gestionadas por la API y SQL Server
  filteredLiquidaciones = computed(() => this.liquidaciones());

  onSearch(term: string) {
    this.searchText.set(term);
    this.pageNumber.set(1);
    this.cargarLiquidaciones();
  }

  onClearSearch() {
    this.searchText.set('');
    this.pageNumber.set(1);
    this.cargarLiquidaciones();
  }

  setFilter(status: string) {
    this.filterStatus.set(status);
    this.pageNumber.set(1);
    this.cargarLiquidaciones();
  }

  // Modal de Pago
  showPagoModal = signal<boolean>(false);
  pagoLiquidacionSeleccionada = signal<LiquidacionListadoDto | null>(null);
  
  fechaPago = signal<string>(new Date().toISOString().split('T')[0]);
  medioPago = signal<number>(1);
  referenciaPago = signal<string>('');

  abrirModalPago(liquidacion: LiquidacionListadoDto) {
    this.pagoLiquidacionSeleccionada.set(liquidacion);
    this.fechaPago.set(new Date().toISOString().split('T')[0]);
    this.medioPago.set(1);
    this.referenciaPago.set('');
    this.showPagoModal.set(true);
  }

  cerrarModalPago() {
    this.showPagoModal.set(false);
    this.pagoLiquidacionSeleccionada.set(null);
  }

  confirmarPago() {
    this.toast.success('Pago registrado exitosamente (simulado).');
    this.cerrarModalPago();
    this.cargarLiquidaciones();
  }

  // Modal de Reliquidar
  showReliquidarModal = signal<boolean>(false);
  liquidacionIdTemp = signal<number | null>(null);
  motivoReliquidacion = signal<string>('Modificación en los actos informados por el contribuyente');

  reliquidar(id: number) {
    this.liquidacionIdTemp.set(id);
    this.motivoReliquidacion.set('Modificación en los actos informados por el contribuyente');
    this.showReliquidarModal.set(true);
  }

  cerrarModalReliquidar() {
    this.showReliquidarModal.set(false);
    this.liquidacionIdTemp.set(null);
  }

  confirmarReliquidar() {
    const id = this.liquidacionIdTemp();
    const motivo = this.motivoReliquidacion();

    if (!id) return;
    
    if (!motivo || motivo.trim().length < 5) {
      this.toast.warning('El motivo de reliquidación debe tener al menos 5 caracteres.');
      return;
    }

    this.isLoading.set(true);
    this.facade.reliquidarLiquidacion(id, motivo).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.toast.success('La liquidación ha sido anulada. Redirigiendo al formulario para ajustar los datos...');
          this.cerrarModalReliquidar();
          this.router.navigate(['/registros/solicitudes/wizard', res.data]);
        } else {
          this.toast.error(res.message || 'Error al intentar reliquidar.');
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.toast.error('Error de red al intentar reliquidar.');
        this.isLoading.set(false);
      }
    });
  }

  anular(id: number) {
    const motivo = prompt('Por favor, ingrese el motivo de anulación para esta liquidación:');
    
    if (motivo !== null) {
      if (motivo.trim().length < 5) {
        this.toast.warning('El motivo de anulación debe tener al menos 5 caracteres.');
        return;
      }

      this.isLoading.set(true);
      this.facade.anularLiquidacion(id, motivo).subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.success('Liquidación anulada exitosamente.');
            this.cargarLiquidaciones(); // Recargamos la grilla
          } else {
            this.toast.error(res.message || 'Error al anular la liquidación.');
            this.isLoading.set(false);
          }
        },
        error: () => {
          this.toast.error('Error de red al intentar anular.');
          this.isLoading.set(false);
        }
      });
    }
  }

  descargar(id: number) {
    this.isLoading.set(true);
    this.facade.descargarPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Liquidacion_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.toast.success('Descarga iniciada');
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error al descargar el PDF');
        this.isLoading.set(false);
      }
    });
  }
}
