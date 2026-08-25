export interface PropietarioInicialRequest {
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
export type PropietarioInicialDto = PropietarioInicialRequest;

export interface CreateVehiculoRequest {
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
  propietarioInicial?: PropietarioInicialRequest | null;
}
export type RegistrarVehiculoDto = CreateVehiculoRequest;

export interface UpdateVehiculoRequest extends Partial<CreateVehiculoRequest> {}

export interface VincularPropietarioRequest {
  personaId?: number;
  tipoVinculoPersonaId: number;
  porcentajePropiedad: number;
  fechaInicio: string;
  esResponsablePrincipal: boolean;
}

export interface VehiculoFiltros {
  page?: number;
  pageSize?: number;
  buscar?: string;
  estado?: string;
  tipoVehiculo?: string;
  estadoMatriculaId?: number;
  soloActivos?: boolean;
}

export interface VehiculoItemDto {
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
export type VehiculoItem = VehiculoItemDto;
export type Vehiculo = VehiculoItemDto;

export interface VehiculoDetalleDto extends VehiculoItemDto {
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
export type VehiculoDetalleCompleto = VehiculoDetalleDto;

export interface VehiculoKpisDto {
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
}
export type VehiculoKpis = VehiculoKpisDto;

export interface PropiedadVehiculoItemDto {
  propietarioId: number;
  nombrePropietario: string;
  tipoDocumento: string;
  numeroDocumento: string;
  tipoVinculo: string;
  porcentajePropiedad: number;
  esResponsablePrincipal: boolean;
  fechaInicio: string;
}

export interface NovedadVehiculoDto {
  fecha: string;
  titulo: string;
  descripcion: string;
  usuario: string;
}

export interface VehiculoExpedienteDto {
  vehiculo: VehiculoDetalleDto;
  propietarios: PropiedadVehiculoItemDto[];
  novedades: NovedadVehiculoDto[];
}
