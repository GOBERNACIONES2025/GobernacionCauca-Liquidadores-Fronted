import { Departamento } from '../Territorios/departamento.model';
import { EstadoNorma } from './estado-norma.model';
import { TipoNorma } from './tipo-norma.model';

/**
 * DTO para documento asociado a una norma.
 */
export interface DocumentoNormativo {
  id: number;
  nombreArchivo: string;
  rutaArchivo: string;
  tipoArchivo: string;
}

/**
 * DTO para actualizar o agregar documentos a una norma existente.
 */
export interface DocumentoNormativoActualizarDto {
  id?: number | null;
  nombreArchivo: string;
  rutaArchivo: string;
  tipoArchivo: string;
}

/**
 * DTO resumido para listado de Normas.
 */
export interface NormaListado {
  id: number;
  numero: string;
  anio: number;
  fechaExpedicion: string;
  departamento: Departamento;
  tipoNorma: TipoNorma;
  estadoNorma: EstadoNorma;
  documentoNormativos: DocumentoNormativo[];
}

/**
 * DTO detallado para una Norma específica.
 */
export interface NormaDetalle {
  id: number;
  numero: string;
  anio: number;
  fechaExpedicion: string;
  descripcion?: string | null;
  departamento: Departamento;
  tipoNorma: TipoNorma;
  estadoNorma: EstadoNorma;
  documentoNormativos: DocumentoNormativo[];
}

/**
 * Payload para registrar una nueva Norma.
 */
export interface CrearNormaRequest {
  departamentoId: number;
  tipoNormaId: number;
  numero: string;
  anio: number;
  fechaExpedicion: string;
  descripcion?: string | null;
  estadoNormaId: number;
}

/**
 * Payload para actualizar una Norma existente.
 */
export interface ActualizarNormaRequest {
  id: number;
  departamentoId: number;
  tipoNormaId: number;
  numero: string;
  anio: number;
  fechaExpedicion: string;
  descripcion?: string | null;
  estadoNormaId: number;
  documentos?: DocumentoNormativoActualizarDto[];
}

export interface CrearDocumentoNormativoRequest {
  nombreArchivo: string;
  rutaArchivo: string;
  tipoArchivo: string;
}

export interface ActualizarDocumentoNormativoRequest {
  nombreArchivo: string;
  rutaArchivo: string;
  tipoArchivo: string;
  activo: boolean;
}
