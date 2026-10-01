import { Injectable, inject, signal, computed } from '@angular/core';
import { LiquidacionesApiService } from '../../../infrastructure/api/liquidaciones-api.service';
import {
  SimulacionLiquidacion,
  SimularLiquidacionRequest
} from '../../../domain/models/liquidacion.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LiquidacionSimulacionFacade {
  private api = inject(LiquidacionesApiService);

  readonly isModalOpen = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Autor: Juan Sebastián Montaño Pérez
  // Fecha: 28/09/2026
  // Módulo: Contendra la simulación de la Liquidación
  readonly simulacion = signal<SimulacionLiquidacion | null>(null);
  readonly simulacionCalculada = computed(() => this.simulacion());
  readonly simulacionRaw = computed(() => this.simulacion());
  readonly selectedVigenciaAnios = signal<number[]>([]);

  readonly totalPagarSeleccionado = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.totalVigencia, 0);
  });

  readonly subtotalImpuestoSeleccionado = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.valorImpuestoNominal, 0);
  });

  readonly descuentosSeleccionado = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.descuentoProntoPago, 0);
  });

  readonly sancionesSeleccionado = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.sancionExtemporaneidad, 0);
  });

  readonly interesesSeleccionado = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.interesesMora, 0);
  });

  readonly sistematizacionSeleccionado = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + (v.derechossistematizacion || v.derechosSistematizacion || 0), 0);
  });

  readonly baseGravableSeleccionada = computed(() => {
    const sim = this.simulacion();
    if (!sim) return 0;
    const sel = this.selectedVigenciaAnios();
    return sim.vigencias
      .filter(v => sel.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.baseGravableAvaluo, 0);
  });

  readonly repartoMunicipioSeleccionado = computed(() =>
    Math.round(this.totalPagarSeleccionado() * 0.20)
  );

  readonly repartoDepartamentoSeleccionado = computed(() =>
    this.totalPagarSeleccionado() - this.repartoMunicipioSeleccionado()
  );


  // Autor: Juan Sebastián Montaño Pérez
  // Fecha: 28/09/2026
  // Módulo: Simulación del calculo de la deuda
  // Descripción: @parameter(Placa:string) va y busca en la API y hace una simulación de cual seria el cobro
  abrirSimulacion(placa: string): void {
    this.isModalOpen.set(true);
    this.selectedVigenciaAnios.set([]);
    this.solicitarSimulacion(placa);
  }

  private solicitarSimulacion(placa: string): void {
    this.loading.set(true);
    this.error.set(null);

    const req: SimularLiquidacionRequest = { placa };

    this.api.simularLiquidacion(req).pipe(
      catchError(() => {
        this.error.set('No se pudo conectar con el motor de liquidaciones.');
        return of(null);
      }),
      finalize(() => {
        this.loading.set(false);
      })
    ).subscribe(res => {
      if (!res?.data) {
        return;
      }

      this.simulacion.set(res.data);

      const validas = (res.data.vigencias ?? [])
        .filter(v => !v.parametrosFaltantesEnDb)
        .map(v => v.anio);

      this.selectedVigenciaAnios.set(validas);
    });
  }

  toggleVigencia(anio: number): void {
    let nuevas = [...this.selectedVigenciaAnios()];
    if (nuevas.includes(anio)) {
      nuevas = nuevas.filter(a => a !== anio);
    } else {
      nuevas = [...nuevas, anio].sort((a, b) => b - a);
    }
    this.selectedVigenciaAnios.set(nuevas);
  }

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

  cerrarModal(): void {
    this.isModalOpen.set(false);
    this.simulacion.set(null);
    this.selectedVigenciaAnios.set([]);
  }

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
