export interface MedioPago {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  requiereComprobante: boolean;
  activo: boolean;
  createdAt?: string;
  createdBy?: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CrearMedioPagoDto {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  requiereComprobante: boolean;
}

export interface ActualizarMedioPagoDto {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  requiereComprobante: boolean;
  activo: boolean;
}
