import { Injectable } from '@angular/core';
import { TipoPasaporte } from '../../domain/models/agendamiento.model';
import { CalculoPasaporteDemo, CitaDemo, ConfiguracionPasaporteDemo, EstadoPersonaDemo } from '../../domain/models/flujo-pasaporte-demo.model';

// Cambiar este único valor a false para demostrar el flujo sin pago web.
const CONFIGURACION: ConfiguracionPasaporteDemo = { pagoWebHabilitado: true };
// Para la demo del pago previo, usar este número de documento en el formulario.
const DOCUMENTO_PAGO_PREVIO = '999999999';
const TIPOS: TipoPasaporte[] = [
  { id: 1, codigo: 'ORD', nombre: 'Pasaporte ordinario', descripcion: 'Pasaporte ordinario para ciudadanos colombianos.' },
  { id: 2, codigo: 'EJE', nombre: 'Pasaporte ejecutivo', descripcion: 'Pasaporte ejecutivo con mayor número de páginas.' },
];
const PRECIOS: Record<number, { departamento: number; nacional: number; primerPago: number }> = {
  1: { departamento: 185000, nacional: 136000, primerPago: 185000 },
  2: { departamento: 185000, nacional: 244000, primerPago: 185000 },
};

@Injectable({ providedIn: 'root' })
export class FlujoPasaporteDemoService {
  private readonly ocupadas = new Set<string>();
  private secuencia = 0;

  obtenerConfiguracion(): ConfiguracionPasaporteDemo { return { ...CONFIGURACION }; }
  consultarEstadoPersona(documento: string): EstadoPersonaDemo {
    return documento === DOCUMENTO_PAGO_PREVIO
      ? { existe: true, documento, tienePagoValido: true, tieneCita: true, estadoCita: 'PENDIENTE_AGENDAMIENTO', tipoPasaporteId: 1 }
      : { existe: false, documento, tienePagoValido: false, tieneCita: false };
  }
  recuperarCitaPendiente(documento: string): CitaDemo | null {
    const estado = this.consultarEstadoPersona(documento);
    const tipo = TIPOS.find(item => item.id === estado.tipoPasaporteId);
    if (!estado.tienePagoValido || !estado.tieneCita || estado.estadoCita !== 'PENDIENTE_AGENDAMIENTO' || !tipo) return null;
    const calculo = this.calcularLiquidacion(tipo, { documento });
    return { citaId: 1044, consecutivo: 20260916001, estadoCita: 'PENDIENTE_AGENDAMIENTO',
      pagoAprobado: true, referenciaPago: 'PSP20260916001', tipoPasaporte: tipo, calculo };
  }
  obtenerTiposPasaporte(): TipoPasaporte[] { return TIPOS.map(tipo => ({ ...tipo })); }

  calcularLiquidacion(tipoPasaporte: TipoPasaporte, _datos: { documento: string }): CalculoPasaporteDemo {
    const precio = PRECIOS[tipoPasaporte.id];
    if (!precio) throw new Error('Tipo de pasaporte no disponible en la simulación.');
    const conceptos = [
      { nombre: 'Derechos departamentales', valor: precio.departamento },
      { nombre: 'Derechos nacionales', valor: precio.nacional },
    ];
    return { tipoPasaporte, conceptos, total: precio.departamento + precio.nacional,
      primerPago: precio.primerPago, saldo: precio.nacional };
  }

  simularPago(calculo: CalculoPasaporteDemo): CitaDemo {
    if (!CONFIGURACION.pagoWebHabilitado) throw new Error('El pago web está deshabilitado.');
    return this.crearDerecho(calculo, true);
  }

  continuarSinPago(calculo: CalculoPasaporteDemo): CitaDemo {
    return this.crearDerecho(calculo, false);
  }

  obtenerFechasDisponibles(anio: number, mes: number): string[] {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const ultimo = new Date(anio, mes, 0).getDate();
    return Array.from({ length: ultimo }, (_, i) => new Date(anio, mes - 1, i + 1))
      .filter(fecha => fecha >= hoy && fecha.getDay() !== 0 && fecha.getDay() !== 6)
      .map(fecha => this.fechaLocal(fecha));
  }

  obtenerHorasDisponibles(fecha: string): { hora: string; ocupada: boolean }[] {
    const horas: { hora: string; ocupada: boolean }[] = [];
    for (const [inicio, fin] of [[8, 12], [14, 17]]) {
      for (let minutos = inicio * 60; minutos < fin * 60; minutos += 5) {
        const hora = `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
        const indice = Math.floor(minutos / 5);
        horas.push({ hora, ocupada: (indice + Number(fecha.slice(-2))) % 11 === 0 || this.ocupadas.has(`${fecha}|${hora}`) });
      }
    }
    return horas;
  }

  programarCita(cita: CitaDemo, fecha: string, hora: string): CitaDemo {
    if (cita.estadoCita !== 'PENDIENTE_AGENDAMIENTO') throw new Error('La cita ya fue programada.');
    if (!this.obtenerFechasDisponibles(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7))).includes(fecha) ||
        !this.obtenerHorasDisponibles(fecha).some(item => item.hora === hora && !item.ocupada)) {
      throw new Error('La hora seleccionada ya no está disponible. Seleccione otra.');
    }
    this.ocupadas.add(`${fecha}|${hora}`);
    return { ...cita, fecha, hora, programacion: { fecha, hora }, estadoCita: 'AGENDADA' };
  }

  private crearDerecho(calculo: CalculoPasaporteDemo, pagoAprobado: boolean): CitaDemo {
    const consecutivo = Number(`${this.fechaLocal(new Date()).replace(/-/g, '')}${String(++this.secuencia).padStart(3, '0')}`);
    return { citaId: 1044 + this.secuencia, consecutivo, estadoCita: 'PENDIENTE_AGENDAMIENTO',
      pagoAprobado, referenciaPago: pagoAprobado ? `PSP${consecutivo}` : `DEMO${consecutivo}`,
      tipoPasaporte: calculo.tipoPasaporte, calculo };
  }

  private fechaLocal(fecha: Date): string {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }
}
