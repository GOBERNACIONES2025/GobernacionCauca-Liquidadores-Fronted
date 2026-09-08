import { Injectable } from '@angular/core';
import { AdminMetric, AppointmentRequest, Formalizer } from '../../domain/models/pasaportes-admin.model';

@Injectable({ providedIn: 'root' })
export class PasaportesAdminDemoService {
  // Datos temporales centralizados; estos métodos conservarán el contrato al conectarse a la API.
  getMetrics(): readonly AdminMetric[] {
    return [
      { label: 'Citas solicitadas', value: 128, icon: 'fa-calendar-check', accentClass: 'text-blue-700 bg-blue-50' },
      { label: 'Citas pendientes', value: 34, icon: 'fa-clock', accentClass: 'text-amber-700 bg-amber-50' },
      { label: 'Cupos disponibles', value: 52, icon: 'fa-calendar-plus', accentClass: 'text-emerald-700 bg-emerald-50' },
    ];
  }

  getLatestAppointments(): readonly AppointmentRequest[] {
    return [
      { citizen: 'María Fernanda López', document: '1.061.723.458', passportType: 'Ordinario', date: '24/08/2026', time: '08:00 a. m.', status: 'Pendiente' },
      { citizen: 'Carlos Andrés Muñoz', document: '76.328.914', passportType: 'Ejecutivo', date: '24/08/2026', time: '09:20 a. m.', status: 'Confirmada' },
      { citizen: 'Laura Sofía Gómez', document: '1.004.521.876', passportType: 'Ordinario', date: '25/08/2026', time: '10:40 a. m.', status: 'Pendiente' },
      { citizen: 'Juan Sebastián Ruiz', document: '10.298.745', passportType: 'Emergencia', date: '25/08/2026', time: '02:00 p. m.', status: 'Confirmada' },
    ];
  }

  getFormalizers(): readonly Formalizer[] {
    return [
      { name: 'Ana Milena Campo', status: 'Disponible' },
      { name: 'Diego Fernando Paz', status: 'Disponible' },
      { name: 'Natalia Andrea Hoyos', status: 'No disponible' },
    ];
  }
}
