import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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
  route = inject(ActivatedRoute);
  facade = inject(GeneracionLiquidacionFacade);
  toast = inject(ToastService);

  // Selector de Panel Superior (Entidades Externas vs Gobernación del Cauca)
  activePanel = signal<'ENTIDAD' | 'GOBERNACION'>('ENTIDAD');

  // Subpestañas del Panel Gobernación
  activeGobernacionTab = signal<'RELIQUIDACIONES' | 'ANULACIONES' | 'DIRECTORIO'>('RELIQUIDACIONES');

  // Estado del Directorio de Liquidaciones (Entidades / Directorio Oficial)
  liquidaciones = signal<LiquidacionListadoDto[]>([]);
  totalCount = signal<number>(0);
  filterStatus = signal<string>('Todas');
  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);

  // Estado Bandeja de Solicitudes de Reliquidación (Gobernación)
  reliquidacionesPendientes = signal<any[]>([]);
  totalReliquidaciones = signal<number>(0);
  isReliquidacionesLoading = signal<boolean>(false);

  // Estado Bandeja de Solicitudes de Anulación (Gobernación)
  anulacionesPendientes = signal<any[]>([]);
  totalAnulaciones = signal<number>(0);
  isAnulacionesLoading = signal<boolean>(false);

  // Modales Entidad: Solicitar Reliquidación
  showReliquidarModal = signal<boolean>(false);
  liquidacionSeleccionada = signal<LiquidacionListadoDto | null>(null);
  causalReliquidacion = signal<string>('ERROR_CUANTIA');
  motivoReliquidacion = signal<string>('');
  docAclaratorioReliquidacion = signal<string>('');

  // Modales Entidad: Solicitar Anulación
  showSolicitarAnulacionModal = signal<boolean>(false);
  causalAnulacion = signal<string>('ESCRITURA_NO_AUTORIZADA');
  motivoAnulacion = signal<string>('');
  docSoporteAnulacion = signal<string>('');

  // Modales Gobernación: Resolución de Trámites
  showAprobarReliquidacionModal = signal<boolean>(false);
  showRechazarReliquidacionModal = signal<boolean>(false);
  showAprobarAnulacionModal = signal<boolean>(false);
  showRechazarAnulacionModal = signal<boolean>(false);
  itemTramiteSeleccionado = signal<any | null>(null);
  observacionesAprobacion = signal<string>('');
  motivoRechazo = signal<string>('');

  // Modal Gobernación: Anulación de Oficio
  showAnulacionOficioModal = signal<boolean>(false);
  motivoAnulacionOficio = signal<string>('');

  // Modal Historial de Estados
  showHistorialModal = signal<boolean>(false);
  historialItems = signal<any[]>([]);
  isHistorialLoading = signal<boolean>(false);

  private readonly ESTADOS_MAP: Record<string, number | null> = {
    'TODAS': null,
    'GENERADA': 2,
    'VIGENTE': 3,
    'PAGADA': 4,
    'DEVUELTA': 5,
    'ANULADA': 6,
    'RELIQUIDADA': 7
  };

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['panel'] === 'GOBERNACION') {
        this.activePanel.set('GOBERNACION');
      } else if (params['panel'] === 'ENTIDAD') {
        this.activePanel.set('ENTIDAD');
      }

      if (params['tab']) {
        const tab = params['tab'].toUpperCase();
        if (tab === 'RELIQUIDACIONES' || tab === 'ANULACIONES' || tab === 'DIRECTORIO') {
          this.activeGobernacionTab.set(tab as any);
        }
      }

      if (params['radicado']) {
        this.searchText.set(params['radicado']);
      }

      this.refrescarSegunPanel();
    });
  }

  setPanel(panel: 'ENTIDAD' | 'GOBERNACION') {
    this.activePanel.set(panel);
    this.pageNumber.set(1);
    this.searchText.set('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { panel: panel },
      queryParamsHandling: 'merge'
    });
    this.refrescarSegunPanel();
  }

  setGobernacionTab(tab: 'RELIQUIDACIONES' | 'ANULACIONES' | 'DIRECTORIO') {
    this.activeGobernacionTab.set(tab);
    this.pageNumber.set(1);
    this.searchText.set('');
    this.refrescarSegunPanel();
  }

  refrescarSegunPanel() {
    if (this.activePanel() === 'ENTIDAD') {
      this.cargarLiquidaciones();
    } else {
      // Panel Gobernación
      if (this.activeGobernacionTab() === 'RELIQUIDACIONES') {
        this.cargarReliquidacionesPendientes();
      } else if (this.activeGobernacionTab() === 'ANULACIONES') {
        this.cargarAnulacionesPendientes();
      } else {
        this.cargarLiquidaciones();
      }
      // Actualizar contadores en segundo plano
      this.cargarContadoresGobernacion();
    }
  }

  cargarContadoresGobernacion() {
    this.facade.listarReliquidacionesPendientes(1, 1).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.totalReliquidaciones.set(res.data.totalCount || 0);
        }
      }
    });

    this.facade.listarAnulacionesPendientes(1, 1).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.totalAnulaciones.set(res.data.totalCount || 0);
        }
      }
    });
  }

  // --- CARGA DE DIRECTORIO DE LIQUIDACIONES ---
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
        this.toast.error('Error de red al consultar liquidaciones');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(term: string) {
    this.searchText.set(term);
    this.pageNumber.set(1);
    this.refrescarSegunPanel();
  }

  onClearSearch() {
    this.searchText.set('');
    this.pageNumber.set(1);
    this.refrescarSegunPanel();
  }

  setFilter(status: string) {
    this.filterStatus.set(status);
    this.pageNumber.set(1);
    this.cargarLiquidaciones();
  }

  onPageChange(page: number) {
    this.pageNumber.set(page);
    this.refrescarSegunPanel();
  }

  filteredLiquidaciones = computed(() => this.liquidaciones());

  // --- ENTIDADES: SOLICITAR RELIQUIDACIÓN ---
  abrirModalReliquidar(liquidacion: LiquidacionListadoDto) {
    this.liquidacionSeleccionada.set(liquidacion);
    this.causalReliquidacion.set('ERROR_CUANTIA');
    this.motivoReliquidacion.set('');
    this.docAclaratorioReliquidacion.set('');
    this.showReliquidarModal.set(true);
  }

  cerrarModalReliquidar() {
    this.showReliquidarModal.set(false);
    this.liquidacionSeleccionada.set(null);
  }

  confirmarSolicitudReliquidacion() {
    const liq = this.liquidacionSeleccionada();
    if (!liq) return;

    const causal = this.causalReliquidacion().trim();
    const motivo = this.motivoReliquidacion().trim();
    const docAclaratorio = this.docAclaratorioReliquidacion().trim();

    if (motivo.length < 5) {
      this.toast.warning('Debe detallar el motivo de la reliquidación con al menos 5 caracteres.');
      return;
    }

    this.isLoading.set(true);
    this.facade.solicitarReliquidacion(liq.id, causal, motivo, docAclaratorio).subscribe({
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

  // --- ENTIDADES: SOLICITAR ANULACIÓN ---
  abrirModalSolicitarAnulacion(liquidacion: LiquidacionListadoDto) {
    this.liquidacionSeleccionada.set(liquidacion);
    this.causalAnulacion.set('ESCRITURA_NO_AUTORIZADA');
    this.motivoAnulacion.set('');
    this.docSoporteAnulacion.set('');
    this.showSolicitarAnulacionModal.set(true);
  }

  cerrarModalSolicitarAnulacion() {
    this.showSolicitarAnulacionModal.set(false);
    this.liquidacionSeleccionada.set(null);
  }

  confirmarSolicitudAnulacion() {
    const liq = this.liquidacionSeleccionada();
    if (!liq) return;

    const causal = this.causalAnulacion().trim();
    const motivo = this.motivoAnulacion().trim();
    const docSoporte = this.docSoporteAnulacion().trim();

    if (motivo.length < 5) {
      this.toast.warning('Debe detallar el motivo de la anulación con al menos 5 caracteres.');
      return;
    }

    this.isLoading.set(true);
    this.facade.solicitarAnulacion(liq.id, causal, motivo, docSoporte).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Solicitud de anulación radicada formalmente ante la Gobernación del Cauca para la liquidación ${liq.numeroLiquidacion}.`);
          this.cerrarModalSolicitarAnulacion();
          this.cargarLiquidaciones();
        } else {
          this.toast.error(res.message || 'Error al radicar solicitud de anulación');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.error?.detail || 'Error al radicar solicitud de anulación');
        this.isLoading.set(false);
      }
    });
  }

  // --- GOBERNACIÓN: GESTIÓN DE RELIQUIDACIONES ---
  cargarReliquidacionesPendientes() {
    this.isReliquidacionesLoading.set(true);
    this.facade.listarReliquidacionesPendientes(this.pageNumber(), this.pageSize(), this.searchText()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.reliquidacionesPendientes.set(res.data.items || []);
          this.totalReliquidaciones.set(res.data.totalCount || 0);
          this.totalCount.set(res.data.totalCount || 0);
        } else {
          this.toast.error(res.message || 'Error al cargar reliquidaciones pendientes');
        }
        this.isReliquidacionesLoading.set(false);
      },
      error: () => {
        this.toast.error('Error de red al consultar solicitudes de reliquidación');
        this.isReliquidacionesLoading.set(false);
      }
    });
  }

  abrirModalAprobarReliquidacion(item: any) {
    this.itemTramiteSeleccionado.set(item);
    this.observacionesAprobacion.set('Aprobación formal de reliquidación por verificación técnica conforme a la documentación radicada.');
    this.showAprobarReliquidacionModal.set(true);
  }

  cerrarModalAprobarReliquidacion() {
    this.showAprobarReliquidacionModal.set(false);
    this.itemTramiteSeleccionado.set(null);
  }

  confirmarAprobacionReliquidacion() {
    const item = this.itemTramiteSeleccionado();
    if (!item) return;

    const motivo = this.observacionesAprobacion().trim();
    if (motivo.length < 5) {
      this.toast.warning('Debe ingresar una observación de aprobación con al menos 5 caracteres.');
      return;
    }

    this.isReliquidacionesLoading.set(true);
    this.facade.aprobarReliquidacion(item.liquidacionId, motivo).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.toast.success(`Reliquidación aprobada formalmente. Se ha expedido la nueva liquidación oficial #${res.data}.`);
          this.cerrarModalAprobarReliquidacion();
          this.cargarReliquidacionesPendientes();
          this.cargarContadoresGobernacion();
        } else {
          this.toast.error(res.message || 'Error al aprobar reliquidación');
          this.isReliquidacionesLoading.set(false);
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al aprobar reliquidación');
        this.isReliquidacionesLoading.set(false);
      }
    });
  }

  abrirModalRechazarReliquidacion(item: any) {
    this.itemTramiteSeleccionado.set(item);
    this.motivoRechazo.set('');
    this.showRechazarReliquidacionModal.set(true);
  }

  cerrarModalRechazarReliquidacion() {
    this.showRechazarReliquidacionModal.set(false);
    this.itemTramiteSeleccionado.set(null);
  }

  confirmarRechazoReliquidacion() {
    const item = this.itemTramiteSeleccionado();
    if (!item) return;

    const motivo = this.motivoRechazo().trim();
    if (motivo.length < 5) {
      this.toast.warning('Debe ingresar un motivo de rechazo formal con al menos 5 caracteres.');
      return;
    }

    this.isReliquidacionesLoading.set(true);
    this.facade.rechazarReliquidacion(item.liquidacionId, motivo).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Solicitud de reliquidación rechazada formalmente. La liquidación previa permanece vigente.');
          this.cerrarModalRechazarReliquidacion();
          this.cargarReliquidacionesPendientes();
          this.cargarContadoresGobernacion();
        } else {
          this.toast.error(res.message || 'Error al rechazar reliquidación');
          this.isReliquidacionesLoading.set(false);
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al rechazar reliquidación');
        this.isReliquidacionesLoading.set(false);
      }
    });
  }

  // --- GOBERNACIÓN: GESTIÓN DE ANULACIONES ---
  cargarAnulacionesPendientes() {
    this.isAnulacionesLoading.set(true);
    this.facade.listarAnulacionesPendientes(this.pageNumber(), this.pageSize(), this.searchText()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.anulacionesPendientes.set(res.data.items || []);
          this.totalAnulaciones.set(res.data.totalCount || 0);
          this.totalCount.set(res.data.totalCount || 0);
        } else {
          this.toast.error(res.message || 'Error al cargar anulaciones pendientes');
        }
        this.isAnulacionesLoading.set(false);
      },
      error: () => {
        this.toast.error('Error de red al consultar solicitudes de anulación');
        this.isAnulacionesLoading.set(false);
      }
    });
  }

  abrirModalAprobarAnulacion(item: any) {
    this.itemTramiteSeleccionado.set(item);
    this.observacionesAprobacion.set('Anulación oficial aprobada tras verificación documental y causal expuesta por la entidad.');
    this.showAprobarAnulacionModal.set(true);
  }

  cerrarModalAprobarAnulacion() {
    this.showAprobarAnulacionModal.set(false);
    this.itemTramiteSeleccionado.set(null);
  }

  confirmarAprobacionAnulacion() {
    const item = this.itemTramiteSeleccionado();
    if (!item) return;

    const obs = this.observacionesAprobacion().trim();
    this.isAnulacionesLoading.set(true);
    this.facade.aprobarAnulacion(item.liquidacionId, obs).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Liquidación oficial ${item.numeroLiquidacion} anulada formalmente.`);
          this.cerrarModalAprobarAnulacion();
          this.cargarAnulacionesPendientes();
          this.cargarContadoresGobernacion();
        } else {
          this.toast.error(res.message || 'Error al aprobar anulación');
          this.isAnulacionesLoading.set(false);
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al aprobar anulación');
        this.isAnulacionesLoading.set(false);
      }
    });
  }

  abrirModalRechazarAnulacion(item: any) {
    this.itemTramiteSeleccionado.set(item);
    this.motivoRechazo.set('');
    this.showRechazarAnulacionModal.set(true);
  }

  cerrarModalRechazarAnulacion() {
    this.showRechazarAnulacionModal.set(false);
    this.itemTramiteSeleccionado.set(null);
  }

  confirmarRechazoAnulacion() {
    const item = this.itemTramiteSeleccionado();
    if (!item) return;

    const motivo = this.motivoRechazo().trim();
    if (motivo.length < 5) {
      this.toast.warning('Debe ingresar un motivo de rechazo de al menos 5 caracteres.');
      return;
    }

    this.isAnulacionesLoading.set(true);
    this.facade.rechazarAnulacion(item.liquidacionId, motivo).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Solicitud de anulación rechazada. La liquidación permanece vigente.');
          this.cerrarModalRechazarAnulacion();
          this.cargarAnulacionesPendientes();
          this.cargarContadoresGobernacion();
        } else {
          this.toast.error(res.message || 'Error al rechazar anulación');
          this.isAnulacionesLoading.set(false);
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al rechazar anulación');
        this.isAnulacionesLoading.set(false);
      }
    });
  }

  // --- GOBERNACIÓN: ANULACIÓN DE OFICIO (ADMINISTRATIVA) ---
  abrirModalAnulacionOficio(liquidacion: LiquidacionListadoDto) {
    this.liquidacionSeleccionada.set(liquidacion);
    this.motivoAnulacionOficio.set('');
    this.showAnulacionOficioModal.set(true);
  }

  cerrarModalAnulacionOficio() {
    this.showAnulacionOficioModal.set(false);
    this.liquidacionSeleccionada.set(null);
  }

  confirmarAnulacionOficio() {
    const liq = this.liquidacionSeleccionada();
    if (!liq) return;

    const motivo = this.motivoAnulacionOficio().trim();
    if (motivo.length < 5) {
      this.toast.warning('El motivo de anulación de oficio debe tener al menos 5 caracteres.');
      return;
    }

    this.isLoading.set(true);
    this.facade.anularLiquidacion(liq.id, motivo).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Liquidación oficial ${liq.numeroLiquidacion} anulada de oficio exitosamente.`);
          this.cerrarModalAnulacionOficio();
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
        this.toast.success('Descarga de recibo y PDF oficial iniciada.');
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error al descargar el PDF de la liquidación.');
        this.isLoading.set(false);
      }
    });
  }

  // Helpers de estado para Entidades
  puedeSolicitarTramite(liq: LiquidacionListadoDto): boolean {
    // Si ya está anulada, pagada o reliquidada, o no es vigente, no se puede radicar trámite
    const estado = liq.estado?.nombre?.toUpperCase() || '';
    return liq.esVigente !== false && estado !== 'ANULADA' && estado !== 'PAGADA' && estado !== 'RELIQUIDADA';
  }
}
