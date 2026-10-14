import { Injectable, inject, signal } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { VehiculosApiService } from '../../../infrastructure/api/vehiculos-api.service';
import { VehiculoKpis } from '../../../domain/models/vehiculo.model';

@Injectable({
  providedIn: 'root',
})
export class VehiculosKpisFacade {
  private vehiculosApi = inject(VehiculosApiService);

  readonly kpis = signal<VehiculoKpis>({
    vigenciaFiscal: new Date().getFullYear(),
    vigenciaEstado: 'ACTIVA',
    vigenciaFecha: '',
    valorUvt: 0,
    uvtVariacion: '0%',
    uvtNorma: 'Sin registrar',
    sancionMinima: 0,
    sancionDescripcion: 'Sin registrar',
    auditadosHoy: 0,
    auditadosUltimo: 'Sin registros',
    totalVehiculos: 0,
    totalVehiculosActivos: 0,
    totalVehiculosInactivos: 0,
    totalPendientesAprobacion: 0
  });

  readonly countsPorEstado = signal<Record<string, number>>({
    ACTIVA: 0,
    CANCELADA: 0,
    TRASLADADA: 0,
    HURTADA: 0,
    CHATARRIZADA: 0
  });

  cargarKpis(): void {
    this.vehiculosApi.getKpis().pipe(
      catchError((err: any) => {
        console.warn('Backend KPIs no disponible:', err);
        return of(null);
      })
    ).subscribe((res: any) => {
      if (res && res.data) {
        const d = res.data;
        this.kpis.set({
          vigenciaFiscal: d.vigenciaFiscal ?? new Date().getFullYear(),
          vigenciaEstado: d.vigenciaEstado ?? 'ACTIVA',
          vigenciaFecha: d.vigenciaFecha ?? '',
          valorUvt: Number(d.valorUvt) || 0,
          uvtVariacion: d.valorUvtIncremento ?? d.uvtVariacion ?? '0%',
          uvtNorma: d.valorUvtReferencia ?? d.uvtNorma ?? 'Sin registrar',
          sancionMinima: Number(d.sancionMinima) || 0,
          sancionDescripcion: d.sancionMinimaDetalle ?? d.sancionDescripcion ?? 'Sin registrar',
          auditadosHoy: Number(d.auditadosHoy) || 0,
          auditadosUltimo: d.ultimaAuditoriaDetalle ?? d.auditadosUltimo ?? 'Sin registros',
          totalVehiculos: d.totalVehiculos ?? 0,
          totalVehiculosActivos: d.totalVehiculosActivos ?? 0,
          totalVehiculosInactivos: d.totalVehiculosInactivos ?? 0,
          totalPendientesAprobacion: d.totalPendientesAprobacion ?? 0
        });
      }
      this.cargarCountsPorEstado();
    });
  }

  cargarCountsPorEstado(): void {
    forkJoin({
      ACTIVA: this.vehiculosApi.getVehiculos({ estado: 'ACTIVA', pageSize: 1 }).pipe(catchError(() => of(null))),
      CANCELADA: this.vehiculosApi.getVehiculos({ estado: 'CANCELADA', pageSize: 1 }).pipe(catchError(() => of(null))),
      TRASLADADA: this.vehiculosApi.getVehiculos({ estado: 'TRASLADADA', pageSize: 1 }).pipe(catchError(() => of(null))),
      HURTADA: this.vehiculosApi.getVehiculos({ estado: 'HURTADA', pageSize: 1 }).pipe(catchError(() => of(null))),
      CHATARRIZADA: this.vehiculosApi.getVehiculos({ estado: 'CHATARRIZADA', pageSize: 1 }).pipe(catchError(() => of(null)))
    }).subscribe(results => {
      const activa = results.ACTIVA?.data?.totalCount ?? this.kpis().totalVehiculosActivos ?? 0;
      const cancelada = results.CANCELADA?.data?.totalCount ?? 0;
      const trasladada = results.TRASLADADA?.data?.totalCount ?? 0;
      const hurtada = results.HURTADA?.data?.totalCount ?? 0;
      const chatarrizada = results.CHATARRIZADA?.data?.totalCount ?? 0;
      const totalReal = activa + cancelada + trasladada + hurtada + chatarrizada;

      this.countsPorEstado.set({
        ACTIVA: activa,
        CANCELADA: cancelada,
        TRASLADADA: trasladada,
        HURTADA: hurtada,
        CHATARRIZADA: chatarrizada
      });

      this.kpis.update(k => ({
        ...k,
        totalVehiculos: totalReal > 0 ? totalReal : (k.totalVehiculos || 0),
        totalVehiculosActivos: activa,
        totalVehiculosInactivos: cancelada + trasladada + hurtada + chatarrizada
      }));
    });
  }

  actualizarPendientesCount(totalPendientes: number): void {
    this.kpis.update(k => ({ ...k, totalPendientesAprobacion: totalPendientes }));
  }
}
