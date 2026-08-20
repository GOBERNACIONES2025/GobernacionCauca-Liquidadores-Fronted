import { Departamento } from './departamento.model';

export interface Municipio {
  id: number;
  codigoDane: string;
  nombre: string;
  activo: boolean;
  departamento: Departamento;
}
