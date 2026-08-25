import { Departamento } from '../Territorios/departamento.model';
import { TipoBeneficiarioExencion } from './tipo-beneficiario-exencion.model';

export interface RolIntervinienteRef {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface NormaRef {
  id: number;
  numero: string;
  anio: number;
  fechaExpedicion?: string;
  departamento?: Departamento;
}

/**
 * DTO para la entidad Exención.
 */
export interface Exencion {
  id: number;
  departamento: Departamento;
  norma: NormaRef;
  tipoBeneficiario?: TipoBeneficiarioExencion | null;
  rolInterviniente?: RolIntervinienteRef | null;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

/**
 * Payload para la creación de una nueva Exención.
 */
export interface CrearExencionRequest {
  departamentoId: number;
  normaId: number;
  tipoBeneficiarioId?: number | null;
  rolIntervinienteId?: number | null;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

/**
 * Payload para la actualización de una Exención existente.
 */
export interface ActualizarExencionRequest {
  id: number;
  departamentoId: number;
  normaId: number;
  tipoBeneficiarioId?: number | null;
  rolIntervinienteId?: number | null;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

export interface CrearRolIntervinienteRefRequest {
  codigo: string;
  nombre: string;
}

export interface ActualizarRolIntervinienteRefRequest {
  codigo: string;
  nombre: string;
  activo: boolean;
}
