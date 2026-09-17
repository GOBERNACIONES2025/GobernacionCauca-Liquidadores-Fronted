import { Injectable, signal } from '@angular/core';
import {
  BeneficioLiquidacionDemoConfig,
  BloqueoHorarioDemoConfig,
  ImpuestoLiquidacionDemoConfig,
  ModoCalculoCupos,
  PasaportesConfiguracionDemo,
} from '../../domain/models/pasaportes-configuracion-demo.model';

const DEFAULT_CONFIG: PasaportesConfiguracionDemo = {
  pagoWeb: {
    habilitado: true,
    modalidad: 'PORCENTAJE',
    valor: 50,
  },
  liquidacion: {
    vigencia: 2026,
    tarifas: [
      { id: 1, codigo: 'ORDINARIO', nombre: 'Pasaporte ordinario', valor: 321000, vigenciaDesde: '2026-01-01', obligatorio: true },
      { id: 2, codigo: 'EJECUTIVO', nombre: 'Pasaporte ejecutivo', valor: 429000, vigenciaDesde: '2026-01-01', obligatorio: true },
    ],
    impuestos: [],
    beneficios: [],
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
  // Configuración administrativa en memoria. No usa localStorage y no modifica el portal ciudadano.
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

  actualizarTarifa(id: number, cambios: Partial<PasaportesConfiguracionDemo['liquidacion']['tarifas'][number]>): void {
    this.configuracion.update((actual) => ({
      ...actual,
      liquidacion: {
        ...actual.liquidacion,
        tarifas: actual.liquidacion.tarifas.map((item) => item.id === id ? { ...item, ...cambios } : item),
      },
    }));
  }

  crearImpuesto(datos: Omit<ImpuestoLiquidacionDemoConfig, 'id'>): ImpuestoLiquidacionDemoConfig {
    const ids = this.configuracion().liquidacion.impuestos.map((item) => item.id);
    const nuevo: ImpuestoLiquidacionDemoConfig = {
      id: ids.length ? Math.max(...ids) + 1 : 1,
      ...datos,
    };

    this.configuracion.update((actual) => ({
      ...actual,
      liquidacion: {
        ...actual.liquidacion,
        impuestos: [...actual.liquidacion.impuestos, nuevo],
      },
    }));

    return nuevo;
  }

  actualizarImpuesto(id: number, cambios: Partial<ImpuestoLiquidacionDemoConfig>): void {
    this.configuracion.update((actual) => ({
      ...actual,
      liquidacion: {
        ...actual.liquidacion,
        impuestos: actual.liquidacion.impuestos.map((item) => item.id === id ? { ...item, ...cambios } : item),
      },
    }));
  }

  eliminarImpuesto(id: number): void {
    this.configuracion.update((actual) => ({
      ...actual,
      liquidacion: {
        ...actual.liquidacion,
        impuestos: actual.liquidacion.impuestos.filter((item) => item.id !== id),
      },
    }));
  }

  crearBeneficio(datos: Omit<BeneficioLiquidacionDemoConfig, 'id'>): BeneficioLiquidacionDemoConfig {
    const ids = this.configuracion().liquidacion.beneficios.map((item) => item.id);
    const nuevo: BeneficioLiquidacionDemoConfig = {
      id: ids.length ? Math.max(...ids) + 1 : 1,
      ...datos,
    };

    this.configuracion.update((actual) => ({
      ...actual,
      liquidacion: {
        ...actual.liquidacion,
        beneficios: [...actual.liquidacion.beneficios, nuevo],
      },
    }));

    return nuevo;
  }

  actualizarBeneficio(id: number, cambios: Partial<BeneficioLiquidacionDemoConfig>): void {
    this.configuracion.update((actual) => ({
      ...actual,
      liquidacion: {
        ...actual.liquidacion,
        beneficios: actual.liquidacion.beneficios.map((item) => item.id === id ? { ...item, ...cambios } : item),
      },
    }));
  }

  eliminarBeneficio(id: number): void {
    this.configuracion.update((actual) => ({
      ...actual,
      liquidacion: {
        ...actual.liquidacion,
        beneficios: actual.liquidacion.beneficios.filter((item) => item.id !== id),
      },
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
