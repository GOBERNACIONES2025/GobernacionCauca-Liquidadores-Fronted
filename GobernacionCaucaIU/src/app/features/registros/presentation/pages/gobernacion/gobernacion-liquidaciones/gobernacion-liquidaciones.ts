import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GeneracionLiquidacionFacade } from '../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { RegistrosPermissionsPolicy } from '../../../../domain/policies/registros-permissions.policy';
import { LiquidacionListadoDto, SolicitudReliquidacionDto } from '../../../../domain/models/Liquidacion/generacion-liquidacion.model';
import { ToastService } from '../../../../../../core/services/toast.service';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';
import { TableSearchComponent } from '../../../shared/components/table-search/table-search';

import { MediosPagoFacade } from '../../../../application/facades/Pagos/medios-pago.facade';

@Component({
  selector: 'app-gobernacion-liquidaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, TableSearchComponent],
  templateUrl: './gobernacion-liquidaciones.html',
  styleUrl: './gobernacion-liquidaciones.css'
})
export class GobernacionLiquidacionesComponent implements OnInit, OnDestroy {
  public facade = inject(GeneracionLiquidacionFacade);
  public mediosPagoFacade = inject(MediosPagoFacade);
  public permissions = inject(RegistrosPermissionsPolicy);
  private toast = inject(ToastService);

  constructor() {
    effect(() => {
      const manuales = this.mediosPagoFacade.mediosPagoManuales();
      const actual = this.pagoMedioPagoId();
      if (this.showPagoModal() && manuales.length > 0) {
        if (!actual || !manuales.some(m => m.id === actual)) {
          this.pagoMedioPagoId.set(manuales[0].id);
        }
      }
    });
  }

  private activeRequestSub: Subscription | null = null;

  // Subpestañas:
  // 1 = Solicitudes de Reliquidación Pendientes
  // 2 = Solicitudes de Anulación Pendientes
  // 3 = Directorio Oficial Departamental de Liquidaciones
  activeTab = signal<1 | 2 | 3>(1);

  // Subfiltro específico para Directorio Departamental (Tab 3)
  filtroDirectorio = signal<'todas' | 'pagadas' | 'vigentes' | 'vencidas' | 'anuladas'>('todas');

  // Tarjetas KPI Operativas
  kpiReliquidaciones = signal<number>(0);
  kpiAnulaciones = signal<number>(0);
  kpiDirectorio = signal<number>(0);
  kpiPagadas = signal<number>(0);
  kpiVigentes = signal<number>(0);
  kpiVencidas = signal<number>(0);
  kpiAnuladas = signal<number>(0);

  // Datos de tabla
  items = signal<any[]>([]);
  totalCount = signal<number>(0);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);

  // Modal Decisión Reliquidación
  selectedReliquidacion = signal<SolicitudReliquidacionDto | any | null>(null);
  showAprobarReliquidacionModal = signal<boolean>(false);
  showRechazarReliquidacionModal = signal<boolean>(false);
  motivoResolucion = signal<string>('');
  isProcesandoReliquidacion = signal<boolean>(false);

  // Modal Decisión Anulación
  selectedAnulacion = signal<any | null>(null);
  showAprobarAnulacionModal = signal<boolean>(false);
  showRechazarAnulacionModal = signal<boolean>(false);
  isProcesandoAnulacion = signal<boolean>(false);

  // Modal Anulación de Oficio
  showAnulacionOficioModal = signal<boolean>(false);
  selectedLiquidacionOficio = signal<LiquidacionListadoDto | null>(null);
  motivoOficio = signal<string>('');
  isProcesandoOficio = signal<boolean>(false);

  // Modal y Formulario de Recaudo Oficial en Ventanilla / Certificación
  showPagoModal = signal<boolean>(false);
  showComprobanteModal = signal<boolean>(false);
  selectedLiquidacion = signal<any | null>(null);
  selectedComprobante = signal<any | null>(null);
  isLoadingComprobante = signal<boolean>(false);
  isSubmittingPago = signal<boolean>(false);

  pagoMedioPagoId = signal<number | null>(null);
  pagoValor = signal<number>(0);
  pagoReferencia = signal<string>('');
  pagoFecha = signal<string>(new Date().toISOString().substring(0, 10));
  pagoObservaciones = signal<string>('');
  pagoArchivo = signal<File | null>(null);
  pagoArchivoNombre = signal<string>('');

  ngOnInit(): void {
    this.cargarMetricasKpi();
    this.cargarDatos();
  }

  cargarMetricasKpi(): void {
    // 1. Reliquidaciones pendientes
    this.facade.listarReliquidacionesPendientes(1, 1).subscribe({
      next: (res) => this.kpiReliquidaciones.set(res?.data?.totalCount || 0),
      error: () => {}
    });

    // 2. Anulaciones pendientes
    this.facade.listarAnulacionesPendientes(1, 1).subscribe({
      next: (res) => this.kpiAnulaciones.set(res?.data?.totalCount || 0),
      error: () => {}
    });

    // 3. Directorio general de liquidaciones (todas)
    this.facade.listarLiquidaciones(1, 1).subscribe({
      next: (res) => this.kpiDirectorio.set(res?.data?.totalCount || 0),
      error: () => {}
    });

    // 4. Pagadas / Recaudadas
    this.facade.listarLiquidaciones(1, 1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'pagadas').subscribe({
      next: (res) => this.kpiPagadas.set(res?.data?.totalCount || 0),
      error: () => {}
    });

    // 5. Vigentes (en plazo activo)
    this.facade.listarLiquidaciones(1, 1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'vigentes').subscribe({
      next: (res) => this.kpiVigentes.set(res?.data?.totalCount || 0),
      error: () => {}
    });

    // 6. Vencidas (plazo expirado con mora)
    this.facade.listarLiquidaciones(1, 1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'vencidas').subscribe({
      next: (res) => this.kpiVencidas.set(res?.data?.totalCount || 0),
      error: () => {}
    });

    // 7. Anuladas formalmente
    this.facade.listarLiquidaciones(1, 1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'anuladas').subscribe({
      next: (res) => this.kpiAnuladas.set(res?.data?.totalCount || 0),
      error: () => {}
    });
  }

  seleccionarKpi(kpi: 'reliquidacion' | 'anulacion' | 'vigentes' | 'vencidas' | 'pagadas'): void {
    if (kpi === 'reliquidacion') {
      this.activeTab.set(1);
    } else if (kpi === 'anulacion') {
      this.activeTab.set(2);
    } else {
      this.activeTab.set(3);
      this.filtroDirectorio.set(kpi);
    }
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  cambiarPestana(tab: 1 | 2 | 3): void {
    this.activeTab.set(tab);
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  setFiltroDirectorio(filtro: 'todas' | 'pagadas' | 'vigentes' | 'vencidas' | 'anuladas'): void {
    this.activeTab.set(3);
    this.filtroDirectorio.set(filtro);
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  cargarDatos(): void {
    // 1. Cancelar cualquier petición previa en vuelo para evitar condiciones de carrera
    if (this.activeRequestSub) {
      this.activeRequestSub.unsubscribe();
      this.activeRequestSub = null;
    }

    this.isLoading.set(true);
    const tab = this.activeTab();

    if (tab === 1) {
      this.activeRequestSub = this.facade.listarReliquidacionesPendientes(
        this.pageNumber(),
        this.pageSize(),
        this.searchText()
      ).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.data) {
            this.items.set(res.data.items || []);
            this.totalCount.set(res.data.totalCount || 0);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.toast.error('Error al consultar reliquidaciones pendientes');
        }
      });
    } else if (tab === 2) {
      this.activeRequestSub = this.facade.listarAnulacionesPendientes(
        this.pageNumber(),
        this.pageSize(),
        this.searchText()
      ).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.data) {
            this.items.set(res.data.items || []);
            this.totalCount.set(res.data.totalCount || 0);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.toast.error('Error al consultar anulaciones pendientes');
        }
      });
    } else {
      const f = this.filtroDirectorio();
      const estadoFiltro = f === 'todas' ? undefined : f;

      this.activeRequestSub = this.facade.listarLiquidaciones(
        this.pageNumber(),
        this.pageSize(),
        this.searchText(),
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        estadoFiltro
      ).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.data) {
            this.items.set(res.data.items || []);
            this.totalCount.set(res.data.totalCount || 0);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.toast.error('Error al consultar directorio departamental');
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.activeRequestSub) {
      this.activeRequestSub.unsubscribe();
      this.activeRequestSub = null;
    }
  }

  onSearch(term: string): void {
    this.searchText.set(term);
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  onPageChange(page: number): void {
    this.pageNumber.set(page);
    this.cargarDatos();
  }

  descargarPdf(id: number): void {
    this.toast.info('Descargando liquidación oficial...');
    this.facade.descargarPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Liquidacion_Oficial_${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Archivo fiscal descargado exitosamente');
      },
      error: () => this.toast.error('Error al descargar el PDF de liquidación')
    });
  }

  // --- Helpers de Formato Visual para Reliquidaciones ---
  getCausalLabel(causal: string | null | undefined): string {
    if (!causal) return 'Revisión General';
    switch (causal.toUpperCase()) {
      case 'ERROR_BASE_GRAVABLE': return 'Error en Base Gravable';
      case 'ERROR_SUJETO_PASIVO': return 'Error en Sujeto Pasivo';
      case 'ERROR_TARIFA': return 'Error en Tarifa Aplicada';
      case 'DOCUMENTO_ACLARATORIO': return 'Documento Aclaratorio';
      case 'CAMBIO_ACTO_CUANTIA': return 'Modificación de Acto / Cuantía';
      case 'CAMBIO_ACTOS': return 'Modificación de Actos';
      case 'EXENCION_NO_APLICADA': return 'Exención No Aplicada';
      default: return causal.replace(/_/g, ' ');
    }
  }

  getCausalBadgeClass(causal: string | null | undefined): string {
    if (!causal) return 'bg-slate-100 text-slate-700 border-slate-200';
    switch (causal.toUpperCase()) {
      case 'ERROR_BASE_GRAVABLE': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'ERROR_SUJETO_PASIVO': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'ERROR_TARIFA': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'DOCUMENTO_ACLARATORIO': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'EXENCION_NO_APLICADA': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CAMBIO_ACTO_CUANTIA': return 'bg-orange-50 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  // --- RELIQUIDACION ---
  abrirAprobarReliquidacion(item: any): void {
    this.selectedReliquidacion.set(item);
    this.motivoResolucion.set('Aprobada conforme a revisión de documentos aportados por la entidad.');
    this.showAprobarReliquidacionModal.set(true);
  }

  confirmarAprobarReliquidacion(): void {
    const it = this.selectedReliquidacion();
    if (!it) return;
    const targetId = it.liquidacionId || it.id;

    this.isProcesandoReliquidacion.set(true);
    this.facade.aprobarReliquidacion(targetId, this.motivoResolucion()).subscribe({
      next: (res) => {
        this.isProcesandoReliquidacion.set(false);
        this.toast.success(`Reliquidación aprobada. Nuevo título expedido: #${res.data}`);
        this.showAprobarReliquidacionModal.set(false);
        this.cargarDatos();
        this.cargarMetricasKpi();
      },
      error: (err) => {
        this.isProcesandoReliquidacion.set(false);
        this.toast.error(err?.error?.message || 'Error al aprobar la reliquidación');
      }
    });
  }

  abrirRechazarReliquidacion(item: any): void {
    this.selectedReliquidacion.set(item);
    this.motivoResolucion.set('');
    this.showRechazarReliquidacionModal.set(true);
  }

  confirmarRechazarReliquidacion(): void {
    const it = this.selectedReliquidacion();
    if (!it || !this.motivoResolucion().trim()) {
      this.toast.warning('Debe motivar formalmente la causal de rechazo');
      return;
    }
    const targetId = it.liquidacionId || it.id;

    this.isProcesandoReliquidacion.set(true);
    this.facade.rechazarReliquidacion(targetId, this.motivoResolucion().trim()).subscribe({
      next: () => {
        this.isProcesandoReliquidacion.set(false);
        this.toast.success('Reliquidación rechazada. Título inicial ratificado en firme.');
        this.showRechazarReliquidacionModal.set(false);
        this.cargarDatos();
        this.cargarMetricasKpi();
      },
      error: (err) => {
        this.isProcesandoReliquidacion.set(false);
        this.toast.error(err?.error?.message || 'Error al rechazar la reliquidación');
      }
    });
  }

  // --- ANULACION ---
  abrirAprobarAnulacion(item: any): void {
    this.selectedAnulacion.set(item);
    this.motivoResolucion.set('Anulación formal autorizada conforme a revisión fiscal.');
    this.showAprobarAnulacionModal.set(true);
  }

  confirmarAprobarAnulacion(): void {
    const it = this.selectedAnulacion();
    if (!it) return;
    const targetId = it.liquidacionId || it.id;

    this.isProcesandoAnulacion.set(true);
    this.facade.aprobarAnulacion(targetId, this.motivoResolucion()).subscribe({
      next: () => {
        this.isProcesandoAnulacion.set(false);
        this.toast.success('Liquidación anulada formalmente en el sistema tributario');
        this.showAprobarAnulacionModal.set(false);
        this.cargarDatos();
        this.cargarMetricasKpi();
      },
      error: (err) => {
        this.isProcesandoAnulacion.set(false);
        this.toast.error(err?.error?.message || 'Error al anular la liquidación');
      }
    });
  }

  abrirRechazarAnulacion(item: any): void {
    this.selectedAnulacion.set(item);
    this.motivoResolucion.set('');
    this.showRechazarAnulacionModal.set(true);
  }

  confirmarRechazarAnulacion(): void {
    const it = this.selectedAnulacion();
    if (!it || !this.motivoResolucion().trim()) {
      this.toast.warning('Debe fundamentar el motivo de desestimación del trámite');
      return;
    }
    const targetId = it.liquidacionId || it.id;

    this.isProcesandoAnulacion.set(true);
    this.facade.rechazarAnulacion(targetId, this.motivoResolucion().trim()).subscribe({
      next: () => {
        this.isProcesandoAnulacion.set(false);
        this.toast.success('Solicitud de anulación rechazada');
        this.showRechazarAnulacionModal.set(false);
        this.cargarDatos();
        this.cargarMetricasKpi();
      },
      error: (err) => {
        this.isProcesandoAnulacion.set(false);
        this.toast.error(err?.error?.message || 'Error al rechazar la anulación');
      }
    });
  }

  // --- ANULACION DE OFICIO ---
  abrirAnulacionOficio(item: LiquidacionListadoDto): void {
    this.selectedLiquidacionOficio.set(item);
    this.motivoOficio.set('');
    this.showAnulacionOficioModal.set(true);
  }

  confirmarAnulacionOficio(): void {
    const liq = this.selectedLiquidacionOficio();
    if (!liq || !this.motivoOficio().trim()) {
      this.toast.warning('Debe fundamentar legalmente la anulación administrativa de oficio');
      return;
    }

    this.isProcesandoOficio.set(true);
    this.facade.anularLiquidacion(liq.id, this.motivoOficio().trim()).subscribe({
      next: () => {
        this.isProcesandoOficio.set(false);
        this.toast.success('Liquidación anulada de oficio administrativamente');
        this.showAnulacionOficioModal.set(false);
        this.cargarDatos();
        this.cargarMetricasKpi();
      },
      error: (err) => {
        this.isProcesandoOficio.set(false);
        this.toast.error(err?.error?.message || 'Error al ejecutar la anulación de oficio');
      }
    });
  }

  // --- RECAUDO EN VENTANILLA Y COMPROBANTES DE PAGO ---
  abrirModalPago(liq: any): void {
    this.selectedLiquidacion.set(liq);
    this.pagoValor.set(liq.totales?.totalPagar || liq.totalPagar || 0);
    this.pagoReferencia.set('');
    this.pagoFecha.set(new Date().toISOString().substring(0, 10));
    this.pagoObservaciones.set('');
    this.pagoArchivo.set(null);
    this.pagoArchivoNombre.set('');

    this.mediosPagoFacade.cargarMediosPago(1, 100, undefined, true);
    const medios = this.mediosPagoFacade.mediosPagoManuales();
    if (medios.length > 0) {
      this.pagoMedioPagoId.set(medios[0].id);
    } else {
      this.pagoMedioPagoId.set(null);
    }
    this.showPagoModal.set(true);
  }

  onPagoFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        this.toast.warning('El comprobante no debe superar los 15 MB.');
        return;
      }
      this.pagoArchivo.set(file);
      this.pagoArchivoNombre.set(file.name);
    } else {
      this.pagoArchivo.set(null);
      this.pagoArchivoNombre.set('');
    }
  }

  enviarRegistroPago(): void {
    const liq = this.selectedLiquidacion();
    if (!liq) return;

    if (!this.pagoMedioPagoId()) {
      this.toast.warning('Por favor seleccione el canal o medio de pago.');
      return;
    }

    if (!this.pagoReferencia().trim()) {
      this.toast.warning('Por favor ingrese el número de aprobación o recibo de caja.');
      return;
    }

    const medioSeleccionado = this.mediosPagoFacade.mediosPagoManuales().find(m => m.id === this.pagoMedioPagoId());
    if (!medioSeleccionado) {
      this.toast.warning('El canal o entidad seleccionada no es válida para recaudo manual.');
      return;
    }
    if (medioSeleccionado.requiereComprobante && !this.pagoArchivo()) {
      this.toast.warning(`El canal ${medioSeleccionado.nombre} exige adjuntar el soporte físico o voucher digital.`);
      return;
    }

    this.isSubmittingPago.set(true);
    const formData = new FormData();
    formData.append('MedioPagoId', this.pagoMedioPagoId()!.toString());
    formData.append('Valor', (this.pagoValor() || liq.totales?.totalPagar || liq.totalPagar || 0).toString());
    formData.append('Referencia', this.pagoReferencia().trim());
    formData.append('FechaPago', this.pagoFecha());
    if (this.pagoObservaciones().trim()) {
      formData.append('Observaciones', this.pagoObservaciones().trim());
    }
    const file = this.pagoArchivo();
    if (file) {
      formData.append('SoporteVoucher', file, file.name);
    }

    this.facade.registrarPago(liq.id, formData).subscribe({
      next: () => {
        this.isSubmittingPago.set(false);
        this.showPagoModal.set(false);
        this.toast.success('Pago fiscal certificado exitosamente. El título ahora figura como PAGADA.');
        this.cargarDatos();
        this.cargarMetricasKpi();
      },
      error: (err) => {
        this.isSubmittingPago.set(false);
        this.toast.error(err?.error?.message || 'Error al certificar el pago en la Gobernación.');
      }
    });
  }

  verComprobante(liq: any): void {
    this.selectedLiquidacion.set(liq);
    this.isLoadingComprobante.set(true);
    this.showComprobanteModal.set(true);
    this.facade.obtenerPago(liq.id).subscribe({
      next: (res) => {
        this.isLoadingComprobante.set(false);
        this.selectedComprobante.set(res.data);
      },
      error: () => {
        this.isLoadingComprobante.set(false);
        this.toast.error('No se pudo cargar la constancia fiscal de recaudo.');
      }
    });
  }

  descargarSoporte(liqId: number): void {
    this.facade.descargarSoportePago(liqId, false).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Soporte_Pago_Liq_${liqId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Soporte bancario descargado');
      },
      error: () => this.toast.error('Error al descargar el comprobante.')
    });
  }

  esPagada(item: any): boolean {
    return item.pago?.estaPagada === true ||
           item.pago?.pagado === true || 
           item.estadoLiquidacionId === 4 ||
           item.estado?.id === 4 ||
           item.estado?.codigo === 'PAGADA' ||
           (item.nombreEstado ? item.nombreEstado.toLowerCase().includes('pagad') : false);
  }

  esAnulada(item: any): boolean {
    return item.estadoLiquidacionId === 6 ||
           item.estado?.id === 6 ||
           item.estado?.codigo === 'ANULADA' ||
           (item.nombreEstado ? item.nombreEstado.toLowerCase().includes('anulad') : false);
  }

  esReliquidada(item: any): boolean {
    return item.estadoLiquidacionId === 7 ||
           item.estado?.id === 7 ||
           item.estado?.codigo === 'RELIQUIDADA' ||
           (item.nombreEstado ? item.nombreEstado.toLowerCase().includes('reliquidad') : false);
  }

  esVencida(item: any): boolean {
    if (this.esPagada(item) || this.esAnulada(item) || this.esReliquidada(item)) return false;
    return item.vencimiento?.estaVencida === true ||
           (item.vencimiento?.diasRestantes !== undefined && item.vencimiento.diasRestantes < 0) ||
           item.estaVencida === true ||
           item.estadoLiquidacionId === 5 ||
           item.estado?.id === 5 ||
           item.estado?.codigo === 'VENCIDA';
  }

  esVigente(item: any): boolean {
    return !this.esPagada(item) && !this.esAnulada(item) && !this.esReliquidada(item) && !this.esVencida(item);
  }
}
