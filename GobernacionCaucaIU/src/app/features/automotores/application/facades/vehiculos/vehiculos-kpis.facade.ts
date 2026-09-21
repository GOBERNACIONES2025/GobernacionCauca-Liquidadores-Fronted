import { Injectable, inject, signal } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
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
    });
  }

  actualizarPendientesCount(totalPendientes: number): void {
    this.kpis.update(k => ({ ...k, totalPendientesAprobacion: totalPendientes }));
  }
}
