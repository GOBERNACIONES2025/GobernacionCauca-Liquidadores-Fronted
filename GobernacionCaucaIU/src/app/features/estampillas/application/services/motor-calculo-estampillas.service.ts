import { Injectable, inject } from '@angular/core';
import { EstampillasStorageService } from '../../infrastructure/storage/storage.service';
import {
  Estampilla,
  ItemLiquidacionConcepto,
  LiquidacionEstampilla,
  Contribuyente,
  Contrato
} from '../../domain/models/estampillas.models';

export interface SolicitudCalculoEstampilla {
  valorContrato: number;
  descuentosDeducciones: number;
  estampillasSeleccionadas: Estampilla[];
  aplicaExencion: boolean;
  tipoExencion?: string;
  fundamentoExencion?: string;
  porcentajeExencion: number; // 0 a 100
  documentoSoporteExencion?: string;
}

export interface ResultadoCalculoEstampillas {
  valorBaseContrato: number;
  descuentosDeducciones: number;
  baseGravableNeta: number;
  totalExencionesAhorro: number;
  totalImpuesto: number;
  interesesMora: number;
  sanciones: number;
  totalPagar: number;
  totalPagarLetras: string;
  conceptos: ItemLiquidacionConcepto[];
}

@Injectable({
  providedIn: 'root'
})
export class MotorCalculoEstampillasService {
  private storage = inject(EstampillasStorageService);

  /**
   * Determina la base gravable neta restando deducciones de ley aplicables.
   */
  calcularBaseGravable(valorContrato: number, deducciones: number = 0): number {
    const valor = Math.max(0, valorContrato || 0);
    const desc = Math.max(0, deducciones || 0);
    return Math.max(0, valor - desc);
  }

  /**
   * Calcula el porcentaje efectivo de tarifa.
   */
  calcularTarifa(tarifaPorcentaje: number): number {
    return Math.max(0, tarifaPorcentaje || 0);
  }

  /**
   * Calcula el descuento por exención tributaria autorizada.
   */
  calcularAhorroExencion(baseNeta: number, porcentajeExencion: number): number {
    const pct = Math.min(100, Math.max(0, porcentajeExencion || 0));
    return Math.round((baseNeta * pct) / 100);
  }

  /**
   * Determina el valor nominal de impuesto para un concepto de estampilla.
   */
  calcularImpuesto(baseGravableFinal: number, tarifaPorcentaje: number): number {
    const base = Math.max(0, baseGravableFinal || 0);
    const tarifa = Math.max(0, tarifaPorcentaje || 0);
    return Math.round((base * tarifa) / 100);
  }

  /**
   * Procesa el cálculo tributario completo para un conjunto de estampillas seleccionadas.
   */
  calcularLiquidacionCompleta(solicitud: SolicitudCalculoEstampilla): ResultadoCalculoEstampillas {
    const baseNeta = this.calcularBaseGravable(solicitud.valorContrato, solicitud.descuentosDeducciones);
    const porcentajeExencion = solicitud.aplicaExencion ? Math.min(100, Math.max(0, solicitud.porcentajeExencion || 0)) : 0;

    let totalAhorroExenciones = 0;
    let totalImpuestoCalculado = 0;

    const conceptos: ItemLiquidacionConcepto[] = (solicitud.estampillasSeleccionadas || []).map(est => {
      let pctExencionItem = 0;
      if (solicitud.aplicaExencion) {
        // Si la exención es aplicable
        pctExencionItem = porcentajeExencion;
      }

      const valorAhorroItem = this.calcularAhorroExencion(baseNeta, pctExencionItem);
      const baseFinalItem = Math.max(0, baseNeta - valorAhorroItem);
      const valorImpuestoItem = this.calcularImpuesto(baseFinalItem, est.tarifaPorcentaje);

      totalAhorroExenciones += valorAhorroItem;
      totalImpuestoCalculado += valorImpuestoItem;

      return {
        estampillaId: est.id,
        estampillaCodigo: est.codigo,
        estampillaNombre: est.nombre,
        fundamentoLegal: est.fundamentoLegal,
        valorBaseContrato: solicitud.valorContrato,
        descuentosDeducciones: solicitud.descuentosDeducciones,
        baseGravableNeta: baseNeta,
        porcentajeExencion: pctExencionItem,
        baseGravableFinal: baseFinalItem,
        tarifaPorcentaje: est.tarifaPorcentaje,
        valorImpuesto: valorImpuestoItem
      };
    });

    const totalPagar = totalImpuestoCalculado;
    const totalPagarLetras = this.storage.numeroALetras(totalPagar);

    return {
      valorBaseContrato: solicitud.valorContrato,
      descuentosDeducciones: solicitud.descuentosDeducciones,
      baseGravableNeta: baseNeta,
      totalExencionesAhorro: totalAhorroExenciones,
      totalImpuesto: totalImpuestoCalculado,
      interesesMora: 0,
      sanciones: 0,
      totalPagar,
      totalPagarLetras,
      conceptos
    };
  }

  /**
   * Genera el consecutivo institucional estructurado (ej: LIQ-2026-000124).
   */
  generarNumeroLiquidacion(consecutivo: number, vigencia: number): string {
    const padded = consecutivo.toString().padStart(6, '0');
    return `LIQ-${vigencia}-${padded}`;
  }

  /**
   * Construye el código de barras estándar de recaudo para entidades bancarias (GS1-128 con AI 415, 8020, 3900, 96).
   */
  construirCodigoBarrasRecaudo(consecutivo: number, valor: number, fechaLimiteStr: string): string {
    const eanEntidad = '7709998000000'; // Código EAN de la Gobernación del Cauca
    const numRef = consecutivo.toString().padStart(9, '0');
    const valPadded = Math.round(valor).toString().padStart(10, '0');
    const fechaLim = fechaLimiteStr.replace(/\D/g, ''); // YYYYMMDD

    return `(415)${eanEntidad}(8020)${numRef}(3900)${valPadded}(96)${fechaLim}`;
  }

  /**
   * Crea una nueva instancia completa de Liquidación Oficial persistible.
   */
  crearLiquidacionOficial(
    contribuyente: Contribuyente,
    contrato: Contrato,
    solicitud: SolicitudCalculoEstampilla,
    usuarioActual: string,
    usuarioRol: string
  ): LiquidacionEstampilla {
    const vigencia = contrato.vigencia || new Date().getFullYear();
    const liquidacionesExistentes = this.storage.getLiquidaciones();
    const ultimoConsecutivo = liquidacionesExistentes.reduce((max, l) => Math.max(max, l.consecutivo || 0), 0);
    const nuevoConsecutivo = ultimoConsecutivo + 1;
    const numeroLiquidacion = this.generarNumeroLiquidacion(nuevoConsecutivo, vigencia);

    const now = new Date();
    const fechaGeneracion = now.toISOString().substring(0, 10);
    
    // Fecha límite de pago: 30 días calendario
    const fechaLimite = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

    const resultadoCalculo = this.calcularLiquidacionCompleta(solicitud);
    const codigoBarras = this.construirCodigoBarrasRecaudo(nuevoConsecutivo, resultadoCalculo.totalPagar, fechaLimite);
    const qrCode = `CAUCA-LIQ-${vigencia}-${nuevoConsecutivo}-IMP-${resultadoCalculo.totalPagar}`;

    const docContribuyente = contribuyente.digitoVerificacion 
      ? `${contribuyente.numeroDocumento}-${contribuyente.digitoVerificacion}`
      : contribuyente.numeroDocumento;

    const nuevaLiquidacion: LiquidacionEstampilla = {
      id: `LIQ-${Date.now()}`,
      numeroLiquidacion,
      consecutivo: nuevoConsecutivo,
      vigencia,
      fechaGeneracion,
      fechaLimitePago: fechaLimite,
      contribuyenteId: contribuyente.id,
      contribuyenteNombre: contribuyente.nombreCompleto,
      contribuyenteDocumento: docContribuyente,
      contribuyenteTipoDoc: contribuyente.tipoDocumento,
      contribuyenteDireccion: contribuyente.direccion,
      contribuyenteTelefono: contribuyente.telefono,
      contribuyenteEmail: contribuyente.correoElectronico,
      contribuyenteMunicipio: contribuyente.municipioNombre,
      contratoId: contrato.id,
      numeroContrato: contrato.numeroContrato,
      objetoContrato: contrato.objeto,
      entidadContratante: contrato.entidadContratante,
      valorContrato: contrato.valorContrato,
      tipoContratoNombre: contrato.tipoContratoNombre,
      municipioEjecucion: contrato.municipioNombre,
      conceptos: resultadoCalculo.conceptos,
      aplicaExencion: solicitud.aplicaExencion,
      tipoExencion: solicitud.tipoExencion,
      fundamentoExencion: solicitud.fundamentoExencion,
      porcentajeExencionGlobal: solicitud.porcentajeExencion,
      documentoSoporteExencion: solicitud.documentoSoporteExencion,
      totalBaseGravable: resultadoCalculo.baseGravableNeta,
      totalDescuentos: resultadoCalculo.descuentosDeducciones,
      totalExencionesAhorro: resultadoCalculo.totalExencionesAhorro,
      totalImpuesto: resultadoCalculo.totalImpuesto,
      interesesMora: 0,
      sanciones: 0,
      totalPagar: resultadoCalculo.totalPagar,
      totalPagarLetras: resultadoCalculo.totalPagarLetras,
      estado: 'PENDIENTE_PAGO',
      creadoPor: usuarioActual,
      usuarioRol: usuarioRol,
      fechaCreacion: `${fechaGeneracion} ${now.toTimeString().substring(0, 5)}`,
      ipTerminal: '192.168.10.25',
      codigoBarrasRecaudo: codigoBarras,
      codigoSeguridadQR: qrCode
    };

    return nuevaLiquidacion;
  }
}
