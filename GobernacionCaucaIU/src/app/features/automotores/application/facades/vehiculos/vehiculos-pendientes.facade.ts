import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { VehiculosApiService } from '../../../infrastructure/api/vehiculos-api.service';
import { VehiculoItem } from '../../../domain/models/vehiculo.model';
import { VehiculosKpisFacade } from './vehiculos-kpis.facade';

@Injectable({
  providedIn: 'root',
})
export class VehiculosPendientesFacade {
  private vehiculosApi = inject(VehiculosApiService);
  private kpisFacade = inject(VehiculosKpisFacade);

  readonly vehiculosPendientesAprobacion = signal<VehiculoItem[]>([]);
  readonly isModalPendientesOpen = signal<boolean>(false);
  readonly cargandoPendientes = signal<boolean>(false);
  readonly filtroPendientes = signal<string>('');

  readonly vehiculosPendientesFiltrados = computed(() => {
    const query = this.filtroPendientes().toLowerCase().trim();
    const list = this.vehiculosPendientesAprobacion();
    if (!query) return list;
    return list.filter(item => 
      item.placa.toLowerCase().includes(query) ||
      item.marca.toLowerCase().includes(query) ||
      item.linea.toLowerCase().includes(query) ||
      (item.propietarioNombre && item.propietarioNombre.toLowerCase().includes(query)) ||
      (item.propietarioDocumento && item.propietarioDocumento.toLowerCase().includes(query))
    );
  });

  cargarPendientesAprobacion(): void {
    this.cargandoPendientes.set(true);
    this.vehiculosApi.getPendientesAprobacion().pipe(
      catchError(err => {
        console.warn('Error al cargar vehículos pendientes de aprobación:', err);
        this.cargandoPendientes.set(false);
        return of(null);
      })
    ).subscribe((res: any) => {
      this.cargandoPendientes.set(false);
      if (res && res.data) {
        const rawList = Array.isArray(res.data) ? res.data : [];
        const mapped: VehiculoItem[] = rawList.map((item: any) => ({
          id: item.id,
          placa: item.placa || '',
          marca: item.marca || '',
          linea: item.linea || '',
          modelo: item.modelo || 2024,
          cilindraje: item.cilindraje || 1600,
          combustible: item.combustible || 'Gasolina',
          tipoVehiculo: item.tipoVehiculo || 'Automóvil',
          clase: item.clase || 'Automóvil',
          servicio: item.servicio || 'Particular',
          estadoMatricula: item.estadoMatricula || 'Pendiente',
          estadoMatriculaId: item.estadoMatriculaId || 2,
          estadoAprobacion: item.estadoAprobacion || 'PENDIENTE',
          propietarioId: item.propietarioId,
          propietarioNombre: item.propietarioNombre,
          propietarioDocumento: item.propietarioDocumento,
          propietarios: item.propietarios || [],
          propietario: {
            nombre: item.propietarioNombre || 'Propietario Pendiente',
            tipoDocumento: 'CC',
            numeroDocumento: item.propietarioDocumento || 'Pendiente'
          }
        }));
        this.vehiculosPendientesAprobacion.set(mapped);
        this.kpisFacade.actualizarPendientesCount(mapped.length);
      }
    });
  }

  abrirModalPendientes(): void {
    this.isModalPendientesOpen.set(true);
    this.cargarPendientesAprobacion();
  }

  cerrarModalPendientes(): void {
    this.isModalPendientesOpen.set(false);
  }

  cambiarEstadoAprobacion(id: number, nuevoEstado: string): Observable<any> {
    return this.vehiculosApi.cambiarEstadoAprobacion(id, nuevoEstado).pipe(
      map(res => {
        this.vehiculosPendientesAprobacion.update(list => list.filter(item => item.id !== id));
        this.kpisFacade.actualizarPendientesCount(this.vehiculosPendientesAprobacion().length);
        return res;
      })
    );
  }
}
