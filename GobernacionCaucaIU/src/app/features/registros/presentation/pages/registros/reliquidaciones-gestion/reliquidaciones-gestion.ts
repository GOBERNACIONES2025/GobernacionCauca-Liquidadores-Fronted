import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GeneracionLiquidacionFacade } from '../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { ToastService } from '../../../../../../core/services/toast.service';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';
import { TableSearchComponent } from '../../../shared/components/table-search/table-search';
import { BreadcrumbComponent } from '../../../../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-reliquidaciones-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, TableSearchComponent, BreadcrumbComponent],
  templateUrl: './reliquidaciones-gestion.html',
  styleUrls: ['./reliquidaciones-gestion.css']
})
export class ReliquidacionesGestionComponent implements OnInit {
  private facade = inject(GeneracionLiquidacionFacade);
  private toast = inject(ToastService);
  private router = inject(Router);

  reliquidaciones = signal<any[]>([]);
  totalCount = signal<number>(0);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);

  // Modales
  showAprobarModal = signal<boolean>(false);
  showRechazarModal = signal<boolean>(false);
  itemSeleccionado = signal<any | null>(null);
  
  motivoAprobacion = signal<string>('Aprobación formal de reliquidación por verificación técnica conforme a la documentación radicada.');
  motivoRechazo = signal<string>('');

  ngOnInit() {
    this.cargarReliquidaciones();
  }

  cargarReliquidaciones() {
    this.isLoading.set(true);
    this.facade.listarReliquidacionesPendientes(
      this.pageNumber(),
      this.pageSize(),
      this.searchText()
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.reliquidaciones.set(res.data.items || []);
          this.totalCount.set(res.data.totalCount || 0);
        } else {
          this.toast.error(res.message || 'Error al cargar reliquidaciones');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error de red al consultar solicitudes de reliquidación');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(term: string) {
    this.searchText.set(term);
    this.pageNumber.set(1);
    this.cargarReliquidaciones();
  }

  onClearSearch() {
    this.searchText.set('');
    this.pageNumber.set(1);
    this.cargarReliquidaciones();
  }

  onPageChange(page: number) {
    this.pageNumber.set(page);
    this.cargarReliquidaciones();
  }

  abrirModalAprobar(item: any) {
    this.itemSeleccionado.set(item);
    this.motivoAprobacion.set('Aprobación formal de reliquidación por verificación técnica conforme a la documentación radicada.');
    this.showAprobarModal.set(true);
  }

  cerrarModalAprobar() {
    this.showAprobarModal.set(false);
    this.itemSeleccionado.set(null);
  }

  confirmarAprobacion() {
    const item = this.itemSeleccionado();
    if (!item) return;

    const motivo = this.motivoAprobacion().trim();
    if (motivo.length < 5) {
      this.toast.warning('Debe ingresar un motivo de aprobación con al menos 5 caracteres.');
      return;
    }

    this.isLoading.set(true);
    this.facade.aprobarReliquidacion(item.liquidacionId, motivo).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Reliquidación aprobada exitosamente. Se ha emitido la nueva liquidación oficial #${res.data || ''}`);
          this.cerrarModalAprobar();
          this.cargarReliquidaciones();
        } else {
          this.toast.error(res.message || 'Error al aprobar reliquidación');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.error?.detail || 'Error al procesar la aprobación de la reliquidación');
        this.isLoading.set(false);
      }
    });
  }

  abrirModalRechazar(item: any) {
    this.itemSeleccionado.set(item);
    this.motivoRechazo.set('');
    this.showRechazarModal.set(true);
  }

  cerrarModalRechazar() {
    this.showRechazarModal.set(false);
    this.itemSeleccionado.set(null);
  }

  confirmarRechazo() {
    const item = this.itemSeleccionado();
    if (!item) return;

    const motivo = this.motivoRechazo().trim();
    if (motivo.length < 5) {
      this.toast.warning('Debe ingresar una justificación de rechazo con al menos 5 caracteres.');
      return;
    }

    this.isLoading.set(true);
    this.facade.rechazarReliquidacion(item.liquidacionId, motivo).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('La solicitud de reliquidación ha sido rechazada. La liquidación original se mantiene vigente.');
          this.cerrarModalRechazar();
          this.cargarReliquidaciones();
        } else {
          this.toast.error(res.message || 'Error al rechazar reliquidación');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.error?.detail || 'Error al procesar el rechazo de la reliquidación');
        this.isLoading.set(false);
      }
    });
  }

  verSolicitud(solicitudId: number) {
    this.router.navigate(['/registros/solicitudes/wizard', solicitudId]);
  }
}
