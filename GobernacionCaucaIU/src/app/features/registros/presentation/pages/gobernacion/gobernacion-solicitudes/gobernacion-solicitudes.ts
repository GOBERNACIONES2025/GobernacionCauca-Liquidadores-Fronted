import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SolicitudesLiquidacionFacade } from '../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { GeneracionLiquidacionFacade } from '../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { RegistrosPermissionsPolicy } from '../../../../domain/policies/registros-permissions.policy';
import { ToastService } from '../../../../../../core/services/toast.service';
import { SolicitudListadoDto } from '../../../../domain/models/Radicacion/solicitud-wizard.model';
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
export class GobernacionSolicitudesComponent implements OnInit, OnDestroy {
  private facade = inject(SolicitudesLiquidacionFacade);
  private generacionFacade = inject(GeneracionLiquidacionFacade);
  public permissions = inject(RegistrosPermissionsPolicy);
  private toast = inject(ToastService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  // Estados de fiscalización: 
  // 2 = En Revisión Técnica (default), 5 = Devuelta a Notaría, 4 = Liquidada, 0 = Todas
  activeTab = signal<number>(2);

  // Tarjetas KPI Operativas
  kpiPendientes = signal<number>(0);
  kpiDevueltas = signal<number>(0);
  kpiLiquidadas = signal<number>(0);
  kpiTotal = signal<number>(0);

  solicitudes = signal<SolicitudListadoDto[]>([]);
  totalCount = signal<number>(0);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);

  // Modal de Fiscalización y Preliquidación
  showFiscalizarModal = signal<boolean>(false);
  selectedSolicitud = signal<any | null>(null);
  preliquidacion = signal<LiquidacionSimuladaResponse | null>(null);
  isPreliquidando = signal<boolean>(false);
  isAprobando = signal<boolean>(false);

  // Pestaña activa del Modal de Fiscalización
  activeFiscalizarTab = signal<'EXPEDIENTE' | 'DOCUMENTO' | 'HISTORIAL'>('EXPEDIENTE');

  // Visor de Documentos PDF
  documentoIframeUrl = signal<SafeResourceUrl | null>(null);
  documentoDescargaUrl = signal<string>('');
  documentoNombreArchivo = signal<string>('');
  isCargandoDocumento = signal<boolean>(false);
  private currentBlobUrl: string | null = null;

  // Modal Devolver con Requerimiento
  showDevolverModal = signal<boolean>(false);
  causalDevolucion = signal<string>('ERROR_BASE_GRAVABLE');
  motivoDevolucion = signal<string>('');
  isDevolviendo = signal<boolean>(false);

  // Modal de Confirmación para Aprobar y Emitir Liquidación
  showConfirmarEmisionModal = signal<boolean>(false);

  ngOnInit(): void {
    this.cargarMetricasKpi();
    this.cargarSolicitudes();
  }

  cargarMetricasKpi(): void {
    // 1. Pendientes de revisión (2)
    this.facade.listarSolicitudes(1, 1, undefined, 2).subscribe({
      next: (res) => this.kpiPendientes.set(res?.data?.totalCount || 0),
      error: () => {}
    });

    // 2. Devueltas a notaría (5)
    this.facade.listarSolicitudes(1, 1, undefined, 5).subscribe({
      next: (res) => this.kpiDevueltas.set(res?.data?.totalCount || 0),
      error: () => {}
    });

    // 3. Liquidadas oficialmente (4)
    this.facade.listarSolicitudes(1, 1, undefined, 4).subscribe({
      next: (res) => this.kpiLiquidadas.set(res?.data?.totalCount || 0),
      error: () => {}
    });

    // 4. Total general
    this.facade.listarSolicitudes(1, 1, undefined, undefined).subscribe({
      next: (res) => this.kpiTotal.set(res?.data?.totalCount || 0),
      error: () => {}
    });
  }

  cambiarPestana(estadoId: number): void {
    this.activeTab.set(estadoId);
    this.pageNumber.set(1);
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.isLoading.set(true);
    const estadoFiltro = this.activeTab() === 0 ? undefined : this.activeTab();

    this.facade.listarSolicitudes(
      this.pageNumber(),
      this.pageSize(),
      this.searchText(),
      estadoFiltro
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
    this.activeFiscalizarTab.set('EXPEDIENTE');
    this.facade.obtenerSolicitudPorId(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) {
          const data: any = res.data;
          data.id = data.solicitudId || data.id || id;
          data.solicitudId = data.id;
          this.selectedSolicitud.set(data);

          // Configurar datos para el Visor de PDF (Documento notarial / minuta)
          const doc = data.documentos?.[0] || data.documentoRegistro;
          const rawName = doc?.nombreArchivo || `Expediente_${data.numeroRadicado}.pdf`;

          this.documentoNombreArchivo.set(rawName);
          this.showFiscalizarModal.set(true);

          // Carga autenticada por Token a través de HttpClient
          this.cargarDocumentoConToken(data.id, rawName, doc?.id || data.id);
          // Simula preliquidación automática
          this.simularPreliquidacion(data.id);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('No se pudo cargar el expediente para fiscalización');
      }
    });
  }

  cambiarFiscalizarTab(tab: 'EXPEDIENTE' | 'DOCUMENTO' | 'HISTORIAL'): void {
    this.activeFiscalizarTab.set(tab);
    if (tab === 'DOCUMENTO' && !this.documentoIframeUrl() && !this.isCargandoDocumento()) {
      const sol = this.selectedSolicitud();
      if (sol) {
        const doc = sol.documentos?.[0] || sol.documentoRegistro;
        const rawName = doc?.nombreArchivo || `Expediente_${sol.numeroRadicado}.pdf`;
        this.cargarDocumentoConToken(sol.id, rawName, doc?.id || sol.id);
      }
    }
  }


  cerrarFiscalizarModal(): void {
    this.showFiscalizarModal.set(false);
    this.limpiarDocumentoBlob();
  }

  ngOnDestroy(): void {
    this.limpiarDocumentoBlob();
  }

  private limpiarDocumentoBlob(): void {
    if (this.currentBlobUrl) {
      window.URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
    this.documentoIframeUrl.set(null);
  }

  cargarDocumentoConToken(solicitudId: number, rawName: string, docId: number): void {
    this.isCargandoDocumento.set(true);
    this.facade.descargarDocumentoArchivo(solicitudId, true).subscribe({
      next: (blob: Blob) => {
        this.isCargandoDocumento.set(false);
        this.limpiarDocumentoBlob();
        this.currentBlobUrl = window.URL.createObjectURL(blob);
        this.documentoIframeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.currentBlobUrl));
      },
      error: () => {
        this.isCargandoDocumento.set(false);
        this.toast.error('No se pudo cargar el documento notarial para previsualización.');
      }
    });
  }

  abrirEnNuevaPestana(): void {
    if (this.currentBlobUrl) {
      window.open(this.currentBlobUrl, '_blank');
      return;
    }

    const sol = this.selectedSolicitud();
    if (!sol) return;

    this.toast.info('Abriendo documento notarial...');
    this.facade.descargarDocumentoArchivo(sol.id, true).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => {
        this.toast.error('No se pudo abrir el documento notarial');
      }
    });
  }

  descargarDocumentoDirecto(): void {
    const sol = this.selectedSolicitud();
    if (!sol) return;

    this.toast.info('Descargando documento notarial con token...');
    this.facade.descargarDocumentoArchivo(sol.id, false).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.documentoNombreArchivo() || `Expediente_${sol.numeroRadicado}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toast.error('Error al descargar el documento adjunto');
      }
    });
  }

  esBaseInferiorAvaluo(acto: any): boolean {
    const avaluo = Number(acto?.inmuebleAvaluo || 0);
    const base = Number(acto?.baseDeclarada || 0);
    return avaluo > 0 && base < avaluo;
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

  abrirConfirmacionEmision(): void {
    this.showConfirmarEmisionModal.set(true);
  }

  aprobarYGenerarLiquidacion(): void {
    const sol = this.selectedSolicitud();
    if (!sol) return;

    const solId = sol.solicitudId || sol.id;
    if (!solId) {
      this.toast.error('No se encontró el identificador del expediente');
      return;
    }

    this.isAprobando.set(true);
    this.generacionFacade.generarLiquidacion({ solicitudId: solId }).subscribe({
      next: (res) => {
        this.isAprobando.set(false);
        this.showConfirmarEmisionModal.set(false);
        this.cerrarFiscalizarModal();
        this.toast.success(`¡Liquidación oficial expedida exitosamente! ID: #${res.data}`);
        this.cargarSolicitudes();
        this.cargarMetricasKpi();
      },
      error: (err) => {
        this.isAprobando.set(false);
        this.toast.error(err?.error?.message || 'Error al generar la liquidación oficial');
      }
    });
  }

  abrirDevolucion(): void {
    this.causalDevolucion.set('ERROR_BASE_GRAVABLE');
    this.motivoDevolucion.set('');
    this.showDevolverModal.set(true);
  }

  confirmarDevolucion(): void {
    const sol = this.selectedSolicitud();
    if (!sol || !this.motivoDevolucion().trim()) {
      this.toast.warning('Por favor describa las observaciones de requerimiento técnico');
      return;
    }

    const solId = sol.solicitudId || sol.id;
    if (!solId) {
      this.toast.error('No se encontró el identificador del expediente');
      return;
    }

    const causalTexto = this.getCausalLabel(this.causalDevolucion());
    const observacionesCompletas = `[Causal: ${causalTexto}] ${this.motivoDevolucion().trim()}`;

    this.isDevolviendo.set(true);
    this.facade.devolverSolicitud(solId, observacionesCompletas).subscribe({
      next: () => {
        this.isDevolviendo.set(false);
        this.toast.success('Expediente devuelto a la entidad externa con requerimiento formal');
        this.showDevolverModal.set(false);
        this.cerrarFiscalizarModal();
        this.cargarSolicitudes();
        this.cargarMetricasKpi();
      },
      error: (err) => {
        this.isDevolviendo.set(false);
        this.toast.error(err?.error?.message || 'Error al devolver el expediente');
      }
    });
  }

  getCausalLabel(causal: string): string {
    switch (causal) {
      case 'ERROR_BASE_GRAVABLE': return 'Diferencia o Inconsistencia en la Base Gravable Declarada';
      case 'DOCUMENTO_INCOMPLETO': return 'Documento o Minuta Notarial Incompleta o Ilegible';
      case 'FALTA_SOPORTE_EXENCION': return 'Falta de Soporte o Certificación de Exención Tributaria';
      case 'INCONSISTENCIA_ACTO': return 'Acto Registral Erróneamente Clasificado';
      case 'ERROR_SUJETO_PASIVO': return 'Inconsistencia en la Identificación de Sujetos Pasivos';
      default: return 'Otro Requerimiento Técnico-Jurídico';
    }
  }
}
