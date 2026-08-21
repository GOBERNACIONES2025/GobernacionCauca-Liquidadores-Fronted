import { Departamento } from './departamento.model';

export interface Municipio {
  id: number;
  codigoDane: string;
  nombre: string;
  activo: boolean;
  departamentoId: number;
  departamento?: Departamento | string;
}

export interface CrearMunicipioRequest {
  codigoDane: string;
  nombre: string;
  departamentoId: number;
}

export interface ActualizarMunicipioRequest {
  codigoDane: string;
  nombre: string;
  activo: boolean;
  departamentoId: number;
}


