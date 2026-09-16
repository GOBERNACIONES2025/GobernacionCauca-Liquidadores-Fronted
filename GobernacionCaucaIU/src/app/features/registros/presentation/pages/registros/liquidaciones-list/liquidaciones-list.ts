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
  templateUrl: './liquidaciones-list.html',
  styleUrls: ['./liquidaciones-list.css']
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

  // Modal de Pago
  showPagoModal = signal<boolean>(false);
  pagoLiquidacionSeleccionada = signal<LiquidacionListadoDto | null>(null);
  fechaPago = signal<string>(new Date().toISOString().split('T')[0]);
  medioPago = signal<number>(1);
  referenciaPago = signal<string>('');

  // Modal de Solicitud de Reliquidación
  showReliquidarModal = signal<boolean>(false);
  liquidacionSeleccionada = signal<LiquidacionListadoDto | null>(null);
  causalReliquidacion = signal<string>('Error aritmético o en la base gravable declarada');
  motivoReliquidacion = signal<string>('Ajuste justificado en los actos e intervinientes declarados');

  // Modal de Historial de Estados
  showHistorialModal = signal<boolean>(false);
  historialItems = signal<any[]>([]);
  isHistorialLoading = signal<boolean>(false);

  ngOnInit() {
    this.cargarLiquidaciones();
  }

  private readonly ESTADOS_MAP: Record<string, number | null> = {
    'TODAS': null,
    'GENERADA': 2,
    'VIGENTE': 3,
    'PAGADA': 4,
    'DEVUELTA': 5,
    'ANULADA': 6,
    'RELIQUIDADA': 7
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
          this.liquidaciones.set(res.data.items || []);
          this.totalCount.set(res.data.totalCount || 0);
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

  // --- MODAL DE PAGO ---
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
    this.toast.success('Pago registrado exitosamente (simulado en entorno de desarrollo).');
    this.cerrarModalPago();
    this.cargarLiquidaciones();
  }

  // --- MODAL DE SOLICITUD DE RELIQUIDACIÓN ---
  abrirModalReliquidar(liquidacion: LiquidacionListadoDto) {
    this.liquidacionSeleccionada.set(liquidacion);
    this.causalReliquidacion.set('Error aritmético o en la base gravable declarada');
    this.motivoReliquidacion.set('Ajuste justificado en los actos e intervinientes declarados');
    this.showReliquidarModal.set(true);
  }

  cerrarModalReliquidar() {
    this.showReliquidarModal.set(false);
    this.liquidacionSeleccionada.set(null);
  }

  // Radica formalmente la solicitud de reliquidación ante la Gobernación
  confirmarSolicitudReliquidacion() {
    const liq = this.liquidacionSeleccionada();
    if (!liq) return;

    const motivoCompleto = `[Causal: ${this.causalReliquidacion()}] - ${this.motivoReliquidacion().trim()}`;
    if (this.motivoReliquidacion().trim().length < 5) {
      this.toast.warning('Debe ingresar un motivo de reliquidación con al menos 5 caracteres.');
      return;
    }

    this.isLoading.set(true);
    this.facade.solicitarReliquidacion(liq.id, motivoCompleto).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Solicitud de reliquidación radicada formalmente ante la Gobernación del Cauca para la liquidación ${liq.numeroLiquidacion}.`);
          this.cerrarModalReliquidar();
          this.cargarLiquidaciones();
        } else {
          this.toast.error(res.message || 'Error al radicar solicitud de reliquidación');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.error?.detail || 'Error al radicar solicitud de reliquidación');
        this.isLoading.set(false);
      }
    });
  }

  // Reliquidación directa (Super Administrador)
  confirmarReliquidarDirecto() {
    const liq = this.liquidacionSeleccionada();
    if (!liq) return;

    const motivo = this.motivoReliquidacion().trim();
    if (motivo.length < 5) {
      this.toast.warning('Debe ingresar un motivo de al menos 5 caracteres.');
      return;
    }

    this.isLoading.set(true);
    this.facade.reliquidarLiquidacion(liq.id, motivo).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.toast.success('La liquidación anterior ha sido anulada. Abriendo formulario para ajustar los datos del trámite...');
          this.cerrarModalReliquidar();
          this.router.navigate(['/registros/solicitudes/wizard', res.data]);
        } else {
          this.toast.error(res.message || 'Error al reliquidar');
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.toast.error('Error de red al ejecutar reliquidación directa');
        this.isLoading.set(false);
      }
    });
  }

  // --- ANULAR LIQUIDACIÓN ---
  anular(id: number) {
    const motivo = prompt('Por favor, ingrese el motivo de anulación oficial para esta liquidación:');
    if (motivo !== null) {
      if (motivo.trim().length < 5) {
        this.toast.warning('El motivo de anulación debe tener al menos 5 caracteres.');
        return;
      }

      this.isLoading.set(true);
      this.facade.anularLiquidacion(id, motivo.trim()).subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.success('Liquidación anulada exitosamente.');
            this.cargarLiquidaciones();
          } else {
            this.toast.error(res.message || 'Error al anular la liquidación');
            this.isLoading.set(false);
          }
        },
        error: () => {
          this.toast.error('Error de red al intentar anular la liquidación');
          this.isLoading.set(false);
        }
      });
    }
  }

  // --- HISTORIAL DE ESTADOS ---
  verHistorial(liquidacion: LiquidacionListadoDto) {
    this.liquidacionSeleccionada.set(liquidacion);
    this.historialItems.set([]);
    this.showHistorialModal.set(true);
    this.isHistorialLoading.set(true);

    this.facade.obtenerHistorial(liquidacion.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.historialItems.set(Array.isArray(res.data) ? res.data : [res.data]);
        }
        this.isHistorialLoading.set(false);
      },
      error: () => {
        this.isHistorialLoading.set(false);
      }
    });
  }

  cerrarHistorialModal() {
    this.showHistorialModal.set(false);
    this.liquidacionSeleccionada.set(null);
  }

  // --- DESCARGAR PDF OFICIAL ---
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
        this.toast.success('Descarga de PDF oficial iniciada');
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error al descargar el PDF de la liquidación');
        this.isLoading.set(false);
      }
    });
  }
}
