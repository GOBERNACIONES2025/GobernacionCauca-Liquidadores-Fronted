import { Departamento } from './departamento.model';

export interface Municipio {
  id: number;
  codigoDane: string;
  nombre: string;
  activo: boolean;
  departamento: Departamento;
}

export interface CrearMunicipioRequest {
  codigoDane: string;
  nombre: string;
  departamento: Departamento;
}

export interface ActualizarMunicipioRequest {
  codigoDane: string;
  nombre: string;
  activo: boolean;
  departamento: Departamento;
}
