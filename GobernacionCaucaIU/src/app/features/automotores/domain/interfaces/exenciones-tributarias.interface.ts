export interface ExencionTributariaDto {
  id: number;
  normaTributariaId: number;
  vigenciaFiscalId: number;
  ambito: string; // 'DEPARTAMENTAL' | 'MUNICIPAL' | 'NACIONAL'
  departamentoId: number;
  codigo: string;
  nombre: string;
  tipoBeneficio: string; // 'EXENCION' | 'DESCUENTO' | 'EXONERACION' | string
  porcentajeExoneracion: number;
  naturalezaJuridicaId?: number | null;
  servicioVehiculoId?: number | null;
  claseVehiculoId?: number | null;
  combustibleId?: number | null;
  antiguedadMinimaAnios?: number | null;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string | null;
  activa: boolean;
  createdAt?: string;
  updatedAt?: string;
  rowVersion?: string;

  // Propiedades resueltas opcionales para visualización
  vigenciaFiscalAnio?: number;
  normaTributariaNombre?: string;
  departamentoNombre?: string;
  naturalezaJuridicaNombre?: string;
  servicioVehiculoNombre?: string;
  claseVehiculoNombre?: string;
  combustibleNombre?: string;
}

export interface CreateExencionTributariaRequest {
  normaTributariaId: number;
  vigenciaFiscalId: number;
  ambito: string;
  departamentoId: number;
  codigo: string;
  nombre: string;
  tipoBeneficio: string;
  porcentajeExoneracion: number;
  naturalezaJuridicaId?: number | null;
  servicioVehiculoId?: number | null;
  claseVehiculoId?: number | null;
  combustibleId?: number | null;
  antiguedadMinimaAnios?: number | null;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string | null;
  activa?: boolean;
}

export interface UpdateExencionTributariaRequest {
  id: number;
  normaTributariaId: number;
  vigenciaFiscalId: number;
  ambito: string;
  departamentoId: number;
  codigo: string;
  nombre: string;
  tipoBeneficio: string;
  porcentajeExoneracion: number;
  naturalezaJuridicaId?: number | null;
  servicioVehiculoId?: number | null;
  claseVehiculoId?: number | null;
  combustibleId?: number | null;
  antiguedadMinimaAnios?: number | null;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string | null;
  activa: boolean;
  rowVersion?: string;
}

export interface FiltrosExencionTributaria {
  vigenciaFiscalId?: number;
  departamentoId?: number;
  normaTributariaId?: number;
  ambito?: string;
  tipoBeneficio?: string;
  activa?: boolean;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}
