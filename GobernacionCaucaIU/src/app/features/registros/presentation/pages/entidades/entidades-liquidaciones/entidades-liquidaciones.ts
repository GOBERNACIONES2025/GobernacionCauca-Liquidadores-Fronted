import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GeneracionLiquidacionFacade } from '../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { CausalesReliquidacionFacade } from '../../../../application/facades/Liquidacion/causales-reliquidacion.facade';
import { CausalesAnulacionFacade } from '../../../../application/facades/Liquidacion/causales-anulacion.facade';
import { CausalReliquidacion } from '../../../../domain/models/Liquidacion/causal-reliquidacion.model';
import { CausalAnulacion } from '../../../../domain/models/Liquidacion/causal-anulacion.model';
import { ToastService } from '../../../../../../core/services/toast.service';
import { LiquidacionListadoDto } from '../../../../domain/models/Liquidacion/generacion-liquidacion.model';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';
import { TableSearchComponent } from '../../../shared/components/table-search/table-search';

import { MediosPagoFacade } from '../../../../application/facades/Pagos/medios-pago.facade';

export type TabLiquidacion = 'todas' | 'vigentes' | 'pagadas' | 'por-vencer' | 'vencidas' | 'reliquidacion' | 'anuladas';

@Component({
  selector: 'app-entidades-liquidaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, TableSearchComponent],
  templateUrl: './entidades-liquidaciones.html',
  styleUrl: './entidades-liquidaciones.css'
})
export class EntidadesLiquidacionesComponent implements OnInit {
  public facade = inject(GeneracionLiquidacionFacade);
  public causalesReliquidacionFacade = inject(CausalesReliquidacionFacade);
  public causalesAnulacionFacade = inject(CausalesAnulacionFacade);
  public mediosPagoFacade = inject(MediosPagoFacade);
  private router = inject(Router);
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

  // Pestaña de filtrado activa
  activeTab = signal<TabLiquidacion>('todas');

  allLiquidaciones = signal<LiquidacionListadoDto[]>([]);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isDownloadingId = signal<number | null>(null);

  // Modales
  showReliquidacionModal = signal<boolean>(false);
  showAnulacionModal = signal<boolean>(false);
  selectedLiquidacion = signal<LiquidacionListadoDto | null>(null);

  // Modal y Formulario de Registro de Pago (Adjuntar Comprobante Bancario)
  showPagoModal = signal<boolean>(false);
  showComprobanteModal = signal<boolean>(false);
  selectedComprobante = signal<any | null>(null);
  isLoadingComprobante = signal<boolean>(false);

  pagoMedioPagoId = signal<number | null>(null);
  pagoValor = signal<number>(0);
  pagoReferencia = signal<string>('');
  pagoFecha = signal<string>(new Date().toISOString().substring(0, 10));
  pagoObservaciones = signal<string>('');
  pagoArchivo = signal<File | null>(null);
  pagoArchivoNombre = signal<string>('');

  // Formulario Reliquidación Dinámica
  selectedCausalReliquidacion = signal<CausalReliquidacion | null>(null);
  reliquidacionCausalId = signal<number | null>(null);
  reliquidacionMotivo = signal<string>('');
  reliquidacionDoc = signal<string>('');
  reliquidacionFechaDoc = signal<string>('');
  reliquidacionArchivo = signal<File | null>(null);
  reliquidacionArchivoNombre = signal<string>('');

  // Formulario Anulación Dinámica
  selectedCausalAnulacion = signal<CausalAnulacion | null>(null);
  anulacionCausalId = signal<number | null>(null);
  anulacionMotivo = signal<string>('');
  anulacionDocSoporte = signal<string>('');
  anulacionArchivo = signal<File | null>(null);
  anulacionArchivoNombre = signal<string>('');

  // =========================================================================
  // SEÑALES COMPUTADAS: FILTRADO Y MÉTRICAS REACTIVAS
  // =========================================================================

  // Métricas para Tarjetas KPI y Pestañas
  kpiTotal = computed(() => this.allLiquidaciones().length);

  kpiPagadas = computed(() => {
    return this.allLiquidaciones().filter(item => this.esPagada(item)).length;
  });

  kpiVigentes = computed(() => {
    return this.allLiquidaciones().filter(item => 
      !this.esPagada(item) &&
      !item.estaVencida && 
      (item.diasParaVencer === undefined || item.diasParaVencer > 5) && 
      !this.estaEnTramiteReliquidacion(item) &&
      !this.esAnulada(item)
    ).length;
  });

  kpiPorVencer = computed(() => {
    return this.allLiquidaciones().filter(item => 
      !this.esPagada(item) &&
      !item.estaVencida &&
      (item.diasParaVencer !== undefined && item.diasParaVencer >= 0 && item.diasParaVencer <= 5) &&
      !this.esAnulada(item)
    ).length;
  });

  kpiVencidas = computed(() => {
    return this.allLiquidaciones().filter(item => 
      !this.esPagada(item) &&
      item.estaVencida &&
      !this.esAnulada(item)
    ).length;
  });

  kpiEnReliquidacion = computed(() => {
    return this.allLiquidaciones().filter(item => 
      this.estaEnTramiteReliquidacion(item) || item.estado?.codigo === 'EN_RELIQUIDACION'
    ).length;
  });

  kpiAnuladas = computed(() => {
    return this.allLiquidaciones().filter(item => this.esAnulada(item)).length;
  });

  montoPagado = computed(() => {
    return this.allLiquidaciones()
      .filter(item => this.esPagada(item))
      .reduce((acc, item) => acc + (item.totales?.totalPagar || 0), 0);
  });

  // Lista filtrada según pestaña y término de búsqueda
  liquidacionesFiltradas = computed(() => {
    const tab = this.activeTab();
    const search = this.searchText().toLowerCase().trim();
    let list = this.allLiquidaciones();

    // 1. Filtrado por término de búsqueda si existe
    if (search) {
      list = list.filter(item => 
        (item.numeroLiquidacion && item.numeroLiquidacion.toLowerCase().includes(search)) ||
        (item.id && item.id.toString().includes(search)) ||
        (item.radicacion?.numeroRadicado && item.radicacion.numeroRadicado.toLowerCase().includes(search)) ||
        (item.contribuyente?.nombreCompleto && item.contribuyente.nombreCompleto.toLowerCase().includes(search)) ||
        (item.contribuyente?.numeroIdentificacion && item.contribuyente.numeroIdentificacion.toLowerCase().includes(search)) ||
        (item.documentoRegistro?.numeroDocumento && item.documentoRegistro.numeroDocumento.toLowerCase().includes(search))
      );
    }

    // 2. Filtrado por Pestaña / Estado Semántico
    switch (tab) {
      case 'vigentes':
        return list.filter(item => 
          !this.esPagada(item) &&
          !item.estaVencida && 
          (item.diasParaVencer === undefined || item.diasParaVencer > 5) && 
          !this.estaEnTramiteReliquidacion(item) &&
          !this.esAnulada(item)
        );

      case 'pagadas':
        return list.filter(item => this.esPagada(item));

      case 'por-vencer':
        return list.filter(item => 
          !this.esPagada(item) &&
          !item.estaVencida &&
          (item.diasParaVencer !== undefined && item.diasParaVencer >= 0 && item.diasParaVencer <= 5) &&
          !this.esAnulada(item)
        );

      case 'vencidas':
        return list.filter(item => 
          !this.esPagada(item) &&
          item.estaVencida &&
          !this.esAnulada(item)
        );

      case 'reliquidacion':
        return list.filter(item => 
          this.estaEnTramiteReliquidacion(item) || item.estado?.codigo === 'EN_RELIQUIDACION'
        );

      case 'anuladas':
        return list.filter(item => this.esAnulada(item));

      case 'todas':
      default:
        return list;
    }
  });

  // Paginación sobre la lista filtrada
  totalFiltrado = computed(() => this.liquidacionesFiltradas().length);

  liquidacionesPaginadas = computed(() => {
    const items = this.liquidacionesFiltradas();
    const page = this.pageNumber();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return items.slice(start, start + size);
  });

  // Monto acumulado de la vista actual
  montoFiltrado = computed(() => {
    return this.liquidacionesFiltradas().reduce((acc, item) => acc + (item.totales?.totalPagar || 0), 0);
  });

  ngOnInit(): void {
    this.cargarLiquidaciones();
    this.causalesReliquidacionFacade.cargarCausalesReliquidacion(1, 100, undefined, true);
    this.causalesAnulacionFacade.cargarCausalesAnulacion(1, 100, undefined, true);
  }

  cargarLiquidaciones(): void {
    this.isLoading.set(true);
    // Consultar el universo de liquidaciones de la entidad (hasta 100) para permitir filtrado instantáneo
    this.facade.listarLiquidaciones(1, 100, undefined, null).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) {
          this.allLiquidaciones.set(res.data.items || []);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Error al consultar las liquidaciones oficiales');
      }
    });
  }

  cambiarPestana(tab: TabLiquidacion): void {
    this.activeTab.set(tab);
    this.pageNumber.set(1);
  }

  onSearch(term: string): void {
    this.searchText.set(term);
    this.pageNumber.set(1);
  }

  limpiarBusqueda(): void {
    this.searchText.set('');
    this.pageNumber.set(1);
  }

  onPageChange(page: number): void {
    this.pageNumber.set(page);
  }

  descargarPdf(id: number): void {
    this.isDownloadingId.set(id);
    this.facade.descargarPdf(id).subscribe({
      next: (blob) => {
        this.isDownloadingId.set(null);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Liquidacion_Oficial_${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Recibo oficial de liquidación descargado exitosamente');
      },
      error: () => {
        this.isDownloadingId.set(null);
        this.toast.error('Error al descargar el PDF de la liquidación');
      }
    });
  }

  // --- GESTIÓN DE RELIQUIDACIÓN ---
  abrirModalReliquidacion(liq: LiquidacionListadoDto): void {
    this.selectedLiquidacion.set(liq);
    this.reliquidacionMotivo.set('');
    this.reliquidacionDoc.set('');
    this.reliquidacionFechaDoc.set('');
    this.reliquidacionArchivo.set(null);
    this.reliquidacionArchivoNombre.set('');

    const causales = this.causalesReliquidacionFacade.causalesReliquidacion();
    if (causales.length > 0) {
      this.reliquidacionCausalId.set(causales[0].id);
      this.selectedCausalReliquidacion.set(causales[0]);
    } else {
      this.reliquidacionCausalId.set(null);
      this.selectedCausalReliquidacion.set(null);
      this.causalesReliquidacionFacade.cargarCausalesReliquidacion(1, 100, undefined, true);
    }
    this.showReliquidacionModal.set(true);
  }

  onCausalReliquidacionChange(id: number): void {
    this.reliquidacionCausalId.set(Number(id));
    const found = this.causalesReliquidacionFacade.causalesReliquidacion().find(c => c.id === Number(id));
    this.selectedCausalReliquidacion.set(found || null);
  }

  onReliquidacionFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    if (file) {
      this.reliquidacionArchivo.set(file);
      this.reliquidacionArchivoNombre.set(file.name);
    } else {
      this.reliquidacionArchivo.set(null);
      this.reliquidacionArchivoNombre.set('');
    }
  }

  irAWizardReliquidacion(): void {
    const liq = this.selectedLiquidacion();
    if (!liq) return;

    const causal = this.selectedCausalReliquidacion();
    if (causal?.requiereSoporte && !this.reliquidacionArchivo()) {
      this.toast.warning('Esta causal exige adjuntar el archivo de soporte digital (PDF) antes de continuar.');
      return;
    }

    if (!this.reliquidacionMotivo().trim()) {
      this.toast.warning('Por favor describa la justificación para la reliquidación.');
      return;
    }

    const targetSolId = liq.radicacion?.solicitudId || liq.id;
    const queryParams: any = {
      modo: 'reliquidacion',
      liquidacionId: liq.id,
      causalId: this.reliquidacionCausalId(),
      motivo: this.reliquidacionMotivo(),
      doc: this.reliquidacionDoc(),
      fechaDoc: this.reliquidacionFechaDoc(),
      archivoNombre: this.reliquidacionArchivoNombre()
    };

    if (this.estaEnTramiteReliquidacion(liq)) {
      this.showReliquidacionModal.set(false);
      this.router.navigate([`/registros/entidades/solicitudes/wizard/${targetSolId}`], { queryParams });
      return;
    }

    this.isSubmitting.set(true);
    const file = this.reliquidacionArchivo();
    const payload = {
      causalReliquidacionId: this.reliquidacionCausalId(),
      causal: causal?.codigo || 'RELIQUIDACION_GENERAL',
      motivo: this.reliquidacionMotivo().trim(),
      numeroDocumentoAclaratorio: this.reliquidacionDoc()?.trim() || null,
      fechaDocumentoAclaratorio: this.reliquidacionFechaDoc() || null,
      nombreArchivoSoporte: file?.name || null,
      tipoArchivoSoporte: file?.type || null,
      rutaArchivoSoporte: file ? `ftp://servidor_ftp/reliquidaciones/${Date.now()}_${file.name}` : null
    };

    this.facade.solicitarReliquidacion(liq.id, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showReliquidacionModal.set(false);
        this.toast.info('Trámite de reliquidación iniciado. Puede mutar actos y cuantías en el asistente.');
        this.router.navigate([`/registros/entidades/solicitudes/wizard/${targetSolId}`], { queryParams });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err?.error?.code === 'Liquidacion.ReliquidacionEnTramite' || err?.error?.message?.includes('en curso') || err?.error?.message?.includes('en trámite')) {
          this.showReliquidacionModal.set(false);
          this.router.navigate([`/registros/entidades/solicitudes/wizard/${targetSolId}`], { queryParams });
        } else {
          this.toast.error(err?.error?.message || 'Error al iniciar trámite de reliquidación en el servidor.');
        }
      }
    });
  }

  enviarSolicitudReliquidacion(): void {
    const liq = this.selectedLiquidacion();
    if (!liq) return;

    if (!this.reliquidacionMotivo().trim()) {
      this.toast.warning('Por favor describa la justificación para la reliquidación.');
      return;
    }

    const causal = this.selectedCausalReliquidacion();
    const file = this.reliquidacionArchivo();

    if (causal?.requiereSoporte && !file) {
      this.toast.warning('Esta causal exige adjuntar el archivo soporte (PDF).');
      return;
    }

    this.isSubmitting.set(true);
    const payload = {
      causalReliquidacionId: this.reliquidacionCausalId(),
      causal: causal?.codigo || 'RELIQUIDACION_GENERAL',
      motivo: this.reliquidacionMotivo().trim(),
      numeroDocumentoAclaratorio: this.reliquidacionDoc()?.trim() || null,
      fechaDocumentoAclaratorio: this.reliquidacionFechaDoc() || null,
      nombreArchivoSoporte: file?.name || null,
      tipoArchivoSoporte: file?.type || null,
      rutaArchivoSoporte: file ? `ftp://servidor_ftp/reliquidaciones/${Date.now()}_${file.name}` : null
    };

    this.facade.solicitarReliquidacion(liq.id, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success('Solicitud de reliquidación radicada ante la Gobernación del Cauca');
        this.showReliquidacionModal.set(false);
        this.cargarLiquidaciones();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(err?.error?.message || 'Error al radicar la solicitud');
      }
    });
  }

  // --- GESTIÓN DE ANULACIÓN ---
  abrirModalAnulacion(liq: LiquidacionListadoDto): void {
    this.selectedLiquidacion.set(liq);
    this.anulacionMotivo.set('');
    this.anulacionDocSoporte.set('');
    this.anulacionArchivo.set(null);
    this.anulacionArchivoNombre.set('');

    const causales = this.causalesAnulacionFacade.causalesAnulacion();
    if (causales.length > 0) {
      this.anulacionCausalId.set(causales[0].id);
      this.selectedCausalAnulacion.set(causales[0]);
    } else {
      this.anulacionCausalId.set(null);
      this.selectedCausalAnulacion.set(null);
      this.causalesAnulacionFacade.cargarCausalesAnulacion(1, 100, undefined, true);
    }
    this.showAnulacionModal.set(true);
  }

  onCausalAnulacionChange(id: number): void {
    this.anulacionCausalId.set(Number(id));
    const found = this.causalesAnulacionFacade.causalesAnulacion().find(c => c.id === Number(id));
    this.selectedCausalAnulacion.set(found || null);
  }

  onAnulacionFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    if (file) {
      this.anulacionArchivo.set(file);
      this.anulacionArchivoNombre.set(file.name);
    } else {
      this.anulacionArchivo.set(null);
      this.anulacionArchivoNombre.set('');
    }
  }

  enviarSolicitudAnulacion(): void {
    const liq = this.selectedLiquidacion();
    if (!liq) return;

    if (!this.anulacionMotivo().trim()) {
      this.toast.warning('Por favor describa la justificación formal de la anulación');
      return;
    }

    const causal = this.selectedCausalAnulacion();
    const file = this.anulacionArchivo();

    if (causal?.requiereSoporte && !file) {
      this.toast.warning('Esta causal exige adjuntar el archivo soporte (PDF) probatorio.');
      return;
    }

    this.isSubmitting.set(true);
    const payload = {
      causalAnulacionId: this.anulacionCausalId(),
      causal: causal?.codigo || 'ANULACION_GENERAL',
      motivo: this.anulacionMotivo().trim(),
      documentoSoporte: this.anulacionDocSoporte()?.trim() || null,
      nombreArchivoSoporte: file?.name || null,
      tipoArchivoSoporte: file?.type || null,
      rutaArchivoSoporte: file ? `ftp://servidor_ftp/anulaciones/${Date.now()}_${file.name}` : null
    };

    this.facade.solicitarAnulacion(liq.id, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success('Solicitud de anulación radicada formalmente ante la Gobernación');
        this.showAnulacionModal.set(false);
        this.cargarLiquidaciones();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(err?.error?.message || 'Error al radicar la anulación');
      }
    });
  }

  // --- GESTIÓN DE RECAUDO Y COMPROBANTES DE PAGO ---
  abrirModalPago(liq: LiquidacionListadoDto): void {
    if (liq.estaVencida) {
      this.toast.warning('Esta liquidación está VENCIDA. Conforme al Estatuto Tributario, no es procedente registrar el pago sin liquidación de intereses moratorios diarios. Proceda a Reliquidar o Anular.');
      return;
    }
    this.selectedLiquidacion.set(liq);
    this.pagoValor.set(liq.totales?.totalPagar || 0);
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
      this.toast.warning('Por favor seleccione el canal o entidad de pago.');
      return;
    }

    if (!this.pagoReferencia().trim()) {
      this.toast.warning('Por favor ingrese el número de aprobación o referencia de la consignación.');
      return;
    }

    const medioSeleccionado = this.mediosPagoFacade.mediosPagoManuales().find(m => m.id === this.pagoMedioPagoId());
    if (!medioSeleccionado) {
      this.toast.warning('El canal o entidad seleccionada no es válida para recaudo manual.');
      return;
    }
    if (medioSeleccionado.requiereComprobante && !this.pagoArchivo()) {
      this.toast.warning(`El canal ${medioSeleccionado.nombre} requiere adjuntar el soporte físico o voucher bancario.`);
      return;
    }

    this.isSubmitting.set(true);
    const formData = new FormData();
    formData.append('MedioPagoId', this.pagoMedioPagoId()!.toString());
    formData.append('Valor', (this.pagoValor() || liq.totales?.totalPagar || 0).toString());
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
        this.isSubmitting.set(false);
        this.showPagoModal.set(false);
        this.toast.success('¡Pago registrado exitosamente! La liquidación ahora figura como PAGADA.');
        this.cargarLiquidaciones();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(err?.error?.message || 'Error al certificar el pago de la liquidación.');
      }
    });
  }

  verComprobante(liq: LiquidacionListadoDto): void {
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
        this.toast.error('No se pudo cargar la información del comprobante de pago.');
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
        this.toast.success('Soporte de pago descargado');
      },
      error: () => this.toast.error('Error al descargar el soporte de pago.')
    });
  }

  // --- HELPERS DE NEGOCIO Y ESTADOS ---
  esPagada(item: LiquidacionListadoDto): boolean {
    return item.pago?.pagado === true || 
           item.estado?.codigo === 'PAGADA' || 
           item.estadoLiquidacionId === 4 ||
           (item.estado?.nombre ? item.estado.nombre.toLowerCase().includes('pagad') : false);
  }

  estaEnTramiteReliquidacion(item: LiquidacionListadoDto): boolean {
    const obs = item.radicacion?.observacion;
    if (obs) {
      const lower = obs.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes('reliquidacion en tramite') || lower.includes('reliquidacion solicitada')) return true;
    }
    return item.estado?.codigo === 'EN_RELIQUIDACION';
  }

  esAnulada(item: LiquidacionListadoDto): boolean {
    return item.estado?.codigo === 'ANULADA' || 
           item.estadoLiquidacionId === 3 ||
           (item.estado?.nombre ? item.estado.nombre.toLowerCase().includes('anulad') : false);
  }

  irAWizard(item: LiquidacionListadoDto): void {
    const solId = item.radicacion?.solicitudId || item.id;
    this.router.navigate([`/registros/entidades/solicitudes/wizard/${solId}`], {
      queryParams: { modo: 'reliquidacion', liquidacionId: item.id }
    });
  }
}
