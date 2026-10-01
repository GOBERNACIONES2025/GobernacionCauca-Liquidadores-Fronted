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

  // Estado de solicitudes
  solicitudes = signal<SolicitudListadoDto[]>([]);
  totalCount = signal<number>(0);
  
  // Filtro activo (en Gobernación inicia en 'EN_REVISION', en Entidades en 'Todas')
  filterStatus = signal<string>('EN_REVISION');
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

  // Modal Ver Observación de Devolución
  showVerObservacionModal = signal<boolean>(false);
  solicitudSeleccionadaDevuelta = signal<SolicitudListadoDto | null>(null);

  // Estado de éxito liquidación generada
  idLiquidacionGenerada = signal<number | null>(null);

  // --- CLASIFICACIÓN DE ESTADOS ---
  esDevuelta(s: SolicitudListadoDto): boolean {
    return s.estadoSolicitudId === 5 || (s.nombreEstado || '').toUpperCase().includes('DEVUELT');
  }

  esLiquidada(s: SolicitudListadoDto): boolean {
    return s.estadoSolicitudId === 4 || (s.nombreEstado || '').toUpperCase().includes('LIQUID');
  }

  esEnRevision(s: SolicitudListadoDto): boolean {
    // Solo está en revisión formal si ya culminó los 4 pasos del wizard y fue radicada
    return !this.esDevuelta(s) 
      && !this.esLiquidada(s) 
      && (s.estadoSolicitudId === 2 || (s.nombreEstado || '').toUpperCase().includes('REVIS'))
      && (s.etapaActual ?? 0) >= 4;
  }

  esBorrador(s: SolicitudListadoDto): boolean {
    return !this.esDevuelta(s) && !this.esLiquidada(s) && !this.esEnRevision(s);
  }

  obtenerTextoEstado(s: SolicitudListadoDto): string {
    if (this.esDevuelta(s)) return 'Devuelta para Subsanación';
    if (this.esLiquidada(s)) return 'Liquidada Oficial';
    if (this.esEnRevision(s)) return 'En Revisión Técnica';
    const paso = Math.min(Math.max((s.etapaActual ?? 0) + 1, 1), 4);
    return `Borrador (Paso ${paso} de 4)`;
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

  setFilter(status: string) {
    this.filterStatus.set(status);
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

    let estadoIdParaApi: number = 0; // 0 indica sin filtro de estado en BD
    const status = this.filterStatus();

    if (this.activePanel() === 'GOBERNACION') {
      if (status === 'EN_REVISION') {
        estadoIdParaApi = 2;
      } else if (status === 'DEVUELTA') {
        estadoIdParaApi = 5;
      } else if (status === 'LIQUIDADA') {
        estadoIdParaApi = 4;
      } else {
        // 'Todas' en Gobernación consulta todos los estados y en memoria filtra exclusivamente los del gobierno
        estadoIdParaApi = 0;
      }
    } else {
      if (status === 'RADICADA') {
        estadoIdParaApi = 1;
      } else if (status === 'EN_REVISION') {
        estadoIdParaApi = 2;
      } else if (status === 'DEVUELTA') {
        estadoIdParaApi = 5;
      } else if (status === 'LIQUIDADA') {
        estadoIdParaApi = 4;
      } else {
        estadoIdParaApi = 0;
      }
    }

    this.facade.listarSolicitudes(this.pageNumber(), this.pageSize(), this.searchText(), estadoIdParaApi).subscribe({
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

    if (this.activePanel() === 'GOBERNACION') {
      // Regla de Oro Gobernación: NUNCA se visualizan borradores incompletos de entidades
      const gobernacionItems = filtered.filter(s => !this.esBorrador(s));

      if (status === 'EN_REVISION') {
        return gobernacionItems.filter(s => this.esEnRevision(s));
      }
      if (status === 'DEVUELTA') {
        return gobernacionItems.filter(s => this.esDevuelta(s));
      }
      if (status === 'LIQUIDADA') {
        return gobernacionItems.filter(s => this.esLiquidada(s));
      }
      // 'Todas': Revisión + Devueltas + Liquidadas
      return gobernacionItems;
    }

    // Panel Entidades Externas
    if (status === 'RADICADA') {
      return filtered.filter(s => this.esBorrador(s));
    }
    if (status === 'EN_REVISION') {
      return filtered.filter(s => this.esEnRevision(s));
    }
    if (status === 'DEVUELTA') {
      return filtered.filter(s => this.esDevuelta(s));
    }
    if (status === 'LIQUIDADA') {
      return filtered.filter(s => this.esLiquidada(s));
    }

    return filtered;
  });

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

    // 1. Obtener expediente completo
    this.facade.obtenerSolicitudPorId(solicitud.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.solicitudDetalle.set(res.data);
        }
      },
      error: () => this.toast.error('Error al cargar detalle del expediente')
    });

    // 2. Obtener preliquidación simulada
    this.generacionFacade.simularLiquidacion(solicitud.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.simulacionDetalle.set(res.data);
        }
        this.isReviewLoading.set(false);
      },
      error: () => {
        this.toast.error('No se pudo simular la liquidación en tiempo real');
        this.isReviewLoading.set(false);
      }
    });
  }

  cerrarRevision() {
    this.showRevisionModal.set(false);
    this.solicitudSeleccionada.set(null);
    this.solicitudDetalle.set(null);
    this.simulacionDetalle.set(null);
    this.idLiquidacionGenerada.set(null);
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

  // --- VER OBSERVACIÓN DEVOLUCIÓN ---
  abrirModalVerObservacion(solicitud: SolicitudListadoDto) {
    this.solicitudSeleccionadaDevuelta.set(solicitud);
    this.showVerObservacionModal.set(true);
  }

  cerrarModalVerObservacion() {
    this.showVerObservacionModal.set(false);
    this.solicitudSeleccionadaDevuelta.set(null);
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
