import { Component, computed, inject, signal } from '@angular/core';
import { AdminAppointment, AdminAppointmentStatus } from '../../../../domain/models/pasaportes-admin.model';
import { PasaportesAdminDemoService } from '../../../../application/demo/pasaportes-admin-demo.service';

@Component({
  selector: 'app-pasaportes-admin-citas',
  standalone: true,
  templateUrl: './pasaportes-admin-citas.html',
})
export class PasaportesAdminCitas {
  private readonly demo = inject(PasaportesAdminDemoService);
  private readonly pageSize = 8;

  readonly appointments = this.demo.getAppointments();
  readonly month = signal(this.currentMonth());
  readonly search = signal('');
  readonly appointmentType = signal('Todos');
  readonly status = signal<'Todos' | AdminAppointmentStatus>('Todos');
  readonly page = signal(1);
  readonly selected = signal<AdminAppointment | null>(null);

  readonly monthAppointments = computed(() =>
    this.appointments.filter((appointment) => appointment.dateIso.startsWith(this.month())),
  );

  readonly filteredAppointments = computed(() => {
    const term = this.normalize(this.search());
    const appointmentType = this.appointmentType();
    const status = this.status();

    return this.monthAppointments().filter((appointment) => {
      const matchesTerm = !term || this.normalize([
        appointment.ticket,
        appointment.citizen,
        appointment.document,
        appointment.documentType,
        appointment.passportType,
        appointment.appointmentType,
      ].join(' ')).includes(term);
      const matchesType = appointmentType === 'Todos' || appointment.appointmentType === appointmentType;
      const matchesStatus = status === 'Todos' || appointment.status === status;
      return matchesTerm && matchesType && matchesStatus;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredAppointments().length / this.pageSize)));
  readonly visibleAppointments = computed(() => {
    const safePage = Math.min(this.page(), this.totalPages());
    const start = (safePage - 1) * this.pageSize;
    return this.filteredAppointments().slice(start, start + this.pageSize);
  });

  readonly summary = computed(() => {
    const appointments = this.monthAppointments();
    return {
      total: appointments.length,
      pending: appointments.filter((item) => item.status === 'Pendiente').length,
      scheduled: appointments.filter((item) => item.status === 'Agendada').length,
      finished: appointments.filter((item) => item.status === 'Finalizada').length,
    };
  });

  readonly typeSummary = computed(() => {
    const appointments = this.monthAppointments();
    return [
      { label: 'Público general', short: 'General', icon: 'fa-users', class: 'bg-blue-50 text-blue-700 border-blue-100', count: appointments.filter((item) => item.appointmentType === 'Público general').length },
      { label: 'Santander de Quilichao', short: 'Santander', icon: 'fa-location-dot', class: 'bg-cyan-50 text-cyan-700 border-cyan-100', count: appointments.filter((item) => item.appointmentType === 'Santander de Quilichao').length },
      { label: 'Secretaría de Gobierno', short: 'Secretaría', icon: 'fa-building', class: 'bg-rose-50 text-rose-700 border-rose-100', count: appointments.filter((item) => item.appointmentType === 'Secretaría de Gobierno').length },
    ];
  });

  readonly monthLabel = computed(() => {
    const [year, month] = this.month().split('-').map(Number);
    if (!year || !month) return 'Mes seleccionado';
    return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' })
      .format(new Date(year, month - 1, 1));
  });

  changeMonth(value: string): void {
    if (!value) return;
    this.month.set(value);
    this.page.set(1);
  }

  changeSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  changeType(value: string): void {
    this.appointmentType.set(value);
    this.page.set(1);
  }

  changeStatus(value: string): void {
    this.status.set(value as 'Todos' | AdminAppointmentStatus);
    this.page.set(1);
  }

  clearFilters(): void {
    this.search.set('');
    this.appointmentType.set('Todos');
    this.status.set('Todos');
    this.page.set(1);
  }

  previousPage(): void {
    this.page.update((value) => Math.max(1, value - 1));
  }

  nextPage(): void {
    this.page.update((value) => Math.min(this.totalPages(), value + 1));
  }

  openDetail(appointment: AdminAppointment): void {
    this.selected.set(appointment);
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  statusClass(status: AdminAppointmentStatus): string {
    switch (status) {
      case 'Finalizada': return 'bg-emerald-100 text-emerald-700';
      case 'Agendada': return 'bg-blue-100 text-blue-700';
      case 'Pendiente': return 'bg-amber-100 text-amber-700';
      case 'Cancelada': return 'bg-rose-100 text-rose-700';
    }
  }

  statusDotClass(status: AdminAppointmentStatus): string {
    switch (status) {
      case 'Finalizada': return 'bg-emerald-500';
      case 'Agendada': return 'bg-blue-500';
      case 'Pendiente': return 'bg-amber-500';
      case 'Cancelada': return 'bg-rose-500';
    }
  }

  private currentMonth(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private normalize(value: string): string {
    return value.toLocaleLowerCase('es-CO').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }
}
