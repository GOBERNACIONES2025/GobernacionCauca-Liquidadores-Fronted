export interface Departamento {
  id: number;
  codigoDane: string;
  nombre: string;
  activo: boolean;
}

export interface CrearDepartamentoRequest {
  codigoDane: string;
  nombre: string;
}

export interface ActualizarDepartamentoRequest {
  codigoDane: string;
  nombre: string;
  activo: boolean;
}
