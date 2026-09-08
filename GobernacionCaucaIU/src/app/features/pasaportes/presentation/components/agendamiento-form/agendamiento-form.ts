import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { TIPO_CITA_GENERAL } from '../../../domain/constants/agendamiento.constants';
import { CalendarioDisponible, IntervaloDisponible, TipoPasaporte } from '../../../domain/models/agendamiento.model';
import { PasaportesApiService } from '../../../infrastructure/api/pasaportes-api.service';

@Component({
  selector: 'app-agendamiento-form',
  standalone: true,
  templateUrl: './agendamiento-form.html',
})
export class AgendamientoForm implements OnInit {
  private readonly api = inject(PasaportesApiService);

  readonly tipoPasaporteSeleccionado = input<TipoPasaporte | null>(null);
  readonly fechaSeleccionada = input<string | null>(null);
  readonly intervaloSeleccionado = input<IntervaloDisponible | null>(null);
  readonly completado = input(false);
  readonly creandoCita = input(false);
  readonly consecutivoCita = input<number | null>(null);
  readonly errorCreacion = input<string | null>(null);
  readonly tipoPasaporteChange = output<TipoPasaporte | null>();
  readonly fechaChange = output<string | null>();
  readonly intervaloChange = output<IntervaloDisponible | null>();
  readonly anterior = output<void>();
  readonly continuar = output<void>();

  readonly tiposPasaporte = signal<TipoPasaporte[]>([]);
  readonly calendario = signal<CalendarioDisponible[]>([]);
  readonly intervalos = signal<IntervaloDisponible[]>([]);
  readonly cargandoTipos = signal(false);
  readonly cargandoCalendario = signal(false);
  readonly cargandoIntervalos = signal(false);
  readonly errorTipos = signal(false);
  readonly errorCalendario = signal(false);
  readonly errorIntervalos = signal(false);
  readonly fechaVista = signal(new Date());

  readonly nombresMes = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  readonly diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  readonly diasDelMes = computed(() => {
    const fecha = this.fechaVista();
    const total = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
    return Array.from({ length: total }, (_, indice) => indice + 1);
  });
  readonly espaciosIniciales = computed(() => {
    const fecha = this.fechaVista();
    return Array.from({ length: new Date(fecha.getFullYear(), fecha.getMonth(), 1).getDay() });
  });

  ngOnInit(): void {
    this.cargarTiposPasaporte();
    const fecha = this.fechaSeleccionada();
    if (this.tipoPasaporteSeleccionado()) {
      this.cargarCalendario();
      if (fecha) this.cargarIntervalos(fecha);
    }
  }

  seleccionarTipo(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    const tipo = this.tiposPasaporte().find((item) => item.id === id) ?? null;
    this.tipoPasaporteChange.emit(tipo);
    this.fechaChange.emit(null);
    this.intervaloChange.emit(null);
    this.intervalos.set([]);
    this.cargarCalendario(tipo?.id);
  }

  cambiarMes(desplazamiento: number): void {
    const actual = this.fechaVista();
    this.fechaVista.set(new Date(actual.getFullYear(), actual.getMonth() + desplazamiento, 1));
    this.fechaChange.emit(null);
    this.intervaloChange.emit(null);
    this.intervalos.set([]);
    this.cargarCalendario();
  }

  seleccionarMes(event: Event): void {
    const mes = Number((event.target as HTMLSelectElement).value);
    const actual = this.fechaVista();
    this.fechaVista.set(new Date(actual.getFullYear(), mes, 1));
    this.fechaChange.emit(null);
    this.intervaloChange.emit(null);
    this.intervalos.set([]);
    this.cargarCalendario();
  }

  seleccionarDia(dia: number): void {
    const fecha = this.fechaIso(dia);
    if (!this.tipoPasaporteSeleccionado() || !this.fechaDisponible(fecha)) return;
    this.fechaChange.emit(fecha);
    this.intervaloChange.emit(null);
    this.cargarIntervalos(fecha);
  }

  seleccionarIntervalo(intervalo: IntervaloDisponible): void {
    this.intervaloChange.emit(intervalo);
  }

  fechaIso(dia: number): string {
    const vista = this.fechaVista();
    return `${vista.getFullYear()}-${String(vista.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  fechaDisponible(fecha: string): boolean {
    return this.calendario().some((item) => item.fecha.startsWith(fecha));
  }

  cargarTiposPasaporte(): void {
    this.cargandoTipos.set(true);
    this.errorTipos.set(false);
    this.api.obtenerTiposPasaporteActivos().subscribe({
      next: (tipos) => this.tiposPasaporte.set(Array.isArray(tipos) ? tipos : []),
      error: () => {
        this.tiposPasaporte.set([]);
        this.errorTipos.set(true);
        this.cargandoTipos.set(false);
      },
      complete: () => this.cargandoTipos.set(false),
    });
  }

  cargarCalendario(idTipoPasaporte = this.tipoPasaporteSeleccionado()?.id): void {
    if (!idTipoPasaporte) {
      this.calendario.set([]);
      this.cargandoCalendario.set(false);
      return;
    }

    const vista = this.fechaVista();
    this.cargandoCalendario.set(true);
    this.errorCalendario.set(false);
    this.calendario.set([]);
    this.api.obtenerCalendario(vista.getFullYear(), vista.getMonth() + 1, idTipoPasaporte).subscribe({
      next: (fechas) => {
        if (this.tipoPasaporteSeleccionado()?.id !== idTipoPasaporte) return;
        this.calendario.set(
          (Array.isArray(fechas) ? fechas : []).filter(
            (item) => item.idTipo === TIPO_CITA_GENERAL && item.idTipoPasaporte === idTipoPasaporte,
          ),
        );
      },
      error: () => {
        this.errorCalendario.set(true);
        this.cargandoCalendario.set(false);
      },
      complete: () => this.cargandoCalendario.set(false),
    });
  }

  cargarIntervalos(fecha: string): void {
    const tipoPasaporte = this.tipoPasaporteSeleccionado();
    if (!tipoPasaporte) {
      this.intervalos.set([]);
      this.cargandoIntervalos.set(false);
      return;
    }

    this.cargandoIntervalos.set(true);
    this.errorIntervalos.set(false);
    this.intervalos.set([]);
    this.api.obtenerIntervalosDisponibles(
      fecha,
      TIPO_CITA_GENERAL,
      null,
      tipoPasaporte.id,
    ).subscribe({
      next: (intervalos) => this.intervalos.set(
        (Array.isArray(intervalos) ? intervalos : []).filter(
          (item) => item.idTipo === TIPO_CITA_GENERAL && item.activo,
        ),
      ),
      error: () => {
        this.errorIntervalos.set(true);
        this.cargandoIntervalos.set(false);
      },
      complete: () => this.cargandoIntervalos.set(false),
    });
  }
}
