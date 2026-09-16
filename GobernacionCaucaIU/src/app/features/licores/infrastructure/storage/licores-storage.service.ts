import { Injectable } from '@angular/core';
import { EntidadProductora, LiquidacionLicores, ProductoLicor, RangoEstampillas } from '../../domain/models/licores.models';
import { generarLiquidacionesSemilla, SEED_CATALOGO_PRODUCTOS, SEED_ENTIDADES } from '../data/licores.seed';

const STORAGE_KEYS = {
  LIQUIDACIONES: 'GOV_CAUCA_ICL_LIQUIDACIONES_V1',
  CATALOGO: 'GOV_CAUCA_ICL_CATALOGO_V1',
  ENTIDADES: 'GOV_CAUCA_ICL_ENTIDADES_V1',
  CONSECUTIVOS: 'GOV_CAUCA_ICL_CONSECUTIVOS_V1',
};

export interface ConsecutivosStorage {
  ultimoRadicado: number; // Ej: 3
  ultimaTornaguia: number; // Ej: 45
  ultimoEstampillaFLA: number; // Ej: 500
  ultimoEstampillaISM: number; // Ej: 100
  ultimoEstampillaVIC: number; // Ej: 50
}

@Injectable({
  providedIn: 'root',
})
export class LicoresStorageService {
  constructor() {
    this.inicializarStorageSiNoExiste();
  }

  /**
   * Inicializa el almacenamiento local con datos semilla si es la primera vez
   */
  public inicializarStorageSiNoExiste(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const liquidacionesExistentes = localStorage.getItem(STORAGE_KEYS.LIQUIDACIONES);
      if (!liquidacionesExistentes) {
        const seedLiq = generarLiquidacionesSemilla();
        localStorage.setItem(STORAGE_KEYS.LIQUIDACIONES, JSON.stringify(seedLiq));
      }

      const catalogoExistente = localStorage.getItem(STORAGE_KEYS.CATALOGO);
      if (!catalogoExistente) {
        localStorage.setItem(STORAGE_KEYS.CATALOGO, JSON.stringify(SEED_CATALOGO_PRODUCTOS));
      }

      const entidadesExistentes = localStorage.getItem(STORAGE_KEYS.ENTIDADES);
      if (!entidadesExistentes) {
        localStorage.setItem(STORAGE_KEYS.ENTIDADES, JSON.stringify(SEED_ENTIDADES));
      }

      const consecutivosExistentes = localStorage.getItem(STORAGE_KEYS.CONSECUTIVOS);
      if (!consecutivosExistentes) {
        const initConsecutivos: ConsecutivosStorage = {
          ultimoRadicado: 3,
          ultimaTornaguia: 45,
          ultimoEstampillaFLA: 500,
          ultimoEstampillaISM: 100,
          ultimoEstampillaVIC: 50,
        };
        localStorage.setItem(STORAGE_KEYS.CONSECUTIVOS, JSON.stringify(initConsecutivos));
      }
    } catch (e) {
      console.error('Error al inicializar localStorage de Licores ICL', e);
    }
  }

  public getLiquidaciones(): LiquidacionLicores[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIQUIDACIONES);
      return data ? JSON.parse(data) : generarLiquidacionesSemilla();
    } catch {
      return generarLiquidacionesSemilla();
    }
  }

  public saveLiquidaciones(liquidaciones: LiquidacionLicores[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LIQUIDACIONES, JSON.stringify(liquidaciones));
    } catch (e) {
      console.error('Error al guardar liquidaciones en localStorage', e);
    }
  }

  public getCatalogo(): ProductoLicor[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATALOGO);
      return data ? JSON.parse(data) : SEED_CATALOGO_PRODUCTOS;
    } catch {
      return SEED_CATALOGO_PRODUCTOS;
    }
  }

  public saveCatalogo(catalogo: ProductoLicor[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATALOGO, JSON.stringify(catalogo));
    } catch (e) {
      console.error('Error al guardar catálogo en localStorage', e);
    }
  }

  public getEntidades(): EntidadProductora[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ENTIDADES);
      return data ? JSON.parse(data) : SEED_ENTIDADES;
    } catch {
      return SEED_ENTIDADES;
    }
  }

  public getConsecutivos(): ConsecutivosStorage {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONSECUTIVOS);
      if (data) return JSON.parse(data);
    } catch {}
    return {
      ultimoRadicado: 3,
      ultimaTornaguia: 45,
      ultimoEstampillaFLA: 500,
      ultimoEstampillaISM: 100,
      ultimoEstampillaVIC: 50,
    };
  }

  public saveConsecutivos(consecutivos: ConsecutivosStorage): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONSECUTIVOS, JSON.stringify(consecutivos));
    } catch (e) {
      console.error('Error al guardar consecutivos en localStorage', e);
    }
  }

  /**
   * Genera el siguiente número de radicado y actualiza el contador
   */
  public generarSiguienteRadicado(): string {
    const c = this.getConsecutivos();
    c.ultimoRadicado += 1;
    this.saveConsecutivos(c);
    const numPadded = String(c.ultimoRadicado).padStart(4, '0');
    const anio = new Date().getFullYear();
    return `RAD-${anio}-${numPadded}`;
  }

  /**
   * Genera el siguiente número de tornaguía oficial y actualiza el contador
   */
  public generarSiguienteTornaguia(): string {
    const c = this.getConsecutivos();
    c.ultimaTornaguia += 1;
    this.saveConsecutivos(c);
    const numPadded = String(c.ultimaTornaguia).padStart(4, '0');
    const anio = new Date().getFullYear();
    return `TGN-${anio}-${numPadded}`;
  }

  /**
   * Asigna un rango de estampillas serializadas correlativas según la cantidad de botellas y prefijo
   */
  public asignarRangoEstampillas(cantidadBotellas: number, prefijo: string = 'FLA'): RangoEstampillas {
    const c = this.getConsecutivos();
    let inicial = 1;

    if (prefijo === 'FLA') {
      inicial = c.ultimoEstampillaFLA + 1;
      c.ultimoEstampillaFLA += cantidadBotellas;
    } else if (prefijo === 'ISM') {
      inicial = c.ultimoEstampillaISM + 1;
      c.ultimoEstampillaISM += cantidadBotellas;
    } else if (prefijo === 'VIC') {
      inicial = c.ultimoEstampillaVIC + 1;
      c.ultimoEstampillaVIC += cantidadBotellas;
    } else {
      c.ultimoEstampillaFLA += cantidadBotellas;
      inicial = c.ultimoEstampillaFLA - cantidadBotellas + 1;
    }

    this.saveConsecutivos(c);

    const final = inicial + cantidadBotellas - 1;
    const desde = `${prefijo}-${String(inicial).padStart(6, '0')}`;
    const hasta = `${prefijo}-${String(final).padStart(6, '0')}`;

    return {
      desde,
      hasta,
      cantidadTotal: cantidadBotellas,
      prefijo,
      numeroInicial: inicial,
      numeroFinal: final,
    };
  }

  /**
   * Restablece los datos de prueba a los valores semilla originales
   */
  public resetToSeed(): void {
    const seedLiq = generarLiquidacionesSemilla();
    localStorage.setItem(STORAGE_KEYS.LIQUIDACIONES, JSON.stringify(seedLiq));
    localStorage.setItem(STORAGE_KEYS.CATALOGO, JSON.stringify(SEED_CATALOGO_PRODUCTOS));
    localStorage.setItem(STORAGE_KEYS.ENTIDADES, JSON.stringify(SEED_ENTIDADES));
    const initConsecutivos: ConsecutivosStorage = {
      ultimoRadicado: 3,
      ultimaTornaguia: 45,
      ultimoEstampillaFLA: 500,
      ultimoEstampillaISM: 100,
      ultimoEstampillaVIC: 50,
    };
    localStorage.setItem(STORAGE_KEYS.CONSECUTIVOS, JSON.stringify(initConsecutivos));
  }
}
