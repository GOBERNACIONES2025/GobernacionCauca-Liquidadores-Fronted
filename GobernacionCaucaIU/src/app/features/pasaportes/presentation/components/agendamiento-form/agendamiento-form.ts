import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FlujoPasaporteDemoService } from '../../../application/demo/flujo-pasaporte-demo.service';

@Component({ selector: 'app-agendamiento-form', standalone: true, templateUrl: './agendamiento-form.html' })
export class AgendamientoForm {
  private readonly demo = inject(FlujoPasaporteDemoService);
  readonly fechaSeleccionada = input<string | null>(null);
  readonly horaSeleccionada = input<string | null>(null);
  readonly fechaChange = output<string>();
  readonly horaChange = output<string>();
  readonly anterior = output<void>();
  readonly continuar = output<void>();
  readonly fechaVista = signal(new Date());
  readonly nombresMes = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  readonly diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  readonly diasDelMes = computed(() => Array.from({ length: new Date(this.fechaVista().getFullYear(), this.fechaVista().getMonth() + 1, 0).getDate() }, (_, i) => i + 1));
  readonly espaciosIniciales = computed(() => Array.from({ length: new Date(this.fechaVista().getFullYear(), this.fechaVista().getMonth(), 1).getDay() }));
  readonly fechas = computed(() => this.demo.obtenerFechasDisponibles(this.fechaVista().getFullYear(), this.fechaVista().getMonth() + 1));
  readonly horas = computed(() => this.fechaSeleccionada() ? this.demo.obtenerHorasDisponibles(this.fechaSeleccionada()!) : []);
  cambiarMes(delta: number): void { const actual = this.fechaVista(); this.fechaVista.set(new Date(actual.getFullYear(), actual.getMonth() + delta, 1)); }
  seleccionarMes(event: Event): void { const actual = this.fechaVista(); this.fechaVista.set(new Date(actual.getFullYear(), Number((event.target as HTMLSelectElement).value), 1)); }
  fechaIso(dia: number): string { const vista = this.fechaVista(); return `${vista.getFullYear()}-${String(vista.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`; }
  fechaDisponible(fecha: string): boolean { return this.fechas().includes(fecha); }
  seleccionarDia(dia: number): void { const fecha = this.fechaIso(dia); if (this.fechaDisponible(fecha)) this.fechaChange.emit(fecha); }
}
