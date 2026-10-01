export interface CalendarioTributarioDto {
  id: number;
  vigenciaFiscalIdInicio: number;
  vigenciaFiscalIdFin: number;
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
  vigenciaFiscalId?: number;
  vigenciaFiscalInicioAnio?: number;
  vigenciaFiscalFinAnio?: number;
  fechaInicioVencimiento?: string;
  fechaFinVencimiento?: string;
  descuentoProntoPago?: number | null;
  recargoPorMora?: number | null;
  vigenciaFiscalAnio?: number;
  normaTributariaNombre?: string;
}

export interface CreateCalendarioTributarioRequest {
  vigenciaFiscalIdInicio: number;
  vigenciaFiscalIdFin: number;
  normaTributariaId: number;
  codigoImpuesto: string;
  fechaInicio: string;
  fechaVencimiento: string;
  porcentajeDescuento: number;
  activo: boolean;
}

export interface UpdateCalendarioTributarioRequest {
  id: number;
  vigenciaFiscalIdInicio: number;
  vigenciaFiscalIdFin: number;
  normaTributariaId: number;
  codigoImpuesto: string;
  fechaInicio: string;
  fechaVencimiento: string;
  porcentajeDescuento: number;
  activo: boolean;
}

export interface FiltrosCalendarioTributario {
  vigenciaFiscalIdInicio?: number;
  vigenciaFiscalIdFin?: number;
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
