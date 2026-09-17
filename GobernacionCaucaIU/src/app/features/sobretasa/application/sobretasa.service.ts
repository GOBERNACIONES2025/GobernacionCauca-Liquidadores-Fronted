import { Injectable, computed, inject, signal } from '@angular/core';
import {
  DeclaracionSobretasa,
  DespachoItem,
  DistribuidorMayorista,
  EstacionServicioDestino,
  KpiSobretasa,
  TipoCombustible,
} from '../domain/models/sobretasa-gasolina.models';
import {
  calcularLiquidacionDespacho,
  calcularLiquidacionMensual,
} from '../domain/calculator/sobretasa-tax-calculator';
import { SobretasaStorageService } from '../infrastructure/storage/sobretasa-storage.service';
import { SIMULATED_SICOM_BATCH } from '../infrastructure/data/sobretasa-gasolina.seed';

@Injectable({
  providedIn: 'root',
})
export class SobretasaService {
  private storage = inject(SobretasaStorageService);

  // Estados Reactivos Principales
  readonly declaraciones = signal<DeclaracionSobretasa[]>(this.storage.getDeclaraciones());
  readonly mayoristas = signal<DistribuidorMayorista[]>(this.storage.getMayoristas());
  readonly edsCatalog = signal<EstacionServicioDestino[]>(this.storage.getEdsCatalogo());
  readonly currentRol = signal<'MAYORISTA' | 'FUNCIONARIO'>(this.storage.getRolActivo());
  readonly selectedMayoristaId = signal<string>(this.storage.getMayoristaActivoId());

  // Mayorista actualmente seleccionado en el portal
  readonly currentMayorista = computed(() => {
    const list = this.mayoristas();
    const id = this.selectedMayoristaId();
    return list.find((m) => m.id === id) || list[0];
  });

  // Declaraciones filtradas para el portal mayorista actual
  readonly declaracionesMayorista = computed(() => {
    const id = this.selectedMayoristaId();
    return this.declaraciones().filter((d) => d.mayoristaId === id);
  });

  // KPIs de Control Territorial (para Funcionario de Hacienda y resumen ejecutivo)
  readonly kpis = computed<KpiSobretasa>(() => {
    const decs = this.declaraciones();
    let totalGalonesJurisdiccion = 0;
    let totalGalonesGMC = 0;
    let totalGalonesGME = 0;
    let totalGalonesACPM = 0;
    let recaudoMunicipalTotal = 0;
    let recaudoDepartamentalTotal = 0;
    let recaudoGeneralEfectivo = 0;

    let declaracionesPendientesRevision = 0;
    let declaracionesObservadas = 0;
    let declaracionesPendientesPago = 0;
    let declaracionesPagadas = 0;

    for (const d of decs) {
      totalGalonesJurisdiccion += d.totalGalonesGeneral || 0;
      totalGalonesGMC += d.totalGalonesGMC || 0;
      totalGalonesGME += d.totalGalonesGME || 0;
      totalGalonesACPM += d.totalGalonesACPM || 0;

      recaudoMunicipalTotal += d.totalMunicipal || 0;
      recaudoDepartamentalTotal += d.totalDepartamental || 0;

      if (d.estado === 'PAGADO_APROBADO') {
        recaudoGeneralEfectivo += d.totalPagar || 0;
        declaracionesPagadas++;
      } else if (d.estado === 'EN_REVISION') {
        declaracionesPendientesRevision++;
      } else if (d.estado === 'OBSERVADO') {
        declaracionesObservadas++;
      } else if (d.estado === 'PENDIENTE_PAGO') {
        declaracionesPendientesPago++;
      }
    }

    return {
      totalGalonesJurisdiccion,
      totalGalonesGMC,
      totalGalonesGME,
      totalGalonesACPM,
      recaudoMunicipalTotal,
      recaudoDepartamentalTotal,
      recaudoGeneralEfectivo,
      declaracionesPendientesRevision,
      declaracionesObservadas,
      declaracionesPendientesPago,
      declaracionesPagadas,
      totalDeclaraciones: decs.length,
    };
  });

  // Cambiar Rol de Usuario
  setRol(rol: 'MAYORISTA' | 'FUNCIONARIO'): void {
    this.currentRol.set(rol);
    this.storage.saveRolActivo(rol);
  }

  // Cambiar Mayorista Activo
  setSelectedMayorista(id: string): void {
    this.selectedMayoristaId.set(id);
    this.storage.saveMayoristaActivoId(id);
  }

  // Obtener una declaración por ID o Radicado
  getDeclaracionById(idOrRadicado: string): DeclaracionSobretasa | undefined {
    return this.declaraciones().find(
      (d) =>
        d.id === idOrRadicado ||
        d.numeroRadicado.toLowerCase() === idOrRadicado.trim().toLowerCase()
    );
  }

  // Simular la importación de un archivo plano SICOM
  simularImportacionSicom(): DespachoItem[] {
    const catalogo = this.edsCatalog();
    return SIMULATED_SICOM_BATCH.map((item, idx) => {
      const eds = catalogo.find((e) => e.codigoSicomEds === item.codEds);
      const calc = calcularLiquidacionDespacho(item.tipo, item.galones);
      return {
        id: `desp-sim-${Date.now()}-${idx}`,
        codigoGuiaSicom: item.guia,
        fechaDespacho: item.fecha,
        placaVehiculo: item.placa,
        tipoCombustible: item.tipo,
        galonesDespachados: item.galones,
        codigoSicomEds: item.codEds,
        estacionServicio: eds,
        tarifaMunicipalAplicada: calc.tarifaMunicipal,
        tarifaDepartamentalAplicada: calc.tarifaDepartamental,
        subtotalMunicipal: calc.subtotalMunicipal,
        subtotalDepartamental: calc.subtotalDepartamental,
        totalItem: calc.totalItem,
        validadoSicom: false,
      };
    });
  }

  // Crear o Radicar una nueva Declaración (Pasa a estado EN_REVISION)
  radicarDeclaracion(payload: {
    periodoMes: number;
    periodoAnio: number;
    mayoristaId: string;
    despachos: DespachoItem[];
  }): DeclaracionSobretasa {
    const mayorista =
      this.mayoristas().find((m) => m.id === payload.mayoristaId) ||
      this.currentMayorista();

    const fechaRadicacion = new Date();
    const liq = calcularLiquidacionMensual(
      payload.despachos,
      payload.periodoMes,
      payload.periodoAnio,
      fechaRadicacion
    );

    const radicado = this.storage.generarSiguienteRadicado();
    const codigoBarras = this.storage.generarCodigoBarras(
      radicado,
      liq.totalPagar,
      liq.fechaLimitePago
    );

    const nuevaDeclaracion: DeclaracionSobretasa = {
      id: `dec-${Date.now()}`,
      numeroRadicado: radicado,
      periodoMes: payload.periodoMes,
      periodoAnio: payload.periodoAnio,
      mayoristaId: mayorista.id,
      mayorista,
      fechaRadicacion: fechaRadicacion.toISOString(),
      fechaLimitePago: liq.fechaLimitePago,
      esExtemporanea: liq.esExtemporanea,
      diasRetraso: liq.diasRetraso,
      sancionExtemporaneidad: liq.sancionExtemporaneidad,
      despachos: payload.despachos,
      totalGalonesGMC: liq.totalGalonesGMC,
      totalGalonesGME: liq.totalGalonesGME,
      totalGalonesACPM: liq.totalGalonesACPM,
      totalGalonesGeneral: liq.totalGalonesGeneral,
      totalMunicipalGMC: liq.totalMunicipalGMC,
      totalDepartamentalGMC: liq.totalDepartamentalGMC,
      totalMunicipalGME: liq.totalMunicipalGME,
      totalDepartamentalGME: liq.totalDepartamentalGME,
      totalDepartamentalACPM: liq.totalDepartamentalACPM,
      totalMunicipal: liq.totalMunicipal,
      totalDepartamental: liq.totalDepartamental,
      subtotalImpuesto: liq.subtotalImpuesto,
      totalPagar: liq.totalPagar,
      estado: 'EN_REVISION',
      codigoBarrasBancario: codigoBarras,
      validacionSicomCompleta: false,
      historial: [
        {
          fecha: fechaRadicacion.toISOString(),
          funcionario: mayorista.razonSocial,
          cargo: 'Agente Mayorista Distribuidor',
          accion: 'RADICACION',
          observacion: `Radicación electrónica mensual de Sobretasa a la Gasolina y ACPM. Total despachos: ${payload.despachos.length}, Galones: ${liq.totalGalonesGeneral.toLocaleString('es-CO')}.`,
          estadoNuevo: 'EN_REVISION',
        },
      ],
    };

    const actualizadas = [nuevaDeclaracion, ...this.declaraciones()];
    this.declaraciones.set(actualizadas);
    this.storage.saveDeclaraciones(actualizadas);
    return nuevaDeclaracion;
  }

  // Subsanar o Corregir una Declaración Observada / Requerida (Mayorista)
  subsanarDeclaracion(
    id: string,
    despachosCorregidos: DespachoItem[],
    observacionMayorista: string
  ): boolean {
    const list = [...this.declaraciones()];
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return false;

    const dec = list[idx];
    const fecha = new Date();
    const liq = calcularLiquidacionMensual(
      despachosCorregidos,
      dec.periodoMes,
      dec.periodoAnio,
      new Date(dec.fechaRadicacion)
    );

    const actual: DeclaracionSobretasa = {
      ...dec,
      despachos: despachosCorregidos,
      totalGalonesGMC: liq.totalGalonesGMC,
      totalGalonesGME: liq.totalGalonesGME,
      totalGalonesACPM: liq.totalGalonesACPM,
      totalGalonesGeneral: liq.totalGalonesGeneral,
      totalMunicipalGMC: liq.totalMunicipalGMC,
      totalDepartamentalGMC: liq.totalDepartamentalGMC,
      totalMunicipalGME: liq.totalMunicipalGME,
      totalDepartamentalGME: liq.totalDepartamentalGME,
      totalDepartamentalACPM: liq.totalDepartamentalACPM,
      totalMunicipal: liq.totalMunicipal,
      totalDepartamental: liq.totalDepartamental,
      subtotalImpuesto: liq.subtotalImpuesto,
      sancionExtemporaneidad: liq.sancionExtemporaneidad,
      totalPagar: liq.totalPagar,
      estado: 'EN_REVISION',
      observacionesSubsanacion: observacionMayorista,
      fechaActualizacion: fecha.toISOString(),
      historial: [
        ...dec.historial,
        {
          fecha: fecha.toISOString(),
          funcionario: dec.mayorista.razonSocial,
          cargo: 'Agente Mayorista Distribuidor',
          accion: 'SUBSANACION',
          observacion: `Requerimiento subsanado: "${observacionMayorista}". Declaración y liquidación corregida reenviada a fiscalización tributaria.`,
          estadoAnterior: dec.estado,
          estadoNuevo: 'EN_REVISION',
        },
      ],
    };

    list[idx] = actual;
    this.declaraciones.set(list);
    this.storage.saveDeclaraciones(list);
    return true;
  }

  // Simular Cruce y Validación con SICOM MinMinas (Funcionario)
  validarSicomDeclaracion(id: string): { exitoso: boolean; mensaje: string } {
    const list = [...this.declaraciones()];
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return { exitoso: false, mensaje: 'Declaración no encontrada' };

    const dec = list[idx];
    const despachosValidados = dec.despachos.map((d) => ({
      ...d,
      validadoSicom: true,
    }));

    const actual = {
      ...dec,
      despachos: despachosValidados,
      validacionSicomCompleta: true,
      historial: [
        ...dec.historial,
        {
          fecha: new Date().toISOString(),
          funcionario: 'Dr. Carlos Alberto Medina',
          cargo: 'Fiscalizador de Rentas Departamentales',
          accion: 'VALIDACION_SICOM' as const,
          observacion: 'Verificación exitosa del 100% de las guías de transporte contra el servicio web de SICOM MinMinas.',
          estadoNuevo: dec.estado,
        },
      ],
    };

    list[idx] = actual;
    this.declaraciones.set(list);
    this.storage.saveDeclaraciones(list);
    return {
      exitoso: true,
      mensaje: 'Validación SICOM exitosa: Todas las guías coinciden con los despachos de planta autorizados.',
    };
  }

  // Aprobar Declaración -> Pasa a PENDIENTE_PAGO
  aprobarDeclaracion(id: string, funcionario: string = 'Dra. Patricia Mosquera (Auditora Fiscal)', obs?: string): boolean {
    const list = [...this.declaraciones()];
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return false;

    const dec = list[idx];
    const fecha = new Date();
    const actual: DeclaracionSobretasa = {
      ...dec,
      estado: 'PENDIENTE_PAGO',
      fechaActualizacion: fecha.toISOString(),
      historial: [
        ...dec.historial,
        {
          fecha: fecha.toISOString(),
          funcionario: funcionario || 'Secretaría de Hacienda Departamental',
          cargo: 'Auditor Tributario',
          accion: 'APROBACION',
          observacion: obs || 'Declaración verificada y liquidada conforme a la Ley 2093 de 2021. Se habilita para pago oficial.',
          estadoAnterior: dec.estado,
          estadoNuevo: 'PENDIENTE_PAGO',
        },
      ],
    };

    list[idx] = actual;
    this.declaraciones.set(list);
    this.storage.saveDeclaraciones(list);
    return true;
  }

  // Observar / Requerir Declaración -> Pasa a OBSERVADO / REQUERIDO
  observarDeclaracion(id: string, funcionario: string, motivoObservacion: string): boolean {
    const list = [...this.declaraciones()];
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return false;

    const dec = list[idx];
    const fecha = new Date();
    const actual: DeclaracionSobretasa = {
      ...dec,
      estado: 'OBSERVADO',
      observacionesFiscalizacion: motivoObservacion,
      fechaActualizacion: fecha.toISOString(),
      historial: [
        ...dec.historial,
        {
          fecha: fecha.toISOString(),
          funcionario: funcionario || 'Fiscalizador de Hacienda',
          cargo: 'Auditor de Rentas',
          accion: 'REQUERIMIENTO',
          observacion: motivoObservacion,
          estadoAnterior: dec.estado,
          estadoNuevo: 'OBSERVADO',
        },
      ],
    };

    list[idx] = actual;
    this.declaraciones.set(list);
    this.storage.saveDeclaraciones(list);
    return true;
  }

  // Rechazar Declaración -> Pasa a RECHAZADO
  rechazarDeclaracion(id: string, motivoRechazo: string, funcionario: string = 'Fiscalizador de Hacienda'): boolean {
    const list = [...this.declaraciones()];
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return false;

    const dec = list[idx];
    const fecha = new Date();
    const actual: DeclaracionSobretasa = {
      ...dec,
      estado: 'RECHAZADO',
      observacionesFiscalizacion: motivoRechazo,
      fechaActualizacion: fecha.toISOString(),
      historial: [
        ...dec.historial,
        {
          fecha: fecha.toISOString(),
          funcionario: funcionario || 'Fiscalizador de Hacienda',
          cargo: 'Auditor de Rentas',
          accion: 'RECHAZO',
          observacion: motivoRechazo || 'Declaración rechazada por inconsistencias normativas insubsanables.',
          estadoAnterior: dec.estado,
          estadoNuevo: 'RECHAZADO',
        },
      ],
    };

    list[idx] = actual;
    this.declaraciones.set(list);
    this.storage.saveDeclaraciones(list);
    return true;
  }

  // Procesar Pago PSE
  pagarPse(id: string, banco: string): { exito: boolean; ref: string; cus: string } {
    const list = [...this.declaraciones()];
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return { exito: false, ref: '', cus: '' };

    const dec = list[idx];
    const ref = `PSE-CAUCA-SOB-${Math.floor(100000 + Math.random() * 900000)}`;
    const cus = `CUS-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const fecha = new Date();

    const actual: DeclaracionSobretasa = {
      ...dec,
      estado: 'PAGADO_APROBADO',
      comprobantePagoRef: ref,
      fechaActualizacion: fecha.toISOString(),
      pago: {
        metodo: 'PSE',
        referenciaPago: ref,
        codigoCus: cus,
        banco: banco || 'Bancolombia S.A.',
        fechaPago: fecha.toISOString(),
        valorPagado: dec.totalPagar,
        estadoPago: 'APROBADO',
      },
      historial: [
        ...dec.historial,
        {
          fecha: fecha.toISOString(),
          funcionario: 'Pasarela PSE - Redeban / ACH',
          cargo: 'Transacción Electrónica Bancaria',
          accion: 'PAGO_REGISTRADO',
          observacion: `Pago en línea acreditado satisfactoriamente por valor de $${dec.totalPagar.toLocaleString('es-CO')} COP. CUS: ${cus}, Banco: ${banco}.`,
          estadoAnterior: dec.estado,
          estadoNuevo: 'PAGADO_APROBADO',
        },
      ],
    };

    list[idx] = actual;
    this.declaraciones.set(list);
    this.storage.saveDeclaraciones(list);
    return { exito: true, ref, cus };
  }

  // Procesar Pago Ventanilla Asobancario
  procesarPagoAsobancario(
    id: string,
    datos: {
      banco: string;
      referencia: string;
      fecha?: string;
    }
  ): boolean {
    const list = [...this.declaraciones()];
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return false;

    const dec = list[idx];
    const fechaActual = datos.fecha ? new Date(datos.fecha).toISOString() : new Date().toISOString();
    const ref = datos.referencia || `REC-ASOB-${Date.now().toString().slice(-8)}`;

    const actual: DeclaracionSobretasa = {
      ...dec,
      estado: 'PAGADO_APROBADO',
      comprobantePagoRef: ref,
      fechaActualizacion: fechaActual,
      pago: {
        metodo: 'ASOBANCARIO_VENTANILLA',
        referenciaPago: ref,
        codigoCus: ref,
        banco: datos.banco || 'Banco Agrario de Colombia',
        fechaPago: fechaActual,
        valorPagado: dec.totalPagar,
        estadoPago: 'APROBADO',
      },
      historial: [
        ...dec.historial,
        {
          fecha: fechaActual,
          funcionario: 'Archivo Asobancario 2001 - Ventanilla Bancaria',
          cargo: 'Convenio Recaudador Departamental',
          accion: 'PAGO_REGISTRADO',
          observacion: `Consignación bancaria verificada en ${datos.banco} por valor de $${dec.totalPagar.toLocaleString('es-CO')} COP. Comprobante No. ${ref}.`,
          estadoAnterior: dec.estado,
          estadoNuevo: 'PAGADO_APROBADO',
        },
      ],
    };

    list[idx] = actual;
    this.declaraciones.set(list);
    this.storage.saveDeclaraciones(list);
    return true;
  }

  // Buscar por Radicado
  buscarPorRadicado(radicado: string): DeclaracionSobretasa | undefined {
    const query = radicado.trim().toUpperCase();
    return this.declaraciones().find(
      (d) => d.numeroRadicado.toUpperCase() === query || d.id === query || (d.comprobantePagoRef || '').toUpperCase() === query
    );
  }

  // Agregar nuevo Mayorista al catálogo
  guardarMayorista(m: DistribuidorMayorista): void {
    const list = [...this.mayoristas()];
    const idx = list.findIndex((item) => item.id === m.id);
    if (idx >= 0) {
      list[idx] = m;
    } else {
      list.push(m);
    }
    this.mayoristas.set(list);
    this.storage.saveMayoristas(list);
  }

  // Agregar o Editar EDS
  guardarEds(eds: EstacionServicioDestino): void {
    const list = [...this.edsCatalog()];
    const idx = list.findIndex((item) => item.id === eds.id || item.codigoSicomEds === eds.codigoSicomEds);
    if (idx >= 0) {
      list[idx] = eds;
    } else {
      list.push(eds);
    }
    this.edsCatalog.set(list);
    this.storage.saveEdsCatalogo(list);
  }

  // Resetear todo a los datos semilla iniciales
  resetearDatos(): void {
    this.storage.resetToSeed();
    this.declaraciones.set(this.storage.getDeclaraciones());
    this.mayoristas.set(this.storage.getMayoristas());
    this.edsCatalog.set(this.storage.getEdsCatalogo());
    this.currentRol.set(this.storage.getRolActivo());
    this.selectedMayoristaId.set(this.storage.getMayoristaActivoId());
  }
}
