import { Departamento } from '../Territorios/departamento.model';
import { TipoActoRegistro } from '../Registro/tipo-acto-registro.model';
import { Vigencia } from '../Normatividad/vigencia.model';
import { NormaListado } from '../Normatividad/norma.model';
import { TipoCalculoTarifa } from './tipo-calculo-tarifa.model';

/**
 * DTO para la entidad Tarifa.
 */
export interface Tarifa {
  id: number;
  departamento: Departamento;
  tipoActoRegistro: TipoActoRegistro;
  vigencia: Vigencia;
  norma: NormaListado;
  tipoCalculoTarifa: TipoCalculoTarifa;
  baseMinima?: number | null;
  baseMaxima?: number | null;
  porcentaje?: number | null;
  valorFijo?: number | null;
  valorMinimo?: number | null;
  valorMaximo?: number | null;
  activo: boolean;
}

/**
 * Payload para registrar una nueva Tarifa.
 */
export interface CrearTarifaDto {
  departamentoId: number;
  tipoActoRegistroId: number;
  vigenciaId: number;
  normaId: number;
  tipoCalculoTarifaId: number;
  baseMinima?: number | null;
  baseMaxima?: number | null;
  porcentaje?: number | null;
  valorFijo?: number | null;
  valorMinimo?: number | null;
  valorMaximo?: number | null;
}

/**
 * Payload para actualizar una Tarifa existente.
 */
export interface ActualizarTarifaDto {
  id: number;
  departamentoId: number;
  tipoActoRegistroId: number;
  vigenciaId: number;
  normaId: number;
  tipoCalculoTarifaId: number;
  baseMinima?: number | null;
  baseMaxima?: number | null;
  porcentaje?: number | null;
  valorFijo?: number | null;
  valorMinimo?: number | null;
  valorMaximo?: number | null;
  activo: boolean;
}

/**
 * Parámetros para filtrar la consulta de tarifas.
 */
export interface TarifaQueryParams {
  departamentoId?: number;
  tipoActoRegistroId?: number;
  vigenciaId?: number;
  normaId?: number;
  tipoCalculoTarifaId?: number;
  pageNumber?: number;
  pageSize?: number;
}
