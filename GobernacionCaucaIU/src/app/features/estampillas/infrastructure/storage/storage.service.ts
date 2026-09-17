import { Injectable, signal } from '@angular/core';
import {
  CONTRIBUYENTES_MOCK,
  CONTRATOS_MOCK,
  ESTAMPILLAS_MOCK,
  TARIFAS_MOCK,
  VIGENCIAS_MOCK,
  LIQUIDACIONES_MOCK,
  PAGOS_MOCK,
  EXENCIONES_MOCK,
  MUNICIPIOS_CAUCA_MOCK,
  DEPARTAMENTOS_MOCK,
  USUARIOS_MOCK,
  AUDITORIA_MOCK
} from '../data/initial-mock-data';
import {
  Contribuyente,
  Contrato,
  Estampilla,
  TarifaEstampilla,
  VigenciaTributaria,
  LiquidacionEstampilla,
  PagoEstampilla,
  ExencionEstampilla,
  MunicipioCauca,
  Departamento,
  UsuarioMock,
  RegistroAuditoria
} from '../../domain/models/estampillas.models';

const STORAGE_KEYS = {
  CONTRIBUYENTES: 'estampillas_contribuyentes',
  CONTRATOS: 'estampillas_contratos',
  ESTAMPILLAS: 'estampillas_catalogo',
  TARIFAS: 'estampillas_tarifas',
  VIGENCIAS: 'estampillas_vigencias',
  LIQUIDACIONES: 'estampillas_liquidaciones',
  PAGOS: 'estampillas_pagos',
  EXENCIONES: 'estampillas_exenciones',
  MUNICIPIOS: 'estampillas_municipios',
  DEPARTAMENTOS: 'estampillas_departamentos',
  USUARIOS: 'estampillas_usuarios',
  CURRENT_USER: 'usuarioActual',
  AUDITORIA: 'estampillas_auditoria',
  SEEDED: 'estampillas_seeded_v1'
};

@Injectable({
  providedIn: 'root'
})
export class EstampillasStorageService {
  readonly dataVersion = signal<number>(Date.now());

  constructor() {
    this.ensureInitialized();
  }

  /**
   * Inicializa automáticamente el almacenamiento local con datos mock si no existen.
   */
  ensureInitialized(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const isSeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
    if (!isSeeded) {
      this.resetToInitialData();
    }
  }

  /**
   * Restaura completamente la base de datos local con la semilla inicial.
   */
  resetToInitialData(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    localStorage.setItem(STORAGE_KEYS.CONTRIBUYENTES, JSON.stringify(CONTRIBUYENTES_MOCK));
    localStorage.setItem(STORAGE_KEYS.CONTRATOS, JSON.stringify(CONTRATOS_MOCK));
    localStorage.setItem(STORAGE_KEYS.ESTAMPILLAS, JSON.stringify(ESTAMPILLAS_MOCK));
    localStorage.setItem(STORAGE_KEYS.TARIFAS, JSON.stringify(TARIFAS_MOCK));
    localStorage.setItem(STORAGE_KEYS.VIGENCIAS, JSON.stringify(VIGENCIAS_MOCK));
    localStorage.setItem(STORAGE_KEYS.LIQUIDACIONES, JSON.stringify(LIQUIDACIONES_MOCK));
    localStorage.setItem(STORAGE_KEYS.PAGOS, JSON.stringify(PAGOS_MOCK));
    localStorage.setItem(STORAGE_KEYS.EXENCIONES, JSON.stringify(EXENCIONES_MOCK));
    localStorage.setItem(STORAGE_KEYS.MUNICIPIOS, JSON.stringify(MUNICIPIOS_CAUCA_MOCK));
    localStorage.setItem(STORAGE_KEYS.DEPARTAMENTOS, JSON.stringify(DEPARTAMENTOS_MOCK));
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(USUARIOS_MOCK));
    localStorage.setItem(STORAGE_KEYS.AUDITORIA, JSON.stringify(AUDITORIA_MOCK));
    
    // Set default user if none
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(USUARIOS_MOCK[0]));
    }

    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
    this.notifyChange();
  }

  /**
   * Notifica a los observadores/signals que la versión de datos cambió.
   */
  notifyChange(): void {
    this.dataVersion.set(Date.now());
  }

  // --- CONTRIBUYENTES ---
  getContribuyentes(): Contribuyente[] {
    return this.getItem<Contribuyente[]>(STORAGE_KEYS.CONTRIBUYENTES, CONTRIBUYENTES_MOCK);
  }

  saveContribuyentes(items: Contribuyente[]): void {
    this.setItem(STORAGE_KEYS.CONTRIBUYENTES, items);
  }

  getContribuyenteById(id: string): Contribuyente | undefined {
    return this.getContribuyentes().find(c => c.id === id || c.numeroDocumento === id);
  }

  saveContribuyente(item: Contribuyente): void {
    const list = this.getContribuyentes();
    const index = list.findIndex(c => c.id === item.id);
    if (index >= 0) {
      list[index] = { ...item, fechaActualizacion: new Date().toISOString() };
    } else {
      list.unshift(item);
    }
    this.saveContribuyentes(list);
  }

  deleteContribuyente(id: string): void {
    const list = this.getContribuyentes().filter(c => c.id !== id);
    this.saveContribuyentes(list);
  }

  // --- CONTRATOS ---
  getContratos(): Contrato[] {
    return this.getItem<Contrato[]>(STORAGE_KEYS.CONTRATOS, CONTRATOS_MOCK);
  }

  saveContratos(items: Contrato[]): void {
    this.setItem(STORAGE_KEYS.CONTRATOS, items);
  }

  getContratoById(id: string): Contrato | undefined {
    return this.getContratos().find(c => c.id === id || c.numeroContrato === id);
  }

  saveContrato(item: Contrato): void {
    const list = this.getContratos();
    const index = list.findIndex(c => c.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    this.saveContratos(list);
  }

  deleteContrato(id: string): void {
    const list = this.getContratos().filter(c => c.id !== id);
    this.saveContratos(list);
  }

  // --- ESTAMPILLAS ---
  getEstampillas(): Estampilla[] {
    return this.getItem<Estampilla[]>(STORAGE_KEYS.ESTAMPILLAS, ESTAMPILLAS_MOCK);
  }

  saveEstampillas(items: Estampilla[]): void {
    this.setItem(STORAGE_KEYS.ESTAMPILLAS, items);
  }

  getEstampillaById(id: string): Estampilla | undefined {
    return this.getEstampillas().find(e => e.id === id || e.codigo === id);
  }

  saveEstampilla(item: Estampilla): void {
    const list = this.getEstampillas();
    const index = list.findIndex(e => e.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.push(item);
    }
    this.saveEstampillas(list);
  }

  // --- TARIFAS ---
  getTarifas(): TarifaEstampilla[] {
    return this.getItem<TarifaEstampilla[]>(STORAGE_KEYS.TARIFAS, TARIFAS_MOCK);
  }

  saveTarifas(items: TarifaEstampilla[]): void {
    this.setItem(STORAGE_KEYS.TARIFAS, items);
  }

  // --- VIGENCIAS ---
  getVigencias(): VigenciaTributaria[] {
    return this.getItem<VigenciaTributaria[]>(STORAGE_KEYS.VIGENCIAS, VIGENCIAS_MOCK);
  }

  saveVigencias(items: VigenciaTributaria[]): void {
    this.setItem(STORAGE_KEYS.VIGENCIAS, items);
  }

  saveVigencia(item: VigenciaTributaria): void {
    const list = this.getVigencias();
    const index = list.findIndex(v => v.anio === item.anio);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    this.saveVigencias(list);
  }

  // --- LIQUIDACIONES ---
  getLiquidaciones(): LiquidacionEstampilla[] {
    return this.getItem<LiquidacionEstampilla[]>(STORAGE_KEYS.LIQUIDACIONES, LIQUIDACIONES_MOCK);
  }

  saveLiquidaciones(items: LiquidacionEstampilla[]): void {
    this.setItem(STORAGE_KEYS.LIQUIDACIONES, items);
  }

  getLiquidacionById(id: string): LiquidacionEstampilla | undefined {
    return this.getLiquidaciones().find(l => l.id === id || l.numeroLiquidacion === id);
  }

  saveLiquidacion(item: LiquidacionEstampilla): void {
    const list = this.getLiquidaciones();
    const index = list.findIndex(l => l.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    this.saveLiquidaciones(list);
  }

  // --- PAGOS ---
  getPagos(): PagoEstampilla[] {
    return this.getItem<PagoEstampilla[]>(STORAGE_KEYS.PAGOS, PAGOS_MOCK);
  }

  savePagos(items: PagoEstampilla[]): void {
    this.setItem(STORAGE_KEYS.PAGOS, items);
  }

  savePago(item: PagoEstampilla): void {
    const list = this.getPagos();
    list.unshift(item);
    this.savePagos(list);

    // Actualizar estado de la liquidación asociada a PAGADA
    const liq = this.getLiquidacionById(item.liquidacionId);
    if (liq) {
      liq.estado = 'PAGADA';
      liq.fechaPago = item.fechaPago;
      this.saveLiquidacion(liq);
    }
  }

  // --- EXENCIONES ---
  getExenciones(): ExencionEstampilla[] {
    return this.getItem<ExencionEstampilla[]>(STORAGE_KEYS.EXENCIONES, EXENCIONES_MOCK);
  }

  saveExenciones(items: ExencionEstampilla[]): void {
    this.setItem(STORAGE_KEYS.EXENCIONES, items);
  }

  // --- MUNICIPIOS & DEPARTAMENTOS ---
  getMunicipios(): MunicipioCauca[] {
    return this.getItem<MunicipioCauca[]>(STORAGE_KEYS.MUNICIPIOS, MUNICIPIOS_CAUCA_MOCK);
  }

  saveMunicipios(items: MunicipioCauca[]): void {
    this.setItem(STORAGE_KEYS.MUNICIPIOS, items);
  }

  getDepartamentos(): Departamento[] {
    return this.getItem<Departamento[]>(STORAGE_KEYS.DEPARTAMENTOS, DEPARTAMENTOS_MOCK);
  }

  // --- AUDITORÍA ---
  getAuditoria(): RegistroAuditoria[] {
    return this.getItem<RegistroAuditoria[]>(STORAGE_KEYS.AUDITORIA, AUDITORIA_MOCK);
  }

  registrarAuditoria(registro: Omit<RegistroAuditoria, 'id' | 'fechaHora'>): void {
    const list = this.getAuditoria();
    const now = new Date();
    const item: RegistroAuditoria = {
      id: `AUD-${Date.now()}`,
      fechaHora: now.toISOString().replace('T', ' ').substring(0, 19),
      ...registro
    };
    list.unshift(item);
    this.setItem(STORAGE_KEYS.AUDITORIA, list.slice(0, 100)); // Mantener últimos 100 registros
  }

  // --- USUARIOS & SESIÓN MOCK ---
  getUsuarios(): UsuarioMock[] {
    return this.getItem<UsuarioMock[]>(STORAGE_KEYS.USUARIOS, USUARIOS_MOCK);
  }

  getCurrentUser(): UsuarioMock {
    const u = this.getItem<UsuarioMock | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (u) return u;
    return USUARIOS_MOCK[0]; // Admin default
  }

  setCurrentUser(usuario: UsuarioMock): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, usuario);
  }

  // --- MÉTODOS GENÉRICOS DE ACCESO A LOCALSTORAGE ---
  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notifyChange();
    } catch (e) {
      console.error(`Error guardando en localStorage key ${key}:`, e);
    }
  }

  // --- UTILITARIOS TRIBUTARIOS Y FINANCIEROS (DIAN / COP / LETRAS) ---

  /**
   * Formatea un número al estándar monetario de pesos colombianos.
   * Ej: 1250000 -> "$ 1.250.000"
   */
  formatCOP(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return '$ 0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Math.round(value));
  }

  /**
   * Algoritmo oficial DIAN para el cálculo del Dígito de Verificación (Módulo 11).
   */
  calcularDigitoVerificacion(nit: string): string {
    if (!nit) return '';
    const cleanNit = nit.replace(/\D/g, '');
    if (cleanNit.length === 0) return '';

    const primos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    let suma = 0;
    const reversed = cleanNit.split('').reverse();

    for (let i = 0; i < reversed.length; i++) {
      suma += parseInt(reversed[i], 10) * primos[i];
    }

    const residuo = suma % 11;
    if (residuo === 0 || residuo === 1) {
      return residuo.toString();
    }
    return (11 - residuo).toString();
  }

  /**
   * Convierte un valor numérico a su expresión en letras en español (M/CTE).
   */
  numeroALetras(monto: number): string {
    if (!monto || isNaN(monto) || monto === 0) return 'CERO PESOS M/CTE';
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const entero = Math.floor(Math.abs(monto));

    function convertirGrupo(n: number): string {
      let output = '';
      if (n === 100) return 'CIEN';
      if (n > 99) {
        output += centenas[Math.floor(n / 100)] + ' ';
        n %= 100;
      }
      if (n >= 10 && n <= 19) {
        output += especiales[n - 10] + ' ';
        return output.trim();
      }
      if (n >= 21 && n <= 29) {
        output += 'VEINTI' + unidades[n - 20] + ' ';
        return output.trim();
      }
      if (n >= 10) {
        output += decenas[Math.floor(n / 10)] + ' ';
        n %= 10;
        if (n > 0) output += 'Y ';
      }
      if (n > 0) {
        output += unidades[n] + ' ';
      }
      return output.trim();
    }

    if (entero === 0) return 'CERO PESOS M/CTE';

    let millones = Math.floor(entero / 1000000);
    let miles = Math.floor((entero % 1000000) / 1000);
    let unidadesCientos = entero % 1000;

    let resultado = '';

    if (millones > 0) {
      if (millones === 1) {
        resultado += 'UN MILLÓN ';
      } else {
        resultado += convertirGrupo(millones) + ' MILLONES ';
      }
    }

    if (miles > 0) {
      if (miles === 1) {
        resultado += 'UN MIL ';
      } else {
        resultado += convertirGrupo(miles) + ' MIL ';
      }
    }

    if (unidadesCientos > 0) {
      resultado += convertirGrupo(unidadesCientos) + ' ';
    }

    return (resultado.trim() + ' PESOS M/CTE').toUpperCase();
  }
}
