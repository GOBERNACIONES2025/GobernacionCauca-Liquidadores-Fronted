import { TipoEntidadRegistro } from './tipo-entidad-registro.model';
import { Departamento } from '../Territorios/departamento.model';
import { Municipio } from '../Territorios/municipio.model';

/**
 * DTO para la entidad Entidad de Registro.
 */
export interface EntidadRegistro {
  id: number;
  tipoEntidadRegistro: TipoEntidadRegistro;
  departamento: Departamento;
  municipio: Municipio;
  nit: string;
  codigo: string;
  nombre: string;
  emailContacto?: string | null;
  activo: boolean;
}

/**
 * Payload para registrar una nueva Entidad de Registro.
 */
export interface CrearEntidadRegistroDto {
  tipoEntidadRegistroId: number;
  departamentoId: number;
  municipioId: number;
  nit: string;
  codigo: string;
  nombre: string;
  emailContacto?: string | null;
}

/**
 * Payload para actualizar una Entidad de Registro existente.
 */
export interface ActualizarEntidadRegistroDto {
  id: number;
  tipoEntidadRegistroId: number;
  departamentoId: number;
  municipioId: number;
  nit: string;
  codigo: string;
  nombre: string;
  emailContacto?: string | null;
  activo: boolean;
}
