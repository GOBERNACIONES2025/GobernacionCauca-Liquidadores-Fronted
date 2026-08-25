export interface PropietarioDto {
  id: number;
  tipoDocumentoId: number;
  numeroDocumento: string;
  digitoVerificacion?: string;
  naturalezaJuridicaId: number;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  razonSocial?: string;
  correoElectronico?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  ciudadId?: number;
  departamentoId?: number;
  cantidadVehiculos: number;
  cantidadDeudas: number;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
}
export type Contribuyente = PropietarioDto;

export interface CreatePropietarioRequest {
  tipoDocumentoId: number;
  numeroDocumento: string;
  digitoVerificacion?: string;
  naturalezaJuridicaId: number;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  razonSocial?: string;
  correoElectronico?: string;
  telefono?: string;
  direccion?: string;
  departamentoId?: number;
  ciudadId?: number;
}

export interface UpdatePropietarioRequest extends Partial<CreatePropietarioRequest> {
  activo?: boolean;
}

export interface PropietarioFiltros {
  page?: number;
  pageSize?: number;
  buscar?: string;
  soloActivos?: boolean;
}

export interface VehiculoExpedienteItemDto {
  placa: string;
  marca: string;
  modelo: number;
  clase: string;
  estado: string;
}
export type VehiculoExpediente = VehiculoExpedienteItemDto;

export interface HistorialDto {
  fecha: string;
  accion: string;
  usuario: string;
}
export type Historial = HistorialDto;

export interface LiquidacionExpedienteDto {
  vigencia: number;
  placa: string;
  detalle: string;
  valor: number;
  estado: string;
}
export type LiquidacionExpediente = LiquidacionExpedienteDto;

export interface ExpedienteDto {
  propietario: PropietarioDto;
  vehiculos: VehiculoExpedienteItemDto[];
  historial: HistorialDto[];
  liquidaciones: LiquidacionExpedienteDto[];
}
export type Expediente = ExpedienteDto;
