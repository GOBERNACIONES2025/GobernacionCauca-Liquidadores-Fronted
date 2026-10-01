import { Component, computed, inject, signal } from '@angular/core';
import { PasaportesConfiguracionDemoService } from '../../../../application/demo/pasaportes-configuracion-demo.service';

interface FormalizadorOperacionDemo {
  id: number;
  taquilla: string;
  asignadas: number;
  atendidas: number;
  pendientes: number;
  tiempoPromedio: number;
  proximaCita: string;
  estadoBase: 'Disponible' | 'Atendiendo';
}

interface BloqueoFormalizadorDemo {
  id: number;
  formalizadorId: number;
  fecha: string;
  todoDia: boolean;
  horaInicio: string;
  horaFin: string;
  motivo: string;
}

interface CitaJornadaDemo {
  hora: string;
  ticket: string;
  ciudadano: string;
  estado: 'Atendida' | 'En atención' | 'Agendada' | 'Pendiente';
  tipo: string;
}

type EstadoFormalizadorView = 'Disponible' | 'Atendiendo' | 'Bloqueado' | 'No disponible' | 'Inactivo';

const localIsoDate = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (iso: string, days: number): string => {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localIsoDate(date);
};

@Component({
  selector: 'app-pasaportes-admin-formalizadores',
  standalone: true,
  templateUrl: './pasaportes-admin-formalizadores.html',
})
export class PasaportesAdminFormalizadores {
  readonly configuracionService = inject(PasaportesConfiguracionDemoService);

  readonly fecha = signal(localIsoDate());
  readonly busqueda = signal('');
  readonly filtroEstado = signal<'Todos' | EstadoFormalizadorView>('Todos');
  readonly seleccionado = signal<number | null>(null);
  readonly modalBloqueo = signal<number | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly errorBloqueo = signal<string | null>(null);

  readonly bloqueoFecha = signal(localIsoDate());
  readonly bloqueoTodoDia = signal(false);
  readonly bloqueoInicio = signal('08:00');
  readonly bloqueoFin = signal('10:00');
  readonly bloqueoMotivo = signal('');

  private readonly operacion: FormalizadorOperacionDemo[] = [
    { id: 1, taquilla: 'Taquilla 1', asignadas: 18, atendidas: 12, pendientes: 6, tiempoPromedio: 11, proximaCita: '10:35 a. m.', estadoBase: 'Atendiendo' },
    { id: 2, taquilla: 'Taquilla 2', asignadas: 16, atendidas: 13, pendientes: 3, tiempoPromedio: 9, proximaCita: '10:45 a. m.', estadoBase: 'Disponible' },
    { id: 3, taquilla: 'Taquilla 3', asignadas: 14, atendidas: 8, pendientes: 6, tiempoPromedio: 12, proximaCita: '11:00 a. m.', estadoBase: 'Disponible' },
  ];

  readonly bloqueos = signal<BloqueoFormalizadorDemo[]>([
    { id: 1, formalizadorId: 3, fecha: localIsoDate(), todoDia: true, horaInicio: '00:00', horaFin: '23:59', motivo: 'Permiso personal' },
    { id: 2, formalizadorId: 1, fecha: addDays(localIsoDate(), 1), todoDia: false, horaInicio: '14:00', horaFin: '15:30', motivo: 'Capacitación interna' },
  ]);

  readonly formalizadores = computed(() => {
    const configurados = this.configuracionService.configuracion().formalizadores;
    return configurados.map((formalizador) => {
      const operacion = this.operacion.find((item) => item.id === formalizador.id) ?? {
        id: formalizador.id,
        taquilla: `Taquilla ${formalizador.id}`,
        asignadas: 0,
        atendidas: 0,
        pendientes: 0,
        tiempoPromedio: 0,
        proximaCita: '—',
        estadoBase: 'Disponible' as const,
      };
      return {
        ...formalizador,
        ...operacion,
        estado: this.estadoFormalizador(formalizador.id, formalizador.activo, formalizador.disponible),
      };
    });
  });

  readonly filtrados = computed(() => {
    const term = this.normalizar(this.busqueda());
    const estado = this.filtroEstado();
    return this.formalizadores().filter((item) => {
      const matchesTerm = !term || this.normalizar(`${item.nombre} ${item.taquilla}`).includes(term);
      const matchesState = estado === 'Todos' || item.estado === estado;
      return matchesTerm && matchesState;
    });
  });

  readonly resumen = computed(() => {
    const items = this.formalizadores();
    return {
      activos: items.filter((item) => item.activo).length,
      disponibles: items.filter((item) => item.estado === 'Disponible').length,
      atendiendo: items.filter((item) => item.estado === 'Atendiendo').length,
      atendidas: items.reduce((total, item) => total + item.atendidas, 0),
    };
  });

  readonly formalizadorSeleccionado = computed(() => this.formalizadores().find((item) => item.id === this.seleccionado()) ?? null);
  readonly formalizadorBloqueo = computed(() => this.formalizadores().find((item) => item.id === this.modalBloqueo()) ?? null);

  readonly bloqueosFecha = computed(() => this.bloqueos()
    .filter((bloqueo) => bloqueo.fecha >= this.fecha())
    .sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`))
    .slice(0, 5));

  cambiarFecha(value: string): void {
    if (!value) return;
    this.fecha.set(value);
    this.mensaje.set(null);
  }

  cambiarBusqueda(value: string): void {
    this.busqueda.set(value);
  }

  cambiarEstado(value: string): void {
    this.filtroEstado.set(value as 'Todos' | EstadoFormalizadorView);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('Todos');
  }

  abrirJornada(id: number): void {
    this.seleccionado.set(id);
  }

  cerrarJornada(): void {
    this.seleccionado.set(null);
  }

  abrirBloqueo(id: number): void {
    this.modalBloqueo.set(id);
    this.bloqueoFecha.set(this.fecha());
    this.bloqueoTodoDia.set(false);
    this.bloqueoInicio.set('08:00');
    this.bloqueoFin.set('10:00');
    this.bloqueoMotivo.set('');
    this.errorBloqueo.set(null);
  }

  cerrarBloqueo(): void {
    this.modalBloqueo.set(null);
    this.errorBloqueo.set(null);
  }

  guardarBloqueo(): void {
    const formalizadorId = this.modalBloqueo();
    const fecha = this.bloqueoFecha();
    const motivo = this.bloqueoMotivo().trim();
    if (!formalizadorId || !fecha || !motivo) {
      this.errorBloqueo.set('Seleccione la fecha e indique el motivo del bloqueo.');
      return;
    }

    const todoDia = this.bloqueoTodoDia();
    const inicio = todoDia ? '00:00' : this.bloqueoInicio();
    const fin = todoDia ? '23:59' : this.bloqueoFin();
    if (!todoDia && (!inicio || !fin || inicio >= fin)) {
      this.errorBloqueo.set('La hora final debe ser posterior a la hora inicial.');
      return;
    }

    const nextId = Math.max(0, ...this.bloqueos().map((item) => item.id)) + 1;
    this.bloqueos.update((actual) => [...actual, {
      id: nextId,
      formalizadorId,
      fecha,
      todoDia,
      horaInicio: inicio,
      horaFin: fin,
      motivo,
    }]);

    const nombre = this.formalizadores().find((item) => item.id === formalizadorId)?.nombre ?? 'Formalizador';
    this.mensaje.set(`Disponibilidad de ${nombre} bloqueada correctamente para la demostración.`);
    this.cerrarBloqueo();
  }

  eliminarBloqueo(id: number): void {
    this.bloqueos.update((actual) => actual.filter((item) => item.id !== id));
    this.mensaje.set('Bloqueo personal retirado correctamente para la demostración.');
  }

  nombreFormalizador(id: number): string {
    return this.formalizadores().find((item) => item.id === id)?.nombre ?? `Formalizador ${id}`;
  }

  porcentajeAtencion(atendidas: number, asignadas: number): number {
    if (!asignadas) return 0;
    return Math.round((atendidas / asignadas) * 100);
  }

  estadoClass(estado: EstadoFormalizadorView): string {
    switch (estado) {
      case 'Disponible': return 'bg-emerald-100 text-emerald-700';
      case 'Atendiendo': return 'bg-blue-100 text-blue-700';
      case 'Bloqueado': return 'bg-amber-100 text-amber-800';
      case 'No disponible': return 'bg-slate-100 text-slate-600';
      case 'Inactivo': return 'bg-rose-100 text-rose-700';
    }
  }

  estadoDotClass(estado: EstadoFormalizadorView): string {
    switch (estado) {
      case 'Disponible': return 'bg-emerald-500';
      case 'Atendiendo': return 'bg-blue-500';
      case 'Bloqueado': return 'bg-amber-500';
      case 'No disponible': return 'bg-slate-400';
      case 'Inactivo': return 'bg-rose-500';
    }
  }

  jornada(id: number): readonly CitaJornadaDemo[] {
    const jornadas: Record<number, CitaJornadaDemo[]> = {
      1: [
        { hora: '08:00', ticket: 'PSP-202609-021', ciudadano: 'María Camila Rosero', estado: 'Atendida', tipo: 'Público general' },
        { hora: '08:15', ticket: 'PSP-202609-022', ciudadano: 'Jorge Andrés Muñoz', estado: 'Atendida', tipo: 'Público general' },
        { hora: '08:30', ticket: 'PSP-202609-023', ciudadano: 'Natalia Gómez Díaz', estado: 'Atendida', tipo: 'Secretaría de Gobierno' },
        { hora: '10:20', ticket: 'PSP-202609-031', ciudadano: 'Samuel Torres Paz', estado: 'En atención', tipo: 'Público general' },
        { hora: '10:35', ticket: 'PSP-202609-032', ciudadano: 'Laura Fernanda Ruiz', estado: 'Agendada', tipo: 'Santander de Quilichao' },
        { hora: '10:50', ticket: 'PSP-202609-033', ciudadano: 'Daniela Campo López', estado: 'Agendada', tipo: 'Público general' },
      ],
      2: [
        { hora: '08:05', ticket: 'PSP-202609-041', ciudadano: 'Ricardo Melo Díaz', estado: 'Atendida', tipo: 'Público general' },
        { hora: '08:20', ticket: 'PSP-202609-042', ciudadano: 'Paula Andrea Rojas', estado: 'Atendida', tipo: 'Santander de Quilichao' },
        { hora: '09:45', ticket: 'PSP-202609-049', ciudadano: 'Mateo Andrés Paz', estado: 'Atendida', tipo: 'Público general' },
        { hora: '10:45', ticket: 'PSP-202609-052', ciudadano: 'Carolina Gómez', estado: 'Agendada', tipo: 'Público general' },
      ],
      3: [
        { hora: '08:10', ticket: 'PSP-202609-061', ciudadano: 'Andrea Valentina León', estado: 'Atendida', tipo: 'Secretaría de Gobierno' },
        { hora: '08:25', ticket: 'PSP-202609-062', ciudadano: 'Felipe Andrés Ruiz', estado: 'Atendida', tipo: 'Público general' },
        { hora: '11:00', ticket: 'PSP-202609-068', ciudadano: 'Sofía Martínez', estado: 'Pendiente', tipo: 'Público general' },
      ],
    };
    return jornadas[id] ?? [];
  }

  jornadaEstadoClass(estado: CitaJornadaDemo['estado']): string {
    switch (estado) {
      case 'Atendida': return 'bg-emerald-100 text-emerald-700';
      case 'En atención': return 'bg-blue-100 text-blue-700';
      case 'Agendada': return 'bg-violet-100 text-violet-700';
      case 'Pendiente': return 'bg-amber-100 text-amber-700';
    }
  }

  fechaLegible(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    if (!year || !month || !day) return iso;
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
      .format(new Date(year, month - 1, day))
      .replace('.', '');
  }

  private estadoFormalizador(id: number, activo: boolean, disponible: boolean): EstadoFormalizadorView {
    if (!activo) return 'Inactivo';
    const bloqueo = this.bloqueos().find((item) => item.formalizadorId === id && item.fecha === this.fecha() && item.todoDia);
    if (bloqueo) return 'Bloqueado';
    if (!disponible) return 'No disponible';
    return this.operacion.find((item) => item.id === id)?.estadoBase ?? 'Disponible';
  }

  private normalizar(value: string): string {
    return value.toLocaleLowerCase('es-CO').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }
}
