import { Injectable } from '@angular/core';
import {
  DeclaracionSobretasa,
  DistribuidorMayorista,
  EstacionServicioDestino,
} from '../../domain/models/sobretasa-gasolina.models';
import {
  SEED_DECLARACIONES,
  SEED_EDS_CATALOGO,
  SEED_MAYORISTAS,
} from '../data/sobretasa-gasolina.seed';

const STORAGE_KEYS = {
  DECLARACIONES: 'cauca_sobretasa_declaraciones_v1',
  MAYORISTAS: 'cauca_sobretasa_mayoristas_v1',
  EDS: 'cauca_sobretasa_eds_v1',
  ROL: 'cauca_sobretasa_rol_activo_v1',
  MAYORISTA_ACTIVO: 'cauca_sobretasa_mayorista_activo_v1',
};

@Injectable({
  providedIn: 'root',
})
export class SobretasaStorageService {
  constructor() {
    this.initStorage();
  }

  private initStorage(): void {
    if (!localStorage.getItem(STORAGE_KEYS.MAYORISTAS)) {
      localStorage.setItem(
        STORAGE_KEYS.MAYORISTAS,
        JSON.stringify(SEED_MAYORISTAS)
      );
    }
    if (!localStorage.getItem(STORAGE_KEYS.EDS)) {
      localStorage.setItem(STORAGE_KEYS.EDS, JSON.stringify(SEED_EDS_CATALOGO));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DECLARACIONES)) {
      localStorage.setItem(
        STORAGE_KEYS.DECLARACIONES,
        JSON.stringify(SEED_DECLARACIONES)
      );
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROL)) {
      localStorage.setItem(STORAGE_KEYS.ROL, 'MAYORISTA');
    }
    if (!localStorage.getItem(STORAGE_KEYS.MAYORISTA_ACTIVO)) {
      localStorage.setItem(STORAGE_KEYS.MAYORISTA_ACTIVO, 'may-001');
    }
  }

  getDeclaraciones(): DeclaracionSobretasa[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DECLARACIONES);
      return data ? JSON.parse(data) : SEED_DECLARACIONES;
    } catch {
      return SEED_DECLARACIONES;
    }
  }

  saveDeclaraciones(declaraciones: DeclaracionSobretasa[]): void {
    localStorage.setItem(
      STORAGE_KEYS.DECLARACIONES,
      JSON.stringify(declaraciones)
    );
  }

  getMayoristas(): DistribuidorMayorista[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MAYORISTAS);
      return data ? JSON.parse(data) : SEED_MAYORISTAS;
    } catch {
      return SEED_MAYORISTAS;
    }
  }

  saveMayoristas(mayoristas: DistribuidorMayorista[]): void {
    localStorage.setItem(STORAGE_KEYS.MAYORISTAS, JSON.stringify(mayoristas));
  }

  getEdsCatalogo(): EstacionServicioDestino[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EDS);
      return data ? JSON.parse(data) : SEED_EDS_CATALOGO;
    } catch {
      return SEED_EDS_CATALOGO;
    }
  }

  saveEdsCatalogo(eds: EstacionServicioDestino[]): void {
    localStorage.setItem(STORAGE_KEYS.EDS, JSON.stringify(eds));
  }

  getRolActivo(): 'MAYORISTA' | 'FUNCIONARIO' {
    const rol = localStorage.getItem(STORAGE_KEYS.ROL);
    return rol === 'FUNCIONARIO' ? 'FUNCIONARIO' : 'MAYORISTA';
  }

  saveRolActivo(rol: 'MAYORISTA' | 'FUNCIONARIO'): void {
    localStorage.setItem(STORAGE_KEYS.ROL, rol);
  }

  getMayoristaActivoId(): string {
    return localStorage.getItem(STORAGE_KEYS.MAYORISTA_ACTIVO) || 'may-001';
  }

  saveMayoristaActivoId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.MAYORISTA_ACTIVO, id);
  }

  generarSiguienteRadicado(): string {
    const decs = this.getDeclaraciones();
    const anio = new Date().getFullYear();
    const count = decs.length + 801;
    const pad = String(count).padStart(4, '0');
    return `SOB-${anio}-${pad}`;
  }

  generarCodigoBarras(radicado: string, valor: number, fechaVencimiento: string): string {
    const radLimpio = radicado.replace(/\D/g, '').slice(-6).padStart(10, '0');
    const valorLimpio = String(Math.round(valor)).padStart(11, '0');
    const f = new Date(fechaVencimiento);
    const fechaStr = `${f.getFullYear()}${String(f.getMonth() + 1).padStart(2, '0')}${String(f.getDate()).padStart(2, '0')}`;
    return `(415)7709998001234(8020)${radLimpio}(3900)${valorLimpio}(96)${fechaStr}`;
  }

  resetToSeed(): void {
    localStorage.setItem(
      STORAGE_KEYS.MAYORISTAS,
      JSON.stringify(SEED_MAYORISTAS)
    );
    localStorage.setItem(STORAGE_KEYS.EDS, JSON.stringify(SEED_EDS_CATALOGO));
    localStorage.setItem(
      STORAGE_KEYS.DECLARACIONES,
      JSON.stringify(SEED_DECLARACIONES)
    );
    localStorage.setItem(STORAGE_KEYS.ROL, 'MAYORISTA');
    localStorage.setItem(STORAGE_KEYS.MAYORISTA_ACTIVO, 'may-001');
  }
}
