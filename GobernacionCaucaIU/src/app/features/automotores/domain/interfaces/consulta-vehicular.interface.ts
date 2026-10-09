// Autor: Juan Sebastián Montaño Pérez
// Fecha: 08/10/2026
// Módulo: Consultas Vehiculares
// Descripción: Interfaces de dominio para la consulta pública vehicular y liquidaciones del ciudadano.

export interface ConsultaVehicularRequest {
  tipoDocumento?: number;
  numeroDocumento?: string;
  placa: string;
}

export interface PropietarioConsultaDto {
  id: number;
  tipoDocumentoId: number;
  numeroDocumento: string;
  nombreCompleto: string;
  correoElectronico?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  activo?: boolean;
  estaEnmascarado?: boolean;
  puedeDesenmascarar?: boolean;
}

export interface SolicitudOtpCiudadanoRequest {
  propietarioId: number;
  placa: string;
}

export interface ValidarOtpCiudadanoRequest {
  propietarioId: number;
  placa: string;
  codigo: string;
}

export interface RespuestaValidacionOtpDto {
  propietario: PropietarioConsultaDto;
  tokenAutorizacion?: string;
}

export interface VehiculoConsultaDto {
  id: number;
  placa: string;
  tipoVehiculo?: string | null;
  clase?: string | null;
  servicio?: string | null;
  combustible?: string | null;
  marca: string;
  linea: string;
  modelo: number;
  cilindraje: number;
  tonelaje?: number | null;
  pasajeros?: number | null;
  watts?: number | null;
  fechaMatricula?: string | null;
  estadoMatriculaId?: number;
  estadoMatriculaNombre?: string | null;
  organismoTransitoId?: number;
  organismoTransitoNombre?: string | null;
  organismoTransito?: string | null;
  organismoTransitoDescripcion?: string | null;
  nombreOrganismoTransito?: string | null;
  secretaria?: string | null;
  secretariaTransito?: string | null;
  municipio?: string | null;
  municipioNombre?: string | null;
  municipioTransito?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RelacionPropietarioConsultaDto {
  id: number;
  tipoVinculoNombre?: string | null;
  porcentajePropiedad?: number;
  esResponsablePrincipal?: boolean;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  esActual?: boolean;
}

export interface NovedadConsultaDto {
  id?: number;
  tipoNovedad?: string;
  detalle?: string;
  fecha?: string;
  estado?: string;
}

export interface HistorialConsultaDto {
  fecha: string;
  accion: string;
  usuario?: string;
}

export interface LiquidacionConsultaDto {
  liquidacionId: number;
  vigencia: number;
  placa: string;
  detalle: string;
  valor: number;
  estado: string;
  numeroLiquidacion?: string | null;
}

export interface ConsultaVehicularData {
  propietario: PropietarioConsultaDto;
  vehiculo: VehiculoConsultaDto;
  relacionPropietario: RelacionPropietarioConsultaDto;
  novedades: NovedadConsultaDto[];
  historial: HistorialConsultaDto[];
  liquidaciones: LiquidacionConsultaDto[];
}

export interface LiquidacionCiudadano {
  id: string;
  liquidacionId: number;    // ID numérico real de la BD — se envía al endpoint de pagos
  vigencia: number;
  placa: string;
  detalle: string;
  valor: number;
  estado: string;
  esPagada: boolean;
  numeroLiquidacion?: string | null;
}

export interface PropietarioCiudadano {
  id?: number;
  nombre: string;
  tipoDocumentoId: number;
  tipoDocumentoNombre: string;
  documento: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  activo: boolean;
  estaEnmascarado?: boolean;
}

