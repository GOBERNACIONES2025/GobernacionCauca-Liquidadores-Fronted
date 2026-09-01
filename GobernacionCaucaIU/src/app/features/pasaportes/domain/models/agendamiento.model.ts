export interface TipoPasaporte {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface CalendarioDisponible {
  idTipo: number;
  idTipoPasaporte: number;
  fecha: string;
  cantidad: number;
  citas: number;
  disponibles: number;
}

export interface IntervaloDisponible {
  idTipo: number;
  idHora: number;
  idCitaHora: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface ObtenerCalendarioRequest {
  anio: number;
  mes: number;
  idTipoPasaporte: number;
}

export interface ObtenerIntervalosDisponiblesRequest {
  fecha: string;
  idTipo: number;
  idFormalizador: number | null;
  idTipoPasaporte: number;
}
