import { Injectable, inject, signal, computed } from '@angular/core';
import { LiquidacionesApiService } from '../../../infrastructure/api/liquidaciones-api.service';
import {
  SimulacionLiquidacion,
  SimularLiquidacionRequest
} from '../../../domain/models/liquidacion.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Sub-facade responsable del proceso de simulación y liquidación individual:
 * modal, selección de vigencias, cálculos de resumen y oficialización.
 */
@Injectable({ providedIn: 'root' })
export class LiquidacionSimulacionFacade {
  private api = inject(LiquidacionesApiService);

  // ── Estado del modal de simulación ───────────────────────────────
  readonly isModalOpen = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly simulacion = signal<SimulacionLiquidacion | null>(null);
  readonly simulacionCalculada = computed(() => this.simulacion());
  readonly simulacionRaw = computed(() => this.simulacion());
  readonly selectedVigenciaAnios = signal<number[]>([]);

  // ── Computados del resumen tributario ────────────────────────────

  /** Total acumulado de las vigencias seleccionadas */
  readonly totalPagarSeleccionado = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.totalVigencia, 0);
  });

  /** Subtotal Impuesto Vehicular seleccionado */
  readonly subtotalImpuestoSeleccionado = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.valorImpuestoNominal, 0);
  });

  /** Total Descuentos seleccionados */
  readonly descuentosSeleccionado = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.descuentoProntoPago, 0);
  });

  /** Total Sanciones seleccionadas */
  readonly sancionesSeleccionado = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.sancionExtemporaneidad, 0);
  });

  /** Total Intereses de Mora seleccionados */
  readonly interesesSeleccionado = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.interesesMora, 0);
  });

  /** Total Derechos de Sistematización y Estampillas seleccionados */
  readonly sistematizacionSeleccionado = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + (v.derechossistematizacion || v.derechosSistematizacion || 0), 0);
  });

  /** Base Gravable Total seleccionada */
  readonly baseGravableSeleccionada = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.baseGravableAvaluo, 0);
  });

  /** Distribución Legal del Recaudo: Municipio (20%) */
  readonly repartoMunicipioSeleccionado = computed(() =>
    Math.round(this.totalPagarSeleccionado() * 0.20)
  );

  /** Distribución Legal del Recaudo: Departamento del Cauca (80%) */
  readonly repartoDepartamentoSeleccionado = computed(() =>
    this.totalPagarSeleccionado() - this.repartoMunicipioSeleccionado()
  );

  // ── Métodos ───────────────────────────────────────────────────────

  /**
   * Solicita al Backend el cálculo y simulación tributaria para una placa.
   * Todos los cálculos son 100% procesados por la API .NET.
   */
  private solicitarSimulacion(placa: string): void {
    this.loading.set(true);
    this.error.set(null);

    const req: SimularLiquidacionRequest = { placa };

    this.api.simular(req).pipe(
      catchError(err => {
        console.warn('Error al simular liquidación:', err);
        this.error.set('No se pudo conectar con el motor de liquidaciones.');
        this.loading.set(false);
        return of(null);
      })
    ).subscribe(res => {
      this.loading.set(false);
      if (res && res.data) {
        this.simulacion.set(res.data);
        const validas = (res.data.vigencias || [])
          .filter(v => !v.parametrosFaltantesEnDb)
          .map(v => v.anio);
        this.selectedVigenciaAnios.set(validas);
      }
    });
  }

  /** Abre el modal de simulación para una placa específica */
  abrirSimulacion(placa: string): void {
    this.isModalOpen.set(true);
    this.selectedVigenciaAnios.set([]);
    this.solicitarSimulacion(placa);
  }

  /** Selecciona o deselecciona una vigencia individual */
  toggleVigencia(anio: number): void {
    let nuevas = [...this.selectedVigenciaAnios()];
    if (nuevas.includes(anio)) {
      nuevas = nuevas.filter(a => a !== anio);
    } else {
      nuevas = [...nuevas, anio].sort((a, b) => b - a);
    }
    this.selectedVigenciaAnios.set(nuevas);
  }

  /** Selecciona o deselecciona todas las vigencias liquidables válidas */
  toggleSeleccionarTodos(): void {
    const sim = this.simulacion();
    if (!sim) return;
    const validas = sim.vigencias
      .filter(v => !v.parametrosFaltantesEnDb && v.totalVigencia > 0)
      .map(v => v.anio);
    if (this.selectedVigenciaAnios().length === validas.length) {
      this.selectedVigenciaAnios.set([]);
    } else {
      this.selectedVigenciaAnios.set(validas);
    }
  }

  /** Cierra el modal de simulación y limpia estado */
  cerrarModal(): void {
    this.isModalOpen.set(false);
    this.simulacion.set(null);
    this.selectedVigenciaAnios.set([]);
  }

  /**
   * Expide e ingresa oficialmente la liquidación a la base de datos.
   * Devuelve un observable para que el facade orquestador pueda reaccionar.
   */
  oficializarLiquidacion(
    onSuccess: () => void
  ): void {
    const sim = this.simulacion();
    if (!sim || this.selectedVigenciaAnios().length === 0) return;

    this.loading.set(true);
    this.error.set(null);

    const req: SimularLiquidacionRequest = {
      placa: sim.placa,
      vigencias: this.selectedVigenciaAnios()
    };

    this.api.oficializar(req).pipe(
      catchError(err => {
        console.warn('Error al oficializar liquidación:', err);
        this.error.set('No se pudo expedir la liquidación oficial en BD.');
        this.loading.set(false);
        return of(null);
      })
    ).subscribe(res => {
      this.loading.set(false);
      if (res && res.data) {
        this.cerrarModal();
        onSuccess();
      }
    });
  }
}
