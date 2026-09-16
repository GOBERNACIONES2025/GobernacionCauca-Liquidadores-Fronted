import { computed, inject, Injectable, signal } from '@angular/core';
import {
  EntidadProductora,
  EstadoLiquidacion,
  HistorialAuditoria,
  InformacionTransporte,
  ItemLote,
  KpiLicores,
  LiquidacionLicores,
  MetodoPago,
  ProductoLicor,
  RangoEstampillas,
  RegistroPago,
} from '../domain/models/licores.models';
import { LicoresStorageService } from '../infrastructure/storage/licores-storage.service';
import {
  calcularLiquidacionItem,
  calcularTotalesLote,
} from '../domain/calculator/licores-tax-calculator';

export type RolUsuarioLicores = 'CONTRIBUYENTE' | 'RENTAS';

@Injectable({
  providedIn: 'root',
})
export class LicoresService {
  private storage = inject(LicoresStorageService);

  // Signals de Estado Reactivo Principal
  readonly liquidaciones = signal<LiquidacionLicores[]>([]);
  readonly catalogo = signal<ProductoLicor[]>([]);
  readonly entidades = signal<EntidadProductora[]>([]);
  readonly rolActivo = signal<RolUsuarioLicores>('CONTRIBUYENTE');
  readonly entidadActiva = signal<EntidadProductora | null>(null);

  // Filtros de navegación
  readonly filtroEstado = signal<string>('TODOS');
  readonly terminoBusqueda = signal<string>('');

  // KPIs Computados en tiempo real
  readonly kpis = computed<KpiLicores>(() => {
    const list = this.liquidaciones();
    let totalRecaudado = 0;
    let totalBotellasDeclaradas = 0;
    let pendientesAuditoria = 0;
    let requeridosSubsanacion = 0;
    let pendientesPago = 0;
    let tornaguiasActivas = 0;
    let tornaguiasLegalizadas = 0;

    for (const liq of list) {
      totalBotellasDeclaradas += liq.totalBotellas || 0;

      if (liq.estado === 'EN_REVISION') {
        pendientesAuditoria++;
      } else if (liq.estado === 'REQUERIDO') {
        requeridosSubsanacion++;
      } else if (liq.estado === 'PENDIENTE_PAGO') {
        pendientesPago++;
      } else if (liq.estado === 'PAGADO_EMITIDO') {
        tornaguiasActivas++;
        totalRecaudado += liq.totalPagar || 0;
      } else if (liq.estado === 'LEGALIZADO') {
        tornaguiasLegalizadas++;
        totalRecaudado += liq.totalPagar || 0;
      }
    }

    return {
      totalRecaudado,
      totalBotellasDeclaradas,
      pendientesAuditoria,
      requeridosSubsanacion,
      pendientesPago,
      tornaguiasActivas,
      tornaguiasLegalizadas,
      totalRadicados: list.length,
    };
  });

  // Liquidaciones filtradas según rol, estado y búsqueda
  readonly liquidacionesFiltradas = computed<LiquidacionLicores[]>(() => {
    const list = this.liquidaciones();
    const rol = this.rolActivo();
    const entidad = this.entidadActiva();
    const estado = this.filtroEstado();
    const search = this.terminoBusqueda().trim().toLowerCase();

    return list.filter((liq) => {
      // Filtro por rol / entidad
      if (rol === 'CONTRIBUYENTE' && entidad) {
        if (liq.entidadProductoraId !== entidad.id) {
          return false;
        }
      }

      // Filtro por estado
      if (estado !== 'TODOS' && liq.estado !== estado) {
        return false;
      }

      // Filtro por texto de búsqueda (Radicado, Placa, Destino, Tornaguía, Conductor)
      if (search) {
        const matchRadicado = liq.numeroRadicado.toLowerCase().includes(search);
        const matchTornaguia = (liq.tornaguiaNumero || '').toLowerCase().includes(search);
        const matchPlaca = liq.transporte.placaVehiculo.toLowerCase().includes(search);
        const matchMunicipio = liq.transporte.municipioDestino.toLowerCase().includes(search);
        const matchConductor = liq.transporte.nombreConductor.toLowerCase().includes(search);
        const matchEntidad = liq.entidadProductora.nombreComercial.toLowerCase().includes(search);

        if (!matchRadicado && !matchTornaguia && !matchPlaca && !matchMunicipio && !matchConductor && !matchEntidad) {
          return false;
        }
      }

      return true;
    });
  });

  constructor() {
    this.recargarDatosDesdeStorage();
  }

  public recargarDatosDesdeStorage(): void {
    const liqs = this.storage.getLiquidaciones();
    const cat = this.storage.getCatalogo();
    const ents = this.storage.getEntidades();

    this.liquidaciones.set(liqs);
    this.catalogo.set(cat);
    this.entidades.set(ents);

    // Por defecto seleccionar la Fábrica de Licores de Antioquia (FLA)
    if (ents.length > 0 && !this.entidadActiva()) {
      const fla = ents.find((e) => e.nit.includes('890900123')) || ents[0];
      this.entidadActiva.set(fla);
    }
  }

  // --- MÉTODOS DE CAMBIO DE ESTADO Y CONTEXTO ---

  public cambiarRol(rol: RolUsuarioLicores): void {
    this.rolActivo.set(rol);
    this.filtroEstado.set('TODOS');
    this.terminoBusqueda.set('');
  }

  public seleccionarEntidad(entidadId: string): void {
    const ent = this.entidades().find((e) => e.id === entidadId);
    if (ent) {
      this.entidadActiva.set(ent);
    }
  }

  public setFiltroEstado(estado: string): void {
    this.filtroEstado.set(estado);
  }

  public setTerminoBusqueda(term: string): void {
    this.terminoBusqueda.set(term);
  }

  // --- OPERACIONES DE NEGOCIO TRIBUTARIO ---

  /**
   * Radica una nueva declaración de embarque en estado 'EN_REVISION'
   */
  public radicarNuevaDeclaracion(datos: {
    transporte: InformacionTransporte;
    items: { producto: ProductoLicor; cantidad: number; observaciones?: string }[];
    entidadId?: string;
  }): LiquidacionLicores {
    const entidadId = datos.entidadId || this.entidadActiva()?.id || this.entidades()[0].id;
    const entidad = this.entidades().find((e) => e.id === entidadId) || this.entidades()[0];

    // Construir Items de lote con cálculo oficial
    const itemsLote: ItemLote[] = datos.items.map((it, idx) => {
      const calculo = calcularLiquidacionItem(it.producto, it.cantidad);
      return {
        id: `ITEM-${Date.now()}-${idx + 1}`,
        productoId: it.producto.id,
        producto: it.producto,
        cantidad: it.cantidad,
        calculo,
        observaciones: it.observaciones,
      };
    });

    const totales = calcularTotalesLote(itemsLote);
    const numeroRadicado = this.storage.generarSiguienteRadicado();
    const fechaActual = new Date().toISOString();

    const historialInicial: HistorialAuditoria = {
      fecha: fechaActual,
      funcionario: `Portal Contribuyente (${entidad.prefijoEstampilla})`,
      cargo: 'Solicitante / Declarante',
      accion: 'CREACION',
      observacion: `Declaración de embarque radicada formalmente para despacho de ${totales.totalBotellas} unidades con destino a ${datos.transporte.municipioDestino} (${datos.transporte.departamentoDestino}).`,
      estadoNuevo: 'EN_REVISION',
    };

    const nuevaLiq: LiquidacionLicores = {
      id: `LIQ-${Date.now()}`,
      numeroRadicado,
      fechaRadicacion: fechaActual,
      fechaActualizacion: fechaActual,
      entidadProductoraId: entidad.id,
      entidadProductora: entidad,
      transporte: datos.transporte,
      items: itemsLote,
      totalBotellas: totales.totalBotellas,
      subtotalEspecifico: totales.subtotalEspecifico,
      subtotalAdValorem: totales.subtotalAdValorem,
      subtotalIva: totales.subtotalIva,
      totalPagar: totales.totalPagar,
      estado: 'EN_REVISION',
      historial: [historialInicial],
    };

    const listaActual = [nuevaLiq, ...this.liquidaciones()];
    this.storage.saveLiquidaciones(listaActual);
    this.liquidaciones.set(listaActual);

    return nuevaLiq;
  }

  /**
   * Subsanar una declaración requerida y devolverla a 'EN_REVISION'
   */
  public subsanarDeclaracion(
    id: string,
    motivoSubsanacion: string,
    nuevosItems?: { producto: ProductoLicor; cantidad: number }[],
    nuevoTransporte?: InformacionTransporte
  ): boolean {
    const list = [...this.liquidaciones()];
    const index = list.findIndex((l) => l.id === id);
    if (index === -1) return false;

    const liq = { ...list[index] };
    const fechaActual = new Date().toISOString();

    if (nuevoTransporte) {
      liq.transporte = nuevoTransporte;
    }

    if (nuevosItems && nuevosItems.length > 0) {
      liq.items = nuevosItems.map((it, idx) => ({
        id: `ITEM-SUBSANADO-${Date.now()}-${idx + 1}`,
        productoId: it.producto.id,
        producto: it.producto,
        cantidad: it.cantidad,
        calculo: calcularLiquidacionItem(it.producto, it.cantidad),
      }));
      const totales = calcularTotalesLote(liq.items);
      liq.totalBotellas = totales.totalBotellas;
      liq.subtotalEspecifico = totales.subtotalEspecifico;
      liq.subtotalAdValorem = totales.subtotalAdValorem;
      liq.subtotalIva = totales.subtotalIva;
      liq.totalPagar = totales.totalPagar;
    }

    liq.estado = 'EN_REVISION';
    liq.fechaActualizacion = fechaActual;
    liq.observacionesSubsanacion = motivoSubsanacion;

    const entradaHistorial: HistorialAuditoria = {
      fecha: fechaActual,
      funcionario: `Portal Contribuyente (${liq.entidadProductora.prefijoEstampilla})`,
      cargo: 'Solicitante / Declarante',
      accion: 'SUBSANACION',
      observacion: `Requerimiento subsanado: "${motivoSubsanacion}". Expediente devuelto a auditoría fiscal.`,
      estadoAnterior: 'REQUERIDO',
      estadoNuevo: 'EN_REVISION',
    };

    liq.historial = [...liq.historial, entradaHistorial];
    list[index] = liq;

    this.storage.saveLiquidaciones(list);
    this.liquidaciones.set(list);
    return true;
  }

  /**
   * Auditoría Fiscal: Aprobar Declaración -> pasa a 'PENDIENTE_PAGO'
   */
  public aprobarDeclaracion(
    id: string,
    observacion: string,
    funcionario: string = 'Dra. Patricia Mosquera (Auditora Fiscal)'
  ): boolean {
    const list = [...this.liquidaciones()];
    const index = list.findIndex((l) => l.id === id);
    if (index === -1) return false;

    const liq = { ...list[index] };
    const fechaActual = new Date().toISOString();
    liq.estado = 'PENDIENTE_PAGO';
    liq.fechaActualizacion = fechaActual;
    liq.observacionesFuncionario = observacion;

    const entradaHistorial: HistorialAuditoria = {
      fecha: fechaActual,
      funcionario,
      cargo: 'Auditor Fiscal de Rentas',
      accion: 'APROBACION',
      observacion: observacion || 'Declaración y liquidación fiscal aprobada sin objeciones. Se habilita liquidación para pago oficial.',
      estadoAnterior: 'EN_REVISION',
      estadoNuevo: 'PENDIENTE_PAGO',
    };

    liq.historial = [...liq.historial, entradaHistorial];
    list[index] = liq;

    this.storage.saveLiquidaciones(list);
    this.liquidaciones.set(list);
    return true;
  }

  /**
   * Auditoría Fiscal: Requerir Declaración -> pasa a 'REQUERIDO'
   */
  public requerirDeclaracion(
    id: string,
    motivoRequerimiento: string,
    funcionario: string = 'Dra. Patricia Mosquera (Auditora Fiscal)'
  ): boolean {
    const list = [...this.liquidaciones()];
    const index = list.findIndex((l) => l.id === id);
    if (index === -1) return false;

    const liq = { ...list[index] };
    const fechaActual = new Date().toISOString();
    liq.estado = 'REQUERIDO';
    liq.fechaActualizacion = fechaActual;
    liq.observacionesFuncionario = motivoRequerimiento;

    const entradaHistorial: HistorialAuditoria = {
      fecha: fechaActual,
      funcionario,
      cargo: 'Auditor Fiscal de Rentas',
      accion: 'REQUERIMIENTO',
      observacion: motivoRequerimiento,
      estadoAnterior: 'EN_REVISION',
      estadoNuevo: 'REQUERIDO',
    };

    liq.historial = [...liq.historial, entradaHistorial];
    list[index] = liq;

    this.storage.saveLiquidaciones(list);
    this.liquidaciones.set(list);
    return true;
  }

  /**
   * Auditoría Fiscal: Rechazar Declaración -> pasa a 'RECHAZADO'
   */
  public rechazarDeclaracion(
    id: string,
    motivoRechazo: string,
    funcionario: string = 'Dra. Patricia Mosquera (Auditora Fiscal)'
  ): boolean {
    const list = [...this.liquidaciones()];
    const index = list.findIndex((l) => l.id === id);
    if (index === -1) return false;

    const liq = { ...list[index] };
    const fechaActual = new Date().toISOString();
    liq.estado = 'RECHAZADO';
    liq.fechaActualizacion = fechaActual;
    liq.observacionesFuncionario = motivoRechazo;

    const entradaHistorial: HistorialAuditoria = {
      fecha: fechaActual,
      funcionario,
      cargo: 'Auditor Fiscal de Rentas',
      accion: 'RECHAZO',
      observacion: motivoRechazo || 'Declaración rechazada por incumplimiento normativo.',
      estadoAnterior: liq.estado,
      estadoNuevo: 'RECHAZADO',
    };

    liq.historial = [...liq.historial, entradaHistorial];
    list[index] = liq;

    this.storage.saveLiquidaciones(list);
    this.liquidaciones.set(list);
    return true;
  }

  /**
   * Procesar Pago (PSE o Asobancario):
   * Cambia estado a 'PAGADO_EMITIDO', asigna consecutivo de Tornaguía y rango de estampillas.
   */
  public procesarPago(
    id: string,
    datosPago: {
      metodo: MetodoPago;
      banco?: string;
      referencia?: string;
      codigoTransaccionPse?: string;
    }
  ): LiquidacionLicores | null {
    const list = [...this.liquidaciones()];
    const index = list.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const liq = { ...list[index] };
    const fechaActual = new Date().toISOString();

    // 1. Generar Tornaguía Oficial y Estampillas
    const numeroTornaguia = this.storage.generarSiguienteTornaguia();
    const prefijo = liq.entidadProductora.prefijoEstampilla || 'FLA';
    const rangoEstampillas = this.storage.asignarRangoEstampillas(liq.totalBotellas, prefijo);

    // 2. Fecha de vencimiento (15 días calendario a partir de la emisión)
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 15);

    // 3. Registro de Pago
    const registroPago: RegistroPago = {
      metodo: datosPago.metodo,
      referenciaPago: datosPago.referencia || `REF-${Date.now().toString().slice(-8)}`,
      codigoTransaccionPse: datosPago.codigoTransaccionPse || `CUS-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
      banco: datosPago.banco || 'Bancolombia S.A.',
      fechaPago: fechaActual,
      valorPagado: liq.totalPagar,
      estadoPago: 'APROBADO',
    };

    // 4. Hash digital y datos QR
    const qrData = `GOB-CAUCA|ICL|${numeroTornaguia}|${liq.numeroRadicado}|NIT:${liq.entidadProductora.nit}|BOTELLAS:${liq.totalBotellas}|ESTAMP:${rangoEstampillas.desde}-${rangoEstampillas.hasta}|VENCE:${fechaVencimiento.toISOString().slice(0, 10)}`;
    const hash = `SHA256-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;

    liq.estado = 'PAGADO_EMITIDO';
    liq.fechaActualizacion = fechaActual;
    liq.pago = registroPago;
    liq.tornaguiaNumero = numeroTornaguia;
    liq.fechaEmisionTornaguia = fechaActual;
    liq.fechaVencimientoTornaguia = fechaVencimiento.toISOString();
    liq.rangoEstampillas = rangoEstampillas;
    liq.codigoQrData = qrData;
    liq.hashFirmaDigital = hash;

    const entradaHistorialPago: HistorialAuditoria = {
      fecha: fechaActual,
      funcionario: datosPago.metodo === 'PSE' ? 'Pasarela PSE ACH Colombia' : 'Archivo Asobancario 2001',
      cargo: 'Sistema Integrado de Recaudo',
      accion: 'PAGO_REGISTRADO',
      observacion: `Pago por valor de $${liq.totalPagar.toLocaleString('es-CO')} COP verificado exitosamente mediante ${datosPago.metodo}.`,
      estadoAnterior: 'PENDIENTE_PAGO',
      estadoNuevo: 'PAGADO_EMITIDO',
    };

    const entradaHistorialTornaguia: HistorialAuditoria = {
      fecha: fechaActual,
      funcionario: 'Sistema de Rentas Departamentales',
      cargo: 'Emisión Automática de Tornaguías',
      accion: 'EMISION_TORNAGUIA',
      observacion: `Tornaguía oficial ${numeroTornaguia} emitida. Se asignaron ${liq.totalBotellas} estampillas serializadas (${rangoEstampillas.desde} al ${rangoEstampillas.hasta}).`,
      estadoAnterior: 'PAGADO_EMITIDO',
      estadoNuevo: 'PAGADO_EMITIDO',
    };

    liq.historial = [...liq.historial, entradaHistorialPago, entradaHistorialTornaguia];
    list[index] = liq;

    this.storage.saveLiquidaciones(list);
    this.liquidaciones.set(list);
    return liq;
  }

  /**
   * Legalización de Tornaguía en Destino:
   * Cambia estado a 'LEGALIZADO' cuando el cargamento arriba a Cauca y es inspeccionado.
   */
  public legalizarTornaguia(
    id: string,
    funcionario: string = 'Inspector de Rentas en Destino',
    actaNumero?: string
  ): boolean {
    const list = [...this.liquidaciones()];
    const index = list.findIndex((l) => l.id === id);
    if (index === -1) return false;

    const liq = { ...list[index] };
    const fechaActual = new Date().toISOString();
    const acta = actaNumero || `ACT-LEG-${Date.now().toString().slice(-6)}`;

    liq.estado = 'LEGALIZADO';
    liq.fechaActualizacion = fechaActual;
    liq.fechaLegalizacion = fechaActual;
    liq.funcionarioLegalizador = funcionario;
    liq.actaLegalizacionNumero = acta;

    const entradaHistorial: HistorialAuditoria = {
      fecha: fechaActual,
      funcionario,
      cargo: 'Inspector Operativo de Rentas Departamentales',
      accion: 'LEGALIZACION',
      observacion: `Cargamento inspeccionado en punto de llegada en ${liq.transporte.municipioDestino}. Precintos y ${liq.totalBotellas} botellas con estampillas verificadas. Acta No. ${acta}. Tornaguía legalizada.`,
      estadoAnterior: 'PAGADO_EMITIDO',
      estadoNuevo: 'LEGALIZADO',
    };

    liq.historial = [...liq.historial, entradaHistorial];
    list[index] = liq;

    this.storage.saveLiquidaciones(list);
    this.liquidaciones.set(list);
    return true;
  }

  /**
   * Búsqueda de liquidación por número de radicado
   */
  public buscarPorRadicado(radicado: string): LiquidacionLicores | undefined {
    const query = radicado.trim().toUpperCase();
    return this.liquidaciones().find((l) => l.numeroRadicado.toUpperCase() === query || l.id === query);
  }

  /**
   * Búsqueda de liquidación por número de tornaguía
   */
  public buscarPorTornaguia(tornaguia: string): LiquidacionLicores | undefined {
    const query = tornaguia.trim().toUpperCase();
    return this.liquidaciones().find((l) => (l.tornaguiaNumero || '').toUpperCase() === query);
  }

  /**
   * Restablece la base de datos a los valores iniciales semilla
   */
  public restablecerValoresIniciales(): void {
    this.storage.resetToSeed();
    this.recargarDatosDesdeStorage();
  }
}
