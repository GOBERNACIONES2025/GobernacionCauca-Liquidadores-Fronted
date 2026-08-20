import { Exencion } from './exencion.model';

export interface TipoActoRegistroRef {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/**
 * DTO para la vinculación Acto - Exención.
 */
export interface ActoExencion {
  id: number;
  tipoActoRegistro: TipoActoRegistroRef;
  exencion: Exencion;
}

/**
 * Payload para vincular tipos de acto a una exención.
 */
export interface CrearActoExencionRequest {
  exencionId: number;
  tiposActoRegistroIds: number[];
}
