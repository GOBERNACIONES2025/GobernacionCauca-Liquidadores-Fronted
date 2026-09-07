import { Vigencia } from '../Normatividad/vigencia.model';

/**
 * @description
 * Modelo de dominio para la parametrización de Tasas de Interés de Mora en Registros.
 */
export interface TasaInteresMora {
  id: number;
  vigenciaId: number;
  vigenciaAnio?: number | null;
  vigencia?: Vigencia;
  fechaInicio: string;
  fechaFin: string;
  tasaMensual: number;
  tasaDiaria: number;
  activo: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

/**
 * Payload para registrar una nueva Tasa de Interés de Mora.
 */
export interface CrearTasaInteresMoraRequest {
  vigenciaId: number;
  fechaInicio: string;
  fechaFin: string;
  tasaMensual: number;
  tasaDiaria: number;
}

/**
 * Payload para actualizar una Tasa de Interés de Mora existente.
 */
export interface ActualizarTasaInteresMoraRequest {
  id: number;
  vigenciaId: number;
  fechaInicio: string;
  fechaFin: string;
  tasaMensual: number;
  tasaDiaria: number;
  activo: boolean;
}

/**
 * Parámetros para la consulta paginada y filtrado de Tasas de Interés de Mora.
 */
export interface TasaInteresMoraQueryParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  searchTerm?: string;
  activo?: boolean;
  vigenciaId?: number;
  fecha?: string;
}
