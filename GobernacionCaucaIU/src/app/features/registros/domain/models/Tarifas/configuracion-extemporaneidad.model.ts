import { Departamento } from '../Territorios/departamento.model';
import { TipoCalculoTarifa } from './tipo-calculo-tarifa.model';
import { Vigencia } from '../Normatividad/vigencia.model';
import { NormaListado } from '../Normatividad/norma.model';

/**
 * @description
 * Modelo de dominio para la parametrización de Configuración de Extemporaneidad en Registros.
 */
export interface ConfiguracionExtemporaneidad {
  id: number;
  departamentoId: number;
  departamentoNombre?: string | null;
  departamento?: Departamento;
  tipoCalculoTarifaId: number;
  tipoCalculoTarifaNombre?: string | null;
  tipoCalculoTarifaCodigo?: string | null;
  tipoCalculoTarifa?: TipoCalculoTarifa;
  vigenciaId: number;
  vigenciaAnio?: number | null;
  vigencia?: Vigencia;
  normaId: number;
  normaNumero?: string | null;
  norma?: NormaListado;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  diasPlazo: number;
  porcentajeSancion?: number | null;
  valorFijoSancion?: number | null;
  aplicaInteresMora: boolean;
  activo: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

/**
 * Payload para registrar una nueva Configuración de Extemporaneidad.
 */
export interface CrearConfiguracionExtemporaneidadRequest {
  departamentoId: number;
  tipoCalculoTarifaId: number;
  vigenciaId: number;
  normaId: number;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  diasPlazo: number;
  porcentajeSancion?: number | null;
  valorFijoSancion?: number | null;
  aplicaInteresMora: boolean;
}

/**
 * Payload para actualizar una Configuración de Extemporaneidad existente.
 */
export interface ActualizarConfiguracionExtemporaneidadRequest {
  id: number;
  departamentoId: number;
  tipoCalculoTarifaId: number;
  vigenciaId: number;
  normaId: number;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  diasPlazo: number;
  porcentajeSancion?: number | null;
  valorFijoSancion?: number | null;
  aplicaInteresMora: boolean;
  activo: boolean;
}

/**
 * Parámetros para la consulta paginada y filtrado de Configuraciones de Extemporaneidad.
 */
export interface ConfiguracionExtemporaneidadQueryParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  searchTerm?: string;
  activo?: boolean;
  departamentoId?: number;
  vigenciaId?: number;
  normaId?: number;
  tipoCalculoTarifaId?: number;
}
