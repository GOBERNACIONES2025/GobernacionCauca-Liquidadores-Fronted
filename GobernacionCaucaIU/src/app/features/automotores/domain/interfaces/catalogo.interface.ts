export interface CatalogoItemDto {
  id: number | string;
  nombre: string;
  codigo?: string;
}
export type CatalogoItem = CatalogoItemDto;

export interface TipoDocumentoDto {
  id: number;
  codigo: string;
  nombre: string;
  requiereDigitoVerificacion?: boolean;
}
export type CatalogoTipoDocumento = TipoDocumentoDto;
export type TipoDocumento = TipoDocumentoDto;

export interface NaturalezaJuridicaDto {
  id: number;
  codigo: string;
  nombre: string;
}
export type CatalogoNaturalezaJuridica = NaturalezaJuridicaDto;
export type NaturalezaJuridica = NaturalezaJuridicaDto;

export interface MarcaDto {
  id: number | string;
  nombre: string;
  codigo?: string;
}
export type CatalogoMarca = MarcaDto;

export interface LineaDto {
  id: number | string;
  marcaId?: number | string;
  marcaNombre?: string;
  nombre: string;
  clase?: string;
  cilindraje?: number;
  combustible?: string;
}
export type CatalogoLinea = LineaDto;

export interface TodosCatalogosDto {
  estadosMatricula?: CatalogoItemDto[];
  serviciosVehiculo?: CatalogoItemDto[];
  tiposVinculo?: CatalogoItemDto[];
  tiposVehiculo?: CatalogoItemDto[];
  combustibles?: CatalogoItemDto[];
  organismosTransito?: CatalogoItemDto[];
  tiposDocumento?: TipoDocumentoDto[];
  naturalezasJuridicas?: NaturalezaJuridicaDto[];
  clasesVehiculo?: CatalogoItemDto[];
}
