import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PasaportesAdminDemoService } from '../../../../application/demo/pasaportes-admin-demo.service';
import { AdminAppointment } from '../../../../domain/models/pasaportes-admin.model';

interface DashboardStatusItem {
  label: string;
  value: number;
  total: number;
  className: string;
  dotClass: string;
}

interface DashboardTypeItem {
  label: string;
  value: number;
  percent: number;
  className: string;
}

interface DashboardAlert {
  title: string;
  detail: string;
  icon: string;
  className: string;
}

@Component({
  selector: 'app-pasaportes-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pasaportes-admin-dashboard.html',
})
export class PasaportesAdminDashboard {
  private readonly demo = inject(PasaportesAdminDemoService);

  readonly metrics = this.demo.getMetrics();
  readonly formalizers = this.demo.getFormalizers();
  readonly allAppointments = this.demo.getAppointments();

  readonly recentAppointments = [...this.allAppointments]
    .filter((appointment) => appointment.dateIso.startsWith('2026-09'))
    .sort((a, b) => `${b.dateIso} ${b.time}`.localeCompare(`${a.dateIso} ${a.time}`))
    .slice(0, 6);

  readonly todaySummary = {
    total: 18,
    attended: 11,
    inService: 2,
    pending: 5,
    progress: 61,
  };

  readonly financialSummary = {
    liquidated: 7_845_000,
    collected: 6_390_000,
    pending: 1_455_000,
    collectionPercent: 81,
  };

  readonly appointmentStatus: readonly DashboardStatusItem[] = [
    { label: 'Finalizadas', value: 61, total: 128, className: 'bg-emerald-500', dotClass: 'bg-emerald-500' },
    { label: 'Agendadas', value: 33, total: 128, className: 'bg-violet-500', dotClass: 'bg-violet-500' },
    { label: 'Pendientes', value: 29, total: 128, className: 'bg-amber-500', dotClass: 'bg-amber-500' },
    { label: 'Canceladas', value: 5, total: 128, className: 'bg-rose-500', dotClass: 'bg-rose-500' },
  ];

  readonly appointmentTypes: readonly DashboardTypeItem[] = [
    { label: 'Público general', value: 92, percent: 72, className: 'bg-[#1b53ad]' },
    { label: 'Santander de Quilichao', value: 22, percent: 17, className: 'bg-cyan-500' },
    { label: 'Secretaría de Gobierno', value: 14, percent: 11, className: 'bg-violet-500' },
  ];

  readonly alerts: readonly DashboardAlert[] = [
    {
      title: 'Próxima semana sin apertura completa',
      detail: 'Aún quedan cupos por definir para Secretaría de Gobierno.',
      icon: 'fa-calendar-days',
      className: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    {
      title: '5 citas pendientes de atención hoy',
      detail: 'Revisa la distribución de taquillas antes del cierre de jornada.',
      icon: 'fa-clock',
      className: 'border-blue-200 bg-blue-50 text-blue-800',
    },
  ];

  moneda(valor: number): string {
    return valor.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }

  porcentaje(value: number, total: number): number {
    if (!total) return 0;
    return Math.min(100, Math.round((value / total) * 100));
  }

  appointmentStatusClass(status: AdminAppointment['status']): string {
    switch (status) {
      case 'Finalizada': return 'bg-emerald-100 text-emerald-700';
      case 'Agendada': return 'bg-violet-100 text-violet-700';
      case 'Pendiente': return 'bg-amber-100 text-amber-700';
      case 'Cancelada': return 'bg-rose-100 text-rose-700';
    }
  }
}
