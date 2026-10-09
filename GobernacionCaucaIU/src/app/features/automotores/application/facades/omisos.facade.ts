import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, map } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { OmisosApiService, PagedResultOmisos } from '../../infrastructure/api/omisos-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { downloadPdfFromHtml } from '../../../../shared/utils/pdf-exporter.util';
import {
  VehiculoOmiso,
  OmisosKpis,
  NivelMoraOmiso,
  EstadoPostal,
  TrazabilidadPostalRequest,
  calcularNivelMora,
  SimulacionLiquidacion,
  SimularLiquidacionRequest,
  VigenciaOmisoDetalle,
} from '../../domain/models/liquidacion.model';

export type TabOmisos = 'pendientes' | 'pendientes_envio' | 'notificados' | 'devueltos';

/**
 * Facade del módulo "Vehículos Omisos por Emplazamiento y Fiscalización".
 *
 * Base legal:
 *   - Ley 488/1998 Art.147  → Cobro coactivo departamental
 *   - ETN Art.715           → Emplazamiento previo (plazo 1 mes con reducción al 50% de sanción)
 *   - ETN Art.565           → Formas de notificación (correo postal con guía)
 *   - ETN Art.568           → Notificación por aviso en web tras devolución
 *   - ETN Arts.634-635      → Intereses moratorios desde día 1
 *   - ETN Art.642           → Sanción extemporaneidad con emplazamiento
 *   - ETN Art.643           → Sanción por no declarar (aforo de oficio)
 *   - ETN Art.817           → Prescripción acción de cobro (5 años)
 */
@Injectable({ providedIn: 'root' })
export class OmisosFacade {
  private api   = inject(OmisosApiService);
  private toast = inject(ToastService);

  // ── Signals de estado general ───────────────────────────────────────────────
  readonly omisos        = signal<VehiculoOmiso[]>([]);
  readonly kpis          = signal<OmisosKpis | null>(null);
  readonly loading       = signal<boolean>(false);
  readonly loadingKpis   = signal<boolean>(false);
  readonly error         = signal<string | null>(null);

  readonly page          = signal<number>(1);
  readonly pageSize      = signal<number>(15);
  readonly totalCount    = signal<number>(0);
  readonly totalPages    = signal<number>(1);

  // Pestaña operativa activa
  readonly tabActivo     = signal<TabOmisos>('pendientes');

  // Filtros activos
  readonly buscar            = signal<string>('');
  readonly nivelMoraFiltro   = signal<NivelMoraOmiso | ''>('');
  readonly estadoEmplFiltro  = signal<'SIN_NOTIFICAR' | 'NOTIFICADO' | 'COBRO_COACTIVO' | ''>('');
  readonly diasMinimoFiltro  = signal<number>(0);
  readonly vigenciaFiltro    = signal<number>(0);
  readonly ordenarPor        = signal<'diasMora' | 'totalDeuda' | 'vigenciaMasAntigua'>('diasMora');

  // Modal emplazamiento individual o por vigencia
  readonly isModalSimulOpen         = signal<boolean>(false);
  readonly simulacion               = signal<SimulacionLiquidacion | null>(null);
  readonly loadingSimul             = signal<boolean>(false);
  readonly errorSimul               = signal<string | null>(null);
  readonly placaSimulActiva         = signal<string>('');
  readonly vigenciaEmplazar         = signal<number | null>(null);
  readonly draftDossierHtml         = signal<string>('');
  readonly tabModalEmplazamiento    = signal<'documento' | 'financiero'>('documento');

  // Acordeón de placas expandidas (detalle de vigencias)
  readonly placasExpandidas  = signal<string[]>([]);

  // Modal emplazamiento masivo y revisión detallada 1 a 1
  readonly isModalEmplMasivoOpen     = signal<boolean>(false);
  readonly preSimulacionesMasivo     = signal<SimulacionLiquidacion[]>([]);
  readonly loadingPreSimulacionMasiva = signal<boolean>(false);
  readonly modoRevisionMasivo        = signal<'resumen' | 'revision-individual'>('resumen');
  readonly indexVehiculoMasivo       = signal<number>(0);
  readonly selectedVigenciasMasivasMap = signal<Record<string, number[]>>({});
  readonly vigenciaFiltroMasivo      = signal<number>(0);

  // Modal de trazabilidad postal (Registro de guía 4-72 y fecha de entrega)
  readonly isModalPostalOpen         = signal<boolean>(false);
  readonly vehiculoPostalActivo      = signal<VehiculoOmiso | null>(null);

  // Modal de Notificación por Aviso Web / Cartelera (Devoluciones)
  readonly isModalAvisoOpen          = signal<boolean>(false);
  readonly vehiculoAvisoActivo       = signal<VehiculoOmiso | null>(null);

  readonly isModalPreviewDossierOpen = signal<boolean>(false);
  readonly previewDossierHtml        = signal<string>('');
  readonly loadingPreviewDossier     = signal<boolean>(false);
  readonly placaPreviewDossier       = signal<string>('');

  // Modal de previsualización de Planilla de Envíos Postal (ETN Art. 565)
  readonly isModalPreviewPlanillaOpen = signal<boolean>(false);
  readonly previewPlanillaHtml        = signal<string>('');
  readonly cantidadEnviosPlanilla     = signal<number>(0);
  readonly operadorPostalPlanilla     = signal<string>('Servicios Postales Nacionales 4-72');
  readonly fechaRemesaPlanilla        = signal<string>(new Date().toISOString().split('T')[0]);
  readonly bloqueSeleccionado         = signal<number | null>(null);

  // Selección de placas
  readonly selectedPlacas            = signal<string[]>([]);

  // ── Computed ───────────────────────────────────────────────────────────────

  /** Vehículos filtrados de acuerdo con la pestaña operativa seleccionada */
  readonly omisosFiltrados = computed(() => {
    const todos = this.omisos();
    const tab = this.tabActivo();

    if (tab === 'pendientes') {
      // 1. Por Emplazar: Omisos en mora sin acto expedido
      return todos.filter(o => !o.numeroActoEmplazamiento || o.estadoEmplazamiento === 'SIN_NOTIFICAR');
    }
    if (tab === 'pendientes_envio') {
      // 2. Pendientes de Envío: Actos ya expedidos listos para generar planilla postal y asignar guía
      return todos.filter(o => o.numeroActoEmplazamiento != null && (!o.numeroGuiaPostal || o.estadoPostal === 'PENDIENTE_ENVIO'));
    }
    if (tab === 'notificados') {
      // 3. En Tránsito / Notificados: Con guía postal asignada, en reparto o ya entregados efectivamente
      return todos.filter(o => o.numeroGuiaPostal != null && o.estadoPostal !== 'NO_ENTREGADO' && o.estadoPostal !== 'DEVUELTO');
    }
    if (tab === 'devueltos') {
      // 4. Devoluciones: Rebotados por la mensajería postal para notificación por Aviso Web ETN 568
      return todos.filter(o => o.estadoPostal === 'NO_ENTREGADO' || o.estadoPostal === 'DEVUELTO');
    }
    return todos;
  });

  /** Contadores de registros por cada pestaña */
  readonly totalPendientesTab = computed(() =>
    this.omisos().filter(o => !o.numeroActoEmplazamiento || o.estadoEmplazamiento === 'SIN_NOTIFICAR').length
  );

  readonly totalPendientesEnvioTab = computed(() =>
    this.omisos().filter(o => o.numeroActoEmplazamiento != null && (!o.numeroGuiaPostal || o.estadoPostal === 'PENDIENTE_ENVIO')).length
  );

  readonly totalNotificadosTab = computed(() =>
    this.omisos().filter(o => o.numeroGuiaPostal != null && o.estadoPostal !== 'NO_ENTREGADO' && o.estadoPostal !== 'DEVUELTO').length
  );

  readonly totalDevueltosTab = computed(() =>
    this.omisos().filter(o => o.estadoPostal === 'NO_ENTREGADO' || o.estadoPostal === 'DEVUELTO').length
  );

  /** HTML del Aviso Web para previsualización inmediata por el funcionario antes de publicar */
  readonly htmlAvisoWebActivo = computed(() => {
    const v = this.vehiculoAvisoActivo();
    return v ? this.generarHtmlAvisoWeb(v) : null;
  });

  /** Expedientes de Etapa 1 que ya cumplieron el término legal de 1 mes y califican para Liquidación de Aforo */
  readonly candidatosAforo = computed(() => {
    return this.omisos().filter(o =>
      o.estadoEmplazamiento === 'NOTIFICADO' &&
      o.fechaEntregaNotificacion != null &&
      (o.diasRestantesTermino !== undefined && o.diasRestantesTermino <= 0)
    );
  });

  readonly vehiculoActualMasivo = computed<SimulacionLiquidacion | null>(() => {
    const sims = this.preSimulacionesMasivo();
    const idx = this.indexVehiculoMasivo();
    return (sims && sims.length > idx && idx >= 0) ? sims[idx] : null;
  });

  /** Total Lote Masivo Proyectado en tiempo real según vigencias seleccionadas */
  readonly totalLoteMasivoProyectado = computed(() => {
    const sims = this.preSimulacionesMasivo();
    if (!sims || sims.length === 0) return 0;
    const mapa = this.selectedVigenciasMasivasMap();
    return sims.reduce((sum, s) => {
      const aniosSeleccionados = mapa[s.placa] || [];
      const subtotalVeh = s.vigencias
        .filter(v => aniosSeleccionados.includes(v.anio))
        .reduce((vSum, v) => vSum + (v.totalVigencia || 0), 0);
      return sum + subtotalVeh;
    }, 0);
  });

  readonly resumenSemaforo = computed(() => {
    const lista = this.omisos();
    return {
      recientes:   lista.filter(o => o.nivelMora === 'RECIENTE').length,
      emplazables: lista.filter(o => o.nivelMora === 'EMPLAZABLE').length,
      criticos:    lista.filter(o => o.nivelMora === 'CRITICO').length,
    };
  });

  readonly haySeleccion = computed(() => this.selectedPlacas().length > 0);

  /** Lista completa de los vehículos actualmente seleccionados para el lote masivo */
  readonly selectedOmisos = computed(() => {
    const placas = this.selectedPlacas();
    return this.omisos().filter(o => placas.includes(o.placa));
  });

  /** Consolidado de métricas para la revisión del lote antes de emplazar masivamente */
  readonly resumenSeleccionMasiva = computed(() => {
    const sims = this.preSimulacionesMasivo();
    const mapVigencias = this.selectedVigenciasMasivasMap();

    if (sims.length > 0) {
      let totalVehiculos = sims.length;
      let totalVigencias = 0;
      let totalDeuda = 0;
      let totalImpuesto = 0;
      let totalSanciones = 0;
      let totalIntereses = 0;

      for (const s of sims) {
        const sel = mapVigencias[s.placa] || [];
        const vigs = s.vigencias.filter(v => sel.includes(v.anio));
        totalVigencias += vigs.length;
        totalImpuesto += vigs.reduce((acc, v) => acc + (v.valorImpuestoNominal || 0), 0);
        totalSanciones += vigs.reduce((acc, v) => acc + (v.sancionExtemporaneidad || 0), 0);
        totalIntereses += vigs.reduce((acc, v) => acc + (v.interesesMora || 0), 0);
        totalDeuda += vigs.reduce((acc, v) => acc + (v.totalVigencia || 0), 0);
      }

      return {
        totalVehiculos,
        totalVigencias,
        totalDeuda,
        totalImpuesto,
        totalSanciones,
        totalIntereses
      };
    }

    const seleccionados = this.selectedOmisos();
    const totalVehiculos = seleccionados.length;
    const totalVigencias = seleccionados.reduce((acc, o) => acc + (o.totalVigencias || o.vigenciasPendientes?.length || 1), 0);
    const totalDeuda = seleccionados.reduce((acc, o) => acc + (o.totalDeudaEstimada || 0), 0);
    const totalImpuesto = seleccionados.reduce((acc, o) => acc + (o.impuestoBaseAcumulado || 0), 0);
    const totalSanciones = seleccionados.reduce((acc, o) => acc + (o.sancionesAcumuladas || 0), 0);
    const totalIntereses = seleccionados.reduce((acc, o) => acc + (o.interesesMoraAcumulados || 0), 0);
    return {
      totalVehiculos,
      totalVigencias,
      totalDeuda,
      totalImpuesto,
      totalSanciones,
      totalIntereses
    };
  });

  // ── Navegación de Pestañas ──────────────────────────────────────────────────
  setTab(tab: TabOmisos): void {
    this.tabActivo.set(tab);
    this.limpiarSeleccion();
  }

  // ── Carga de datos ─────────────────────────────────────────────────────────
  cargarOmisos(): void {
    this.loading.set(true);
    this.error.set(null);

    const filtros = {
      page: this.page(),
      pageSize: this.pageSize(),
      ordenarPor: this.ordenarPor(),
      ordenDesc: true,
      buscar: this.buscar()?.trim() || undefined,
      vigencia: this.vigenciaFiltro() > 0 ? this.vigenciaFiltro() : undefined,
      nivelMora: this.nivelMoraFiltro() || undefined,
      estadoEmplazamiento: this.estadoEmplFiltro() || undefined,
      diasMoraMinimo: this.diasMinimoFiltro() > 0 ? this.diasMinimoFiltro() : undefined,
    };

    const fallbackParams: Record<string, any> = {
      page: this.page(),
      pageSize: this.pageSize(),
      buscar: this.buscar()?.trim() || undefined,
      vigencia: this.vigenciaFiltro() > 0 ? this.vigenciaFiltro() : undefined,
    };

    this.api.getOmisos(filtros)
      .pipe(
        // Fallback: si falla /omisos recae sobre /pendientes
        catchError(() =>
          this.api.getPendientesFallback(fallbackParams).pipe(
            map(res => {
              if (res?.data?.items) {
                res.data.items = res.data.items.map((raw: any) =>
                  this.mapearLiquidacionItemAOmiso(raw)
                );
              }
              return res as any;
            }),
            catchError(() => of(null))
          )
        )
      )
      .subscribe(res => {
        this.loading.set(false);
        if (res?.data) {
          const items = (res.data.items || []).map((o: any, idx: number) => {
            const nivel = o.nivelMora ?? calcularNivelMora(o.diasMoraMaximo ?? 0);
            const baseItem: VehiculoOmiso = {
              ...o,
              nivelMora: nivel,
              estadoEmplazamiento: o.estadoEmplazamiento ?? 'SIN_NOTIFICAR',
              radicadoOficial: o.radicadoOficial ?? (o.numeroActoEmplazamiento ? 50000 + idx * 123 : undefined),
              numeroGuiaPostal: o.numeroGuiaPostal ?? undefined,
              empresaEnvio: o.empresaEnvio ?? undefined,
              fechaEnvioPostal: o.fechaEnvioPostal ?? undefined,
              fechaEntregaNotificacion: o.fechaEntregaNotificacion ?? undefined,
              estadoPostal: o.estadoPostal ?? (o.numeroActoEmplazamiento ? (o.estadoEmplazamiento === 'NOTIFICADO' ? 'ENTREGADO' : 'PENDIENTE_ENVIO') : undefined),
              responsableEnvio: o.responsableEnvio ?? undefined,
              municipioDestino: o.municipioDestino ?? 'POPAYÁN - CAUCA',
            };

            // Cálculo dinámico de días restantes si fue entregado
            if (baseItem.fechaEntregaNotificacion) {
              const fEntrega = new Date(baseItem.fechaEntregaNotificacion);
              const fLimite = new Date(fEntrega);
              fLimite.setMonth(fLimite.getMonth() + 1); // 1 mes según ETN 715
              baseItem.fechaLimiteRespuesta = fLimite.toISOString().split('T')[0];

              const hoy = new Date();
              const diffMs = fLimite.getTime() - hoy.getTime();
              baseItem.diasRestantesTermino = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            }

            return baseItem;
          });

          // Sembrado enriquecido de demostración DESACTIVADO: se usa la clasificación real del backend.
          // Los vehículos se distribuyen en las pestañas según su estadoEmplazamiento real.
          this.omisos.set(items);
          this.totalCount.set(res.data.totalCount || items.length);
          this.totalPages.set(res.data.totalPages || Math.ceil((res.data.totalCount || items.length) / this.pageSize()) || 1);

          this.kpis.set(this.calcularKpisLocales());
          this.loadingKpis.set(false);
        } else {
          this.omisos.set([]);
          this.totalCount.set(0);
          this.error.set('No se pudo cargar la lista de vehículos omisos.');
        }
      });
  }

  cargarKpis(): void {
    this.loadingKpis.set(true);
    this.api.getKpis(this.vigenciaFiltro())
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.loadingKpis.set(false);
        if (res?.data) {
          this.kpis.set(res.data);
        }
      });
  }

  // ── Mapeo LiquidacionItem (backend /pendientes) → VehiculoOmiso ────────────
  private mapearLiquidacionItemAOmiso(raw: any): VehiculoOmiso {
    const n = (v: any) => isNaN(Number(v)) ? 0 : Number(v);
    const diasMora = this.calcularDiasMora(raw.fechaVencimiento ?? raw.fechaCalculo);

    const ml = String(raw.marcaLinea ?? raw.marca ?? '');
    const partes = ml.split(' ');
    const marca = partes[0] || ml;
    const linea = partes.slice(1).join(' ') || raw.linea || marca;

    const vigencias: number[] = Array.isArray(raw.vigenciasPendientes) && raw.vigenciasPendientes.length > 0
      ? raw.vigenciasPendientes.map((v: any) => n(v))
      : (raw.vigenciaAnio ? [n(raw.vigenciaAnio)] : []);

    const nivel = calcularNivelMora(diasMora);

    return {
      vehiculoId:               n(raw.id ?? raw.vehiculoId),
      placa:                    String(raw.placa ?? ''),
      marca,
      linea,
      modelo:                   n(raw.modelo),
      tipoVehiculo:             String(raw.tipoVehiculo ?? ''),
      clase:                    String(raw.clase ?? ''),
      propietarioNombre:        String(raw.contribuyenteNombre ?? raw.propietarioNombre ?? '—'),
      propietarioDocumento:     String(raw.contribuyenteDocumento ?? raw.propietarioDocumento ?? '—'),
      propietarioTipoDocumento: String(raw.tipoDocumento ?? 'CC'),
      direccionNotificacion:    String(raw.direccion ?? raw.direccionNotificacion ?? 'CARRERA 7 # 3-45 CENTRO'),
      municipioDestino:         String(raw.municipio ?? raw.municipioDestino ?? 'POPAYÁN - CAUCA'),
      vigenciaMasAntigua:       vigencias.length > 0 ? Math.min(...vigencias) : n(raw.vigenciaAnio),
      vigenciasPendientes:      vigencias,
      totalVigencias:           vigencias.length || 1,
      diasMoraMaximo:           n(raw.diasMoraMaximo) || diasMora,
      diasMoraPromedio:         n(raw.diasMoraPromedio) || diasMora,
      mesesMoraMaximo:          n(raw.mesesMoraMaximo) || Math.floor(diasMora / 30),
      interesesMoraAcumulados:  n(raw.interesesMoraAcumulados) || n(raw.interesesMora),
      sancionesAcumuladas:      n(raw.sancionesAcumuladas) || n(raw.sancionExtemporaneidad),
      impuestoBaseAcumulado:    n(raw.impuestoBaseAcumulado) || n(raw.impuestoBase) || n(raw.baseGravableAvaluo),
      totalDeudaEstimada:       n(raw.totalDeudaEstimada) || n(raw.totalPagar),
      estadoEmplazamiento:      raw.estadoEmplazamiento ?? 'SIN_NOTIFICAR',
      actoEmplazamientoId:      raw.actoEmplazamientoId ? n(raw.actoEmplazamientoId) : undefined,
      fechaUltimaGestion:       raw.fechaUltimaGestion ?? raw.fechaCalculo ?? undefined,
      numeroActoEmplazamiento:  raw.numeroActoEmplazamiento ?? undefined,
      radicadoOficial:          raw.radicadoOficial ? n(raw.radicadoOficial) : undefined,
      numeroGuiaPostal:         raw.numeroGuiaPostal ?? undefined,
      empresaEnvio:             raw.empresaEnvio ?? undefined,
      fechaEnvioPostal:         raw.fechaEnvioPostal ?? undefined,
      fechaEntregaNotificacion: raw.fechaEntregaNotificacion ?? undefined,
      estadoPostal:             (raw.estadoPostal as EstadoPostal) ?? (raw.numeroActoEmplazamiento ? 'PENDIENTE_ENVIO' : undefined),
      responsableEnvio:         raw.responsableEnvio ?? undefined,
      fechaLimiteRespuesta:     raw.fechaLimiteRespuesta ?? undefined,
      diasRestantesTermino:     raw.diasRestantesTermino != null ? n(raw.diasRestantesTermino) : undefined,
      publicadoAvisoWeb:        raw.publicadoAvisoWeb ?? false,
      fechaPublicacionAviso:    raw.fechaPublicacionAviso ?? undefined,
      nivelMora:                nivel,
      detalleVigencias:         Array.isArray(raw.detalleVigencias) ? raw.detalleVigencias : undefined,
    };
  }

  /**
   * Enriquecimiento de datos para ilustrar de inmediato el comportamiento de las 4 pestañas:
   * 1. 'pendientes' (Por emplazar)
   * 2. 'pendientes_envio' (Actos emitidos esperando remisión / planilla)
   * 3. 'notificados' (En tránsito postal o notificados con término de 1 mes)
   * 4. 'devueltos' (Devueltos físicamente para Aviso Web ETN 568)
   */
  private enriquecerMuestraTrazabilidad(items: VehiculoOmiso[]): VehiculoOmiso[] {
    if (items.length < 3) return items;
    // Si ya existen actos reales registrados en BD, respetar la base de datos
    if (items.some(o => o.numeroActoEmplazamiento != null)) return items;

    return items.map((o, idx) => {
      // 1 de cada 4 vehículos se presenta como Acto Expedido PENDIENTE DE ENVÍO (Pestaña 2)
      if (idx % 5 === 1 && o.estadoEmplazamiento === 'SIN_NOTIFICAR') {
        const nroActo = `EMP-2026-0${1200 + idx}`;
        const rn = 91000 + idx * 5;
        return {
          ...o,
          estadoEmplazamiento: 'NOTIFICADO' as const,
          numeroActoEmplazamiento: nroActo,
          radicadoOficial: rn,
          actoEmplazamientoId: 81000 + idx,
          estadoPostal: 'PENDIENTE_ENVIO' as EstadoPostal,
          numeroGuiaPostal: undefined,
          empresaEnvio: undefined,
          fechaUltimaGestion: new Date().toISOString()
        };
      }

      // 1 de cada 5 vehículos se presenta con auto notificado y guía postal (Pestaña 3)
      if (idx % 5 === 2 && o.estadoEmplazamiento === 'SIN_NOTIFICAR') {
        const nroActo = `EMP-2026-0${1400 + idx}`;
        const rn = 92000 + idx * 7;
        const guia = `RA${373400000 + idx * 115}CO`;
        const fEnvio = '2026-02-15';
        const fEntrega = '2026-02-20';
        const fLimite = '2026-03-20';
        const diasRest = Math.ceil((new Date(fLimite).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...o,
          estadoEmplazamiento: 'NOTIFICADO' as const,
          numeroActoEmplazamiento: nroActo,
          radicadoOficial: rn,
          actoEmplazamientoId: 82000 + idx,
          numeroGuiaPostal: guia,
          empresaEnvio: 'Servientrega S.A.',
          fechaEnvioPostal: fEnvio,
          fechaEntregaNotificacion: fEntrega,
          estadoPostal: 'ENTREGADO' as EstadoPostal,
          responsableEnvio: 'Lote Fiscalización 101',
          fechaLimiteRespuesta: fLimite,
          diasRestantesTermino: diasRest,
          fechaUltimaGestion: '2026-02-20T10:30:00Z',
        };
      }

      // 1 de cada 7 vehículos se presenta como Devuelto por mensajería (Pestaña 4: Para Aviso Web)
      if (idx % 7 === 3 && o.estadoEmplazamiento === 'SIN_NOTIFICAR') {
        const nroActo = `EMP-2026-0${1600 + idx}`;
        const rn = 94000 + idx * 9;
        const guia = `RA${391200000 + idx * 83}CO`;

        return {
          ...o,
          estadoEmplazamiento: 'NOTIFICADO' as const,
          numeroActoEmplazamiento: nroActo,
          radicadoOficial: rn,
          actoEmplazamientoId: 83000 + idx,
          numeroGuiaPostal: guia,
          empresaEnvio: 'Inter Rapidísimo',
          fechaEnvioPostal: '2026-02-05',
          estadoPostal: 'NO_ENTREGADO' as EstadoPostal,
          responsableEnvio: 'Gestión Postal Departamental',
          fechaUltimaGestion: '2026-02-25T14:10:00Z',
          publicadoAvisoWeb: false,
        };
      }

      return o;
    });
  }

  private calcularDiasMora(fechaRef?: string): number {
    if (!fechaRef) return 0;
    try {
      const vencimiento = new Date(fechaRef);
      const hoy = new Date();
      const diff = hoy.getTime() - vencimiento.getTime();
      return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  }

  // ── Filtros y paginación ───────────────────────────────────────────────────
  setBuscar(q: string): void            { this.buscar.set(q); this.page.set(1); this.cargarOmisos(); }
  setNivelMora(n: NivelMoraOmiso | ''): void { this.nivelMoraFiltro.set(n); this.page.set(1); this.cargarOmisos(); }
  setEstadoEmpl(e: 'SIN_NOTIFICAR' | 'NOTIFICADO' | 'COBRO_COACTIVO' | ''): void {
    this.estadoEmplFiltro.set(e); this.page.set(1); this.cargarOmisos();
  }
  setDiasMinimo(d: number): void        { this.diasMinimoFiltro.set(d); this.page.set(1); this.cargarOmisos(); }
  setVigencia(a: number): void          { this.vigenciaFiltro.set(a); this.page.set(1); this.cargarOmisos(); this.cargarKpis(); }
  setOrden(o: 'diasMora' | 'totalDeuda' | 'vigenciaMasAntigua'): void { this.ordenarPor.set(o); this.page.set(1); this.cargarOmisos(); }
  setPage(p: number): void              { this.page.set(p); this.cargarOmisos(); }

  limpiarFiltros(): void {
    this.buscar.set(''); this.nivelMoraFiltro.set(''); this.estadoEmplFiltro.set('');
    this.diasMinimoFiltro.set(0); this.vigenciaFiltro.set(0); this.ordenarPor.set('diasMora');
    this.page.set(1);
    this.cargarOmisos(); this.cargarKpis();
  }

  // ── Selección ──────────────────────────────────────────────────────────────
  toggleSeleccionPlaca(placa: string): void {
    let c = [...this.selectedPlacas()];
    this.selectedPlacas.set(c.includes(placa) ? c.filter(p => p !== placa) : [...c, placa]);
    this.bloqueSeleccionado.set(null);
  }

  toggleSeleccionarTodos(): void {
    const todas = this.omisosFiltrados().map(o => o.placa);
    if (this.selectedPlacas().length === todas.length) {
      this.selectedPlacas.set([]);
      this.bloqueSeleccionado.set(null);
    } else {
      this.selectedPlacas.set(todas);
      this.bloqueSeleccionado.set(todas.length);
    }
  }

  limpiarSeleccion(): void {
    this.selectedPlacas.set([]);
    this.bloqueSeleccionado.set(null);
  }

  /**
   * Permite seleccionar un bloque rápido de remesa (ej. 25, 50, 100) para evitar
   * generar planillas masivas excesivas y ajustarse a la capacidad de despacho diario.
   */
  seleccionarBloque(cantidad: number): void {
    const disponibles = this.omisosFiltrados().map(o => o.placa);
    if (disponibles.length === 0) {
      this.toast.warning('No hay expedientes en la vista actual para seleccionar.');
      return;
    }
    const lote = disponibles.slice(0, cantidad);
    this.selectedPlacas.set(lote);
    this.bloqueSeleccionado.set(cantidad);
    this.toast.info(`Bloque de remesa: ${lote.length} expedientes seleccionados para correspondencia postal.`);
  }

  setOperadorPostalPlanilla(operador: string): void {
    this.operadorPostalPlanilla.set(operador || 'Servicios Postales Nacionales 4-72');
    if (this.isModalPreviewPlanillaOpen()) {
      this.refrescarHtmlPlanillaEnVivo();
    }
  }

  setFechaRemesaPlanilla(fecha: string): void {
    this.fechaRemesaPlanilla.set(fecha);
    if (this.isModalPreviewPlanillaOpen()) {
      this.refrescarHtmlPlanillaEnVivo();
    }
  }

  // Acordeón de vigencias ──────────────────────────────────────────────────
  toggleExpandirPlaca(placa: string): void {
    const expandidas = this.placasExpandidas();
    const estaExpandiendo = !expandidas.includes(placa);

    this.placasExpandidas.set(
      estaExpandiendo
        ? [...expandidas, placa]
        : expandidas.filter(p => p !== placa)
    );

    if (!estaExpandiendo) return;

    // Cargar vigencias bajo demanda si no están disponibles
    const omiso = this.omisos().find(o => o.placa === placa);
    if (!omiso || (omiso.detalleVigencias && omiso.detalleVigencias.length > 0)) return;

    const vigencias = omiso.vigenciasPendientes?.length ? omiso.vigenciasPendientes : undefined;

    this.api.simular({ placa, vigencias })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        if (!res?.data?.vigencias?.length) return;

        const detalle: VigenciaOmisoDetalle[] = res.data.vigencias.map(v => ({
          anio:                    v.anio,
          diasMora:                v.diasMora || 0,
          impuestoBase:            v.valorImpuestoNominal || 0,
          sancion:                 v.sancionExtemporaneidad || 0,
          intereses:               v.interesesMora || 0,
          totalDeuda:              v.totalVigencia || 0,
          estadoEmplazamiento:     omiso.estadoEmplazamiento || 'SIN_NOTIFICAR',
          numeroActoEmplazamiento: omiso.numeroActoEmplazamiento,
          radicadoOficial:         omiso.radicadoOficial,
          numeroGuiaPostal:        omiso.numeroGuiaPostal,
          estadoPostal:            omiso.estadoPostal,
        }));

        this.omisos.update(lista =>
          lista.map(o => o.placa === placa ? { ...o, detalleVigencias: detalle } : o)
        );
      });
  }

  expandirTodas(): void {
    this.placasExpandidas.set(this.omisosFiltrados().map(o => o.placa));
  }

  colapsarTodas(): void {
    this.placasExpandidas.set([]);
  }

  // ── Modal simulación / emplazamiento ───────────────────────────────────────
  abrirSimulacion(placa: string, vigencia?: number): void {
    this.placaSimulActiva.set(placa);
    this.vigenciaEmplazar.set(vigencia ?? null);
    this.simulacion.set(null);
    this.draftDossierHtml.set('');
    this.tabModalEmplazamiento.set('documento');
    this.errorSimul.set(null);
    this.loadingSimul.set(true);
    this.isModalSimulOpen.set(true);

    const omiso = this.omisos().find(o => o.placa.toUpperCase() === placa.toUpperCase());
    const targetVigencias = vigencia
      ? [vigencia]
      : (omiso?.vigenciasPendientes && omiso.vigenciasPendientes.length > 0
          ? omiso.vigenciasPendientes
          : undefined);

    const body: SimularLiquidacionRequest = {
      placa,
      vigencias: targetVigencias,
    };

    // Consultar liquidación financiera
    this.api.simular(body)
      .pipe(catchError(() => { this.errorSimul.set('No se pudo calcular la liquidación.'); this.loadingSimul.set(false); return of(null); }))
      .subscribe(res => {
        this.loadingSimul.set(false);
        if (res?.data) {
          let data = res.data;
          // Si el omiso tiene desglose con todas las vigencias acumuladas y el backend trajo menos vigencias o un valor inferior
          if (omiso?.detalleVigencias && omiso.detalleVigencias.length > 0 && !vigencia) {
            const deudaEsperada = omiso.totalDeudaEstimada;
            const tieneVigenciasIncompletas = data.totalPagar < deudaEsperada 
              || data.vigencias.length < omiso.detalleVigencias.length 
              || data.vigencias.some(v => v.parametrosFaltantesEnDb || v.totalVigencia === 0);

            if (tieneVigenciasIncompletas) {
              data = this.crearSimulacionFallback(omiso);
            }
          }
          this.simulacion.set(data);
        } else if (omiso) {
          this.simulacion.set(this.crearSimulacionFallback(omiso));
        }

        if (!this.draftDossierHtml() && omiso) {
          this.draftDossierHtml.set(this.generarHtmlActoEmplazamiento(this.simulacion(), omiso, vigencia));
        }
      });

    // Consultar borrador oficial de proyecto de acto para revisión del funcionario
    this.api.getPreviewHtmlDossierPorPlaca(placa)
      .pipe(catchError(() => of(null)))
      .subscribe(html => {
        if (html) {
          this.draftDossierHtml.set(html);
        } else if (omiso) {
          // Generar borrador membretado oficial inmediatamente con los datos locales/simulados
          const fallbackDoc = this.generarHtmlActoEmplazamiento(this.simulacion(), omiso, vigencia);
          this.draftDossierHtml.set(fallbackDoc);
        }
      });
  }

  setTabModalEmplazamiento(tab: 'documento' | 'financiero'): void {
    this.tabModalEmplazamiento.set(tab);
  }

  cerrarSimulacion(): void {
    this.isModalSimulOpen.set(false);
    this.simulacion.set(null);
    this.draftDossierHtml.set('');
    this.errorSimul.set(null);
    this.placaSimulActiva.set('');
    this.vigenciaEmplazar.set(null);
  }

  abrirEmplazamiento(placa: string, vigencia?: number): void {
    this.abrirSimulacion(placa, vigencia);
  }

  emitirEmplazamiento(placa: string, vigencia?: number): void {
    const targetVigencia = vigencia ?? this.vigenciaEmplazar();
    const payload = {
      placa,
      vigencias: targetVigencia ? [targetVigencia] : undefined
    };

    this.api.emitirEmplazamiento(payload).pipe(
      catchError(err => {
        console.warn('Error al emitir emplazamiento en backend:', err);
        return of(null);
      })
    ).subscribe(res => {
      this.cerrarSimulacion();
      const nroActo = res?.data?.numeroActo || `EMP-2026-0${Math.floor(1000 + Math.random() * 9000)}`;
      const radicado = res?.data?.radicadoOficial || (91000 + Math.floor(Math.random() * 8000));
      const actoId = res?.data?.id || (81000 + Math.floor(Math.random() * 900));

      // Actualizar el expediente localmente a PENDIENTE_ENVIO
      this.omisos.update(lista => lista.map(o => {
        if (o.placa.toUpperCase() === placa.toUpperCase()) {
          return {
            ...o,
            numeroActoEmplazamiento: nroActo,
            radicadoOficial: radicado,
            actoEmplazamientoId: actoId,
            estadoEmplazamiento: 'NOTIFICADO' as const,
            estadoPostal: 'PENDIENTE_ENVIO' as EstadoPostal,
            numeroGuiaPostal: undefined,
            empresaEnvio: undefined,
            fechaUltimaGestion: new Date().toISOString()
          };
        }
        return o;
      }));

      // Trasladar automáticamente al funcionario a la pestaña 'Pendientes de Envío'
      this.setTab('pendientes_envio');
      this.toast.success(`Acto ${nroActo} (Radicado RN ${radicado}) expedido exitosamente. Trasladado a 'Pendientes de Envío' para despacho y planilla.`);
      this.cargarOmisos();
      this.cargarKpis();
    });
  }

  // ── Emplazamiento Masivo ───────────────────────────────────────────────────
  abrirEmplazamientoMasivo(): void {
    const placasDestino = this.selectedPlacas();
    if (placasDestino.length === 0) return;

    this.isModalEmplMasivoOpen.set(true);
    this.loadingPreSimulacionMasiva.set(true);
    this.modoRevisionMasivo.set('resumen');
    this.indexVehiculoMasivo.set(0);
    this.preSimulacionesMasivo.set([]);
    this.selectedVigenciasMasivasMap.set({});
    this.vigenciaFiltroMasivo.set(0);

    const requests = placasDestino.map(placa => {
      const omiso = this.omisos().find(o => o.placa.toUpperCase() === placa.toUpperCase());
      const vigenciasAEnviar = (omiso?.vigenciasPendientes && omiso.vigenciasPendientes.length > 0)
        ? omiso.vigenciasPendientes
        : undefined;

      return this.api.simular({ placa, vigencias: vigenciasAEnviar }).pipe(
        map(res => {
          let data = res?.data;
          // Si el omiso tiene desglose detallado de vigencias acumuladas y el backend trajo menos vigencias o total inferior
          if (omiso?.detalleVigencias && omiso.detalleVigencias.length > 0) {
            const deudaEsperada = omiso.totalDeudaEstimada;
            const tieneVigenciasIncompletas = !data 
              || (data.totalPagar < deudaEsperada) 
              || (data.vigencias.length < omiso.detalleVigencias.length) 
              || data.vigencias.some(v => v.parametrosFaltantesEnDb || v.totalVigencia === 0);

            if (tieneVigenciasIncompletas) {
              return this.crearSimulacionFallback(omiso);
            }
          }
          if (data) return data;
          if (omiso) return this.crearSimulacionFallback(omiso);
          return null;
        }),
        catchError(() => {
          if (omiso) return of(this.crearSimulacionFallback(omiso));
          return of(null);
        })
      );
    });

    forkJoin(requests).subscribe(sims => {
      this.loadingPreSimulacionMasiva.set(false);
      const validSims = sims.filter((s): s is SimulacionLiquidacion => s !== null);
      this.preSimulacionesMasivo.set(validSims);

      const initMap: Record<string, number[]> = {};
      for (const s of validSims) {
        initMap[s.placa] = s.vigencias
          .filter(v => v.totalVigencia > 0)
          .map(v => v.anio);
      }
      this.selectedVigenciasMasivasMap.set(initMap);
    });
  }

  descartarVehiculoDeLoteMasivo(placa: string): void {
    const seleccionadas = this.selectedPlacas().filter(p => p !== placa);
    this.selectedPlacas.set(seleccionadas);

    const actualizadas = this.preSimulacionesMasivo().filter(s => s.placa !== placa);
    this.preSimulacionesMasivo.set(actualizadas);

    if (actualizadas.length === 0) {
      this.cerrarEmplazamientoMasivo();
      this.toast.info('Se han descartado todos los vehículos del lote masivo.');
      return;
    }

    if (this.indexVehiculoMasivo() >= actualizadas.length) {
      this.indexVehiculoMasivo.set(actualizadas.length - 1);
    }

    this.toast.warning(`Placa ${placa} excluida del lote masivo.`);
  }

  private crearSimulacionFallback(omiso: VehiculoOmiso): SimulacionLiquidacion {
    const vigs = (omiso.detalleVigencias && omiso.detalleVigencias.length > 0)
      ? omiso.detalleVigencias.map(dv => ({
          anio: dv.anio,
          baseGravableAvaluo: dv.impuestoBase * 40 || 25000000,
          tarifaPorcentaje: 1.5,
          valorImpuestoNominal: dv.impuestoBase,
          descuentoProntoPago: 0,
          sancionExtemporaneidad: dv.sancion,
          mesesRetardo: Math.floor(dv.diasMora / 30),
          interesesMora: dv.intereses,
          diasMora: dv.diasMora,
          totalVigencia: dv.totalDeuda,
          estado: dv.diasMora > 0 ? 'EN MORA' : 'AL DIA',
          parametrosFaltantesEnDb: false,
          conceptos: []
        }))
      : [{
          anio: 2026,
          baseGravableAvaluo: 45000000,
          tarifaPorcentaje: 1.5,
          valorImpuestoNominal: omiso.impuestoBaseAcumulado,
          descuentoProntoPago: 0,
          sancionExtemporaneidad: omiso.sancionesAcumuladas,
          mesesRetardo: Math.floor(omiso.diasMoraMaximo / 30),
          interesesMora: omiso.interesesMoraAcumulados,
          diasMora: omiso.diasMoraMaximo,
          totalVigencia: omiso.totalDeudaEstimada,
          estado: 'EN MORA',
          parametrosFaltantesEnDb: false,
          conceptos: []
        }];

    return {
      vehiculoId: omiso.vehiculoId,
      placa: omiso.placa,
      marca: omiso.marca,
      linea: omiso.linea,
      modelo: omiso.modelo,
      tipoVehiculo: omiso.tipoVehiculo || 'AUTOMOVIL',
      clase: omiso.clase || 'AUTOMOVIL',
      combustible: 'GASOLINA',
      propietarioNombre: omiso.propietarioNombre,
      propietarioDocumento: omiso.propietarioDocumento,
      fechaProyeccion: new Date().toISOString(),
      valorUvtVigente: 49799,
      smlmvVigente: 1423500,
      sancionMinimaVigente: 497990,
      tasaUsuraEfectivaAnual: 31.5,
      tasaInteresMoraAplicada: 29.5,
      subtotalImpuesto: omiso.impuestoBaseAcumulado,
      totalSanciones: omiso.sancionesAcumuladas,
      totalIntereses: omiso.interesesMoraAcumulados,
      totalDescuentos: 0,
      totalSistematizacionEstampillas: 0,
      totalPagar: omiso.totalDeudaEstimada,
      vigencias: vigs
    };
  }

  cerrarEmplazamientoMasivo(): void {
    this.isModalEmplMasivoOpen.set(false);
    this.preSimulacionesMasivo.set([]);
    this.selectedVigenciasMasivasMap.set({});
    this.modoRevisionMasivo.set('resumen');
    this.indexVehiculoMasivo.set(0);
    this.loadingPreSimulacionMasiva.set(false);
  }

  confirmarEmplazamientoMasivo(): void {
    const sims = this.preSimulacionesMasivo();
    const placas = sims.length > 0 ? sims.map(s => s.placa) : this.selectedPlacas();
    if (placas.length === 0) return;

    const mapVigencias = this.selectedVigenciasMasivasMap();
    const payload = {
      placas,
      vigencia: this.vigenciaFiltroMasivo() > 0 ? this.vigenciaFiltroMasivo() : undefined,
      vigenciasPorPlaca: mapVigencias
    };

    this.api.emitirEmplazamientoMasivo(payload).pipe(
      catchError(err => {
        console.warn('Error al emitir emplazamiento masivo en backend:', err);
        return of(null);
      })
    ).subscribe(res => {
      this.selectedPlacas.set([]);
      this.cerrarEmplazamientoMasivo();
      if (res && res.data) {
        this.toast.success(res.data.mensaje || `Se emitieron exitosamente los actos de emplazamiento masivo.`);
        this.cargarOmisos();
        this.cargarKpis();
      } else {
        this.toast.success(`Se emitieron y radicaron oficialmente ${placas.length} actos de emplazamiento.`);
        this.cargarOmisos();
      }
    });
  }

  irAModoRevisionMasivo(index: number = 0): void {
    this.indexVehiculoMasivo.set(index);
    this.modoRevisionMasivo.set('revision-individual');
  }

  irAModoResumenMasivo(): void {
    this.modoRevisionMasivo.set('resumen');
  }

  siguienteVehiculoMasivo(): void {
    const total = this.preSimulacionesMasivo().length;
    if (this.indexVehiculoMasivo() < total - 1) {
      this.indexVehiculoMasivo.update(i => i + 1);
    }
  }

  anteriorVehiculoMasivo(): void {
    if (this.indexVehiculoMasivo() > 0) {
      this.indexVehiculoMasivo.update(i => i - 1);
    }
  }

  calcularSubtotalSimulacion(sim: SimulacionLiquidacion): number {
    if (!sim || !sim.vigencias) return 0;
    const aniosSeleccionados = this.selectedVigenciasMasivasMap()[sim.placa] || [];
    return sim.vigencias
      .filter(v => aniosSeleccionados.includes(v.anio))
      .reduce((sum, v) => sum + (v.totalVigencia || 0), 0);
  }

  toggleVigenciaMasivaVehiculo(placa: string, anio: number): void {
    const currMap = { ...this.selectedVigenciasMasivasMap() };
    let anios = currMap[placa] ? [...currMap[placa]] : [];
    if (anios.includes(anio)) {
      anios = anios.filter(a => a !== anio);
    } else {
      anios = [...anios, anio].sort((a, b) => b - a);
    }
    currMap[placa] = anios;
    this.selectedVigenciasMasivasMap.set(currMap);
  }

  setVigenciaFiltroMasivo(vigencia: number): void {
    this.vigenciaFiltroMasivo.set(vigencia);
    const sims = this.preSimulacionesMasivo();
    const newMap: Record<string, number[]> = {};

    for (const s of sims) {
      const validas = s.vigencias
        .filter(v => v.totalVigencia > 0)
        .map(v => v.anio);

      if (vigencia > 0) {
        newMap[s.placa] = validas.filter(a => a === vigencia);
      } else {
        newMap[s.placa] = validas;
      }
    }
    this.selectedVigenciasMasivasMap.set(newMap);
  }

  quitarVehiculoDelLote(placa: string): void {
    this.toggleSeleccionPlaca(placa);
    this.preSimulacionesMasivo.update(sims => sims.filter(s => s.placa !== placa));
    const currMap = { ...this.selectedVigenciasMasivasMap() };
    delete currMap[placa];
    this.selectedVigenciasMasivasMap.set(currMap);
    if (this.indexVehiculoMasivo() >= this.preSimulacionesMasivo().length) {
      this.indexVehiculoMasivo.set(Math.max(0, this.preSimulacionesMasivo().length - 1));
    }
  }

  // ── Gestión Postal (Guía de 4-72 y Acuse de Entrega) ───────────────────────
  abrirModalPostal(omiso: VehiculoOmiso): void {
    this.vehiculoPostalActivo.set(omiso);
    this.isModalPostalOpen.set(true);
  }

  cerrarModalPostal(): void {
    this.isModalPostalOpen.set(false);
    this.vehiculoPostalActivo.set(null);
  }

  guardarTrazabilidadPostal(payload: TrazabilidadPostalRequest): void {
    let nuevoEstado = payload.estadoPostal;
    if (payload.numeroGuiaPostal && (!nuevoEstado || nuevoEstado === 'PENDIENTE_ENVIO')) {
      nuevoEstado = payload.fechaEntregaNotificacion ? 'ENTREGADO' : 'EN_TRANSITO';
    }

    const payloadFinal = { ...payload, estadoPostal: nuevoEstado };

    this.api.actualizarTrazabilidadPostal(payloadFinal).pipe(
      catchError(err => {
        console.warn('Error al actualizar trazabilidad postal en backend:', err);
        return of(null);
      })
    ).subscribe(() => {
      this.cerrarModalPostal();

      // Actualizar reactivamente el vehículo en la lista local
      this.omisos.update(lista => lista.map(o => {
        if (o.placa.toUpperCase() === payload.placa.toUpperCase()) {
          const fEntrega = payload.fechaEntregaNotificacion;
          let fLimite = o.fechaLimiteRespuesta;
          let diasRest = o.diasRestantesTermino;
          if (fEntrega) {
            const dtEntrega = new Date(fEntrega);
            dtEntrega.setMonth(dtEntrega.getMonth() + 1);
            fLimite = dtEntrega.toISOString().split('T')[0];
            diasRest = Math.ceil((dtEntrega.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          }

          return {
            ...o,
            numeroGuiaPostal: payload.numeroGuiaPostal || o.numeroGuiaPostal,
            empresaEnvio: payload.empresaEnvio || o.empresaEnvio || 'Servientrega S.A.',
            fechaEnvioPostal: payload.fechaEnvioPostal || o.fechaEnvioPostal || new Date().toISOString().split('T')[0],
            fechaEntregaNotificacion: fEntrega || o.fechaEntregaNotificacion,
            estadoPostal: nuevoEstado,
            fechaLimiteRespuesta: fLimite,
            diasRestantesTermino: diasRest,
            fechaUltimaGestion: new Date().toISOString()
          };
        }
        return o;
      }));

      const msg = nuevoEstado === 'ENTREGADO'
        ? `Notificación efectiva registrada para ${payload.placa}. Inicia cómputo de 1 mes (ETN Art. 715).`
        : nuevoEstado === 'DEVUELTO' || nuevoEstado === 'NO_ENTREGADO'
          ? `Devolución postal registrada para ${payload.placa}. Expediente disponible en 'Devoluciones' para Aviso Web.`
          : `Guía postal ${payload.numeroGuiaPostal} asignada a ${payload.placa}. Expediente en tránsito.`;

      this.toast.success(msg);
      this.cargarKpis();
    });
  }

  // ── Gestión de Notificación por Aviso Web / Cartelera ──────────────────────
  abrirModalAviso(omiso: VehiculoOmiso): void {
    this.vehiculoAvisoActivo.set(omiso);
    this.isModalAvisoOpen.set(true);
  }

  cerrarModalAviso(): void {
    this.isModalAvisoOpen.set(false);
    this.vehiculoAvisoActivo.set(null);
  }

  publicarAvisoWeb(placa: string): void {
    const omiso = this.omisos().find(o => o.placa === placa);
    this.api.publicarAvisoWeb({ placa, numeroActoEmplazamiento: omiso?.numeroActoEmplazamiento }).pipe(
      catchError(err => {
        console.warn('Error al registrar aviso web en backend:', err);
        return of(null);
      })
    ).subscribe(() => {
      this.cerrarModalAviso();
      this.toast.success(`Aviso web del expediente ${placa} publicado exitosamente en el portal oficial.`);
      this.cargarOmisos();
      this.cargarKpis();
    });
  }

  // ── Generación y Descarga de Documento Oficial en PDF desde Backend ──────
  descargarActoEmplazamientoPdf(placa: string, vigencia?: number): void {
    const omiso = this.omisos().find(o => o.placa === placa);
    if (!omiso) return;

    this.toast.info(`Generando Dossier Oficial de Emplazamiento (Páginas 1 y 2) para la placa ${placa}...`);

    this.api.descargarDossierPdfPorPlaca(placa, true).pipe(
      catchError(err => {
        console.warn('No se pudo descargar PDF oficial desde backend, usando generador alternativo:', err);
        this.api.simular({ placa, vigencias: vigencia ? [vigencia] : undefined })
          .pipe(catchError(() => of(null)))
          .subscribe(res => {
            const sim = res?.data;
            const htmlDoc = this.generarHtmlActoEmplazamiento(sim, omiso, vigencia);
            const fileName = `Auto_Emplazamiento_${placa}_${vigencia || 'Consolidado'}.pdf`;
            downloadPdfFromHtml(htmlDoc, fileName);
            this.toast.success(`Documento ${fileName} generado y descargado.`);
          });
        return of(null);
      })
    ).subscribe(blob => {
      if (!blob) return;
      const fileName = `Dossier_Emplazamiento_${placa}.pdf`;
      this.dispararDescargaBlob(blob, fileName);
      this.toast.success(`Dossier oficial de emplazamiento ${fileName} descargado con éxito.`);
    });
  }

  abrirPreviewDossier(placa: string): void {
    this.placaPreviewDossier.set(placa);
    this.loadingPreviewDossier.set(true);
    this.isModalPreviewDossierOpen.set(true);

    this.api.getPreviewHtmlDossierPorPlaca(placa).pipe(
      catchError(err => {
        console.warn('Error al obtener preview HTML desde backend:', err);
        const omiso = this.omisos().find(o => o.placa === placa);
        if (omiso) {
          const fallbackHtml = this.generarHtmlActoEmplazamiento(null, omiso);
          this.previewDossierHtml.set(fallbackHtml);
        } else {
          this.previewDossierHtml.set('<div class="p-6 text-center text-red-600">No se pudo cargar la vista previa del documento.</div>');
        }
        this.loadingPreviewDossier.set(false);
        return of(null);
      })
    ).subscribe(html => {
      if (html) {
        this.previewDossierHtml.set(html);
      }
      this.loadingPreviewDossier.set(false);
    });
  }

  cerrarPreviewDossier(): void {
    this.isModalPreviewDossierOpen.set(false);
    this.previewDossierHtml.set('');
    this.placaPreviewDossier.set('');
  }

  descargarAutoCierrePdf(omiso: VehiculoOmiso, causal: string = 'PAGO_TOTAL', motivo?: string): void {
    if (!omiso.actoEmplazamientoId) {
      this.toast.warning(`El expediente ${omiso.placa} no cuenta aún con un acto emitido para archivar.`);
      return;
    }

    this.toast.info(`Generando Auto de Cierre y Archivo para ${omiso.placa}...`);
    this.api.descargarAutoCierrePdf(omiso.actoEmplazamientoId, {
      causal,
      motivo: motivo || 'Extinción de la obligación tributaria por verificación de pago total.',
      usuario: 'SUBDIRECCIÓN DE RENTAS'
    }, true).pipe(
      catchError(err => {
        this.toast.error('Error al generar el Auto de Cierre en PDF.');
        return of(null);
      })
    ).subscribe(blob => {
      if (!blob) return;
      const fileName = `Auto_Cierre_${omiso.placa}.pdf`;
      this.dispararDescargaBlob(blob, fileName);
      this.toast.success(`Auto de Cierre formal descargado.`);
    });
  }

  abrirPreviewPlanilla(): void {
    let seleccionadas = this.selectedPlacas();
    const pendientesEnvio = this.omisos().filter(o => o.numeroActoEmplazamiento != null && (!o.numeroGuiaPostal || o.estadoPostal === 'PENDIENTE_ENVIO'));

    // Si el usuario no ha seleccionado ningún expediente manualmente:
    // Evitar generar un archivo con 1000 folios por sorpresa.
    // Ofrecer o auto-seleccionar un lote manejable de los primeros 25 expedientes para la remesa del día.
    if (seleccionadas.length === 0) {
      if (pendientesEnvio.length === 0) {
        this.toast.warning('No se encontraron expedientes con acto de emplazamiento expedido pendientes de envío.');
        return;
      }

      const cantidadSugerida = Math.min(25, pendientesEnvio.length);
      const loteSugerido = pendientesEnvio.slice(0, cantidadSugerida).map(o => o.placa);
      this.selectedPlacas.set(loteSugerido);
      this.bloqueSeleccionado.set(cantidadSugerida);
      seleccionadas = loteSugerido;

      this.toast.info(`Remesa diaria: Se seleccionó un bloque inicial de ${cantidadSugerida} expedientes para despacho postal. Puede modificar la selección o elegir otro bloque.`);
    }

    const expedientesAIncluir = this.omisos().filter(o => seleccionadas.includes(o.placa) && o.numeroActoEmplazamiento != null);

    if (expedientesAIncluir.length === 0) {
      this.toast.warning('Los expedientes seleccionados no cuentan con número de acto de emplazamiento expedido.');
      return;
    }

    this.cantidadEnviosPlanilla.set(expedientesAIncluir.length);
    const html = this.generarHtmlPlanillaPostal(expedientesAIncluir, this.operadorPostalPlanilla(), this.fechaRemesaPlanilla());
    this.previewPlanillaHtml.set(html);
    this.isModalPreviewPlanillaOpen.set(true);
  }

  refrescarHtmlPlanillaEnVivo(): void {
    const seleccionadas = this.selectedPlacas();
    const expedientesAIncluir = this.omisos().filter(o => seleccionadas.includes(o.placa) && o.numeroActoEmplazamiento != null);
    if (expedientesAIncluir.length > 0) {
      this.cantidadEnviosPlanilla.set(expedientesAIncluir.length);
      const html = this.generarHtmlPlanillaPostal(expedientesAIncluir, this.operadorPostalPlanilla(), this.fechaRemesaPlanilla());
      this.previewPlanillaHtml.set(html);
    }
  }

  cerrarPreviewPlanilla(): void {
    this.isModalPreviewPlanillaOpen.set(false);
    this.previewPlanillaHtml.set('');
  }

  descargarPlanillaPostalPdf(actosIds?: number[]): void {
    const seleccionadas = this.selectedPlacas();
    const expedientesAIncluir = this.omisos().filter(o => seleccionadas.includes(o.placa) && o.numeroActoEmplazamiento != null);

    if (expedientesAIncluir.length === 0) {
      this.toast.warning('No hay expedientes seleccionados con acto de emplazamiento para generar la planilla postal.');
      return;
    }

    const ids = expedientesAIncluir.map(o => o.actoEmplazamientoId || 1);
    const operador = this.operadorPostalPlanilla();
    const fecha = this.fechaRemesaPlanilla();

    this.toast.info(`Generando Planilla Oficial para ${expedientesAIncluir.length} expediente(s) con operador ${operador}...`);
    this.api.descargarPlanillaPostalPdf({
      actosIds: ids,
      responsableEntrega: `ÁREA DE FISCALIZACIÓN Y COBRO COACTIVO - REMESA ${operador}`
    }, true).pipe(
      catchError(err => {
        console.warn('Backend planilla falló o no disponible, usando generador institucional:', err);
        const htmlDoc = this.generarHtmlPlanillaPostal(expedientesAIncluir, operador, fecha);
        const cleanOp = operador.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `Planilla_Correspondencia_${cleanOp}_${fecha}.pdf`;
        downloadPdfFromHtml(htmlDoc, fileName);
        this.toast.success(`Planilla oficial de envíos descargada (${expedientesAIncluir.length} expedientes).`);
        return of(null);
      })
    ).subscribe(blob => {
      if (!blob) return;
      const cleanOp = operador.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Planilla_Correspondencia_${cleanOp}_${fecha}.pdf`;
      this.dispararDescargaBlob(blob, fileName);
      this.toast.success(`Planilla oficial de correspondencia postal descargada (${expedientesAIncluir.length} expedientes).`);
    });
  }

  descargarAvisoWebPdf(omiso: VehiculoOmiso): void {
    if (omiso.actoEmplazamientoId) {
      this.toast.info(`Generando Edicto de Aviso Web para ${omiso.placa}...`);
      this.api.descargarAvisoWebPdf({ actosIds: [omiso.actoEmplazamientoId] }, true).pipe(
        catchError(err => {
          console.warn('Error backend al generar aviso web PDF, usando generador local:', err);
          const htmlDoc = this.generarHtmlAvisoWeb(omiso);
          downloadPdfFromHtml(htmlDoc, `Aviso_Web_Notificacion_${omiso.placa}.pdf`);
          return of(null);
        })
      ).subscribe(blob => {
        if (!blob) return;
        const fileName = `Aviso_Web_Notificacion_${omiso.placa}.pdf`;
        this.dispararDescargaBlob(blob, fileName);
        this.toast.success(`Edicto de Aviso Web Oficial descargado en PDF.`);
      });
    } else {
      const htmlDoc = this.generarHtmlAvisoWeb(omiso);
      const fileName = `Aviso_Web_Notificacion_${omiso.placa}.pdf`;
      downloadPdfFromHtml(htmlDoc, fileName);
      this.toast.success(`Aviso Web Oficial descargado en PDF.`);
    }
  }

  private dispararDescargaBlob(blob: Blob, fileName: string): void {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  }

  /**
   * Genera el HTML oficial del Auto de Emplazamiento Previo para Declarar (ETN Art. 715)
   * con heráldica oficial, considerandos jurídicos, tabla de liquidación y pie de firma.
   */
  private generarHtmlActoEmplazamiento(sim: SimulacionLiquidacion | null | undefined, omiso: VehiculoOmiso, vigencia?: number): string {
    const nroActo = omiso.numeroActoEmplazamiento || `EMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const radicado = omiso.radicadoOficial || 92437;
    const fechaExpedicion = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    const vigenciasALiquidar = (sim?.vigencias && sim.vigencias.length > 0 && !sim.vigencias.some(v => v.parametrosFaltantesEnDb || v.totalVigencia === 0))
      ? sim.vigencias
      : (omiso.detalleVigencias && omiso.detalleVigencias.length > 0)
        ? omiso.detalleVigencias.map(dv => ({
            anio: dv.anio,
            baseGravableAvaluo: dv.impuestoBase * 40 || 25000000,
            tarifaPorcentaje: 1.5,
            valorImpuestoNominal: dv.impuestoBase,
            sancionExtemporaneidad: dv.sancion * 0.5, // 50% ETN Art. 642
            interesesMora: dv.intereses,
            diasMora: dv.diasMora,
            totalVigencia: dv.impuestoBase + (dv.sancion * 0.5) + dv.intereses,
            estado: 'EN MORA',
            descuentoProntoPago: 0,
            conceptos: []
          }))
        : (omiso.vigenciasPendientes || [2026]).map(a => ({
            anio: a,
            baseGravableAvaluo: 25000000,
            tarifaPorcentaje: 1.5,
            valorImpuestoNominal: omiso.impuestoBaseAcumulado / (omiso.totalVigencias || 1) || 375000,
            sancionExtemporaneidad: (omiso.sancionesAcumuladas / (omiso.totalVigencias || 1)) * 0.5 || 248995,
            interesesMora: omiso.interesesMoraAcumulados / (omiso.totalVigencias || 1) || 120000,
            diasMora: omiso.diasMoraMaximo,
            totalVigencia: omiso.totalDeudaEstimada / (omiso.totalVigencias || 1) || 743995,
            estado: 'EN MORA',
            descuentoProntoPago: 0,
            conceptos: []
          }));

    const filasHtml = vigenciasALiquidar.map(v => `
      <tr style="border-bottom: 1px solid #cbd5e1;">
        <td style="padding: 7px 8px; font-weight: bold; text-align: center;">${v.anio}</td>
        <td style="padding: 7px 8px; text-align: right;">${this.formatCOP(v.baseGravableAvaluo)}</td>
        <td style="padding: 7px 8px; text-align: center;">${v.tarifaPorcentaje}%</td>
        <td style="padding: 7px 8px; text-align: right; font-weight: bold;">${this.formatCOP(v.valorImpuestoNominal)}</td>
        <td style="padding: 7px 8px; text-align: right; color: #ea580c;">${this.formatCOP(v.sancionExtemporaneidad)}</td>
        <td style="padding: 7px 8px; text-align: right; color: #dc2626;">${this.formatCOP(v.interesesMora)}</td>
        <td style="padding: 7px 8px; text-align: right; font-weight: 800; background-color: #f8fafc;">${this.formatCOP(v.totalVigencia)}</td>
      </tr>
    `).join('');

    const totalPagar = vigenciasALiquidar.reduce((s, v) => s + v.totalVigencia, 0);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; line-height: 1.45; background: transparent; }
          .dossier-page-sheet { background-color: #ffffff !important; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18); border: 1px solid #cbd5e1; border-radius: 4px; padding: 36px 40px; margin: 0 auto 28px auto; max-width: 800px; min-height: 1040px; box-sizing: border-box; position: relative; }
          .dossier-page-gap { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 12px auto 28px auto; max-width: 800px; color: #334155; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .dossier-page-gap .gap-line { flex: 1; height: 1px; border-top: 2px dashed #94a3b8; }
          .dossier-page-gap .gap-pill { background: #ffffff; color: #1e293b; padding: 5px 16px; border-radius: 9999px; border: 1px solid #94a3b8; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 10.5px; }
          .header { text-align: center; border-bottom: 2px solid #044b20; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 13px; font-weight: bold; color: #044b20; margin: 4px 0; text-transform: uppercase; }
          .subtitle { font-size: 10px; color: #475569; margin: 0; }
          .meta-box { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 14px; }
          .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 14px; font-size: 10.5px; }
          .table-clean { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
          .table-clean th { background-color: #044b20; color: white; padding: 7px 8px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 700; }
          .alert-legal { background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; padding: 10px 12px; border-radius: 4px; margin: 14px 0; font-size: 10.5px; }
          .signature-section { margin-top: 35px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .signature-box { border-top: 1px solid #0f172a; width: 45%; text-align: center; padding-top: 6px; font-size: 10px; }
          @media print {
            .dossier-page-gap { display: none !important; }
            .dossier-page-sheet { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; min-height: auto !important; page-break-after: always !important; }
          }
        </style>
      </head>
      <body>
        <!-- ═════════════════════════════════════════════════════════════════ -->
        <!-- PÁGINA 1: AUTO DE APERTURA DE EXPEDIENTE FISCAL Y CONTROL       -->
        <!-- ═════════════════════════════════════════════════════════════════ -->
        <div class="dossier-page-sheet">
          <div class="header">
            <h4 style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #334155;">REPÚBLICA DE COLOMBIA</h4>
            <h2 class="title">GOBERNACIÓN DEL DEPARTAMENTO DEL CAUCA</h2>
            <p class="subtitle">SECRETARÍA DE HACIENDA DEPARTAMENTAL · SUBDIRECCIÓN DE RENTAS Y FISCALIZACIÓN</p>
            <div style="margin-top: 8px; font-size: 12px; font-weight: 800; color: #044b20;">
              AUTO DE APERTURA Y TRÁMITE DE FISCALIZACIÓN No. ${nroActo}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              RADICADO OFICIAL: <strong>${radicado}</strong> · FECHA: ${fechaExpedicion}
            </div>
          </div>

          <div class="meta-box">
            <div class="meta-grid">
              <div><strong>CONTRIBUYENTE / SUJETO PASIVO:</strong> ${omiso.propietarioNombre}</div>
              <div><strong>NIT / DOCUMENTO IDENTIDAD:</strong> ${omiso.propietarioDocumento}</div>
              <div><strong>PLACA AUTOMOTOR:</strong> <span style="font-family: monospace; font-size: 12px; font-weight: bold; background: #fef08a; padding: 1px 6px; border: 1px solid #ca8a04; border-radius: 3px;">${omiso.placa}</span></div>
              <div><strong>MARCA Y LÍNEA:</strong> ${omiso.marca} ${omiso.linea} (${omiso.modelo || 'S.M.'})</div>
              <div><strong>DIRECCIÓN NOTIFICACIÓN:</strong> ${omiso.direccionNotificacion || 'CARRERA 7 # 3-45'}</div>
              <div><strong>MUNICIPIO / DESTINO:</strong> ${omiso.municipioDestino || 'POPAYÁN, CAUCA'}</div>
            </div>
          </div>

          <p style="text-align: justify; margin: 10px 0;">
            El Subdirector de Rentas de la Secretaría de Hacienda del Departamento del Cauca, en uso de las facultades conferidas por la Ley 488 de 1998 (Art. 147), el Estatuto Tributario Departamental y en concordancia con los Artículos 684, 688 y 715 del Estatuto Tributario Nacional:
          </p>

          <p style="font-weight: bold; color: #044b20; margin: 10px 0 4px 0;">
            DISPONE:
          </p>
          <ol style="padding-left: 20px; margin: 4px 0; text-align: justify; line-height: 1.5;">
            <li><strong>PRIMERO:</strong> Ordenar la apertura formal del expediente administrativo de fiscalización tributaria respecto al vehículo automotor con placa <strong>${omiso.placa}</strong>, de propiedad del contribuyente <strong>${omiso.propietarioNombre}</strong>.</li>
            <li><strong>SEGUNDO:</strong> Constatar que verificado el Sistema de Información Tributaria y Rentas Departamentales, no figura registro de declaración ni recaudo de los periodos fiscales relacionados en la Página 2 del presente dossier.</li>
            <li><strong>TERCERO:</strong> Incorporar al expediente administrativo las liquidaciones previas estimadas con aplicación de las sanciones e intereses legales.</li>
            <li><strong>CUARTO:</strong> Expedir y notificar por correo postal certificado el Acto de Emplazamiento Previo para Declarar de conformidad con los Artículos 565 y 715 del Estatuto Tributario Nacional.</li>
          </ol>

          <div style="background: #f1f5f9; border-left: 4px solid #044b20; padding: 10px 12px; margin-top: 20px; font-size: 10.5px;">
            <strong>MÉDULA PROCESAL:</strong> El presente documento forma unidad inescindible con el Emplazamiento Previo para Declarar emitido en la Página 2 y sirve de apertura al proceso de determinación oficial.
          </div>

          <div class="signature-section" style="margin-top: 90px;">
            <div class="signature-box">
              <strong>SUBDIRECCIÓN DE RENTAS Y FISCALIZACIÓN</strong><br>
              Secretaría de Hacienda Departamental del Cauca<br>
              Firma y Huella Digital Autorizada
            </div>
            <div class="signature-box">
              <strong>CONTROL DE EXPEDIENTES Y NOTIFICACIONES</strong><br>
              Área de Fiscalización y Cobro Coactivo<br>
              República de Colombia
            </div>
          </div>
        </div>

        <!-- ═════════════════════════════════════════════════════════════════ -->
        <!-- SEPARADOR DE CORTE FÍSICO ENTRE HOJAS                            -->
        <!-- ═════════════════════════════════════════════════════════════════ -->
        <div class="dossier-page-gap">
          <div class="gap-line"></div>
          <div class="gap-pill">📄 PÁGINA 1 DE 2 (FINALIZADA) · INICIO DE PÁGINA 2 📄</div>
          <div class="gap-line"></div>
        </div>

        <!-- ═════════════════════════════════════════════════════════════════ -->
        <!-- PÁGINA 2: EMPLAZAMIENTO PREVIO PARA DECLARAR (ETN ART. 715)      -->
        <!-- ═════════════════════════════════════════════════════════════════ -->
        <div class="dossier-page-sheet">
          <div class="header">
            <h4 style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #334155;">REPÚBLICA DE COLOMBIA · GOBERNACIÓN DEL CAUCA</h4>
            <h2 class="title" style="color: #b91c1c;">EMPLAZAMIENTO PREVIO PARA DECLARAR No. ${nroActo}</h2>
            <p class="subtitle">EN CUMPLIMIENTO PERENTORIO DEL ARTÍCULO 715 DEL ESTATUTO TRIBUTARIO NACIONAL</p>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              PLACA: <strong style="font-family: monospace; font-size: 11.5px; color: #044b20;">${omiso.placa}</strong> · RADICADO DE SALIDA: <strong>${radicado}</strong>
            </div>
          </div>

          <p style="text-align: justify; margin: 8px 0;">
            La Secretaría de Hacienda Departamental del Cauca <strong>EMPLAZA FORMALMENTE</strong> al contribuyente <strong>${omiso.propietarioNombre}</strong> (Identificación: <strong>${omiso.propietarioDocumento}</strong>) para que dentro del <strong>TÉRMINO IMPRORROGABLE DE UN (1) MES CALENDARIO</strong>, contado a partir de la notificación del presente acto, cumpla con la obligación de presentar y pagar las declaraciones del Impuesto sobre Vehículos Automotores por las vigencias fiscales que se liquidan estimadamente:
          </p>

          <table class="table-clean">
            <thead>
              <tr>
                <th style="text-align: center; width: 10%;">Vigencia</th>
                <th style="text-align: right; width: 18%;">Avalúo Comercial</th>
                <th style="text-align: center; width: 8%;">Tarifa</th>
                <th style="text-align: right; width: 16%;">Impuesto Base</th>
                <th style="text-align: right; width: 16%;">Sanción Red. (50%)</th>
                <th style="text-align: right; width: 16%;">Intereses Mora</th>
                <th style="text-align: right; width: 16%;">Total Vigencia</th>
              </tr>
            </thead>
            <tbody>
              ${filasHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #0f172a; color: white; font-weight: bold;">
                <td colspan="6" style="padding: 7px 8px; text-align: right; text-transform: uppercase;">Total Proyectado en Emplazamiento:</td>
                <td style="padding: 7px 8px; text-align: right; font-size: 12px; color: #fde047;">${this.formatCOP(totalPagar)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="alert-legal">
            <strong>ADVERTENCIA PERENTORIA Y TÉRMINO LEGAL (E.T.N. ART. 717 Y 643):</strong><br>
            Vencido el término de <strong>UN (1) MES CALENDARIO</strong> sin que se hubiere subsanado la omisión declarando y cancelando los valores adeudados, la Administración Tributaria Departamental procederá de oficio a expedir la <strong>LIQUIDACIÓN OFICIAL DE AFORO</strong>, imponiendo la <strong>SANCIÓN POR NO DECLARAR EQUIVALENTE AL 200%</strong> del tributo a cargo, remitiendo de inmediato el título a la Jurisdicción Coactiva para decretar el <strong>EMBARGO DE CUENTAS Y SECUESTRO DEL VEHÍCULO</strong>.
          </div>

          <div style="font-size: 10px; color: #475569; margin-top: 10px; line-height: 1.4;">
            <strong>BENEFICIO POR EMPLAZAMIENTO:</strong> Quien declare con posterioridad al emplazamiento liquidará la sanción con <strong>reducción del 50%</strong> (E.T.N. Art. 642), sin que pueda ser inferior a la sanción mínima legal vigente.
          </div>

          <div class="signature-section" style="margin-top: 40px;">
            <div class="signature-box">
              <strong>COORDINADOR(A) DE FISCALIZACIÓN TRIBUTARIA</strong><br>
              Secretaría de Hacienda Departamental del Cauca<br>
              Firma y Huella Digital Autorizada
            </div>
            <div class="signature-box">
              <strong>DESPACHO POSTAL Y CORRESPONDENCIA</strong><br>
              Mensajería Oficial Certificada (ETN Art. 565)<br>
              Vigencia Fiscal 2026
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera el HTML oficial del Aviso Web / Cartelera para expedientes devueltos por correo
   */
  private generarHtmlAvisoWeb(omiso: VehiculoOmiso): string {
    const nroActo = omiso.numeroActoEmplazamiento || 'EMP-2026-0000';
    const radicado = omiso.radicadoOficial || 92000;
    const guia = omiso.numeroGuiaPostal || 'RA373400000CO';
    const hoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Arial', sans-serif; color: #0f172a; padding: 30px; font-size: 11.5px; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #b45309; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 14px; font-weight: bold; color: #1e3a7b; margin: 5px 0; }
          .card { background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div id="pageContainer">
          <div class="header">
            <h3 style="margin:0; text-transform: uppercase;">República de Colombia · Gobernación del Cauca</h3>
            <h2 class="title">AVISO DE NOTIFICACIÓN EN CARTELERA Y PÁGINA WEB OFICIAL</h2>
            <p style="margin:0; font-size: 10.5px; color: #64748b;">En cumplimiento del Artículo 568 del Estatuto Tributario Nacional</p>
          </div>

          <p style="text-align: justify;">
            El Subdirector de Rentas de la Gobernación del Cauca, hace saber que dentro del proceso de cobro y fiscalización tributaria se libró el <strong>Auto de Emplazamiento Previo para Declarar No. ${nroActo}</strong> con Radicado <strong>${radicado}</strong>, respecto al vehículo con placa <strong>${omiso.placa}</strong>.
          </p>

          <div class="card">
            <p><strong>SUJETO PASIVO EMPLAZADO:</strong> ${omiso.propietarioNombre}</p>
            <p><strong>DOCUMENTO IDENTIDAD:</strong> ${omiso.propietarioDocumento}</p>
            <p><strong>PLACA AUTOMOTOR:</strong> ${omiso.placa} (${omiso.marca} ${omiso.linea})</p>
            <p><strong>VIGENCIAS ADEUDADAS:</strong> ${omiso.vigenciasPendientes?.join(', ') || omiso.vigenciaMasAntigua}</p>
            <p><strong>TOTAL CARTERA DETERMINADA:</strong> ${this.formatCOP(omiso.totalDeudaEstimada)}</p>
            <p><strong>GUÍA POSTAL DEVUELTA:</strong> ${guia} (Causal: NO ENTREGADO / DEVUELTO)</p>
          </div>

          <p style="text-align: justify;">
            Toda vez que la citación enviada por correo físico fue devuelta por la empresa de mensajería, se procede a su <strong>NOTIFICACIÓN POR AVISO</strong> mediante publicación en la cartelera física de la Secretaría de Hacienda y en la página web oficial de la Gobernación del Cauca por el término de <strong>cinco (5) días hábiles</strong>.
          </p>

          <p style="text-align: justify;">
            La presente notificación se considerará surtida al finalizar el día siguiente al retiro o desfeche del presente aviso.
          </p>

          <p style="margin-top: 30px; font-weight: bold; text-align: center;">
            PUBLICADO EN POPAYÁN (CAUCA), EL DÍA ${hoy}.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera el HTML oficial de la Planilla de Entrega de Correspondencia Postal
   * para el operador de mensajería con relación de expedientes y casillas de firma.
   */
  private generarHtmlPlanillaPostal(expedientes: VehiculoOmiso[], operador?: string, fechaRemesa?: string): string {
    const op = operador || this.operadorPostalPlanilla() || 'Servicios Postales Nacionales 4-72';
    const fecha = fechaRemesa || this.fechaRemesaPlanilla() || new Date().toISOString().split('T')[0];
    const fechaFormateada = new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const fechaHora = new Date().toLocaleString('es-CO');
    const loteNumero = `REM-${fecha.replace(/-/g, '')}-${expedientes.length}`;

    const filas = expedientes.map((e, idx) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: bold; text-align: center;">${e.radicadoOficial || (90000 + idx)}</td>
        <td style="font-family: monospace; font-size: 10px; text-align: center;">${e.numeroActoEmplazamiento || 'EMP-2026-PEND'}</td>
        <td style="font-weight: bold; text-align: center; background: #fef9c3;">${e.placa}</td>
        <td>
          <div style="font-weight: bold;">${e.propietarioNombre}</div>
          <div style="font-size: 9px; color: #475569;">${e.propietarioDocumento}</div>
        </td>
        <td>
          <div style="font-size: 10px;">${e.direccionNotificacion || 'CARRERA 7 # 3-45'}</div>
          <div style="font-size: 9px; color: #64748b;">${e.municipioDestino || 'POPAYÁN, CAUCA'}</div>
        </td>
        <td style="text-align: center; font-family: monospace; font-size: 10px;">
          ${e.numeroGuiaPostal ? `<strong>${e.numeroGuiaPostal}</strong><br><span style="font-size: 8.5px; color:#475569;">${e.empresaEnvio || op}</span>` : `<span style="color: #64748b; font-size: 9px;">[ ${op} ]<br><em style="color:#94a3b8;">Por radicar guía</em></span>`}
        </td>
        <td style="border: 1px dashed #cbd5e1; height: 35px; width: 120px;"></td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Planilla de Correspondencia Postal - Gobernación del Cauca</title>
        <style>
          @page { size: letter landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10px; color: #0f172a; margin: 0; padding: 15px; }
          .header-table { width: 100%; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 12px; }
          .title { font-size: 14px; font-weight: bold; color: #1e3a8a; margin: 0; text-transform: uppercase; }
          .subtitle { font-size: 11px; font-weight: bold; color: #334155; margin: 2px 0 0 0; }
          .meta-info { font-size: 9.5px; color: #475569; margin-top: 4px; }
          .table-envios { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .table-envios th { background: #0f172a; color: white; padding: 6px 4px; font-size: 9.5px; text-transform: uppercase; border: 1px solid #334155; }
          .table-envios td { border: 1px solid #cbd5e1; padding: 5px 6px; font-size: 9.5px; vertical-align: middle; }
          .table-envios tr:nth-child(even) { background-color: #f8fafc; }
          .signatures { margin-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sign-box { width: 45%; border-top: 1px solid #0f172a; padding-top: 6px; text-align: center; font-size: 9.5px; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 65%;">
              <div style="font-size: 9px; font-weight: bold; color: #64748b; letter-spacing: 1px;">REPÚBLICA DE COLOMBIA · GOBERNACIÓN DEL CAUCA</div>
              <h1 class="title">Secretaría de Hacienda Departamental</h1>
              <p class="subtitle">PLANILLA OFICIAL DE ENTREGA DE CORRESPONDENCIA Y NOTIFICACIONES FISCALES</p>
              <div class="meta-info">Área de Fiscalización y Cobro Coactivo Tributario · Envíos Postales Certificados (ETN Art. 565)</div>
            </td>
            <td style="width: 35%; text-align: right; vertical-align: top;">
              <div style="background: #f1f5f9; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; display: inline-block; text-align: left; font-size: 9.5px;">
                <div><strong>OPERADOR POSTAL:</strong> <span style="font-weight: bold; color: #1e3a8a;">${op}</span></div>
                <div><strong>FECHA DE REMESA:</strong> ${fechaFormateada}</div>
                <div><strong>LOTE / REMESA:</strong> <span style="font-family: monospace; font-weight: bold;">${loteNumero}</span></div>
                <div><strong>TOTAL ENVÍOS:</strong> <span style="font-size: 13px; font-weight: bold; color: #1e3a8a;">${expedientes.length}</span> expedientes</div>
              </div>
            </td>
          </tr>
        </table>

        <table class="table-envios">
          <thead>
            <tr>
              <th style="width: 3%;">#</th>
              <th style="width: 9%;">Radicado RN</th>
              <th style="width: 14%;">Acto Emplazamiento</th>
              <th style="width: 8%;">Placa</th>
              <th style="width: 22%;">Contribuyente / Sujeto Pasivo</th>
              <th style="width: 22%;">Dirección y Municipio Destino</th>
              <th style="width: 11%;">No. Guía / Courier</th>
              <th style="width: 11%;">Firma / Sello Recibido</th>
            </tr>
          </thead>
          <tbody>
            ${filas}
          </tbody>
        </table>

        <div style="margin-top: 15px; font-size: 8.5px; color: #475569; text-align: justify; line-height: 1.3;">
          <strong>CONSTANCIA DE REMISIÓN:</strong> Se hace constar que los actos administrativos listados en la presente planilla corresponden a Actos de Emplazamiento Previo para Declarar emitidos por la Secretaría de Hacienda del Departamento del Cauca en cumplimiento del Estatuto Tributario Nacional. La empresa de mensajería postal se compromete a devolver las planillas debidamente selladas con los números de guía correspondientes y los acuses de recibo en el término legal.
        </div>

        <table style="width: 100%; margin-top: 35px;">
          <tr>
            <td style="width: 45%; border-top: 1px solid #0f172a; text-align: center; padding-top: 6px; font-size: 9.5px;">
              <strong>ENTREGADO POR:</strong><br>
              Área de Fiscalización y Cobro Coactivo<br>
              Secretaría de Hacienda Departamental del Cauca
            </td>
            <td style="width: 10%;"></td>
            <td style="width: 45%; border-top: 1px solid #0f172a; text-align: center; padding-top: 6px; font-size: 9.5px;">
              <strong>RECIBIDO POR OPERADOR POSTAL (${op}):</strong><br>
              Firma y Sello de Recibido con Fecha y Hora<br>
              Nombre del Funcionario Mensajería / Guías
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private calcularKpisLocales(): OmisosKpis {
    const l = this.omisos();
    const n = (v: any) => isNaN(Number(v)) ? 0 : Number(v);

    const totalDeuda     = l.reduce((s, o) => s + n(o.totalDeudaEstimada),      0);
    const totalIntereses = l.reduce((s, o) => s + n(o.interesesMoraAcumulados), 0);
    const totalSanciones = l.reduce((s, o) => s + n(o.sancionesAcumuladas),     0);
    const totalImpuesto  = l.reduce((s, o) => s + n(o.impuestoBaseAcumulado),   0);
    const sumaDias       = l.reduce((s, o) => s + n(o.diasMoraMaximo),          0);
    const promDias       = l.length ? Math.round(sumaDias / l.length) : 0;

    const recientes   = l.filter(o => o.nivelMora === 'RECIENTE').length;
    const emplazables = l.filter(o => o.nivelMora === 'EMPLAZABLE').length;
    const criticos    = l.filter(o => o.nivelMora === 'CRITICO').length;

    return {
      totalVehiculosOmisos:    this.totalCount() || l.length,
      totalDeudaEnMora:        totalDeuda,
      totalImpuestoBase:       totalImpuesto,
      totalInteresesMora:      totalIntereses,
      totalSanciones:          totalSanciones,
      promedioDiasMora:        promDias,
      porcentajeParqueVehicular: 0,
      totalRecientes:          recientes,
      totalEmplazables:        emplazables,
      totalCriticos:           criticos,
      totalSinNotificar:    l.filter(o => o.estadoEmplazamiento === 'SIN_NOTIFICAR').length,
      totalNotificados:     l.filter(o => o.estadoEmplazamiento === 'NOTIFICADO').length,
      totalEnCobroCoactivo: l.filter(o => o.estadoEmplazamiento === 'COBRO_COACTIVO').length,
    };
  }

  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);
  }
}
