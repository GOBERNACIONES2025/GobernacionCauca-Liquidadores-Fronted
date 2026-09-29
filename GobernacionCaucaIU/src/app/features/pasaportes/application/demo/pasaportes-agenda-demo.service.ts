import { Injectable, inject, signal } from '@angular/core';
import { AperturaCuposDiaDemo, CupoSemanaEdicionDemo } from '../../domain/models/pasaportes-agenda-demo.model';
import { PasaportesConfiguracionDemoService } from './pasaportes-configuracion-demo.service';

const pad = (value: number): string => String(value).padStart(2, '0');

const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const startOfWeekMonday = (date: Date): Date => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
};

@Injectable({ providedIn: 'root' })
export class PasaportesAgendaDemoService {
  private readonly configuracionService = inject(PasaportesConfiguracionDemoService);

  // Demo deliberadamente en memoria. No persiste y no afecta el portal ciudadano.
  readonly aperturas = signal<AperturaCuposDiaDemo[]>(this.crearAperturasIniciales());

  obtener(fecha: string): AperturaCuposDiaDemo | undefined {
    return this.aperturas().find((item) => item.fecha === fecha);
  }

  guardarSemana(dias: CupoSemanaEdicionDemo[]): void {
    const fechas = new Set(dias.map((dia) => dia.fecha));
    const nuevasAperturas = dias.map<AperturaCuposDiaDemo>((dia) => ({
      fecha: dia.fecha,
      cupos: dia.cupos.map((cupo) => ({
        tipoCitaId: cupo.tipoCitaId,
        abiertos: Math.max(0, Math.trunc(cupo.valor)),
        reservados: 0,
      })),
    }));

    this.aperturas.update((actual) => [
      ...actual.filter((item) => !fechas.has(item.fecha)),
      ...nuevasAperturas,
    ].sort((a, b) => a.fecha.localeCompare(b.fecha)));
  }

  private crearAperturasIniciales(): AperturaCuposDiaDemo[] {
    const hoy = new Date();
    const lunesSemanaActual = startOfWeekMonday(hoy);
    const inicioDemo = new Date(lunesSemanaActual);
    inicioDemo.setDate(inicioDemo.getDate() - 14);

    const tipos = this.configuracionService.configuracion().tiposCita.filter((tipo) => tipo.activo);
    const resultado: AperturaCuposDiaDemo[] = [];

    // Se cargan tres semanas previas/actual como si ya hubiesen sido abiertas.
    // La siguiente semana queda sin apertura para demostrar el flujo administrativo.
    for (let offset = 0; offset < 19; offset++) {
      const fecha = new Date(inicioDemo);
      fecha.setDate(inicioDemo.getDate() + offset);
      const day = fecha.getDay();
      if (day === 0 || day === 6) continue;

      const distancia = Math.abs(Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000));
      resultado.push({
        fecha: toIsoDate(fecha),
        cupos: tipos.map((tipo, index) => {
          const abiertos = tipo.cupo;
          const factor = (fecha.getDate() * (index + 3) + distancia * 5) % Math.max(1, abiertos);
          const reservados = fecha <= hoy
            ? Math.min(abiertos, Math.max(0, Math.round(abiertos * 0.35) + factor % Math.max(1, Math.round(abiertos * 0.45))))
            : Math.min(abiertos, Math.round(abiertos * 0.15) + factor % Math.max(1, Math.round(abiertos * 0.2)));
          return { tipoCitaId: tipo.id, abiertos, reservados };
        }),
      });
    }

    return resultado;
  }
}
