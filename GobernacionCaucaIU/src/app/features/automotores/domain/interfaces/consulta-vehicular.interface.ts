export interface ConsultaVehicularRequest {
  tipoDocumento: number;
  numeroDocumento: string;
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
  vigencia: number;
  placa: string;
  detalle: string;
  valor: number;
  estado: string;
}

export interface ConsultaVehicularData {
  propietario: PropietarioConsultaDto;
  vehiculo: VehiculoConsultaDto;
  relacionPropietario: RelacionPropietarioConsultaDto;
  novedades: NovedadConsultaDto[];
  historial: HistorialConsultaDto[];
  liquidaciones: LiquidacionConsultaDto[];
}
