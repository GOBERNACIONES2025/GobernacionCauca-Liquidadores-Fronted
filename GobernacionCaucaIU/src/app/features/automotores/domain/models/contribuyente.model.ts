export interface Contribuyente {
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

export interface TipoDocumento {
  id: number;
  codigo: string;
  nombre: string;
  requiereDigitoVerificacion?: boolean;
}

export interface NaturalezaJuridica {
  id: number;
  codigo: string;
  nombre: string;
}

export interface Departamento {
  id: number;
  codigo?: string;
  nombre: string;
}

export interface Ciudad {
  id: number;
  codigo?: string;
  nombre: string;
  departamentoId: number;
}

export interface VehiculoExpediente {
  placa: string;
  marca: string;
  modelo: number;
  clase: string;
  estado: string;
}

export interface Historial {
  fecha: string;
  accion: string;
  usuario: string;
}

export interface LiquidacionExpediente {
  vigencia: number;
  placa: string;
  detalle: string;
  valor: number;
  estado: string;
}

export interface Expediente {
  propietario: Contribuyente;
  vehiculos: VehiculoExpediente[];
  historial: Historial[];
  liquidaciones: LiquidacionExpediente[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}
