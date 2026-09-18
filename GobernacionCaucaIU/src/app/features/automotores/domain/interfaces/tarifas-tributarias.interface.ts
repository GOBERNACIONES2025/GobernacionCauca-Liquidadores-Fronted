export interface TarifaTributariaDto {
  id: number;
  vigenciaFiscalId: number;
  normaTributariaId: number;
  departamentoId: number;
  servicioVehiculoId: number;
  claseVehiculoId: number;
  combustibleId: number;
  baseGravableDesde: number;
  baseGravableHasta: number;
  porcentajeTarifa: number;
  ordenRango: number;
  activa: boolean;
  createdAt?: string;
  updatedAt?: string;
  rowVersion?: string;

  // Propiedades resueltas opcionales para visualización
  vigenciaFiscalAnio?: number;
  normaTributariaNombre?: string;
  departamentoNombre?: string;
  servicioVehiculoNombre?: string;
  claseVehiculoNombre?: string;
  combustibleNombre?: string;
}

export interface CreateTarifaTributariaRequest {
  vigenciaFiscalId: number;
  normaTributariaId: number;
  departamentoId: number;
  servicioVehiculoId: number;
  claseVehiculoId: number;
  combustibleId: number;
  baseGravableDesde: number;
  baseGravableHasta: number;
  porcentajeTarifa: number;
  ordenRango: number;
  activa?: boolean;
}

export interface UpdateTarifaTributariaRequest {
  id: number;
  vigenciaFiscalId: number;
  normaTributariaId: number;
  departamentoId: number;
  servicioVehiculoId: number;
  claseVehiculoId: number;
  combustibleId: number;
  baseGravableDesde: number;
  baseGravableHasta: number;
  porcentajeTarifa: number;
  ordenRango: number;
  activa: boolean;
  rowVersion?: string;
}

export interface FiltrosTarifaTributaria {
  vigenciaFiscalId?: number;
  departamentoId?: number;
  claseVehiculoId?: number;
  servicioVehiculoId?: number;
  combustibleId?: number;
  normaTributariaId?: number;
  activa?: boolean;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}
