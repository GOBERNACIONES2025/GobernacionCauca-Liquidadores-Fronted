export interface CalendarioTributarioDto {
  id: number;
  vigenciaFiscalId: number;
  normaTributariaId?: number | null;
  codigoImpuesto: string;
  nombreImpuesto?: string;
  fechaInicio: string;
  fechaVencimiento: string;
  porcentajeDescuento: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Propiedades opcionales de compatibilidad y visualización
  fechaInicioVencimiento?: string;
  fechaFinVencimiento?: string;
  descuentoProntoPago?: number | null;
  recargoPorMora?: number | null;
  vigenciaFiscalAnio?: number;
  normaTributariaNombre?: string;
}

export interface CreateCalendarioTributarioRequest {
  vigenciaFiscalId: number;
  normaTributariaId?: number | null;
  codigoImpuesto: string;
  fechaInicio: string;
  fechaVencimiento: string;
  porcentajeDescuento: number;
  activo: boolean;
}

export interface UpdateCalendarioTributarioRequest {
  id: number;
  vigenciaFiscalId: number;
  normaTributariaId?: number | null;
  codigoImpuesto: string;
  fechaInicio: string;
  fechaVencimiento: string;
  porcentajeDescuento: number;
  activo: boolean;
}

export interface FiltrosCalendarioTributario {
  vigenciaFiscalId?: number;
  normaTributariaId?: number;
  codigoImpuesto?: string;
  activo?: boolean;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortColumn?: string;
  sortDescending?: boolean;
}
