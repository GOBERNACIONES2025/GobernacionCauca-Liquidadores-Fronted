import { DespachoItem, TipoCombustible } from '../models/sobretasa-gasolina.models';

/**
 * Tarifas Oficiales Vigentes de Sobretasa a la Gasolina y ACPM (Ley 2093 de 2021)
 * Valores expresados en Pesos Colombianos (COP) por cada galón americano a 60 °F.
 */
export const TARIFAS_SOBRETASA_2026 = {
  // Gasolina Motor Corriente (GMC)
  GMC_MUNICIPAL: 1420,
  GMC_DEPARTAMENTAL: 480,
  GMC_TOTAL: 1900,

  // Gasolina Motor Extra (GME)
  GME_MUNICIPAL: 1850,
  GME_DEPARTAMENTAL: 620,
  GME_TOTAL: 2470,

  // ACPM / Diésel (ACPM)
  ACPM_MUNICIPAL: 0,
  ACPM_DEPARTAMENTAL: 395,
  ACPM_TOTAL: 395,

  // Día límite de vencimiento en el mes siguiente
  DIA_LIMITE_PAGO_MES_SIGUIENTE: 18,
  
  // Porcentaje sanción por extemporaneidad por mes o fracción
  PORCENTAJE_SANCION_EXTEMPORANEIDAD: 0.05, // 5%
};

/**
 * Obtiene las tarifas aplicables según el tipo de combustible
 */
export function obtenerTarifasPorTipo(tipo: TipoCombustible): {
  municipal: number;
  departamental: number;
  total: number;
} {
  switch (tipo) {
    case 'GMC':
      return {
        municipal: TARIFAS_SOBRETASA_2026.GMC_MUNICIPAL,
        departamental: TARIFAS_SOBRETASA_2026.GMC_DEPARTAMENTAL,
        total: TARIFAS_SOBRETASA_2026.GMC_TOTAL,
      };
    case 'GME':
      return {
        municipal: TARIFAS_SOBRETASA_2026.GME_MUNICIPAL,
        departamental: TARIFAS_SOBRETASA_2026.GME_DEPARTAMENTAL,
        total: TARIFAS_SOBRETASA_2026.GME_TOTAL,
      };
    case 'ACPM':
      return {
        municipal: TARIFAS_SOBRETASA_2026.ACPM_MUNICIPAL,
        departamental: TARIFAS_SOBRETASA_2026.ACPM_DEPARTAMENTAL,
        total: TARIFAS_SOBRETASA_2026.ACPM_TOTAL,
      };
    default:
      return {
        municipal: TARIFAS_SOBRETASA_2026.GMC_MUNICIPAL,
        departamental: TARIFAS_SOBRETASA_2026.GMC_DEPARTAMENTAL,
        total: TARIFAS_SOBRETASA_2026.GMC_TOTAL,
      };
  }
}

/**
 * Función pura: Calcula la liquidación de un despacho individual
 */
export function calcularLiquidacionDespacho(tipo: TipoCombustible, galones: number): {
  tarifaMunicipal: number;
  tarifaDepartamental: number;
  subtotalMunicipal: number;
  subtotalDepartamental: number;
  totalItem: number;
} {
  const gal = Math.max(0, Math.floor(galones || 0));
  const tarifas = obtenerTarifasPorTipo(tipo);

  const subtotalMunicipal = Math.round(gal * tarifas.municipal);
  const subtotalDepartamental = Math.round(gal * tarifas.departamental);
  const totalItem = subtotalMunicipal + subtotalDepartamental;

  return {
    tarifaMunicipal: tarifas.municipal,
    tarifaDepartamental: tarifas.departamental,
    subtotalMunicipal,
    subtotalDepartamental,
    totalItem,
  };
}

/**
 * Función pura: Calcula si una fecha de radicación es extemporánea frente al periodo declarado
 */
export function evaluarExtemporaneidad(
  periodoMes: number,
  periodoAnio: number,
  fechaRadicacion: Date = new Date()
): {
  esExtemporanea: boolean;
  diasRetraso: number;
  mesesFraccionRetraso: number;
  fechaLimite: Date;
} {
  // El vencimiento es el día 18 del mes siguiente al periodo gravable
  let mesVencimiento = periodoMes + 1;
  let anioVencimiento = periodoAnio;

  if (mesVencimiento > 12) {
    mesVencimiento = 1;
    anioVencimiento += 1;
  }

  // Fecha límite de radicación sin sanción: Día 18 a las 23:59:59
  const fechaLimite = new Date(anioVencimiento, mesVencimiento - 1, TARIFAS_SOBRETASA_2026.DIA_LIMITE_PAGO_MES_SIGUIENTE, 23, 59, 59);

  if (fechaRadicacion.getTime() <= fechaLimite.getTime()) {
    return {
      esExtemporanea: false,
      diasRetraso: 0,
      mesesFraccionRetraso: 0,
      fechaLimite,
    };
  }

  const diffMs = fechaRadicacion.getTime() - fechaLimite.getTime();
  const diasRetraso = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  // Cada mes o fracción de mes (30 días por mes)
  const mesesFraccionRetraso = Math.ceil(diasRetraso / 30);

  return {
    esExtemporanea: true,
    diasRetraso,
    mesesFraccionRetraso: Math.max(1, mesesFraccionRetraso),
    fechaLimite,
  };
}

/**
 * Función pura: Calcula la liquidación mensual consolidada a partir de los despachos
 */
export function calcularLiquidacionMensual(
  despachos: DespachoItem[],
  periodoMes: number,
  periodoAnio: number,
  fechaRadicacion: Date = new Date()
): {
  totalGalonesGMC: number;
  totalGalonesGME: number;
  totalGalonesACPM: number;
  totalGalonesGeneral: number;
  totalMunicipalGMC: number;
  totalDepartamentalGMC: number;
  totalMunicipalGME: number;
  totalDepartamentalGME: number;
  totalDepartamentalACPM: number;
  totalMunicipal: number;
  totalDepartamental: number;
  subtotalImpuesto: number;
  esExtemporanea: boolean;
  diasRetraso: number;
  sancionExtemporaneidad: number;
  totalPagar: number;
  fechaLimitePago: string;
} {
  let totalGalonesGMC = 0;
  let totalGalonesGME = 0;
  let totalGalonesACPM = 0;

  for (const d of despachos) {
    if (d.tipoCombustible === 'GMC') {
      totalGalonesGMC += d.galonesDespachados;
    } else if (d.tipoCombustible === 'GME') {
      totalGalonesGME += d.galonesDespachados;
    } else if (d.tipoCombustible === 'ACPM') {
      totalGalonesACPM += d.galonesDespachados;
    }
  }

  const totalGalonesGeneral = totalGalonesGMC + totalGalonesGME + totalGalonesACPM;

  const totalMunicipalGMC = Math.round(totalGalonesGMC * TARIFAS_SOBRETASA_2026.GMC_MUNICIPAL);
  const totalDepartamentalGMC = Math.round(totalGalonesGMC * TARIFAS_SOBRETASA_2026.GMC_DEPARTAMENTAL);

  const totalMunicipalGME = Math.round(totalGalonesGME * TARIFAS_SOBRETASA_2026.GME_MUNICIPAL);
  const totalDepartamentalGME = Math.round(totalGalonesGME * TARIFAS_SOBRETASA_2026.GME_DEPARTAMENTAL);

  const totalDepartamentalACPM = Math.round(totalGalonesACPM * TARIFAS_SOBRETASA_2026.ACPM_DEPARTAMENTAL);

  const totalMunicipal = totalMunicipalGMC + totalMunicipalGME;
  const totalDepartamental = totalDepartamentalGMC + totalDepartamentalGME + totalDepartamentalACPM;
  const subtotalImpuesto = totalMunicipal + totalDepartamental;

  const evalExtemp = evaluarExtemporaneidad(periodoMes, periodoAnio, fechaRadicacion);
  let sancionExtemporaneidad = 0;

  if (evalExtemp.esExtemporanea) {
    sancionExtemporaneidad = Math.round(subtotalImpuesto * (TARIFAS_SOBRETASA_2026.PORCENTAJE_SANCION_EXTEMPORANEIDAD * evalExtemp.mesesFraccionRetraso));
  }

  const totalPagar = subtotalImpuesto + sancionExtemporaneidad;

  return {
    totalGalonesGMC,
    totalGalonesGME,
    totalGalonesACPM,
    totalGalonesGeneral,
    totalMunicipalGMC,
    totalDepartamentalGMC,
    totalMunicipalGME,
    totalDepartamentalGME,
    totalDepartamentalACPM,
    totalMunicipal,
    totalDepartamental,
    subtotalImpuesto,
    esExtemporanea: evalExtemp.esExtemporanea,
    diasRetraso: evalExtemp.diasRetraso,
    sancionExtemporaneidad,
    totalPagar,
    fechaLimitePago: evalExtemp.fechaLimite.toISOString(),
  };
}

export function formatMoneyCop(val: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export const formatCurrencyCop = formatMoneyCop;

export function formatGalones(val: number): string {
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(val || 0) + ' Gl';
}

