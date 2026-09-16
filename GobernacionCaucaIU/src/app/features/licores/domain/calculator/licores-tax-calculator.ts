import { CalculoSubtotales, ItemLote, ProductoLicor, TipoBebida } from '../models/licores.models';

/**
 * Constantes y Tarifas Oficiales Vigentes (Ley 1816 de 2016 y decretos anuales)
 */
export const TARIFAS_ICL_2026 = {
  // Tarifa en pesos colombianos por cada grado de alcohol (base 750 cm3)
  TARIFA_GRADO_DESTILADOS: 360, // COP por grado
  TARIFA_GRADO_VINOS: 243,       // COP por grado
  TARIFA_GRADO_APERITIVOS: 360,  // COP por grado (o aperitivos destilados)

  // Porcentaje Ad Valorem sobre PVP certificado por el DANE
  PORCENTAJE_AD_VALOREM_DESTILADOS: 0.25, // 25%
  PORCENTAJE_AD_VALOREM_VINOS: 0.20,      // 20%
  PORCENTAJE_AD_VALOREM_APERITIVOS: 0.25, // 25%

  // IVA Cedido Departamental
  PORCENTAJE_IVA_CEDIDO: 0.05, // 5%

  // Volumen de referencia base en cm3 (mililitros)
  VOLUMEN_BASE_CM3: 750,
};

/**
 * Obtiene la tarifa por grado según el tipo de bebida
 */
export function obtenerTarifaGradoPorTipo(tipo: TipoBebida): number {
  switch (tipo) {
    case 'DESTILADO':
      return TARIFAS_ICL_2026.TARIFA_GRADO_DESTILADOS;
    case 'VINO':
      return TARIFAS_ICL_2026.TARIFA_GRADO_VINOS;
    case 'APERITIVO':
      return TARIFAS_ICL_2026.TARIFA_GRADO_APERITIVOS;
    default:
      return TARIFAS_ICL_2026.TARIFA_GRADO_DESTILADOS;
  }
}

/**
 * Obtiene el porcentaje Ad Valorem según el tipo de bebida
 */
export function obtenerPorcentajeAdValoremPorTipo(tipo: TipoBebida): number {
  switch (tipo) {
    case 'DESTILADO':
      return TARIFAS_ICL_2026.PORCENTAJE_AD_VALOREM_DESTILADOS;
    case 'VINO':
      return TARIFAS_ICL_2026.PORCENTAJE_AD_VALOREM_VINOS;
    case 'APERITIVO':
      return TARIFAS_ICL_2026.PORCENTAJE_AD_VALOREM_APERITIVOS;
    default:
      return TARIFAS_ICL_2026.PORCENTAJE_AD_VALOREM_DESTILADOS;
  }
}

/**
 * Función Pura del Motor Tributario de Licores (Ley 1816 de 2016)
 * Calcula los componentes Específico, Ad Valorem, IVA Cedido y Total para una cantidad dada de botellas.
 * 
 * Fórmula Específico: GradosAlcohol * TarifaGrado * (VolumenCm3 / 750) * Cantidad
 * Fórmula Ad Valorem: (PVP_DANE * %AdValorem) * Cantidad
 * Fórmula IVA Cedido: (PVP_DANE * 5%) * Cantidad
 * Total: Específico + Ad Valorem + IVA Cedido
 */
export function calcularLiquidacionItem(producto: ProductoLicor, cantidad: number): CalculoSubtotales {
  const cant = Math.max(0, Math.floor(cantidad || 0));
  const tarifaGrado = obtenerTarifaGradoPorTipo(producto.tipoBebida);
  const porcentajeAdValorem = obtenerPorcentajeAdValoremPorTipo(producto.tipoBebida);
  const factorVolumen = producto.volumenCm3 / TARIFAS_ICL_2026.VOLUMEN_BASE_CM3;

  // Componente Específico Unitario
  const especificoUnitario = producto.gradosAlcohol * tarifaGrado * factorVolumen;

  // Componente Ad Valorem Unitario
  const adValoremUnitario = producto.pvpDaneOficial * porcentajeAdValorem;

  // IVA Cedido Unitario
  const ivaCedidoUnitario = producto.pvpDaneOficial * TARIFAS_ICL_2026.PORCENTAJE_IVA_CEDIDO;

  // Total Unitario por botella
  const totalUnitario = especificoUnitario + adValoremUnitario + ivaCedidoUnitario;

  // Subtotales para el total de botellas
  const subtotalEspecifico = Math.round(especificoUnitario * cant);
  const subtotalAdValorem = Math.round(adValoremUnitario * cant);
  const subtotalIva = Math.round(ivaCedidoUnitario * cant);
  const totalItem = subtotalEspecifico + subtotalAdValorem + subtotalIva;

  return {
    tarifaGradoAplicada: tarifaGrado,
    factorVolumen,
    especificoUnitario: Math.round(especificoUnitario),
    adValoremUnitario: Math.round(adValoremUnitario),
    ivaCedidoUnitario: Math.round(ivaCedidoUnitario),
    totalUnitario: Math.round(totalUnitario),
    subtotalEspecifico,
    subtotalAdValorem,
    subtotalIva,
    totalItem,
  };
}

/**
 * Recalcula la sumatoria de un arreglo de items de lote
 */
export function calcularTotalesLote(items: ItemLote[]): {
  subtotalEspecifico: number;
  subtotalAdValorem: number;
  subtotalIva: number;
  totalPagar: number;
  totalBotellas: number;
} {
  return items.reduce(
    (acc, item) => {
      acc.subtotalEspecifico += item.calculo.subtotalEspecifico;
      acc.subtotalAdValorem += item.calculo.subtotalAdValorem;
      acc.subtotalIva += item.calculo.subtotalIva;
      acc.totalPagar += item.calculo.totalItem;
      acc.totalBotellas += item.cantidad;
      return acc;
    },
    {
      subtotalEspecifico: 0,
      subtotalAdValorem: 0,
      subtotalIva: 0,
      totalPagar: 0,
      totalBotellas: 0,
    }
  );
}

/**
 * Formatea un valor numérico a moneda colombiana (COP)
 */
export function formatCurrencyCop(val: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val || 0);
}
