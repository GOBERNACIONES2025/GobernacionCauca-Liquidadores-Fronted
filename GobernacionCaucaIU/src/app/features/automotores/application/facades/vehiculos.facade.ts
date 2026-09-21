import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  ApiResponse,
  VehiculoItem, 
  RegistrarVehiculoDto 
} from '../../domain/models/vehiculo.model';

import { VehiculosListFacade } from './vehiculos/vehiculos-list.facade';
import { VehiculosKpisFacade } from './vehiculos/vehiculos-kpis.facade';
import { VehiculosCatalogosFacade } from './vehiculos/vehiculos-catalogos.facade';
import { VehiculosPendientesFacade } from './vehiculos/vehiculos-pendientes.facade';
import { VehiculosOperacionesFacade } from './vehiculos/vehiculos-operaciones.facade';

export { VehiculosListFacade } from './vehiculos/vehiculos-list.facade';
export { VehiculosKpisFacade } from './vehiculos/vehiculos-kpis.facade';
export { VehiculosCatalogosFacade } from './vehiculos/vehiculos-catalogos.facade';
export { VehiculosPendientesFacade } from './vehiculos/vehiculos-pendientes.facade';
export { VehiculosOperacionesFacade } from './vehiculos/vehiculos-operaciones.facade';

/**
 * Centro de Mando / Orquestador Principal del Módulo de Vehículos.
 * Unifica los sub-facades especializados coordinando flujos globales y
 * preservando 100% de compatibilidad hacia atrás.
 */
@Injectable({
  providedIn: 'root',
})
export class VehiculosFacade {
  readonly list = inject(VehiculosListFacade);
  readonly kpisFacade = inject(VehiculosKpisFacade);
  readonly catalogos = inject(VehiculosCatalogosFacade);
  readonly pendientes = inject(VehiculosPendientesFacade);
  readonly operaciones = inject(VehiculosOperacionesFacade);

  // --------------------------------------------------------------------------
  // DELEGACIÓN DE SIGNALS PRINCIPALES (Grilla y Filtros)
  // --------------------------------------------------------------------------
  readonly vehiculos = this.list.vehiculos;
  readonly totalVehiculos = this.list.totalVehiculos;
  readonly paginaActual = this.list.paginaActual;
  readonly pageSize = this.list.pageSize;
  readonly totalPaginas = this.list.totalPaginas;
  readonly paginasDisponibles = this.list.paginasDisponibles;
  readonly loading = this.list.loading;
  readonly error = this.list.error;
  readonly filtroTexto = this.list.filtroTexto;
  readonly filtroEstado = this.list.filtroEstado;
  readonly filtroTipo = this.list.filtroTipo;
  readonly filteredVehiculos = this.list.filteredVehiculos;
  readonly selectedVehiculo = this.list.selectedVehiculo;
  readonly expedienteActual = this.list.expedienteActual;
  readonly expedienteLoading = this.list.expedienteLoading;
  readonly panelTab = this.list.panelTab;

  // --------------------------------------------------------------------------
  // DELEGACIÓN DE SIGNALS (KPIs)
  // --------------------------------------------------------------------------
  readonly kpis = this.kpisFacade.kpis;

  // --------------------------------------------------------------------------
  // DELEGACIÓN DE SIGNALS (Catálogos)
  // --------------------------------------------------------------------------
  readonly marcas = this.catalogos.marcas;
  readonly marcasDisponibles = this.catalogos.marcasDisponibles;
  readonly lineas = this.catalogos.lineas;
  readonly lineasDisponibles = this.catalogos.lineasDisponibles;
  readonly estadosMatricula = this.catalogos.estadosMatricula;
  readonly serviciosVehiculo = this.catalogos.serviciosVehiculo;
  readonly tiposVinculo = this.catalogos.tiposVinculo;
  readonly tiposVehiculo = this.catalogos.tiposVehiculo;
  readonly combustibles = this.catalogos.combustibles;
  readonly organismosTransito = this.catalogos.organismosTransito;
  readonly tiposDocumento = this.catalogos.tiposDocumento;
  readonly naturalezasJuridicas = this.catalogos.naturalezasJuridicas;
  readonly departamentos = this.catalogos.departamentos;
  readonly ciudades = this.catalogos.ciudades;
  readonly ciudadesDisponibles = this.catalogos.ciudadesDisponibles;
  readonly catalogosLoading = this.catalogos.catalogosLoading;
  readonly catalogosLoaded = this.catalogos.catalogosLoaded;

  // --------------------------------------------------------------------------
  // DELEGACIÓN DE SIGNALS (Pendientes de Aprobación)
  // --------------------------------------------------------------------------
  readonly vehiculosPendientesAprobacion = this.pendientes.vehiculosPendientesAprobacion;
  readonly isModalPendientesOpen = this.pendientes.isModalPendientesOpen;
  readonly cargandoPendientes = this.pendientes.cargandoPendientes;
  readonly vehiculosPendientesFiltrados = this.pendientes.vehiculosPendientesFiltrados;

  // --------------------------------------------------------------------------
  // DELEGACIÓN DE SIGNALS (Operaciones, Drawer, RUNT, Inactivar)
  // --------------------------------------------------------------------------
  readonly registroLoading = this.operaciones.registroLoading;
  readonly isDrawerOpen = this.operaciones.isDrawerOpen;
  readonly isNuevoRegistro = this.operaciones.isNuevoRegistro;
  readonly currentStep = this.operaciones.currentStep;
  readonly activeTab = this.operaciones.activeTab;
  readonly tabs = this.operaciones.tabs;
  readonly isRuntModalOpen = this.operaciones.isRuntModalOpen;
  readonly placaRunt = this.operaciones.placaRunt;
  readonly runtLoading = this.operaciones.runtLoading;
  readonly isInactivarModalOpen = this.operaciones.isInactivarModalOpen;
  readonly vehiculoAInactivar = this.operaciones.vehiculoAInactivar;
  readonly inactivandoLoading = this.operaciones.inactivandoLoading;
  readonly buscandoPropietario = this.operaciones.buscandoPropietario;
  readonly propietarioEncontrado = this.operaciones.propietarioEncontrado;
  readonly busquedaRealizada = this.operaciones.busquedaRealizada;

  // --------------------------------------------------------------------------
  // MÉTODOS ORQUESTADORES GLOBALES
  // --------------------------------------------------------------------------
  refrescarDashboard(irAPrimeraPagina: boolean = true): void {
    if (irAPrimeraPagina) {
      this.list.paginaActual.set(1);
    }
    this.kpisFacade.cargarKpis();
    this.list.cargarVehiculos(this.list.paginaActual(), this.list.pageSize());
    this.pendientes.cargarPendientesAprobacion();
  }

  // --------------------------------------------------------------------------
  // DELEGACIÓN DE MÉTODOS: Lista y Expediente
  // --------------------------------------------------------------------------
  cargarVehiculos(page: number = 1, pageSize?: number): void {
    this.list.cargarVehiculos(page, pageSize);
  }

  cambiarPagina(nuevaPagina: number): void {
    this.list.cambiarPagina(nuevaPagina);
  }

  setFiltroTexto(texto: string): void {
    this.list.setFiltroTexto(texto);
  }

  setFiltroEstado(estado: string): void {
    this.list.setFiltroEstado(estado);
  }

  setFiltroTipo(tipo: string): void {
    this.list.setFiltroTipo(tipo);
  }

  seleccionarVehiculo(v: VehiculoItem): void {
    this.list.seleccionarVehiculo(v);
  }

  deseleccionarVehiculo(): void {
    this.list.deseleccionarVehiculo();
  }

  cargarExpediente(id: number): Observable<any> {
    return this.list.cargarExpediente(id);
  }

  // --------------------------------------------------------------------------
  // DELEGACIÓN DE MÉTODOS: KPIs
  // --------------------------------------------------------------------------
  cargarKpis(): void {
    this.kpisFacade.cargarKpis();
  }

  // --------------------------------------------------------------------------
  // DELEGACIÓN DE MÉTODOS: Catálogos
  // --------------------------------------------------------------------------
  cargarCatalogos(): void {
    this.catalogos.cargarCatalogos();
  }

  cargarCiudadesPorDepartamento(departamentoId: number): void {
    this.catalogos.cargarCiudadesPorDepartamento(departamentoId);
  }

  cargarMarcasPorTipo(tipoVehiculo?: string): void {
    this.catalogos.cargarMarcasPorTipo(tipoVehiculo);
  }

  cargarLineasPorMarca(marcaNombre: string, tipoVehiculo?: string): void {
    this.catalogos.cargarLineasPorMarca(marcaNombre, tipoVehiculo);
  }

  // --------------------------------------------------------------------------
  // DELEGACIÓN DE MÉTODOS: Pendientes de Aprobación
  // --------------------------------------------------------------------------
  cargarPendientesAprobacion(): void {
    this.pendientes.cargarPendientesAprobacion();
  }

  abrirModalPendientes(): void {
    this.pendientes.abrirModalPendientes();
  }

  cerrarModalPendientes(): void {
    this.pendientes.cerrarModalPendientes();
  }

  cambiarEstadoAprobacion(id: number, nuevoEstado: string): Observable<any> {
    return this.pendientes.cambiarEstadoAprobacion(id, nuevoEstado).pipe(
      map(res => {
        this.refrescarDashboard(true);
        return res;
      })
    );
  }

  // --------------------------------------------------------------------------
  // DELEGACIÓN DE MÉTODOS: Operaciones CRUD, RUNT, Inactivar, Wizard
  // --------------------------------------------------------------------------
  crearVehiculo(payload: RegistrarVehiculoDto): Observable<ApiResponse<any>> {
    return this.operaciones.crearVehiculo(payload).pipe(
      map(res => {
        this.refrescarDashboard(true);
        return res;
      })
    );
  }

  actualizarVehiculo(id: number, payload: any): Observable<ApiResponse<any>> {
    return this.operaciones.actualizarVehiculo(id, payload);
  }

  verificarPlacaExistente(placa: string): Observable<boolean> {
    return this.operaciones.verificarPlacaExistente(placa);
  }

  inactivarVehiculo(id: number): Observable<any> {
    return this.operaciones.inactivarVehiculo(id).pipe(
      map(res => {
        this.refrescarDashboard();
        return res;
      })
    );
  }

  buscarPropietario(tipo: string | number, numero: string): Observable<any> {
    return this.operaciones.buscarPropietario(tipo, numero);
  }

  limpiarBusquedaPropietario(): void {
    this.operaciones.limpiarBusquedaPropietario();
  }

  abrirRegistro(): void {
    this.catalogos.cargarCatalogos();
    this.operaciones.abrirRegistro();
  }

  abrirExpediente(v: VehiculoItem): void {
    this.catalogos.cargarCatalogos();
    this.seleccionarVehiculo(v);
    this.operaciones.abrirExpediente();
  }

  cerrarRegistro(): void {
    this.operaciones.cerrarRegistro();
  }

  setStep(stepNumber: number): void {
    this.operaciones.setStep(stepNumber);
  }

  setTab(tabName: string): void {
    this.operaciones.setTab(tabName);
  }

  siguientePaso(): void {
    this.operaciones.siguientePaso();
  }

  anteriorPaso(): void {
    this.operaciones.anteriorPaso();
  }

  abrirInactivar(v: VehiculoItem): void {
    this.operaciones.abrirInactivar(v);
  }

  cerrarInactivar(): void {
    this.operaciones.cerrarInactivar();
  }

  confirmarInactivacion(): void {
    this.operaciones.confirmarInactivacion(() => {
      this.refrescarDashboard();
    });
  }

  abrirRunt(placa?: string): void {
    this.operaciones.abrirRunt(placa);
  }

  cerrarRunt(): void {
    this.operaciones.cerrarRunt();
  }

  consultarRunt(): void {
    this.operaciones.consultarRunt((placa: string) => {
      const found = this.vehiculos().find(v => v.placa.replace('-', '').toUpperCase() === placa.toUpperCase());
      if (found) {
        this.seleccionarVehiculo(found);
      }
    });
  }
}
