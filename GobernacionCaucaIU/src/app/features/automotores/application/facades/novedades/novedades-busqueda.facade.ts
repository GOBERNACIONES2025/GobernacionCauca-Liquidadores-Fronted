import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { VehiculosApiService } from '../../../infrastructure/api/vehiculos-api.service';
import { NovedadesApiService } from '../../../infrastructure/api/novedades-api.service';
import { VehiculoItemDto } from '../../../domain/interfaces/vehiculo.interface';
import { 
  NovedadItemDto, 
  NovedadDetalleDto, 
  NovedadKpisDto, 
  EstadoNovedad 
} from '../../../domain/interfaces/novedades.interface';

export interface NovedadHistoricoItem {
  id: string;
  rawId?: number;
  fecha: string;
  placa: string;
  tipoNovedad: string;
  detalle: string;
  responsable: string;
  estado: string;
  anexo?: string;
  motivo?: string;
  observaciones?: string;
  fechaRadicacion?: string;
  createdAt?: string;
  numeroRadicado?: string;
  datosPreviosJson?: string;
  datosNuevosJson?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NovedadesBusquedaFacade {
  private readonly vehiculosApi = inject(VehiculosApiService);
  private readonly novedadesApi = inject(NovedadesApiService);

  readonly placa = signal<string>('');
  readonly vehiculo = signal<VehiculoItemDto | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly kpis = signal<NovedadKpisDto | null>(null);
  readonly historialNovedades = signal<NovedadHistoricoItem[]>([]);
  readonly detalleModal = signal<NovedadDetalleDto | null>(null);
  readonly accionLoading = signal<number | null>(null);

  readonly vehiculoDisplay = computed(() => {
    const v = this.vehiculo();
    if (!v) return null;
    const anyV = v as any;
    return {
      placa: v.placa || '',
      marca: v.marca || 'MARCA N/A',
      linea: v.linea || '',
      modelo: v.modelo || 'N/A',
      estadoMatricula: v.estadoMatricula || anyV.estadoMatriculaNombre || 'Activo',
      organismoTransito: v.organismoTransito || anyV.organismoTransitoNombre || 'Popayán',
      clase: v.clase || 'Automóvil',
      cilindraje: v.cilindraje ? `${v.cilindraje} cc` : 'N/A',
      combustible: v.combustible || v.tipoCombustible || 'Gasolina',
      servicio: v.servicio || 'Particular',
      municipio: anyV.municipioNombre || anyV.municipio || v.organismoTransito || 'Popayán',
      propietarioNombre: v.propietario?.nombre || v.propietarioNombre || 'Contribuyente Principal',
    };
  });

  onPlacaInput(value: string): void {
    this.placa.set(value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    if (this.error()) {
      this.error.set(null);
    }
  }

  buscarPlaca(): Observable<VehiculoItemDto | null> {
    const rawPlaca = this.placa().trim().toUpperCase();
    if (!rawPlaca) {
      this.error.set('Por favor ingrese una placa para realizar la búsqueda.');
      return of(null);
    }

    if (rawPlaca.length < 5 || rawPlaca.length > 7) {
      this.error.set('La placa debe tener entre 5 y 7 caracteres alfanuméricos.');
      return of(null);
    }

    this.loading.set(true);
    this.error.set(null);

    return this.vehiculosApi.getVehiculos({ page: 1, pageSize: 10, buscar: rawPlaca }).pipe(
      map(res => {
        this.loading.set(false);
        const items: VehiculoItemDto[] = res?.data?.items || (res as any)?.items || [];
        const encontrado = items.find((v: VehiculoItemDto) => v.placa?.toUpperCase() === rawPlaca) || items[0] || null;

        if (encontrado) {
          this.vehiculo.set(encontrado);
          this.cargarHistorialVehiculo(encontrado.placa);
          return encontrado;
        } else {
          this.vehiculo.set(null);
          this.error.set(`No se encontró ningún vehículo registrado con la placa ${rawPlaca}.`);
          return null;
        }
      }),
      catchError(() => {
        this.loading.set(false);
        this.vehiculo.set(null);
        this.error.set(`No fue posible consultar la placa ${rawPlaca}. Verifique la conexión con el servidor.`);
        return of(null);
      })
    );
  }

  cargarKpis(): void {
    this.novedadesApi.getKpis().subscribe({
      next: (res) => {
        if (res?.data) {
          this.kpis.set(res.data);
        }
      },
      error: () => {}
    });
  }

  cargarHistorialGeneral(): void {
    this.novedadesApi.getNovedades({ page: 1, pageSize: 20 }).subscribe({
      next: (res) => {
        const items = res?.data?.items || (res as any)?.items || [];
        this.historialNovedades.set(items.map(n => this.mapNovedadItem(n)));
      },
      error: () => {
        this.historialNovedades.set([]);
      }
    });
  }

  cargarHistorialVehiculo(placa: string): void {
    this.novedadesApi.getByPlaca(placa).subscribe({
      next: (res) => {
        const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (items.length > 0) {
          this.historialNovedades.set(items.map(n => this.mapNovedadItem(n)));
        }
      },
      error: () => {}
    });
  }

  verDetalle(novedad: NovedadHistoricoItem): void {
    if (novedad.rawId) {
      this.novedadesApi.getById(novedad.rawId).subscribe({
        next: (res) => {
          if (res?.data) {
            this.detalleModal.set(res.data);
          } else {
            this.detalleModal.set(this.buildDetalleFromHistorico(novedad));
          }
        },
        error: () => {
          this.detalleModal.set(this.buildDetalleFromHistorico(novedad));
        }
      });
    } else {
      this.detalleModal.set(this.buildDetalleFromHistorico(novedad));
    }
  }

  cerrarModalDetalle(): void {
    this.detalleModal.set(null);
  }

  esPendiente(estado: string | undefined | null): boolean {
    if (!estado) return false;
    const est = estado.trim().toUpperCase();
    return est === 'RADICADO' || est === 'EN_REVISION' || est === 'RADICADA';
  }

  cambiarEstado(idOrItem: any, nuevoEstado: EstadoNovedad, observaciones?: string): Observable<any> {
    const rawId = typeof idOrItem === 'number' ? idOrItem : (idOrItem?.rawId || idOrItem?.id);
    const numId = Number(rawId);
    if (!numId || isNaN(numId)) {
      return of({ success: false, message: 'Identificador de novedad no válido.' });
    }

    const novedadActual = this.historialNovedades().find(n => n.rawId === numId || n.id === String(numId));
    if (novedadActual && !this.esPendiente(novedadActual.estado)) {
      return of({ 
        success: false, 
        message: `La novedad ya se encuentra en estado ${novedadActual.estado} y no puede ser modificada nuevamente.` 
      });
    }

    this.accionLoading.set(numId);
    return this.novedadesApi.cambiarEstado(numId, {
      nuevoEstado,
      observaciones: observaciones || `Novedad marcada como ${nuevoEstado} en visto bueno tributario`
    }).pipe(
      map(res => {
        this.accionLoading.set(null);
        if (this.vehiculo()) {
          this.cargarHistorialVehiculo(this.vehiculo()!.placa);
        } else {
          this.cargarHistorialGeneral();
        }
        this.cargarKpis();
        return { success: true, data: res };
      }),
      catchError(err => {
        this.accionLoading.set(null);
        const errMsg = err?.error?.message || err?.message || 'Error al actualizar el estado de la novedad.';
        return of({ success: false, message: errMsg });
      })
    );
  }

  limpiarBusqueda(): void {
    this.placa.set('');
    this.vehiculo.set(null);
    this.error.set(null);
    this.cargarHistorialGeneral();
  }

  mapNovedadItem(n: NovedadItemDto | any): NovedadHistoricoItem {
    return {
      id: n.numeroRadicado || (n.id ? `NOV-${n.id}` : 'NOV-S/N'),
      rawId: n.id,
      fecha: n.fechaRadicacion ? n.fechaRadicacion.substring(0, 10) : (n.createdAt ? n.createdAt.substring(0, 10) : ''),
      placa: n.placa || '',
      tipoNovedad: n.tipoNovedad || 'Novedad',
      detalle: n.motivo || n.observaciones || `Trámite ${n.tipoNovedad || ''}`,
      responsable: n.propietarioActual || 'Liquidador Automotores',
      estado: n.estado || 'RADICADO',
      anexo: n.rutaArchivoSoporte ? n.rutaArchivoSoporte.split('/').pop() : undefined,
      datosPreviosJson: n.datosPreviosJson,
      datosNuevosJson: n.datosNuevosJson
    };
  }

  private buildDetalleFromHistorico(n: NovedadHistoricoItem): NovedadDetalleDto {
    return {
      id: n.rawId || 0,
      vehiculoId: 0,
      placa: n.placa,
      numeroRadicado: n.numeroRadicado || n.id,
      tipoNovedad: (n.tipoNovedad || 'TRASPASO') as any,
      estado: (n.estado || 'RADICADO') as any,
      motivo: n.motivo || n.detalle,
      observaciones: n.observaciones,
      rutaArchivoSoporte: n.anexo,
      fechaRadicacion: n.fechaRadicacion || n.fecha,
      createdAt: n.createdAt || n.fecha,
      datosPreviosJson: n.datosPreviosJson,
      datosNuevosJson: n.datosNuevosJson
    };
  }
}
