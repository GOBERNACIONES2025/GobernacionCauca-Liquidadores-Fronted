import { Injectable, signal } from '@angular/core';
import { BloqueoHorarioDemoConfig, ModoCalculoCupos, PasaportesConfiguracionDemo } from '../../domain/models/pasaportes-configuracion-demo.model';

const DEFAULT_CONFIG: PasaportesConfiguracionDemo = {
  pagoWeb: {
    habilitado: true,
    modalidad: 'PORCENTAJE',
    valor: 50,
  },
  modoCalculoCupos: 'AUTOMATICO',
  intervaloMinutos: 5,
  tiposCita: [
    { id: 1, codigo: 'GENERAL', nombre: 'Público general', cupo: 100, activo: true },
    { id: 2, codigo: 'SANTANDER', nombre: 'Santander de Quilichao', cupo: 30, activo: true },
    { id: 3, codigo: 'SECRETARIA', nombre: 'Secretaría de Gobierno', cupo: 20, activo: true },
  ],
  rangosHorarios: [
    { id: 1, horaInicio: '08:00', horaFin: '12:00', activo: true },
    { id: 2, horaInicio: '14:00', horaFin: '17:00', activo: true },
  ],
  bloqueos: [
    { id: 1, fecha: '2026-09-18', horaInicio: '08:00', horaFin: '10:30', motivo: 'Reunión institucional', activo: true },
  ],
  formalizadores: [
    { id: 1, nombre: 'Ana Milena Campo', disponible: true, activo: true },
    { id: 2, nombre: 'Diego Fernando Paz', disponible: true, activo: true },
    { id: 3, nombre: 'Natalia Andrea Hoyos', disponible: false, activo: true },
  ],
};

const cloneDefault = (): PasaportesConfiguracionDemo => structuredClone(DEFAULT_CONFIG);

@Injectable({ providedIn: 'root' })
export class PasaportesConfiguracionDemoService {
  // Demo deliberadamente en memoria. No usa localStorage y no modifica el portal ciudadano.
  readonly configuracion = signal<PasaportesConfiguracionDemo>(cloneDefault());

  restaurarValoresDemo(): void {
    this.configuracion.set(cloneDefault());
  }

  actualizarPagoWeb(cambios: Partial<PasaportesConfiguracionDemo['pagoWeb']>): void {
    this.configuracion.update((actual) => ({
      ...actual,
      pagoWeb: { ...actual.pagoWeb, ...cambios },
    }));
  }

  actualizarIntervalo(intervaloMinutos: number): void {
    this.configuracion.update((actual) => ({ ...actual, intervaloMinutos }));
  }

  actualizarModoCalculoCupos(modoCalculoCupos: ModoCalculoCupos): void {
    this.configuracion.update((actual) => ({ ...actual, modoCalculoCupos }));
  }

  actualizarTipoCita(id: number, cambios: Partial<PasaportesConfiguracionDemo['tiposCita'][number]>): void {
    this.configuracion.update((actual) => ({
      ...actual,
      tiposCita: actual.tiposCita.map((item) => item.id === id ? { ...item, ...cambios } : item),
    }));
  }

  actualizarRango(id: number, cambios: Partial<PasaportesConfiguracionDemo['rangosHorarios'][number]>): void {
    this.configuracion.update((actual) => ({
      ...actual,
      rangosHorarios: actual.rangosHorarios.map((item) => item.id === id ? { ...item, ...cambios } : item),
    }));
  }

  actualizarBloqueo(id: number, cambios: Partial<PasaportesConfiguracionDemo['bloqueos'][number]>): void {
    this.configuracion.update((actual) => ({
      ...actual,
      bloqueos: actual.bloqueos.map((item) => item.id === id ? { ...item, ...cambios } : item),
    }));
  }

  crearBloqueo(datos: Omit<BloqueoHorarioDemoConfig, 'id'>): BloqueoHorarioDemoConfig {
    const ids = this.configuracion().bloqueos.map((item) => item.id);
    const nuevo: BloqueoHorarioDemoConfig = {
      id: ids.length ? Math.max(...ids) + 1 : 1,
      ...datos,
    };

    this.configuracion.update((actual) => ({
      ...actual,
      bloqueos: [...actual.bloqueos, nuevo],
    }));

    return nuevo;
  }

  actualizarFormalizador(id: number, cambios: Partial<PasaportesConfiguracionDemo['formalizadores'][number]>): void {
    this.configuracion.update((actual) => ({
      ...actual,
      formalizadores: actual.formalizadores.map((item) => item.id === id ? { ...item, ...cambios } : item),
    }));
  }
}
