import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LiquidacionesOficialesApiService } from '../../infrastructure/api/liquidaciones-oficiales-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  ActoLiquidacionOficial,
  LiquidacionOficialKpis,
  LiquidacionOficialFiltros,
  TabLiquidacionOficial,
  EmitirLiquidacionOficialRequest,
  EmitirLiquidacionOficialMasivaRequest,
  ActualizarTrazabilidadPostalLiqOficialRequest,
  DeclararPrescripcionRequest,
} from '../../domain/models/liquidacion-oficial.model';

/**
 * Facade del módulo de Liquidación Oficial de Aforo y Prescripción (Fase 2 de Cobro Coactivo).
 *
 * Fundamentos Legales:
 *  - ETN Art. 717: Liquidación de Aforo tras vencimiento de emplazamiento para declarar.
 *  - ETN Art. 643: Sanción por No Declarar equivalente al 160% del tributo determinado.
 *  - ETN Art. 720: Recurso de Reconsideración (plazo de 2 meses desde la notificación).
 *  - ETN Art. 817: Término de Prescripción de 5 años de la acción de cobro coactivo.
 *  - ETN Art. 828: Carácter de Título Ejecutivo de los actos administrativos ejecutoriados.
 */
@Injectable({ providedIn: 'root' })
export class LiquidacionesOficialesFacade {
  private api = inject(LiquidacionesOficialesApiService);
  private toast = inject(ToastService);

  // ── Signals de Estado General ──────────────────────────────────────────────
  readonly actos = signal<ActoLiquidacionOficial[]>([]);
  readonly kpis = signal<LiquidacionOficialKpis | null>(null);
  readonly loading = signal<boolean>(false);
  readonly loadingKpis = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Paginación
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(15);
  readonly totalCount = signal<number>(0);
  readonly totalPages = signal<number>(1);

  // Pestaña operativa activa
  readonly tabActivo = signal<TabLiquidacionOficial>('aptos_aforo');

  // Filtros
  readonly buscar = signal<string>('');
  readonly vigenciaFiltro = signal<number>(0);
  readonly estadoActoFiltro = signal<string>('');
  readonly estadoPostalFiltro = signal<string>('');

  // Filas expandidas (acordeón detalle anualizado)
  readonly expandedIds = signal<number[]>([]);

  // Selección múltiple
  readonly selectedPlacas = signal<string[]>([]);
  readonly selectedIds = signal<number[]>([]);

  // ── Modales ────────────────────────────────────────────────────────────────
  // Modal de Emisión Individual
  readonly isModalEmitirOpen = signal<boolean>(false);
  readonly actoParaEmitir = signal<ActoLiquidacionOficial | null>(null);
  readonly loadingEmitir = signal<boolean>(false);

  // Modal de Emisión Masiva
  readonly isModalEmitirMasivoOpen = signal<boolean>(false);
  readonly loadingEmitirMasivo = signal<boolean>(false);
  readonly vigenciaMasivaSeleccionada = signal<number>(0);

  // Modal de Trazabilidad Postal (4-72)
  readonly isModalPostalOpen = signal<boolean>(false);
  readonly actoPostalActivo = signal<ActoLiquidacionOficial | null>(null);
  readonly loadingPostal = signal<boolean>(false);

  // Modal de Pérdida de Competencia / Prescripción (ETN 817)
  readonly isModalPrescribirOpen = signal<boolean>(false);
  readonly actoPrescribirActivo = signal<ActoLiquidacionOficial | null>(null);
  readonly loadingPrescribir = signal<boolean>(false);

  // Modal Visor HTML / Documento
  readonly isModalPreviewOpen = signal<boolean>(false);
  readonly previewHtml = signal<string>('');
  readonly previewTitulo = signal<string>('');
  readonly loadingPreview = signal<boolean>(false);

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly haySeleccion = computed(() => this.selectedPlacas().length > 0);
  readonly totalSeleccionados = computed(() => this.selectedPlacas().length);

  readonly actosFiltrados = computed(() => {
    return this.actos();
  });

  // ── Carga de Datos ─────────────────────────────────────────────────────────
  cargarActos(): void {
    this.loading.set(true);
    this.error.set(null);

    const filtros: LiquidacionOficialFiltros = {
      page: this.page(),
      pageSize: this.pageSize(),
      tab: this.tabActivo(),
    };

    if (this.buscar().trim()) filtros.placa = this.buscar().trim();
    if (this.vigenciaFiltro() > 0) filtros.vigencia = this.vigenciaFiltro();
    if (this.estadoActoFiltro()) filtros.estadoActo = this.estadoActoFiltro();
    if (this.estadoPostalFiltro()) filtros.estadoPostal = this.estadoPostalFiltro();

    this.api.getLiquidacionesOficiales(filtros)
      .pipe(
        catchError(err => {
          console.error('Error al cargar liquidaciones oficiales:', err);
          this.error.set('No se pudo obtener el listado de liquidaciones oficiales.');
          this.loading.set(false);
          return of(null);
        })
      )
      .subscribe(res => {
        this.loading.set(false);
        if (res?.data) {
          this.actos.set(res.data.items || []);
          this.totalCount.set(res.data.totalCount || 0);
          this.totalPages.set(res.data.totalPages || 1);
        } else {
          this.actos.set([]);
          this.totalCount.set(0);
          this.totalPages.set(1);
        }
      });
  }

  cargarKpis(): void {
    this.loadingKpis.set(true);
    this.api.getKpis()
      .pipe(
        catchError(err => {
          console.warn('Error al cargar KPIs de liquidación oficial:', err);
          this.loadingKpis.set(false);
          return of(null);
        })
      )
      .subscribe(res => {
        this.loadingKpis.set(false);
        if (res?.data) {
          this.kpis.set(res.data);
        }
      });
  }

  // ── Navegación y Paginación ────────────────────────────────────────────────
  cambiarTab(tab: TabLiquidacionOficial): void {
    if (this.tabActivo() === tab) return;
    this.tabActivo.set(tab);
    this.page.set(1);
    this.selectedPlacas.set([]);
    this.selectedIds.set([]);
    this.cargarActos();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages()) return;
    this.page.set(nuevaPagina);
    this.cargarActos();
  }

  aplicarFiltros(): void {
    this.page.set(1);
    this.cargarActos();
  }

  limpiarFiltros(): void {
    this.buscar.set('');
    this.vigenciaFiltro.set(0);
    this.estadoActoFiltro.set('');
    this.estadoPostalFiltro.set('');
    this.page.set(1);
    this.cargarActos();
  }

  // ── Acordeón de Detalles ───────────────────────────────────────────────────
  toggleDetalle(id: number): void {
    const actuales = this.expandedIds();
    if (actuales.includes(id)) {
      this.expandedIds.set(actuales.filter(x => x !== id));
    } else {
      this.expandedIds.set([...actuales, id]);
    }
  }

  isDetalleExpandido(id: number): boolean {
    return this.expandedIds().includes(id);
  }

  // ── Selección Múltiple ─────────────────────────────────────────────────────
  toggleSeleccion(placa: string, id: number): void {
    const actualesPlacas = this.selectedPlacas();
    const actualesIds = this.selectedIds();

    if (actualesPlacas.includes(placa)) {
      this.selectedPlacas.set(actualesPlacas.filter(p => p !== placa));
      this.selectedIds.set(actualesIds.filter(i => i !== id));
    } else {
      this.selectedPlacas.set([...actualesPlacas, placa]);
      this.selectedIds.set([...actualesIds, id]);
    }
  }

  isSeleccionado(placa: string): boolean {
    return this.selectedPlacas().includes(placa);
  }

  seleccionarTodos(): void {
    const lista = this.actos();
    if (this.selectedPlacas().length === lista.length && lista.length > 0) {
      this.selectedPlacas.set([]);
      this.selectedIds.set([]);
    } else {
      this.selectedPlacas.set(lista.map(a => a.placa));
      this.selectedIds.set(lista.map(a => a.id));
    }
  }

  // ── Emisión de Aforo Individual (ETN Art. 717) ──────────────────────────────
  abrirEmitirAforo(acto: ActoLiquidacionOficial): void {
    this.actoParaEmitir.set(acto);
    this.isModalEmitirOpen.set(true);
  }

  cerrarEmitirAforo(): void {
    this.isModalEmitirOpen.set(false);
    this.actoParaEmitir.set(null);
    this.loadingEmitir.set(false);
  }

  confirmarEmitirAforo(responsable: string = 'FISCALIZACIÓN TRIBUTARIA', observaciones?: string): void {
    const acto = this.actoParaEmitir();
    if (!acto) return;

    this.loadingEmitir.set(true);
    const request: EmitirLiquidacionOficialRequest = {
      placa: acto.placa,
      actoEmplazamientoId: acto.actoEmplazamientoId ?? (acto.id > 0 ? acto.id : null),
      vigencias: acto.vigenciasLista?.length ? acto.vigenciasLista : undefined,
      responsableEmision: responsable,
      observaciones: observaciones || 'Emisión formal de Liquidación Oficial de Aforo por no comparecencia al emplazamiento previo.',
    };

    this.api.emitir(request)
      .pipe(
        catchError(err => {
          this.loadingEmitir.set(false);
          const msg = err?.error?.message || err?.message || 'Error al emitir la liquidación oficial de aforo.';
          this.toast.error(msg);
          return of(null);
        })
      )
      .subscribe(res => {
        this.loadingEmitir.set(false);
        if (res && res.data) {
          this.cerrarEmitirAforo();
          this.toast.success(`Liquidación Oficial de Aforo ${res.data.numeroActo} emitida con éxito para la placa ${acto.placa}.`);
          this.cargarActos();
          this.cargarKpis();
        }
      });
  }

  // ── Emisión de Aforo Masivo ────────────────────────────────────────────────
  abrirEmitirMasivo(): void {
    this.isModalEmitirMasivoOpen.set(true);
    this.vigenciaMasivaSeleccionada.set(0);
  }

  cerrarEmitirMasivo(): void {
    this.isModalEmitirMasivoOpen.set(false);
    this.loadingEmitirMasivo.set(false);
  }

  confirmarEmitirMasivo(responsable: string = 'DIRECCIÓN DE RENTAS'): void {
    this.loadingEmitirMasivo.set(true);
    const placasAforo = this.selectedPlacas();
    const vigencia = this.vigenciaMasivaSeleccionada() > 0 ? this.vigenciaMasivaSeleccionada() : undefined;

    const request: EmitirLiquidacionOficialMasivaRequest = {
      placas: placasAforo.length > 0 ? placasAforo : undefined,
      vigenciaEspecifica: vigencia,
      responsableEmision: responsable,
    };

    this.api.emitirMasivo(request)
      .pipe(
        catchError(err => {
          this.loadingEmitirMasivo.set(false);
          const msg = err?.error?.message || err?.message || 'Error en la emisión masiva de liquidaciones de aforo.';
          this.toast.error(msg);
          return of(null);
        })
      )
      .subscribe(res => {
        this.loadingEmitirMasivo.set(false);
        this.cerrarEmitirMasivo();
        this.selectedPlacas.set([]);
        this.selectedIds.set([]);
        if (res) {
          this.toast.success(res.message || 'Lote de liquidaciones oficiales de aforo emitido exitosamente.');
          this.cargarActos();
          this.cargarKpis();
        }
      });
  }

  // ── Trazabilidad Postal (4-72) ─────────────────────────────────────────────
  abrirPostal(acto: ActoLiquidacionOficial): void {
    this.actoPostalActivo.set(acto);
    this.isModalPostalOpen.set(true);
  }

  cerrarPostal(): void {
    this.isModalPostalOpen.set(false);
    this.actoPostalActivo.set(null);
    this.loadingPostal.set(false);
  }

  guardarPostal(payload: ActualizarTrazabilidadPostalLiqOficialRequest): void {
    this.loadingPostal.set(true);
    this.api.actualizarPostal(payload)
      .pipe(
        catchError(err => {
          this.loadingPostal.set(false);
          const msg = err?.error?.message || err?.message || 'Error al actualizar la trazabilidad postal.';
          this.toast.error(msg);
          return of(null);
        })
      )
      .subscribe(res => {
        this.loadingPostal.set(false);
        if (res && res.data) {
          this.cerrarPostal();
          this.toast.success('Trazabilidad postal actualizada. Términos legales de 2 meses computados según ETN Art. 720.');
          this.cargarActos();
          this.cargarKpis();
        }
      });
  }

  // ── Pérdida de Competencia / Prescripción (ETN 817) ─────────────────────────
  abrirPrescribir(acto: ActoLiquidacionOficial): void {
    this.actoPrescribirActivo.set(acto);
    this.isModalPrescribirOpen.set(true);
  }

  cerrarPrescribir(): void {
    this.isModalPrescribirOpen.set(false);
    this.actoPrescribirActivo.set(null);
    this.loadingPrescribir.set(false);
  }

  confirmarPrescribir(
    motivo: string = 'Pérdida de competencia por término quinquenal extintivo (ETN Arts. 717 y 817)',
    fundamento: string = 'Artículo 817 del Estatuto Tributario Nacional y Ordenanza Departamental.',
    responsable: string = 'SUBDIRECCIÓN DE RENTAS'
  ): void {
    const acto = this.actoPrescribirActivo();
    if (!acto) return;

    this.loadingPrescribir.set(true);
    const request: DeclararPrescripcionRequest = {
      placa: acto.placa,
      actoLiquidacionOficialId: acto.id > 0 ? acto.id : null,
      vigenciasAPrescribir: acto.vigenciasLista?.length ? acto.vigenciasLista : undefined,
      motivoPrescripcion: motivo,
      fundamentoNormativo: fundamento,
      responsableResolucion: responsable,
    };

    this.api.declararPrescripcion(request)
      .pipe(
        catchError(err => {
          this.loadingPrescribir.set(false);
          const msg = err?.error?.message || err?.message || 'Error al declarar la prescripción.';
          this.toast.error(msg);
          return of(null);
        })
      )
      .subscribe(res => {
        this.loadingPrescribir.set(false);
        if (res && res.data) {
          this.cerrarPrescribir();
          this.toast.success(`Resolución de Prescripción ${res.data.numeroResolucionPrescripcion || ''} expedida para placa ${acto.placa}.`);
          this.cargarActos();
          this.cargarKpis();
        }
      });
  }

  // ── Verificación de Ejecutoria / Firmeza (ETN 828) ──────────────────────────
  verificarEjecutoria(): void {
    this.toast.info('Verificando vencimiento de plazos de recurso de reconsideración (ETN Art. 720)...');
    this.api.verificarEjecutoria()
      .pipe(
        catchError(err => {
          this.toast.error('Error al verificar la firmeza de títulos ejecutivos.');
          return of(null);
        })
      )
      .subscribe(res => {
        if (res && res.data !== undefined) {
          if (res.data > 0) {
            this.toast.success(`Se consolidaron ${res.data} título(s) ejecutivo(s) en firme listos para Mandamiento de Pago (Fase 3).`);
          } else {
            this.toast.info('No se encontraron nuevos títulos pendientes de consolidar ejecutoria.');
          }
          this.cargarActos();
          this.cargarKpis();
        }
      });
  }

  // ── Descarga de PDF y Visualización de Documentos ──────────────────────────
  descargarResolucionPdf(id: number, numeroActo: string): void {
    this.toast.info(`Generando documento oficial en PDF de la Resolución ${numeroActo}...`);
    this.api.descargarPdf(id, true)
      .pipe(
        catchError(err => {
          this.toast.error('No se pudo descargar el archivo PDF de la resolución.');
          return of(null);
        })
      )
      .subscribe(blob => {
        if (blob) {
          const fileName = `Resolucion_Liquidacion_Aforo_${numeroActo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
          this.dispararDescargaBlob(blob, fileName);
          this.toast.success(`Resolución ${fileName} descargada con éxito.`);
        }
      });
  }

  descargarPrescripcionPdf(id: number, numeroResolucion?: string): void {
    this.toast.info(`Generando Resolución de Prescripción en PDF...`);
    this.api.descargarPrescripcionPdf(id, true)
      .pipe(
        catchError(err => {
          this.toast.error('No se pudo descargar el PDF de la resolución de prescripción.');
          return of(null);
        })
      )
      .subscribe(blob => {
        if (blob) {
          const num = numeroResolucion ? numeroResolucion.replace(/[^a-zA-Z0-9]/g, '_') : id.toString();
          const fileName = `Resolucion_Prescripcion_${num}.pdf`;
          this.dispararDescargaBlob(blob, fileName);
          this.toast.success(`Resolución de Prescripción descargada exitosamente.`);
        }
      });
  }

  abrirPreviewHtml(id: number, titulo: string): void {
    this.previewTitulo.set(titulo);
    this.loadingPreview.set(true);
    this.isModalPreviewOpen.set(true);

    this.api.getPreviewHtml(id)
      .pipe(
        catchError(err => {
          console.error('Error al obtener vista previa HTML:', err);
          this.previewHtml.set('<div class="p-8 text-center text-red-600 font-semibold">No se pudo cargar la vista previa del documento administrativo.</div>');
          this.loadingPreview.set(false);
          return of(null);
        })
      )
      .subscribe(html => {
        this.loadingPreview.set(false);
        if (html) {
          this.previewHtml.set(html);
        }
      });
  }

  cerrarPreviewHtml(): void {
    this.isModalPreviewOpen.set(false);
    this.previewHtml.set('');
    this.previewTitulo.set('');
  }

  imprimirPreviewHtml(): void {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(this.previewHtml());
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
    }
  }

  private dispararDescargaBlob(blob: Blob, fileName: string): void {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 200);
  }
}
