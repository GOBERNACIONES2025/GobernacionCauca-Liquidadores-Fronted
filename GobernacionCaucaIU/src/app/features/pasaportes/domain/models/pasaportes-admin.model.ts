export interface AdminMetric {
  label: string;
  value: number;
  icon: string;
  accentClass: string;
}

export interface AppointmentRequest {
  citizen: string;
  document: string;
  passportType: string;
  date: string;
  time: string;
  status: 'Pendiente' | 'Confirmada';
}

export interface Formalizer {
  name: string;
  status: 'Disponible' | 'No disponible';
}

export type AdminAppointmentStatus = 'Pendiente' | 'Agendada' | 'Finalizada' | 'Cancelada';

export interface AdminAppointment {
  id: number;
  ticket: string;
  citizen: string;
  documentType: 'Cédula de ciudadanía' | 'Tarjeta de identidad' | 'Registro civil' | 'Pasaporte';
  document: string;
  appointmentType: 'Público general' | 'Santander de Quilichao' | 'Secretaría de Gobierno';
  passportType: 'Ordinario' | 'Ejecutivo' | 'Emergencia';
  dateIso: string;
  date: string;
  time: string;
  status: AdminAppointmentStatus;
  priority: boolean;
  extraordinary: boolean;
  email: string;
  phone: string;
  paymentReference?: string;
}
