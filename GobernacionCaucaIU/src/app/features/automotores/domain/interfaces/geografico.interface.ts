export interface DepartamentoDto {
  id: number;
  codigo?: string;
  nombre: string;
}
export type CatalogoDepartamento = DepartamentoDto;
export type Departamento = DepartamentoDto;

export interface CiudadDto {
  id: number;
  codigo?: string;
  nombre: string;
  departamentoId: number;
}
export type CatalogoCiudad = CiudadDto;
export type Ciudad = CiudadDto;
