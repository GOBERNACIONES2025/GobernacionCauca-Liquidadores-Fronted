import { Injectable } from '@angular/core';
import { AdminAppointment, AdminMetric, AppointmentRequest, Formalizer } from '../../domain/models/pasaportes-admin.model';

@Injectable({ providedIn: 'root' })
export class PasaportesAdminDemoService {
  getMetrics(): readonly AdminMetric[] {
    return [
      { label: 'Citas solicitadas', value: 128, icon: 'fa-calendar-check', accentClass: 'text-blue-700 bg-blue-50' },
      { label: 'Pendientes de agendamiento', value: 34, icon: 'fa-clock', accentClass: 'text-amber-700 bg-amber-50' },
      { label: 'Citas agendadas', value: 94, icon: 'fa-circle-check', accentClass: 'text-violet-700 bg-violet-50' },
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

  getAppointments(): readonly AdminAppointment[] {
    return [
      { id: 1, ticket: 'PSP-202609-001', citizen: 'Miguel Ángel Rivera Ocampo', documentType: 'Cédula de ciudadanía', document: '1.002.965.354', appointmentType: 'Público general', passportType: 'Ordinario', dateIso: '2026-09-02', date: '02/09/2026', time: '08:00 a. m.', status: 'Finalizada', priority: false, extraordinary: false, email: 'miguel.rivera@correo.com', phone: '300 456 7890', paymentReference: 'PSP202609001' },
      { id: 2, ticket: 'PSP-202609-002', citizen: 'Paula Andrea Alvear Gaviria', documentType: 'Cédula de ciudadanía', document: '1.002.965.534', appointmentType: 'Público general', passportType: 'Ejecutivo', dateIso: '2026-09-03', date: '03/09/2026', time: '08:20 a. m.', status: 'Finalizada', priority: true, extraordinary: false, email: 'paula.alvear@correo.com', phone: '310 551 2210', paymentReference: 'PSP202609002' },
      { id: 3, ticket: 'PSP-202609-003', citizen: 'Valentina Muñoz Quintero', documentType: 'Tarjeta de identidad', document: '1.058.940.166', appointmentType: 'Santander de Quilichao', passportType: 'Ordinario', dateIso: '2026-09-07', date: '07/09/2026', time: '09:00 a. m.', status: 'Finalizada', priority: false, extraordinary: false, email: 'valentina.munoz@correo.com', phone: '312 728 4410', paymentReference: 'PSP202609003' },
      { id: 4, ticket: 'PSP-202609-004', citizen: 'Erick Mauricio Escobar Erazo', documentType: 'Cédula de ciudadanía', document: '1.029.602.945', appointmentType: 'Público general', passportType: 'Ordinario', dateIso: '2026-09-08', date: '08/09/2026', time: '09:25 a. m.', status: 'Agendada', priority: false, extraordinary: false, email: 'erick.escobar@correo.com', phone: '316 622 9081', paymentReference: 'PSP202609004' },
      { id: 5, ticket: 'PSP-202609-005', citizen: 'Yudy Alexandra Velasco Covo', documentType: 'Cédula de ciudadanía', document: '1.143.832.956', appointmentType: 'Secretaría de Gobierno', passportType: 'Ordinario', dateIso: '2026-09-09', date: '09/09/2026', time: '10:10 a. m.', status: 'Finalizada', priority: true, extraordinary: false, email: 'yudy.velasco@correo.com', phone: '301 780 2461', paymentReference: 'PSP202609005' },
      { id: 6, ticket: 'PSP-202609-006', citizen: 'Osvaldo Morales Martínez', documentType: 'Cédula de ciudadanía', document: '1.113.670.351', appointmentType: 'Público general', passportType: 'Ejecutivo', dateIso: '2026-09-10', date: '10/09/2026', time: '10:40 a. m.', status: 'Finalizada', priority: false, extraordinary: false, email: 'osvaldo.morales@correo.com', phone: '315 907 1312', paymentReference: 'PSP202609006' },
      { id: 7, ticket: 'PSP-202609-007', citizen: 'Angie Valentina Muñoz Quiñones', documentType: 'Cédula de ciudadanía', document: '1.061.808.272', appointmentType: 'Público general', passportType: 'Ordinario', dateIso: '2026-09-11', date: '11/09/2026', time: '11:15 a. m.', status: 'Finalizada', priority: false, extraordinary: false, email: 'angie.munoz@correo.com', phone: '300 881 5627', paymentReference: 'PSP202609007' },
      { id: 8, ticket: 'PSP-202609-008', citizen: 'María Fernanda López', documentType: 'Cédula de ciudadanía', document: '1.061.723.458', appointmentType: 'Público general', passportType: 'Ordinario', dateIso: '2026-09-14', date: '14/09/2026', time: '08:00 a. m.', status: 'Agendada', priority: false, extraordinary: false, email: 'maria.lopez@correo.com', phone: '310 330 9175', paymentReference: 'PSP202609008' },
      { id: 9, ticket: 'PSP-202609-009', citizen: 'Carlos Andrés Muñoz', documentType: 'Cédula de ciudadanía', document: '76.328.914', appointmentType: 'Santander de Quilichao', passportType: 'Ejecutivo', dateIso: '2026-09-15', date: '15/09/2026', time: '09:20 a. m.', status: 'Agendada', priority: false, extraordinary: true, email: 'carlos.munoz@correo.com', phone: '300 667 1089', paymentReference: 'PSP202609009' },
      { id: 10, ticket: 'PSP-202609-010', citizen: 'Laura Sofía Gómez', documentType: 'Cédula de ciudadanía', document: '1.004.521.876', appointmentType: 'Público general', passportType: 'Ordinario', dateIso: '2026-09-16', date: '16/09/2026', time: '10:40 a. m.', status: 'Agendada', priority: false, extraordinary: false, email: 'laura.gomez@correo.com', phone: '314 812 6671', paymentReference: 'PSP202609010' },
      { id: 11, ticket: 'PSP-202609-011', citizen: 'Juan Sebastián Ruiz', documentType: 'Cédula de ciudadanía', document: '10.298.745', appointmentType: 'Secretaría de Gobierno', passportType: 'Emergencia', dateIso: '2026-09-17', date: '17/09/2026', time: '02:00 p. m.', status: 'Agendada', priority: true, extraordinary: true, email: 'juan.ruiz@correo.com', phone: '300 112 3509', paymentReference: 'PSP202609011' },
      { id: 12, ticket: 'PSP-202609-012', citizen: 'Diana Marcela Campo', documentType: 'Cédula de ciudadanía', document: '1.061.045.912', appointmentType: 'Público general', passportType: 'Ordinario', dateIso: '2026-09-18', date: '18/09/2026', time: '03:15 p. m.', status: 'Pendiente', priority: false, extraordinary: false, email: 'diana.campo@correo.com', phone: '313 240 8332' },
      { id: 13, ticket: 'PSP-202609-013', citizen: 'Samuel Andrés Díaz', documentType: 'Cédula de ciudadanía', document: '1.064.778.320', appointmentType: 'Santander de Quilichao', passportType: 'Ordinario', dateIso: '2026-09-21', date: '21/09/2026', time: '08:35 a. m.', status: 'Pendiente', priority: false, extraordinary: false, email: 'samuel.diaz@correo.com', phone: '300 218 5177' },
      { id: 14, ticket: 'PSP-202609-014', citizen: 'Natalia Andrea Hoyos', documentType: 'Cédula de ciudadanía', document: '1.006.429.711', appointmentType: 'Público general', passportType: 'Ejecutivo', dateIso: '2026-09-22', date: '22/09/2026', time: '09:50 a. m.', status: 'Cancelada', priority: false, extraordinary: false, email: 'natalia.hoyos@correo.com', phone: '316 220 4192', paymentReference: 'PSP202609014' },
      { id: 15, ticket: 'PSP-202609-015', citizen: 'Ana Milena Campo', documentType: 'Cédula de ciudadanía', document: '1.061.872.349', appointmentType: 'Secretaría de Gobierno', passportType: 'Ordinario', dateIso: '2026-09-23', date: '23/09/2026', time: '11:30 a. m.', status: 'Pendiente', priority: false, extraordinary: false, email: 'ana.campo@correo.com', phone: '315 200 8801' },
      { id: 16, ticket: 'PSP-202609-016', citizen: 'Diego Fernando Paz', documentType: 'Cédula de ciudadanía', document: '1.022.335.691', appointmentType: 'Público general', passportType: 'Ordinario', dateIso: '2026-09-24', date: '24/09/2026', time: '02:25 p. m.', status: 'Pendiente', priority: false, extraordinary: false, email: 'diego.paz@correo.com', phone: '301 821 6011' },
      { id: 17, ticket: 'PSP-202608-017', citizen: 'Juliana Andrea Rosero', documentType: 'Cédula de ciudadanía', document: '1.005.861.920', appointmentType: 'Público general', passportType: 'Ordinario', dateIso: '2026-08-24', date: '24/08/2026', time: '08:45 a. m.', status: 'Finalizada', priority: false, extraordinary: false, email: 'juliana.rosero@correo.com', phone: '311 554 7700', paymentReference: 'PSP202608017' },
      { id: 18, ticket: 'PSP-202608-018', citizen: 'Felipe Andrés Cerón', documentType: 'Cédula de ciudadanía', document: '1.061.222.419', appointmentType: 'Santander de Quilichao', passportType: 'Ejecutivo', dateIso: '2026-08-25', date: '25/08/2026', time: '10:15 a. m.', status: 'Finalizada', priority: true, extraordinary: false, email: 'felipe.ceron@correo.com', phone: '314 901 2200', paymentReference: 'PSP202608018' },
    ];
  }

}
