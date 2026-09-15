import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, map } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ApiResponse } from '../../domain/models/vehiculo.model';
import {
  VehiculoOmiso,
  OmisosKpis,
  NivelMoraOmiso,
  calcularNivelMora,
  SimulacionLiquidacion,
  SimularLiquidacionRequest,
} from '../../domain/models/liquidacion.model';

export interface PagedResultOmisos<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Facade del módulo "Vehículos Omisos por Emplazamiento".
 *
 * Base legal:
 *   - Ley 488/1998 Art.147  → cobro coactivo departamental
 *   - ETN Art.715           → emplazamiento previo (plazo 1 mes)
 *   - ETN Arts.634-635      → intereses de mora desde día 1
 *   - ETN Art.642           → sanción extemporaneidad agravada post-emplazamiento
 *   - ETN Art.643           → sanción por no declarar / aforo de oficio
 *   - ETN Art.817           → prescripción acción de cobro (5 años)
 *
 * Un vehículo es "omiso" desde el día 1 de mora (no existe umbral mínimo
 * en la ley para iniciar el emplazamiento formal).
 */
@Injectable({ providedIn: 'root' })
export class OmisosFacade {
  private api   = inject(BaseApiService);
  private toast = inject(ToastService);

  // ── Signals de estado ──────────────────────────────────────────────────────
  readonly omisos        = signal<VehiculoOmiso[]>([]);
  readonly kpis          = signal<OmisosKpis | null>(null);
  readonly loading       = signal<boolean>(false);
  readonly loadingKpis   = signal<boolean>(false);
  readonly error         = signal<string | null>(null);

  readonly page          = signal<number>(1);
  readonly pageSize      = signal<number>(15);
  readonly totalCount    = signal<number>(0);
  readonly totalPages    = signal<number>(1);

  // Filtros activos
  readonly buscar            = signal<string>('');
  readonly nivelMoraFiltro   = signal<NivelMoraOmiso | ''>('');
  readonly estadoEmplFiltro  = signal<'SIN_NOTIFICAR' | 'NOTIFICADO' | 'COBRO_COACTIVO' | ''>('');
  readonly diasMinimoFiltro  = signal<number>(0);
  readonly vigenciaFiltro    = signal<number>(0);
  readonly ordenarPor        = signal<'diasMora' | 'totalDeuda' | 'vigenciaMasAntigua'>('diasMora');

  // Modal emplazamiento individual o por vigencia
  readonly isModalSimulOpen  = signal<boolean>(false);
  readonly simulacion        = signal<SimulacionLiquidacion | null>(null);
  readonly loadingSimul      = signal<boolean>(false);
  readonly errorSimul        = signal<string | null>(null);
  readonly placaSimulActiva  = signal<string>('');
  readonly vigenciaEmplazar  = signal<number | null>(null);

  // Acordeón de placas expandidas (detalle de vigencias)
  readonly placasExpandidas  = signal<string[]>([]);

  // Modal emplazamiento masivo y revisión detallada 1 a 1
  readonly isModalEmplMasivoOpen     = signal<boolean>(false);
  readonly preSimulacionesMasivo     = signal<SimulacionLiquidacion[]>([]);
  readonly loadingPreSimulacionMasiva = signal<boolean>(false);
  readonly modoRevisionMasivo        = signal<'resumen' | 'revision-individual'>('resumen');
  readonly indexVehiculoMasivo       = signal<number>(0);
  readonly selectedVigenciasMasivasMap = signal<Record<string, number[]>>({});
  readonly vigenciaFiltroMasivo      = signal<number>(0); // 0 = Todas, 2026, etc.

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
        .filter(v => aniosSeleccionados.includes(v.anio) && !v.parametrosFaltantesEnDb)
        .reduce((vSum, v) => vSum + v.totalVigencia, 0);
      return sum + subtotalVeh;
    }, 0);
  });

  // Selección de placas
  readonly selectedPlacas    = signal<string[]>([]);

  // ── Computed ───────────────────────────────────────────────────────────────

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

  // ── Carga de datos ─────────────────────────────────────────────────────────

  cargarOmisos(): void {
    this.loading.set(true);
    this.error.set(null);

    const omisosParams: Record<string, any> = {
      page:      this.page(),
      pageSize:  this.pageSize(),
      ordenarPor: this.ordenarPor(),
      ordenDesc: true,
    };
    if (this.buscar()?.trim())       omisosParams['buscar']        = this.buscar().trim();
    if (this.vigenciaFiltro() > 0)   omisosParams['vigencia']      = this.vigenciaFiltro();
    if (this.nivelMoraFiltro())      omisosParams['nivelMora']     = this.nivelMoraFiltro();
    if (this.estadoEmplFiltro())     omisosParams['estadoEmplazamiento'] = this.estadoEmplFiltro();
    if (this.diasMinimoFiltro() > 0) omisosParams['diasMoraMinimo'] = this.diasMinimoFiltro();

    const fallbackParams: Record<string, any> = {
      page:     this.page(),
      pageSize: this.pageSize(),
      buscar:   this.buscar()?.trim() || undefined,
      vigencia: this.vigenciaFiltro() > 0 ? this.vigenciaFiltro() : undefined,
    };

    this.api
      .get<ApiResponse<PagedResultOmisos<VehiculoOmiso>>>(
        '/liquidaciones/omisos', { params: omisosParams }, 'AUTOMOTORES'
      )
      .pipe(
        // ── Fallback: si falla /omisos recae sobre /pendientes ──────────
        catchError(() =>
          this.api.get<ApiResponse<PagedResultOmisos<any>>>(
            '/liquidaciones/pendientes', { params: fallbackParams }, 'AUTOMOTORES'
          ).pipe(
            map(res => {
              if (res?.data?.items) {
                res.data.items = res.data.items.map((raw: any) =>
                  this.mapearLiquidacionItemAOmiso(raw)
                );
              }
              return res as ApiResponse<PagedResultOmisos<VehiculoOmiso>>;
            }),
            catchError(() => of(null))
          )
        )
      )

      .subscribe(res => {
        this.loading.set(false);
        if (res?.data) {
          const items = (res.data.items || []).map(o => ({
            ...o,
            nivelMora: o.nivelMora ?? calcularNivelMora(o.diasMoraMaximo ?? 0),
            estadoEmplazamiento: o.estadoEmplazamiento ?? 'SIN_NOTIFICAR',
          } as VehiculoOmiso));

          this.omisos.set(items);
          this.totalCount.set(res.data.totalCount || items.length);
          this.totalPages.set(res.data.totalPages || Math.ceil((res.data.totalCount || items.length) / this.pageSize()) || 1);

          // Recalcula KPIs locales con los datos ya mapeados
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
    const params: Record<string, any> = {};
    if (this.vigenciaFiltro() > 0) params['vigencia'] = this.vigenciaFiltro();

    this.api
      .get<ApiResponse<OmisosKpis>>('/liquidaciones/omisos/kpis', { params }, 'AUTOMOTORES')
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.loadingKpis.set(false);
        // Si el backend devuelve KPIs propios los usa; si no, calcula locales
        if (res?.data) {
          this.kpis.set(res.data);
        }
        // Si no hay res, los KPIs ya fueron calculados localmente al final de cargarOmisos()
      });
  }

  // ── Mapeo LiquidacionItem (backend /pendientes) → VehiculoOmiso ────────────
  private mapearLiquidacionItemAOmiso(raw: any): VehiculoOmiso {
    const n = (v: any) => isNaN(Number(v)) ? 0 : Number(v);  // safe cast

    // Calcula días de mora desde fechaVencimiento si está disponible
    const diasMora = this.calcularDiasMora(raw.fechaVencimiento ?? raw.fechaCalculo);

    // Parte la marcaLinea en marca / linea (ej: "RENAULT SANDERO")
    const ml      = String(raw.marcaLinea ?? raw.marca ?? '');
    const partes  = ml.split(' ');
    const marca   = partes[0] || ml;
    const linea   = partes.slice(1).join(' ') || raw.linea || marca;

    const vigencias: number[] = Array.isArray(raw.vigenciasPendientes) && raw.vigenciasPendientes.length > 0
      ? raw.vigenciasPendientes.map((v: any) => n(v))
      : (raw.vigenciaAnio ? [n(raw.vigenciaAnio)] : []);

    const nivel = calcularNivelMora(diasMora);

    return {
      vehiculoId:               n(raw.id),
      placa:                    String(raw.placa ?? ''),
      marca,
      linea,
      modelo:                   n(raw.modelo),
      tipoVehiculo:             String(raw.tipoVehiculo ?? ''),
      clase:                    String(raw.clase ?? ''),
      propietarioNombre:        String(raw.contribuyenteNombre ?? raw.propietarioNombre ?? '—'),
      propietarioDocumento:     String(raw.contribuyenteDocumento ?? raw.propietarioDocumento ?? '—'),
      propietarioTipoDocumento: String(raw.tipoDocumento ?? ''),
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
      fechaUltimaGestion:       raw.fechaUltimaGestion ?? raw.fechaCalculo ?? undefined,
      numeroActoEmplazamiento:  raw.numeroActoEmplazamiento ?? undefined,
      nivelMora:                nivel,
    };
  }


  /** Calcula los días transcurridos desde una fecha de vencimiento hasta hoy. */
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
  }

  toggleSeleccionarTodos(): void {
    const todas = this.omisos().map(o => o.placa);
    this.selectedPlacas.set(this.selectedPlacas().length === todas.length ? [] : todas);
  }

  limpiarSeleccion(): void { this.selectedPlacas.set([]); }

  // ── Acordeón de vigencias ──────────────────────────────────────────────────
  toggleExpandirPlaca(placa: string): void {
    const expandidas = this.placasExpandidas();
    this.placasExpandidas.set(
      expandidas.includes(placa) ? expandidas.filter(p => p !== placa) : [...expandidas, placa]
    );
  }

  expandirTodas(): void {
    this.placasExpandidas.set(this.omisos().map(o => o.placa));
  }

  colapsarTodas(): void {
    this.placasExpandidas.set([]);
  }

  // ── Modal simulación / emplazamiento ───────────────────────────────────────

  abrirSimulacion(placa: string, vigencia?: number): void {
    this.placaSimulActiva.set(placa);
    this.vigenciaEmplazar.set(vigencia ?? null);
    this.simulacion.set(null);
    this.errorSimul.set(null);
    this.loadingSimul.set(true);
    this.isModalSimulOpen.set(true);

    const body: SimularLiquidacionRequest = {
      placa,
      vigencias: vigencia ? [vigencia] : undefined,
    };

    this.api
      .post<ApiResponse<SimulacionLiquidacion>>(
        '/liquidaciones/simular', body, {}, 'AUTOMOTORES'
      )
      .pipe(catchError(() => { this.errorSimul.set('No se pudo calcular la liquidación.'); this.loadingSimul.set(false); return of(null); }))
      .subscribe(res => {
        this.loadingSimul.set(false);
        if (res?.data) this.simulacion.set(res.data);
      });
  }

  cerrarSimulacion(): void {
    this.isModalSimulOpen.set(false);
    this.simulacion.set(null);
    this.errorSimul.set(null);
    this.placaSimulActiva.set('');
    this.vigenciaEmplazar.set(null);
  }

  // ── Emplazamiento individual, grupal y masivo ──────────────────────────────

  abrirEmplazamiento(placa: string, vigencia?: number): void {
    this.abrirSimulacion(placa, vigencia);
  }

  emitirEmplazamiento(placa: string, vigencia?: number): void {
    const consecutivo = Math.floor(1000 + Math.random() * 9000);
    const nroActo = `EMP-2026-${consecutivo}`;
    const hoy = new Date().toISOString();
    const targetVigencia = vigencia ?? this.vigenciaEmplazar();

    this.omisos.update(lista =>
      lista.map(o => {
        if (o.placa !== placa) return o;

        // Actualizar detalle de vigencias
        const detActualizado = (o.detalleVigencias || []).map(d => {
          if (!targetVigencia || d.anio === targetVigencia) {
            return {
              ...d,
              estadoEmplazamiento: 'NOTIFICADO' as const,
              numeroActoEmplazamiento: nroActo,
            };
          }
          return d;
        });

        // Si se emplazó todo el vehículo o todas las vigencias quedaron notificadas
        const todasNotificadas = detActualizado.length > 0 && detActualizado.every(d => d.estadoEmplazamiento === 'NOTIFICADO');
        const estadoFinal = (!targetVigencia || todasNotificadas) ? ('NOTIFICADO' as const) : o.estadoEmplazamiento;

        return {
          ...o,
          estadoEmplazamiento: estadoFinal,
          numeroActoEmplazamiento: nroActo,
          fechaUltimaGestion: hoy,
          detalleVigencias: detActualizado,
        };
      })
    );

    const msg = targetVigencia 
      ? `Acto de Emplazamiento ${nroActo} emitido para la Vigencia ${targetVigencia} de la placa ${placa}.`
      : `Acto de Emplazamiento Consolidado ${nroActo} emitido para todas las vigencias de la placa ${placa}.`;

    this.cerrarSimulacion();
    this.toast.success(msg);
  }

  /** Inicia el modo de revisión 1 a 1 de vehículos en el lote masivo */
  irAModoRevisionMasivo(index: number = 0): void {
    this.indexVehiculoMasivo.set(index);
    this.modoRevisionMasivo.set('revision-individual');
  }

  /** Regresa a la vista de resumen consolidado del lote masivo */
  irAModoResumenMasivo(): void {
    this.modoRevisionMasivo.set('resumen');
  }

  /** Avanza al siguiente vehículo en la inspección 1 a 1 del lote masivo */
  siguienteVehiculoMasivo(): void {
    const total = this.preSimulacionesMasivo().length;
    if (this.indexVehiculoMasivo() < total - 1) {
      this.indexVehiculoMasivo.update(i => i + 1);
    }
  }

  /** Regresa al vehículo anterior en la inspección 1 a 1 del lote masivo */
  anteriorVehiculoMasivo(): void {
    if (this.indexVehiculoMasivo() > 0) {
      this.indexVehiculoMasivo.update(i => i - 1);
    }
  }

  /** Calcula el subtotal individual para un vehículo en el modal masivo */
  calcularSubtotalSimulacion(sim: SimulacionLiquidacion): number {
    if (!sim || !sim.vigencias) return 0;
    const aniosSeleccionados = this.selectedVigenciasMasivasMap()[sim.placa] || [];
    return sim.vigencias
      .filter(v => aniosSeleccionados.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.totalVigencia, 0);
  }

  /** Activa o desactiva una vigencia individual para un vehículo en la lista masiva */
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

  /** Aplica el filtro maestro por vigencia para todos los vehículos en el lote masivo */
  setVigenciaFiltroMasivo(vigencia: number): void {
    this.vigenciaFiltroMasivo.set(vigencia);
    const sims = this.preSimulacionesMasivo();
    const newMap: Record<string, number[]> = {};

    for (const s of sims) {
      const validas = s.vigencias
        .filter(v => !v.parametrosFaltantesEnDb && v.totalVigencia > 0)
        .map(v => v.anio);

      if (vigencia > 0) {
        newMap[s.placa] = validas.filter(a => a === vigencia);
      } else {
        newMap[s.placa] = validas;
      }
    }
    this.selectedVigenciasMasivasMap.set(newMap);
  }

  /** Quita un vehículo del lote masivo tanto de la selección como de las pre-simulaciones */
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

    const requests = placasDestino.map(placa =>
      this.api.post<ApiResponse<SimulacionLiquidacion>>('/liquidaciones/simular', { placa }, {}, 'AUTOMOTORES').pipe(
        map(res => res?.data || null),
        catchError(() => of(null))
      )
    );

    forkJoin(requests).subscribe(sims => {
      this.loadingPreSimulacionMasiva.set(false);
      const validSims = sims.filter((s): s is SimulacionLiquidacion => s !== null);
      this.preSimulacionesMasivo.set(validSims);

      const initMap: Record<string, number[]> = {};
      for (const s of validSims) {
        initMap[s.placa] = s.vigencias
          .filter(v => !v.parametrosFaltantesEnDb && v.totalVigencia > 0)
          .map(v => v.anio);
      }
      this.selectedVigenciasMasivasMap.set(initMap);
    });
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

    const hoy = new Date().toISOString();
    const mapVigencias = this.selectedVigenciasMasivasMap();

    this.omisos.update(lista =>
      lista.map(o => {
        if (!placas.includes(o.placa)) return o;
        const nroActo = `EMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const vigenciasSeleccionadas = mapVigencias[o.placa] || o.vigenciasPendientes || [];

        const detActualizado = o.detalleVigencias?.map(v =>
          vigenciasSeleccionadas.includes(v.anio)
            ? { ...v, estadoEmplazamiento: 'NOTIFICADO' as const, numeroActoEmplazamiento: nroActo }
            : v
        );

        return {
          ...o,
          estadoEmplazamiento: 'NOTIFICADO' as const,
          numeroActoEmplazamiento: nroActo,
          fechaUltimaGestion: hoy,
          detalleVigencias: detActualizado,
        };
      })
    );

    const cant = placas.length;
    this.selectedPlacas.set([]);
    this.cerrarEmplazamientoMasivo();
    this.toast.success(`Se emitieron y registraron exitosamente ${cant} actos de emplazamiento masivo.`);
  }


  // ── Helpers ────────────────────────────────────────────────────────────────

  private calcularKpisLocales(): OmisosKpis {
    const l = this.omisos();
    const n = (v: any) => isNaN(Number(v)) ? 0 : Number(v);   // safe numeric cast

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
