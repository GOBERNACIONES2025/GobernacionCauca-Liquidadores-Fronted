import { PagedResult } from './api-response.interface';

export interface NormaTributariaDto {
  id: number;
  tipoNorma: string;
  numero: string;
  fechaExpedicion?: string | null;
  entidadEmisora?: string | null;
  titulo?: string | null;
  urlFuente?: string | null;
  hashDocumento?: string | null;
  activa: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  rowVersion?: string | null;
}

export interface CreateNormaTributariaRequest {
  tipoNorma: string;
  numero: string;
  fechaExpedicion?: string | null;
  entidadEmisora?: string | null;
  titulo?: string | null;
  urlFuente?: string | null;
  hashDocumento?: string | null;
  activa?: boolean;
}

export interface UpdateNormaTributariaRequest {
  id?: number;
  tipoNorma: string;
  numero: string;
  fechaExpedicion?: string | null;
  entidadEmisora?: string | null;
  titulo?: string | null;
  urlFuente?: string | null;
  hashDocumento?: string | null;
  activa?: boolean;
}

export interface FiltrosNormaTributaria {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  tipoNorma?: string;
  activa?: boolean;
}
