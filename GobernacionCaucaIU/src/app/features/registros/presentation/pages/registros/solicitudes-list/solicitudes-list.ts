import { Component, computed, signal, inject, OnInit } from '@angular/core';
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
import { BreadcrumbComponent } from '../../../../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-solicitudes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, TableSearchComponent, BreadcrumbComponent],
  templateUrl: './solicitudes-list.html',
  styleUrls: ['./solicitudes-list.css']
})
export class SolicitudesListComponent implements OnInit {
  router = inject(Router);
  facade = inject(SolicitudesLiquidacionFacade);
  generacionFacade = inject(GeneracionLiquidacionFacade);
  toast = inject(ToastService);

  // Modo de vista: 'ENTIDAD' (Mis Trámites) o 'GOBERNACION' (Bandeja de Revisión y Liquidación)
  activePanel = signal<'ENTIDAD' | 'GOBERNACION'>('GOBERNACION');

  // Estado
  solicitudes = signal<SolicitudListadoDto[]>([]);
  totalCount = signal<number>(0);
  
  filterStatus = signal<string>('Todas');
  searchText = signal<string>('');

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);

  // Modal de Revisión Técnica Gobernación
  showRevisionModal = signal<boolean>(false);
  solicitudSeleccionada = signal<SolicitudListadoDto | null>(null);
  solicitudDetalle = signal<SolicitudLiquidacion | null>(null);
  simulacionDetalle = signal<LiquidacionSimuladaResponse | null>(null);
  isReviewLoading = signal<boolean>(false);

  // Modal Devolver Solicitud
  showDevolverModal = signal<boolean>(false);
  motivoDevolucion = signal<string>('');
  solicitudADevolver = signal<SolicitudListadoDto | null>(null);

  // Modal Anular Solicitud
  showAnularModal = signal<boolean>(false);
  motivoAnulacion = signal<string>('');
  solicitudAAnular = signal<SolicitudListadoDto | null>(null);

  // Estado de éxito liquidación generada
  idLiquidacionGenerada = signal<number | null>(null);

  esDevuelta(s: SolicitudListadoDto): boolean {
    return s.estadoSolicitudId === 5 || (s.nombreEstado || '').toUpperCase().includes('DEVUELT');
  }

  esEnRevision(s: SolicitudListadoDto): boolean {
    return s.estadoSolicitudId === 2 || (s.nombreEstado || '').toUpperCase().includes('REVIS');
  }

  esLiquidada(s: SolicitudListadoDto): boolean {
    return s.estadoSolicitudId === 4 || (s.nombreEstado || '').toUpperCase().includes('LIQUID');
  }

  ngOnInit() {
    this.cargarSolicitudes();
  }

  setPanel(panel: 'ENTIDAD' | 'GOBERNACION') {
    this.activePanel.set(panel);
    if (panel === 'GOBERNACION') {
      this.filterStatus.set('EN_REVISION');
    } else {
      this.filterStatus.set('Todas');
    }
    this.pageNumber.set(1);
    this.cargarSolicitudes();
  }

  onSearch(term: string) {
    this.searchText.set(term);
    this.pageNumber.set(1);
    this.cargarSolicitudes();
  }

  onClearSearch() {
    this.searchText.set('');
    this.pageNumber.set(1);
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.isLoading.set(true);
    this.facade.listarSolicitudes(this.pageNumber(), this.pageSize(), this.searchText()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.solicitudes.set(res.data.items || []);
          this.totalCount.set(res.data.totalCount || 0);
        } else {
          this.toast.error(res.message || 'Error al cargar solicitudes');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error de red al cargar solicitudes');
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.pageNumber.set(page);
    this.cargarSolicitudes();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.pageNumber.set(1);
    this.cargarSolicitudes();
  }

  filteredSolicitudes = computed(() => {
    let filtered = this.solicitudes();
    const status = this.filterStatus();

    if (status !== 'Todas') {
      filtered = filtered.filter(s => {
        const nom = (s.nombreEstado || '').toUpperCase();
        if (status === 'DEVUELTA') return nom.includes('DEVUELT');
        if (status === 'EN_REVISION') return nom.includes('REVISION') || nom.includes('REVISIÓN');
        if (status === 'RADICADA') return nom.includes('RADICAD') || nom.includes('BORRADOR');
        if (status === 'LIQUIDADA') return nom.includes('LIQUIDAD');
        return nom === status.toUpperCase();
      });
    }

    return filtered;
  });

  setFilter(status: string) {
    this.filterStatus.set(status);
  }

  onNewSolicitud() {
    this.router.navigate(['/registros/solicitudes/wizard']);
  }

  continuarSolicitud(id: number) {
    this.router.navigate(['/registros/solicitudes/wizard', id]);
  }

  subsanarSolicitud(solicitud: SolicitudListadoDto) {
    this.toast.info(`Abriendo solicitud ${solicitud.numeroRadicado} para subsanar observaciones de la Gobernación.`);
    this.router.navigate(['/registros/solicitudes/wizard', solicitud.id]);
  }

  // --- REVISIÓN TÉCNICA GOBERNACIÓN ---
  abrirRevision(solicitud: SolicitudListadoDto) {
    this.solicitudSeleccionada.set(solicitud);
    this.solicitudDetalle.set(null);
    this.simulacionDetalle.set(null);
    this.idLiquidacionGenerada.set(null);
    this.showRevisionModal.set(true);
    this.isReviewLoading.set(true);

    // Cargar detalle completo
    this.facade.obtenerSolicitudPorId(solicitud.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.solicitudDetalle.set(res.data);
        }
      }
    });

    // Cargar preliquidación simulada
    this.generacionFacade.simularLiquidacion(solicitud.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.simulacionDetalle.set(res.data);
        }
        this.isReviewLoading.set(false);
      },
      error: () => {
        this.isReviewLoading.set(false);
      }
    });
  }

  cerrarRevision() {
    this.showRevisionModal.set(false);
    this.solicitudSeleccionada.set(null);
    this.solicitudDetalle.set(null);
    this.simulacionDetalle.set(null);
  }

  aprobarYGenerarLiquidacion() {
    const solicitud = this.solicitudSeleccionada();
    if (!solicitud) return;

    this.isReviewLoading.set(true);
    this.generacionFacade.generarLiquidacion({ solicitudId: solicitud.id }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.idLiquidacionGenerada.set(res.data);
          this.toast.success(`¡Liquidación oficial generada exitosamente para el radicado ${solicitud.numeroRadicado}!`);
          this.cargarSolicitudes();
        } else {
          this.toast.error(res.message || 'Error al generar liquidación oficial');
        }
        this.isReviewLoading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.error?.detail || 'Error del servidor al emitir liquidación oficial');
        this.isReviewLoading.set(false);
      }
    });
  }

  descargarPdfLiquidacion(id: number) {
    this.generacionFacade.descargarPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Liquidacion_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.toast.success('Descarga de PDF iniciada');
      },
      error: () => {
        this.toast.error('Error al descargar el PDF de la liquidación');
      }
    });
  }

  // --- DEVOLVER SOLICITUD ---
  abrirModalDevolver(solicitud: SolicitudListadoDto) {
    this.solicitudADevolver.set(solicitud);
    this.motivoDevolucion.set('');
    this.showDevolverModal.set(true);
  }

  cerrarModalDevolver() {
    this.showDevolverModal.set(false);
    this.solicitudADevolver.set(null);
  }

  confirmarDevolver() {
    const sol = this.solicitudADevolver();
    if (!sol) return;

    const motivo = this.motivoDevolucion().trim();
    if (motivo.length < 5) {
      this.toast.warning('El motivo de devolución debe tener al menos 5 caracteres.');
      return;
    }

    this.isLoading.set(true);
    this.facade.devolverSolicitud(sol.id, motivo).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Solicitud ${sol.numeroRadicado} devuelta a la entidad para subsanación.`);
          this.cerrarModalDevolver();
          this.cerrarRevision();
          this.cargarSolicitudes();
        } else {
          this.toast.error(res.message || 'Error al devolver la solicitud');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.error?.detail || 'Error de red al devolver la solicitud');
        this.isLoading.set(false);
      }
    });
  }

  // --- ANULAR SOLICITUD ---
  abrirModalAnular(solicitud: SolicitudListadoDto) {
    this.solicitudAAnular.set(solicitud);
    this.motivoAnulacion.set('');
    this.showAnularModal.set(true);
  }

  cerrarModalAnular() {
    this.showAnularModal.set(false);
    this.solicitudAAnular.set(null);
  }

  confirmarAnular() {
    const sol = this.solicitudAAnular();
    if (!sol) return;

    const motivo = this.motivoAnulacion().trim();
    if (motivo.length < 5) {
      this.toast.warning('El motivo de anulación debe tener al menos 5 caracteres.');
      return;
    }

    this.isLoading.set(true);
    this.facade.cancelarSolicitud(sol.id, motivo).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Solicitud ${sol.numeroRadicado} anulada exitosamente.`);
          this.cerrarModalAnular();
          this.cerrarRevision();
          this.cargarSolicitudes();
        } else {
          this.toast.error(res.message || 'Error al anular la solicitud');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.error?.detail || 'Error de red al anular la solicitud');
        this.isLoading.set(false);
      }
    });
  }
}
