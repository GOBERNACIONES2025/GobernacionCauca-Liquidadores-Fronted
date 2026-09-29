import { Component, computed, inject, signal } from '@angular/core';
import { PasaportesAgendaDemoService } from '../../../../application/demo/pasaportes-agenda-demo.service';
import { PasaportesConfiguracionDemoService } from '../../../../application/demo/pasaportes-configuracion-demo.service';
import { CupoSemanaEdicionDemo } from '../../../../domain/models/pasaportes-agenda-demo.model';

interface DiaCalendarioView {
  fecha: Date;
  iso: string;
  numero: number;
  delMes: boolean;
  hoy: boolean;
  finSemana: boolean;
}

interface DiaSemanaEdicionView extends CupoSemanaEdicionDemo {
  fechaDate: Date;
  nombreDia: string;
  fechaCorta: string;
  finSemana: boolean;
}

const pad = (value: number): string => String(value).padStart(2, '0');
const toIsoDate = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fromIsoDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const startOfWeekMonday = (date: Date): Date => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day));
  return result;
};

@Component({
  selector: 'app-pasaportes-admin-calendario',
  standalone: true,
  templateUrl: './pasaportes-admin-calendario.html',
})
export class PasaportesAdminCalendario {
  readonly agenda = inject(PasaportesAgendaDemoService);
  readonly configuracionService = inject(PasaportesConfiguracionDemoService);

  readonly hoy = new Date();
  readonly mesVisible = signal(new Date(this.hoy.getFullYear(), this.hoy.getMonth(), 1));
  readonly modalSemanaAbierto = signal(false);
  readonly semanaEdicion = signal<DiaSemanaEdicionView[]>([]);
  readonly errorSemana = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);

  readonly tiposActivos = computed(() => this.configuracionService.configuracion().tiposCita.filter((tipo) => tipo.activo));
  readonly bloqueosActivos = computed(() => this.configuracionService.configuracion().bloqueos.filter((bloqueo) => bloqueo.activo));

  readonly tituloMes = computed(() =>
    new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(this.mesVisible()),
  );

  readonly diasCalendario = computed<DiaCalendarioView[]>(() => {
    const base = this.mesVisible();
    const primero = new Date(base.getFullYear(), base.getMonth(), 1);
    const ultimo = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const desplazamiento = (primero.getDay() + 6) % 7; // lunes = 0
    const inicio = new Date(primero);
    inicio.setDate(primero.getDate() - desplazamiento);

    const totalCeldas = desplazamiento + ultimo.getDate() > 35 ? 42 : 35;
    return Array.from({ length: totalCeldas }, (_, index) => {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + index);
      return {
        fecha,
        iso: toIsoDate(fecha),
        numero: fecha.getDate(),
        delMes: fecha.getMonth() === base.getMonth(),
        hoy: toIsoDate(fecha) === toIsoDate(this.hoy),
        finSemana: fecha.getDay() === 0 || fecha.getDay() === 6,
      };
    });
  });

  readonly proximaSemana = computed(() => {
    const lunesActual = startOfWeekMonday(this.hoy);
    const lunes = new Date(lunesActual);
    lunes.setDate(lunes.getDate() + 7);
    const domingo = new Date(lunes);
    domingo.setDate(domingo.getDate() + 6);
    return { lunes, domingo };
  });

  readonly etiquetaProximaSemana = computed(() => {
    const { lunes, domingo } = this.proximaSemana();
    const formatter = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' });
    return `${formatter.format(lunes)} – ${formatter.format(domingo)}`;
  });

  readonly proximaSemanaYaAbierta = computed(() => {
    const { lunes } = this.proximaSemana();
    for (let i = 0; i < 5; i++) {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() + i);
      if (!this.agenda.obtener(toIsoDate(fecha))) return false;
    }
    return true;
  });

  readonly resumenMes = computed(() => {
    const base = this.mesVisible();
    const aperturasMes = this.agenda.aperturas().filter((apertura) => {
      const fecha = fromIsoDate(apertura.fecha);
      return fecha.getFullYear() === base.getFullYear() && fecha.getMonth() === base.getMonth();
    });
    return aperturasMes.reduce((acc, apertura) => {
      acc.dias++;
      for (const cupo of apertura.cupos) {
        acc.abiertos += cupo.abiertos;
        acc.reservados += cupo.reservados;
      }
      return acc;
    }, { dias: 0, abiertos: 0, reservados: 0 });
  });

  mesAnterior(): void {
    this.mesVisible.update((actual) => new Date(actual.getFullYear(), actual.getMonth() - 1, 1));
    this.mensaje.set(null);
  }

  mesSiguiente(): void {
    this.mesVisible.update((actual) => new Date(actual.getFullYear(), actual.getMonth() + 1, 1));
    this.mensaje.set(null);
  }

  irMesActual(): void {
    this.mesVisible.set(new Date(this.hoy.getFullYear(), this.hoy.getMonth(), 1));
    this.mensaje.set(null);
  }

  apertura(fecha: string) {
    return this.agenda.obtener(fecha);
  }

  bloqueo(fecha: string) {
    return this.bloqueosActivos().find((item) => item.fecha === fecha);
  }

  nombreTipo(tipoId: number): string {
    return this.configuracionService.configuracion().tiposCita.find((tipo) => tipo.id === tipoId)?.nombre ?? `Tipo ${tipoId}`;
  }

  codigoTipo(tipoId: number): string {
    return this.configuracionService.configuracion().tiposCita.find((tipo) => tipo.id === tipoId)?.codigo ?? `TIPO-${tipoId}`;
  }

  abrirSemana(): void {
    const { lunes } = this.proximaSemana();
    const tipos = this.tiposActivos();
    const dias = Array.from({ length: 7 }, (_, index): DiaSemanaEdicionView => {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() + index);
      const iso = toIsoDate(fecha);
      const existente = this.agenda.obtener(iso);
      return {
        fecha: iso,
        fechaDate: fecha,
        nombreDia: new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(fecha).replace('.', ''),
        fechaCorta: new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' }).format(fecha).replace('.', ''),
        finSemana: fecha.getDay() === 0 || fecha.getDay() === 6,
        cupos: tipos.map((tipo) => ({
          tipoCitaId: tipo.id,
          valor: existente?.cupos.find((cupo) => cupo.tipoCitaId === tipo.id)?.abiertos ?? 0,
        })),
      };
    });

    this.semanaEdicion.set(dias);
    this.errorSemana.set(null);
    this.modalSemanaAbierto.set(true);
  }

  cerrarSemana(): void {
    this.modalSemanaAbierto.set(false);
    this.errorSemana.set(null);
  }

  cambiarCupo(fecha: string, tipoCitaId: number, rawValue: string): void {
    const tipo = this.tiposActivos().find((item) => item.id === tipoCitaId);
    if (!tipo) return;
    const parsed = Number(rawValue);
    const valor = Number.isFinite(parsed) ? Math.min(tipo.cupo, Math.max(0, Math.trunc(parsed))) : 0;
    this.semanaEdicion.update((dias) => dias.map((dia) => dia.fecha !== fecha ? dia : ({
      ...dia,
      cupos: dia.cupos.map((cupo) => cupo.tipoCitaId === tipoCitaId ? { ...cupo, valor } : cupo),
    })));
  }

  usarMaximos(): void {
    const maximos = new Map(this.tiposActivos().map((tipo) => [tipo.id, tipo.cupo]));
    this.semanaEdicion.update((dias) => dias.map((dia) => dia.finSemana ? dia : ({
      ...dia,
      cupos: dia.cupos.map((cupo) => ({ ...cupo, valor: maximos.get(cupo.tipoCitaId) ?? 0 })),
    })));
    this.errorSemana.set(null);
  }

  copiarPrimerDia(): void {
    const primerHabil = this.semanaEdicion().find((dia) => !dia.finSemana);
    if (!primerHabil) return;
    const valores = new Map(primerHabil.cupos.map((cupo) => [cupo.tipoCitaId, cupo.valor]));
    this.semanaEdicion.update((dias) => dias.map((dia) => dia.finSemana ? dia : ({
      ...dia,
      cupos: dia.cupos.map((cupo) => ({ ...cupo, valor: valores.get(cupo.tipoCitaId) ?? 0 })),
    })));
    this.errorSemana.set(null);
  }

  totalDia(dia: DiaSemanaEdicionView): number {
    return dia.cupos.reduce((total, cupo) => total + cupo.valor, 0);
  }

  guardarSemana(): void {
    const diasHabiles = this.semanaEdicion().filter((dia) => !dia.finSemana);
    if (diasHabiles.some((dia) => this.totalDia(dia) === 0)) {
      this.errorSemana.set('Todos los días hábiles deben tener al menos un cupo asignado antes de abrir la semana.');
      return;
    }

    this.agenda.guardarSemana(diasHabiles.map(({ fecha, cupos }) => ({ fecha, cupos })));
    const { lunes } = this.proximaSemana();
    this.mesVisible.set(new Date(lunes.getFullYear(), lunes.getMonth(), 1));
    this.modalSemanaAbierto.set(false);
    this.errorSemana.set(null);
    this.mensaje.set(`Cupos de la semana ${this.etiquetaProximaSemana()} guardados correctamente.`);
  }

  maximoTipo(tipoCitaId: number): number {
    return this.tiposActivos().find((tipo) => tipo.id === tipoCitaId)?.cupo ?? 0;
  }
}
