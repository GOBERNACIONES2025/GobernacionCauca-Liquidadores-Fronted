import { EntidadRegistro } from './entidad-registro.model';
import { TipoActoRegistro } from './tipo-acto-registro.model';

/**
 * DTO para la relación Entidad - Tipo de Acto Permitido.
 */
export interface EntidadTipoActoPermitido {
  id: number;
  entidadRegistro: EntidadRegistro;
  tipoActoRegistro: TipoActoRegistro;
  activo: boolean;
}

/**
 * Payload para registrar una nueva relación Entidad - Tipo de Acto Permitido.
 */
export interface CrearEntidadTipoActoPermitidoDto {
  entidadRegistroId: number;
  tipoActoRegistroId: number;
}

/**
 * Payload para actualizar una relación Entidad - Tipo de Acto Permitido existente.
 */
export interface ActualizarEntidadTipoActoPermitidoDto {
  id: number;
  entidadRegistroId: number;
  tipoActoRegistroId: number;
  activo: boolean;
}
