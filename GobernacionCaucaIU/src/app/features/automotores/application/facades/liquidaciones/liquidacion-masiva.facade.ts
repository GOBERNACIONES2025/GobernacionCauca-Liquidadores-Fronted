import { Injectable, inject, signal, computed } from '@angular/core';
import { LiquidacionesApiService } from '../../../infrastructure/api/liquidaciones-api.service';
import {
  SimulacionLiquidacion,
  SimularLiquidacionRequest,
  LiquidacionMasivaResultado
} from '../../../domain/models/liquidacion.model';
import { LiquidacionItem } from './liquidaciones.models';
import { catchError, map } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class LiquidacionMasivaFacade {
  private api = inject(LiquidacionesApiService);

  readonly isModalMasivoOpen = signal<boolean>(false);
  readonly ejecutandoMasivo = signal<boolean>(false);
  readonly resultadoMasivo = signal<LiquidacionMasivaResultado | null>(null);
  readonly preSimulacionesMasivo = signal<SimulacionLiquidacion[]>([]);
  readonly loadingPreSimulacionMasiva = signal<boolean>(false);
  readonly vehiculoExpandidoMasivo = signal<string | null>(null);

  readonly selectedVigenciasMasivasMap = signal<Record<string, number[]>>({});
  readonly vigenciaFiltroMasivo = signal<number>(0);

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

  calcularSubtotalSimulacion(sim: SimulacionLiquidacion): number {
    if (!sim || !sim.vigencias) return 0;
    const aniosSeleccionados = this.selectedVigenciasMasivasMap()[sim.placa] || [];
    return sim.vigencias
      .filter(v => aniosSeleccionados.includes(v.anio) && !v.parametrosFaltantesEnDb)
      .reduce((sum, v) => sum + v.totalVigencia, 0);
  }

  toggleVigenciaMasivaVehiculo(placa: string, anio: number): void {
    const currMap = { ...this.selectedVigenciasMasivasMap() };
    let anios = currMap[placa] ? [...currMap[placa]] : [];
    if (anios.includes(anio)) {
      anios = anios.filter(a => a !== anio);
    } else {
      anios.push(anio);
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

  toggleExpandirVehiculoMasivo(placa: string): void {
    if (this.vehiculoExpandidoMasivo() === placa) {
      this.vehiculoExpandidoMasivo.set(null);
    } else {
      this.vehiculoExpandidoMasivo.set(placa);
    }
  }


  abrirModalMasivo(placasDestino: string[]): void {
    this.isModalMasivoOpen.set(true);
    this.resultadoMasivo.set(null);
    this.preSimulacionesMasivo.set([]);
    this.loadingPreSimulacionMasiva.set(true);
    this.vehiculoExpandidoMasivo.set(null);
    this.selectedVigenciasMasivasMap.set({});
    this.vigenciaFiltroMasivo.set(0);

    if (placasDestino.length === 0) {
      this.loadingPreSimulacionMasiva.set(false);
      return;
    }

    const requests = placasDestino.map(placa =>
      this.api.simularLiquidacion({ placa }).pipe(
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

  cerrarModalMasivo(): void {
    this.isModalMasivoOpen.set(false);
    this.resultadoMasivo.set(null);
    this.ejecutandoMasivo.set(false);
    this.preSimulacionesMasivo.set([]);
    this.vehiculoExpandidoMasivo.set(null);
    this.selectedVigenciasMasivasMap.set({});
  }


  ejecutarLiquidacionMasiva(onSuccess: () => void): void {
    this.ejecutandoMasivo.set(true);
    this.resultadoMasivo.set(null);

    const sims = this.preSimulacionesMasivo();
    const mapVigencias = this.selectedVigenciasMasivasMap();

    const requests = sims.map(sim => {
      const aniosOficializar = mapVigencias[sim.placa] || [];
      if (aniosOficializar.length === 0) return of([]);

      const req: SimularLiquidacionRequest = {
        placa: sim.placa,
        vigencias: aniosOficializar
      };
      return this.api.oficializar(req).pipe(
        map(res => res?.data || []),
        catchError(() => of([]))
      );
    });

    forkJoin(requests).subscribe(results => {
      this.ejecutandoMasivo.set(false);
      const todosItems = results.flat().filter((i): i is LiquidacionItem => i !== null);

      const totalRecaudo = todosItems.reduce((sum, item) => sum + item.totalPagar, 0);
      const placasProcesadas = new Set(todosItems.map(i => i.placa)).size;

      this.resultadoMasivo.set({
        totalVehiculosProcesados: placasProcesadas,
        totalVigenciasLiquidadas: todosItems.length,
        totalRecaudoGenerado: totalRecaudo,
        numerosLiquidacionGenerados: todosItems.map(i => i.numeroLiquidacion),
        detalleLiquidaciones: todosItems,
        mensaje: `Se expedieron exitosamente ${todosItems.length} liquidación(es) oficial(es) en BD para ${placasProcesadas} vehículo(s) por un valor total de $${totalRecaudo.toLocaleString('es-CO')}.`
      });

      onSuccess();
    });
  }
}
