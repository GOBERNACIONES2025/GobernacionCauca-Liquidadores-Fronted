export interface ParametroTributario {
  id: number;
  vigenciaFiscalId: number;
  normaTributariaId?: number | null;
  codigo: string;
  nombre: string;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string | null;
  valorDecimal?: number | null;
  valorTexto?: string | null;
  activo: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  rowVersion?: string | null;
}

export interface CreateParametroTributarioDto {
  vigenciaFiscalId: number;
  normaTributariaId?: number | null;
  codigo: string;
  nombre: string;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string | null;
  valorDecimal?: number | null;
  valorTexto?: string | null;
  activo: boolean;
}

export interface UpdateParametroTributarioDto extends CreateParametroTributarioDto {
  id: number;
  rowVersion?: string | null;
}

export interface CerrarParametroDto {
  id: number;
  fechaFinVigencia: string;
  crearNuevoPeriodo?: boolean;
  nuevaVigenciaFiscalId?: number;
  nuevoValorDecimal?: number | null;
  nuevoValorTexto?: string | null;
  nuevaFechaInicioVigencia?: string;
}
