export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[] | any;
}

export interface CatalogoItem {
  id: number | string;
  nombre: string;
  codigo?: string;
}

export interface CatalogoMarca {
  id: number | string;
  nombre: string;
  codigo?: string;
}

export interface CatalogoLinea {
  id: number | string;
  marcaId?: number | string;
  marcaNombre?: string;
  nombre: string;
  clase?: string;
  cilindraje?: number;
  combustible?: string;
}

export interface CatalogoTipoDocumento {
  id: number;
  codigo: string;
  nombre: string;
  requiereDigitoVerificacion?: boolean;
}

export interface CatalogoNaturalezaJuridica {
  id: number;
  codigo: string;
  nombre: string;
}

export interface CatalogoDepartamento {
  id: number;
  codigo?: string;
  nombre: string;
}

export interface CatalogoCiudad {
  id: number;
  codigo?: string;
  nombre: string;
  departamentoId: number;
}

export interface PropietarioInicialDto {
  personaId?: number | null;
  tipoDocumentoId: number;
  numeroDocumento: string;
  digitoVerificacion?: string | null;
  naturalezaJuridicaId: number;
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  razonSocial?: string | null;
  correoElectronico?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  departamentoId?: number | null;
  ciudadId?: number | null;
  tipoVinculoPersonaId: number;
  porcentajePropiedad: number;
  fechaInicio: string;
  esResponsablePrincipal: boolean;
}

export interface RegistrarVehiculoDto {
  placa: string;
  estadoMatriculaId: number;
  marca: string;
  linea: string;
  modelo: number;
  color?: string;
  servicio?: string;
  tipoVehiculo: string;
  clase: string;
  combustible: string;
  cilindraje: number;
  pasajeros?: number;
  numeroMotor?: string;
  vinChasis?: string;
  organismoTransitoId?: number;
  fechaMatricula?: string;
  propietarioInicial?: PropietarioInicialDto | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface VehiculoItem {
  id: number;
  placa: string;
  marca: string;
  linea: string;
  modelo: number;
  cilindraje: number;
  tipoCombustible?: string;
  combustible?: string;
  clase?: string;
  tipoVehiculo?: string;
  color?: string;
  servicio?: string;
  tipoVinculo?: string;
  pasajeros?: number;
  organismoTransito?: string;
  organismoTransitoId?: number;
  fechaMatricula?: string;
  estadoMatricula: string;
  estadoMatriculaId?: number;
  estadoAprobacion?: string;
  exencion?: string;
  seleccionado?: boolean;
  propietario: {
    nombre: string;
    tipoDocumento: string;
    numeroDocumento: string;
    tipoPersona?: string;
  };
  tituloFichaTecnica?: string;
  subtituloFichaTecnica?: string;
  propietarioId?: number;
  propietarioNombre?: string;
  propietarioDocumento?: string;
}

// Alias for backward compatibility
export type Vehiculo = VehiculoItem;

export interface VehiculoDetalleCompleto extends VehiculoItem {
  pasajeros?: number;
  numeroMotor?: string;
  vinChasis?: string;
  organismoTransito?: string;
  fechaMatricula?: string;
  porcentajeParticipacion?: number;
  responsablePrincipal?: boolean;
  fechaInicioVinculacion?: string;
  observaciones?: string;
  historial?: Array<{
    fecha: string;
    titulo: string;
    descripcion: string;
    usuario: string;
  }>;
}

export interface VehiculoKpis {
  vigenciaFiscal: number;
  vigenciaEstado: string;
  vigenciaFecha: string;
  valorUvt: number;
  uvtVariacion: string;
  uvtNorma: string;
  sancionMinima: number;
  sancionDescripcion: string;
  auditadosHoy: number;
  auditadosUltimo: string;
  totalVehiculos?: number;
  totalVehiculosActivos?: number;
  totalVehiculosInactivos?: number;
  totalPendientesAprobacion?: number;
}
