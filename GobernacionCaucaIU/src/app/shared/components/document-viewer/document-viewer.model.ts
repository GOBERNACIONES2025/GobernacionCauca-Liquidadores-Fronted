export interface DocumentItem {
  id: number | string;
  nombreArchivo: string;
  rutaArchivo: string;
  tipoArchivo?: string;
  contenidoHtml?: string;
}
