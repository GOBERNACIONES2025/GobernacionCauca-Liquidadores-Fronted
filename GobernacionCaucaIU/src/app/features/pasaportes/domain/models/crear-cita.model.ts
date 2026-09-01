export interface CrearCitaRequest {
  idTipoDoc: number;
  idTipoPasaporte: number;
  documento: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  municipio: string;
  departamento: string;
  genero: string;
  discapacidad: string;
  etnia: string;
  nombreResponsable: string;
  documentoResponsable: string;
  fechaNacimiento: string;
  idCitaHora: number;
  fecha: string;
}

export interface CrearCitaResponse {
  consecutivo: number;
}
