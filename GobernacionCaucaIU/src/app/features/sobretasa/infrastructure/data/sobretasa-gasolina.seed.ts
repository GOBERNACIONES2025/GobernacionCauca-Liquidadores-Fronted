import {
  DistribuidorMayorista,
  EstacionServicioDestino,
  DeclaracionSobretasa,
  DespachoItem,
} from '../../domain/models/sobretasa-gasolina.models';
import {
  calcularLiquidacionDespacho,
  calcularLiquidacionMensual,
} from '../../domain/calculator/sobretasa-tax-calculator';

export const SEED_MAYORISTAS: DistribuidorMayorista[] = [
  {
    id: 'may-001',
    nit: '860015545-1',
    razonSocial: 'ORGANIZACIÓN TERPEL S.A.',
    nombreComercial: 'Terpel Colombia',
    codigoSicomPlanta: 'PL-TER-042',
    municipioPlanta: 'Yumbo',
    departamentoPlanta: 'Valle del Cauca (Distribución Cauca)',
    direccion: 'Carrera 7 No. 75-51, Bogotá D.C. / Terminal Yumbo',
    telefono: '(601) 317 5000',
    email: 'tributario@terpel.com',
    estado: 'Habilitado',
  },
  {
    id: 'may-002',
    nit: '860002554-2',
    razonSocial: 'PRIMAX COLOMBIA S.A.S.',
    nombreComercial: 'Primax Colombia',
    codigoSicomPlanta: 'PL-PRX-088',
    municipioPlanta: 'Yumbo / Cali',
    departamentoPlanta: 'Valle del Cauca (Suministro Suroccidente)',
    direccion: 'Calle 113 No. 7-45 Torre B, Bogotá D.C.',
    telefono: '(601) 658 2000',
    email: 'impuestos.colombia@primax.com.co',
    estado: 'Habilitado',
  },
  {
    id: 'may-003',
    nit: '830132845-0',
    razonSocial: 'BIOMAX BIOCOMBUSTIBLES S.A.',
    nombreComercial: 'Biomax',
    codigoSicomPlanta: 'PL-BMX-012',
    municipioPlanta: 'Buga',
    departamentoPlanta: 'Valle del Cauca',
    direccion: 'Autopista Norte No. 103-60, Bogotá D.C.',
    telefono: '(601) 743 4000',
    email: 'declaraciones@biomax.co',
    estado: 'Habilitado',
  },
];

export const SEED_EDS_CATALOGO: EstacionServicioDestino[] = [
  {
    id: 'eds-001',
    codigoSicomEds: '110204',
    nombreComercial: 'EDS San Jerónimo',
    razonSocial: 'COMBUSTIBLES SAN JERÓNIMO S.A.S.',
    nit: '900123456-7',
    municipio: 'Popayán',
    departamento: 'Cauca',
    direccion: 'Carrera 9 # 25N-40, Popayán',
  },
  {
    id: 'eds-002',
    codigoSicomEds: '110205',
    nombreComercial: 'EDS Las Palmas',
    razonSocial: 'INVERSIONES LAS PALMAS DEL CAUCA LTDA.',
    nit: '891500345-2',
    municipio: 'Santander de Quilichao',
    departamento: 'Cauca',
    direccion: 'Calle 5 # 10-22, Santander de Quilichao',
  },
  {
    id: 'eds-003',
    codigoSicomEds: '110206',
    nombreComercial: 'EDS El Crucero',
    razonSocial: 'DISTRIBUIDORA EL CRUCERO S.A.S.',
    nit: '900789012-4',
    municipio: 'Puerto Tejada',
    departamento: 'Cauca',
    direccion: 'Vía Panamericana Km 12, Puerto Tejada',
  },
  {
    id: 'eds-004',
    codigoSicomEds: '110207',
    nombreComercial: 'EDS Panamericana Norte',
    razonSocial: 'ESTACIÓN DE SERVICIO PANAMERICANA POPAYÁN LTDA.',
    nit: '891501234-8',
    municipio: 'Popayán',
    departamento: 'Cauca',
    direccion: 'Variante Norte Km 3 # 45-12, Popayán',
  },
  {
    id: 'eds-005',
    codigoSicomEds: '110208',
    nombreComercial: 'EDS El Bordo Sur',
    razonSocial: 'COMBUSTIBLES DEL SUR DEL CAUCA S.A.S.',
    nit: '901234567-0',
    municipio: 'El Patía (El Bordo)',
    departamento: 'Cauca',
    direccion: 'Vía Panamericana Sur Km 82, El Bordo',
  },
];

// Helper para crear despachos con liquidación calculada
function crearDespacho(
  id: string,
  guia: string,
  fecha: string,
  placa: string,
  tipo: 'GMC' | 'GME' | 'ACPM',
  galones: number,
  codigoEds: string,
  validado = true
): DespachoItem {
  const eds = SEED_EDS_CATALOGO.find(e => e.codigoSicomEds === codigoEds);
  const calc = calcularLiquidacionDespacho(tipo, galones);
  return {
    id,
    codigoGuiaSicom: guia,
    fechaDespacho: fecha,
    placaVehiculo: placa,
    tipoCombustible: tipo,
    galonesDespachados: galones,
    codigoSicomEds: codigoEds,
    estacionServicio: eds,
    tarifaMunicipalAplicada: calc.tarifaMunicipal,
    tarifaDepartamentalAplicada: calc.tarifaDepartamental,
    subtotalMunicipal: calc.subtotalMunicipal,
    subtotalDepartamental: calc.subtotalDepartamental,
    totalItem: calc.totalItem,
    validadoSicom: validado,
  };
}

// Despachos Semilla para Declaración 1: PAGADO_APROBADO (Periodo Mes 7 / Julio 2026 - Terpel)
const despachosDec1: DespachoItem[] = [
  crearDespacho('desp-101', 'SIC-2026-78410', '2026-07-05', 'SZK-412', 'GMC', 15000, '110204', true),
  crearDespacho('desp-102', 'SIC-2026-78411', '2026-07-08', 'WFR-890', 'GMC', 12000, '110205', true),
  crearDespacho('desp-103', 'SIC-2026-78412', '2026-07-12', 'VRC-671', 'GME', 8000, '110204', true),
  crearDespacho('desp-104', 'SIC-2026-78413', '2026-07-16', 'SZK-412', 'ACPM', 18000, '110206', true),
  crearDespacho('desp-105', 'SIC-2026-78414', '2026-07-22', 'WFR-890', 'ACPM', 12000, '110207', true),
];

// Despachos Semilla para Declaración 2: EN_REVISION (Periodo Mes 8 / Agosto 2026 - Terpel - 45.000 galones consolidados)
const despachosDec2: DespachoItem[] = [
  crearDespacho('desp-201', 'SIC-2026-89201', '2026-08-04', 'TKR-304', 'GMC', 15000, '110204', true),
  crearDespacho('desp-202', 'SIC-2026-89202', '2026-08-10', 'TKR-304', 'GMC', 10000, '110205', true),
  crearDespacho('desp-203', 'SIC-2026-89203', '2026-08-15', 'WLZ-912', 'GME', 8000, '110207', true),
  crearDespacho('desp-204', 'SIC-2026-89204', '2026-08-20', 'EQZ-115', 'ACPM', 12000, '110206', true),
];

// Despachos Semilla para Declaración 3: OBSERVADO (Periodo Mes 8 / Agosto 2026 - Primax - Discrepancia de 2.000 galones)
const despachosDec3: DespachoItem[] = [
  crearDespacho('desp-301', 'SIC-2026-90510', '2026-08-03', 'UYO-552', 'GMC', 14000, '110205', true),
  crearDespacho('desp-302', 'SIC-2026-90511', '2026-08-12', 'UYO-552', 'GMC', 16000, '110208', false), // Observado
  crearDespacho('desp-303', 'SIC-2026-90512', '2026-08-18', 'SPQ-714', 'GME', 5000, '110204', true),
  crearDespacho('desp-304', 'SIC-2026-90513', '2026-08-25', 'SPQ-714', 'ACPM', 10000, '110207', true),
];

const liqDec1 = calcularLiquidacionMensual(despachosDec1, 7, 2026, new Date('2026-08-12T10:30:00'));
const liqDec2 = calcularLiquidacionMensual(despachosDec2, 8, 2026, new Date('2026-09-10T14:15:00'));
const liqDec3 = calcularLiquidacionMensual(despachosDec3, 8, 2026, new Date('2026-09-14T11:00:00'));

export const SEED_DECLARACIONES: DeclaracionSobretasa[] = [
  {
    id: 'dec-001',
    numeroRadicado: 'SOB-2026-0801',
    periodoMes: 7, // Julio 2026
    periodoAnio: 2026,
    mayoristaId: 'may-001',
    mayorista: SEED_MAYORISTAS[0],
    fechaRadicacion: '2026-08-12T10:30:00.000Z',
    fechaLimitePago: liqDec1.fechaLimitePago,
    esExtemporanea: liqDec1.esExtemporanea,
    diasRetraso: liqDec1.diasRetraso,
    sancionExtemporaneidad: liqDec1.sancionExtemporaneidad,
    despachos: despachosDec1,
    totalGalonesGMC: liqDec1.totalGalonesGMC,
    totalGalonesGME: liqDec1.totalGalonesGME,
    totalGalonesACPM: liqDec1.totalGalonesACPM,
    totalGalonesGeneral: liqDec1.totalGalonesGeneral,
    totalMunicipalGMC: liqDec1.totalMunicipalGMC,
    totalDepartamentalGMC: liqDec1.totalDepartamentalGMC,
    totalMunicipalGME: liqDec1.totalMunicipalGME,
    totalDepartamentalGME: liqDec1.totalDepartamentalGME,
    totalDepartamentalACPM: liqDec1.totalDepartamentalACPM,
    totalMunicipal: liqDec1.totalMunicipal,
    totalDepartamental: liqDec1.totalDepartamental,
    subtotalImpuesto: liqDec1.subtotalImpuesto,
    totalPagar: liqDec1.totalPagar,
    estado: 'PAGADO_APROBADO',
    comprobantePagoRef: 'PSE-CAUCA-SOB-992140',
    codigoBarrasBancario: '(415)7709998001234(8020)0000000801(3900)00082910000(96)20260818',
    validacionSicomCompleta: true,
    pago: {
      metodo: 'PSE',
      referenciaPago: 'PSE-CAUCA-SOB-992140',
      codigoCus: 'CUS-99120485',
      banco: 'Bancolombia S.A.',
      fechaPago: '2026-08-14T16:20:00.000Z',
      valorPagado: liqDec1.totalPagar,
      estadoPago: 'APROBADO',
    },
    historial: [
      {
        fecha: '2026-08-12T10:30:00.000Z',
        funcionario: 'Organización Terpel S.A.',
        cargo: 'Agente Mayorista Distribuidor',
        accion: 'RADICACION',
        observacion: 'Radicación electrónica mensual de Sobretasa a la Gasolina y ACPM periodo Julio/2026.',
        estadoNuevo: 'EN_REVISION',
      },
      {
        fecha: '2026-08-13T09:15:00.000Z',
        funcionario: 'Dr. Carlos Alberto Medina',
        cargo: 'Fiscalizador de Rentas Departamentales',
        accion: 'VALIDACION_SICOM',
        observacion: 'Validación exitosa al 100% de las guías de despacho contra el sistema SICOM MinMinas.',
        estadoAnterior: 'EN_REVISION',
        estadoNuevo: 'PENDIENTE_PAGO',
      },
      {
        fecha: '2026-08-14T16:20:00.000Z',
        funcionario: 'Pasarela PSE ACH Colombia',
        cargo: 'Servicio Financiero Integrado',
        accion: 'PAGO_REGISTRADO',
        observacion: 'Transacción PSE confirmada con CUS-99120485. Recaudo distribuido a las cuentas municipales y departamental.',
        estadoAnterior: 'PENDIENTE_PAGO',
        estadoNuevo: 'PAGADO_APROBADO',
      },
    ],
  },
  {
    id: 'dec-002',
    numeroRadicado: 'SOB-2026-0802',
    periodoMes: 8, // Agosto 2026
    periodoAnio: 2026,
    mayoristaId: 'may-001',
    mayorista: SEED_MAYORISTAS[0],
    fechaRadicacion: '2026-09-10T14:15:00.000Z',
    fechaLimitePago: liqDec2.fechaLimitePago,
    esExtemporanea: liqDec2.esExtemporanea,
    diasRetraso: liqDec2.diasRetraso,
    sancionExtemporaneidad: liqDec2.sancionExtemporaneidad,
    despachos: despachosDec2,
    totalGalonesGMC: liqDec2.totalGalonesGMC,
    totalGalonesGME: liqDec2.totalGalonesGME,
    totalGalonesACPM: liqDec2.totalGalonesACPM,
    totalGalonesGeneral: 45000, // 25.000 GMC + 8.000 GME + 12.000 ACPM = 45.000 galones consolidados
    totalMunicipalGMC: liqDec2.totalMunicipalGMC,
    totalDepartamentalGMC: liqDec2.totalDepartamentalGMC,
    totalMunicipalGME: liqDec2.totalMunicipalGME,
    totalDepartamentalGME: liqDec2.totalDepartamentalGME,
    totalDepartamentalACPM: liqDec2.totalDepartamentalACPM,
    totalMunicipal: liqDec2.totalMunicipal,
    totalDepartamental: liqDec2.totalDepartamental,
    subtotalImpuesto: liqDec2.subtotalImpuesto,
    totalPagar: liqDec2.totalPagar,
    estado: 'EN_REVISION',
    codigoBarrasBancario: '(415)7709998001234(8020)0000000802(3900)00072000000(96)20260918',
    validacionSicomCompleta: false,
    historial: [
      {
        fecha: '2026-09-10T14:15:00.000Z',
        funcionario: 'Organización Terpel S.A.',
        cargo: 'Agente Mayorista Distribuidor',
        accion: 'RADICACION',
        observacion: 'Radicación electrónica periodo Agosto/2026 con 45.000 galones distribuidos en Cauca.',
        estadoNuevo: 'EN_REVISION',
      },
    ],
  },
  {
    id: 'dec-003',
    numeroRadicado: 'SOB-2026-0803',
    periodoMes: 8, // Agosto 2026
    periodoAnio: 2026,
    mayoristaId: 'may-002',
    mayorista: SEED_MAYORISTAS[1],
    fechaRadicacion: '2026-09-14T11:00:00.000Z',
    fechaLimitePago: liqDec3.fechaLimitePago,
    esExtemporanea: liqDec3.esExtemporanea,
    diasRetraso: liqDec3.diasRetraso,
    sancionExtemporaneidad: liqDec3.sancionExtemporaneidad,
    despachos: despachosDec3,
    totalGalonesGMC: liqDec3.totalGalonesGMC,
    totalGalonesGME: liqDec3.totalGalonesGME,
    totalGalonesACPM: liqDec3.totalGalonesACPM,
    totalGalonesGeneral: liqDec3.totalGalonesGeneral,
    totalMunicipalGMC: liqDec3.totalMunicipalGMC,
    totalDepartamentalGMC: liqDec3.totalDepartamentalGMC,
    totalMunicipalGME: liqDec3.totalMunicipalGME,
    totalDepartamentalGME: liqDec3.totalDepartamentalGME,
    totalDepartamentalACPM: liqDec3.totalDepartamentalACPM,
    totalMunicipal: liqDec3.totalMunicipal,
    totalDepartamental: liqDec3.totalDepartamental,
    subtotalImpuesto: liqDec3.subtotalImpuesto,
    totalPagar: liqDec3.totalPagar,
    estado: 'OBSERVADO',
    observacionesFiscalizacion: 'Discrepancia de 2.000 galones frente al reporte mensual consolidado de SICOM en guía SIC-2026-90511 (EDS El Bordo Sur). Por favor subsanar o rectificar soporte de entrega.',
    codigoBarrasBancario: '(415)7709998001234(8020)0000000803(3900)00069400000(96)20260918',
    validacionSicomCompleta: false,
    historial: [
      {
        fecha: '2026-09-14T11:00:00.000Z',
        funcionario: 'Primax Colombia S.A.S.',
        cargo: 'Agente Mayorista Distribuidor',
        accion: 'RADICACION',
        observacion: 'Radicación electrónica mensual de Sobretasa periodo Agosto/2026.',
        estadoNuevo: 'EN_REVISION',
      },
      {
        fecha: '2026-09-15T15:45:00.000Z',
        funcionario: 'Dra. María Elena Restrepo',
        cargo: 'Auditora Tributaria Territorial',
        accion: 'OBSERVACION',
        observacion: 'Discrepancia de 2.000 galones frente al reporte mensual consolidado de SICOM en la guía SIC-2026-90511.',
        estadoAnterior: 'EN_REVISION',
        estadoNuevo: 'OBSERVADO',
      },
    ],
  },
];

export const SIMULATED_SICOM_BATCH = [
  { guia: 'SIC-2026-99401', placa: 'SZK-412', tipo: 'GMC' as const, galones: 12000, codEds: '110204', fecha: '2026-09-02' },
  { guia: 'SIC-2026-99402', placa: 'SZK-412', tipo: 'GMC' as const, galones: 14000, codEds: '110205', fecha: '2026-09-05' },
  { guia: 'SIC-2026-99403', placa: 'WFR-890', tipo: 'GME' as const, galones: 8500, codEds: '110204', fecha: '2026-09-08' },
  { guia: 'SIC-2026-99404', placa: 'VRC-671', tipo: 'ACPM' as const, galones: 15000, codEds: '110206', fecha: '2026-09-11' },
  { guia: 'SIC-2026-99405', placa: 'TKR-304', tipo: 'GMC' as const, galones: 11000, codEds: '110207', fecha: '2026-09-14' },
  { guia: 'SIC-2026-99406', placa: 'EQZ-115', tipo: 'ACPM' as const, galones: 18000, codEds: '110208', fecha: '2026-09-17' },
  { guia: 'SIC-2026-99407', placa: 'WLZ-912', tipo: 'GME' as const, galones: 6000, codEds: '110205', fecha: '2026-09-20' },
];
