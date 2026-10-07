import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { NovedadesCatalogosFacade } from './novedades/novedades-catalogos.facade';
import { NovedadesBusquedaFacade, NovedadHistoricoItem } from './novedades/novedades-busqueda.facade';
import { NovedadesOperacionesFacade, TipoNovedadVehiculo, RadicarResultado } from './novedades/novedades-operaciones.facade';
import { EstadoNovedad } from '../../domain/interfaces/novedades.interface';
import { VehiculoItemDto } from '../../domain/interfaces/vehiculo.interface';

export { NovedadesCatalogosFacade } from './novedades/novedades-catalogos.facade';
export { NovedadesBusquedaFacade } from './novedades/novedades-busqueda.facade';
export type { NovedadHistoricoItem } from './novedades/novedades-busqueda.facade';
export { NovedadesOperacionesFacade } from './novedades/novedades-operaciones.facade';
export type { TipoNovedadVehiculo, RadicarResultado } from './novedades/novedades-operaciones.facade';

/**
 * Facade Principal / Orquestador del Módulo de Novedades Vehiculares.
 * Agrupa y coordina los sub-facades especializados:
 * - catalogos: Gestión de tipos de documento y organismos de tránsito.
 * - busqueda: Búsqueda de vehículos por placa, KPIs, historial y detalle.
 * - operaciones: Formularios de traspaso, traslado, rematrícula y radicación.
 */
@Injectable({
  providedIn: 'root'
})
export class NovedadesFacade {
  readonly catalogos = inject(NovedadesCatalogosFacade);
  readonly busqueda = inject(NovedadesBusquedaFacade);
  readonly operaciones = inject(NovedadesOperacionesFacade);

  // --------------------------------------------------------------------------
  // CATÁLOGOS Y OPCIONES
  // --------------------------------------------------------------------------
  readonly tiposDocumento = this.catalogos.tiposDocumento;
  readonly organismosTransito = this.catalogos.organismosTransito;
  readonly catalogosLoading = this.catalogos.catalogosLoading;

  readonly tiposNovedadOpciones = [
    { id: 'Traspaso de Propiedad del Vehiculo', nombre: 'Traspaso de Propiedad del Vehículo' },
    { id: 'Traslado', nombre: 'Traslado de Cuenta / Matrícula' },
    { id: 'Rematricula', nombre: 'Rematrícula' },
  ];

  // --------------------------------------------------------------------------
  // BÚSQUEDA Y CONSULTA DE VEHÍCULO
  // --------------------------------------------------------------------------
  readonly placa = this.busqueda.placa;
  readonly vehiculo = this.busqueda.vehiculo;
  readonly loading = this.busqueda.loading;
  readonly error = this.busqueda.error;
  readonly vehiculoDisplay = this.busqueda.vehiculoDisplay;

  // --------------------------------------------------------------------------
  // HISTORIAL, KPIS Y DETALLE
  // --------------------------------------------------------------------------
  readonly kpis = this.busqueda.kpis;
  readonly historialNovedades = this.busqueda.historialNovedades;
  readonly detalleModal = this.busqueda.detalleModal;
  readonly accionLoading = this.busqueda.accionLoading;

  // --------------------------------------------------------------------------
  // OPERACIONES Y FORMULARIOS
  // --------------------------------------------------------------------------
  readonly tipoNovedad = this.operaciones.tipoNovedad;
  readonly submitting = this.operaciones.submitting;
  readonly anexoTraspaso = this.operaciones.anexoTraspaso;
  readonly anexoTraslado = this.operaciones.anexoTraslado;
  readonly anexoRematricula = this.operaciones.anexoRematricula;

  get traspasoForm() {
    return this.operaciones.traspasoForm;
  }
  set traspasoForm(value) {
    this.operaciones.traspasoForm = value;
  }

  get trasladoForm() {
    return this.operaciones.trasladoForm;
  }
  set trasladoForm(value) {
    this.operaciones.trasladoForm = value;
  }

  get rematriculaForm() {
    return this.operaciones.rematriculaForm;
  }
  set rematriculaForm(value) {
    this.operaciones.rematriculaForm = value;
  }

  // --------------------------------------------------------------------------
  // ACCIONES PRINCIPALES
  // --------------------------------------------------------------------------
  init(): void {
    this.catalogos.cargarCatalogos();
    this.busqueda.cargarHistorialGeneral();
    this.busqueda.cargarKpis();
  }

  onPlacaInput(val: string): void {
    this.busqueda.onPlacaInput(val);
  }

  buscarPlaca(): void {
    this.busqueda.buscarPlaca().subscribe(encontrado => {
      if (encontrado) {
        this.operaciones.autocompletarFormularios(encontrado);
      }
    });
  }

  onTipoNovedadChange(tipo: string): void {
    this.operaciones.tipoNovedad.set(tipo as TipoNovedadVehiculo);
    if (this.vehiculo()) {
      this.operaciones.autocompletarFormularios(this.vehiculo()!);
    }
  }

  limpiarBusqueda(): void {
    this.busqueda.limpiarBusqueda();
    this.operaciones.tipoNovedad.set('');
    this.operaciones.limpiarFormularios(null);
  }

  verDetalle(novedad: NovedadHistoricoItem): void {
    this.busqueda.verDetalle(novedad);
  }

  cerrarModalDetalle(): void {
    this.busqueda.cerrarModalDetalle();
  }

  esPendiente(estado: string | undefined | null): boolean {
    return this.busqueda.esPendiente(estado);
  }

  cambiarEstado(idOrItem: any, nuevoEstado: EstadoNovedad, observaciones?: string): Observable<any> {
    return this.busqueda.cambiarEstado(idOrItem, nuevoEstado, observaciones).pipe(
      map(res => {
        if (res.success && nuevoEstado === 'APROBADO' && res.placa) {
          // Al aprobar, refrescar el vehículo desde la API y sincronizar los formularios con los datos mutados
          this.busqueda.refrescarVehiculo(res.placa).subscribe(vehiculoActualizado => {
            if (vehiculoActualizado) {
              this.operaciones.autocompletarFormularios(vehiculoActualizado);
            }
          });
        }
        return res;
      })
    );
  }

  radicarNovedad(): Observable<RadicarResultado> {
    const v = this.vehiculo();
    if (!v) {
      return new Observable(obs => obs.next({ success: false, error: 'Primero debe consultar un vehículo con su placa.' }));
    }
    return this.operaciones.radicarNovedad(v, this.tiposDocumento());
  }
}
