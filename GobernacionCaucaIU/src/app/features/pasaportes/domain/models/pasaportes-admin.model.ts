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
