import { EntidadProductora, LiquidacionLicores, ProductoLicor } from '../../domain/models/licores.models';
import { calcularLiquidacionItem, calcularTotalesLote } from '../../domain/calculator/licores-tax-calculator';

/**
 * Entidades Productoras e Importadoras Semilla
 */
export const SEED_ENTIDADES: EntidadProductora[] = [
  {
    id: 'ENT-FLA-001',
    nit: '890900123-1',
    razonSocial: 'Fábrica de Licores y Alcoholes de Antioquia E.I.C.E.',
    nombreComercial: 'Fábrica de Licores de Antioquia (FLA)',
    tipo: 'Fábrica Departamental',
    registroInvimaPrincipal: 'INVIMA-2018L-0004521',
    departamentoOrigen: 'Antioquia',
    municipioOrigen: 'Itagüí',
    direccion: 'Carrera 50 No. 12 Sur - 50',
    telefono: '(604) 383 6000',
    email: 'tributario@fla.com.co',
    estado: 'Habilitado',
    prefijoEstampilla: 'FLA',
  },
  {
    id: 'ENT-SANMARTIN-002',
    nit: '900456789-2',
    razonSocial: 'Importadora y Distribuidora San Martín S.A.S.',
    nombreComercial: 'Importadora San Martín',
    tipo: 'Importador',
    registroInvimaPrincipal: 'INVIMA-2020L-0009812',
    departamentoOrigen: 'Valle del Cauca',
    municipioOrigen: 'Cali',
    direccion: 'Calle 15 No. 32 - 18 Zona Industrial',
    telefono: '(602) 489 1234',
    email: 'comercio@sanmartinvinos.com',
    estado: 'Habilitado',
    prefijoEstampilla: 'ISM',
  },
  {
    id: 'ENT-VICHE-003',
    nit: '901876543-8',
    razonSocial: 'Asociación de Productores Tradicionales Viche del Pacífico',
    nombreComercial: 'Destilería Artesanal Viche del Pacífico',
    tipo: 'Productor Artesanal',
    registroInvimaPrincipal: 'INVIMA-2023L-0001234',
    departamentoOrigen: 'Cauca',
    municipioOrigen: 'Guapi',
    direccion: 'Barrio Puerto Nuevo, Muelle Principal',
    telefono: '(602) 840 2211',
    email: 'contacto@vichecauca.org',
    estado: 'Habilitado',
    prefijoEstampilla: 'VIC',
  },
];

/**
 * Catálogo Oficial DANE de Productos y PVP Certificado
 */
export const SEED_CATALOGO_PRODUCTOS: ProductoLicor[] = [
  {
    id: 'PROD-001',
    sku: 'FLA-AGU-AZUL-750',
    nombre: 'Aguardiente Antioqueño Tapa Azul',
    marca: 'Antioqueño',
    tipoBebida: 'DESTILADO',
    gradosAlcohol: 29,
    volumenCm3: 750,
    registroInvima: 'INVIMA 2018L-0005421',
    pvpDaneOficial: 38500,
    descripcion: 'Aguardiente sin azúcar 29° en botella de vidrio de 750 cm3',
  },
  {
    id: 'PROD-002',
    sku: 'FLA-RON-MED3A-750',
    nombre: 'Ron Medellín Añejo 3 Años',
    marca: 'Ron Medellín',
    tipoBebida: 'DESTILADO',
    gradosAlcohol: 35,
    volumenCm3: 750,
    registroInvima: 'INVIMA 2017L-0003189',
    pvpDaneOficial: 44000,
    descripcion: 'Ron añejado en barricas de roble 35° en botella de 750 cm3',
  },
  {
    id: 'PROD-003',
    sku: 'VIN-RES-IMP-750',
    nombre: 'Vino Tinto Reserva Importado',
    marca: 'Cabernet Reserva San Martín',
    tipoBebida: 'VINO',
    gradosAlcohol: 13.5,
    volumenCm3: 750,
    registroInvima: 'INVIMA 2021L-0008892',
    pvpDaneOficial: 52000,
    descripcion: 'Vino tinto reserva varietal 13.5° en botella de 750 cm3',
  },
  {
    id: 'PROD-004',
    sku: 'APE-MANZ-1000',
    nombre: 'Aperitivo de Manzana',
    marca: 'Manzana Real',
    tipoBebida: 'APERITIVO',
    gradosAlcohol: 12,
    volumenCm3: 1000,
    registroInvima: 'INVIMA 2019L-0006734',
    pvpDaneOficial: 22000,
    descripcion: 'Aperitivo con sabor a manzana 12° en garrafa PET de 1000 cm3',
  },
];

/**
 * Función generadora de Liquidaciones Iniciales Semilla
 */
export function generarLiquidacionesSemilla(): LiquidacionLicores[] {
  const fla = SEED_ENTIDADES[0];
  const prod1 = SEED_CATALOGO_PRODUCTOS[0]; // Aguardiente Antioqueño 29° 750ml
  const prod2 = SEED_CATALOGO_PRODUCTOS[1]; // Ron Medellín 35° 750ml
  const prod3 = SEED_CATALOGO_PRODUCTOS[2]; // Vino Tinto 13.5° 750ml
  const prod4 = SEED_CATALOGO_PRODUCTOS[3]; // Aperitivo Manzana 12° 1000ml

  // 1. LIQUIDACIÓN HISTÓRICA 1: PAGADO_EMITIDO con Tornaguía y Estampillas
  const item1Lote1 = {
    id: 'ITEM-001-A',
    productoId: prod1.id,
    producto: prod1,
    cantidad: 500,
    calculo: calcularLiquidacionItem(prod1, 500),
  };
  const totales1 = calcularTotalesLote([item1Lote1]);

  const radicado1: LiquidacionLicores = {
    id: 'LIQ-2026-0001',
    numeroRadicado: 'RAD-2026-0001',
    fechaRadicacion: '2026-09-10T09:30:00Z',
    fechaActualizacion: '2026-09-10T14:45:00Z',
    entidadProductoraId: fla.id,
    entidadProductora: fla,
    transporte: {
      departamentoOrigen: 'Antioquia',
      municipioOrigen: 'Itagüí',
      departamentoDestino: 'Cauca',
      municipioDestino: 'Popayán',
      direccionDestino: 'Bodega Central de Licores del Cauca - Variante Norte Km 4',
      empresaTransportadora: 'Transportes del Sur S.A.S.',
      nitTransportador: '890123456-7',
      nombreConductor: 'Carlos Mario Morales',
      cedulaConductor: '71.234.567',
      telefonoConductor: '312 456 7890',
      placaVehiculo: 'WXY-789',
      tipoVehiculo: 'Furgón Termoaislado 2 Ejes',
      rutaAutorizada: 'Medellín - La Pintada - Pereira - Cali - Santander de Quilichao - Popayán',
      tiempoEstimadoHoras: 16,
    },
    items: [item1Lote1],
    totalBotellas: totales1.totalBotellas,
    subtotalEspecifico: totales1.subtotalEspecifico,
    subtotalAdValorem: totales1.subtotalAdValorem,
    subtotalIva: totales1.subtotalIva,
    totalPagar: totales1.totalPagar,
    estado: 'PAGADO_EMITIDO',
    tornaguiaNumero: 'TGN-2026-0045',
    fechaEmisionTornaguia: '2026-09-10T14:45:00Z',
    fechaVencimientoTornaguia: '2026-09-25T23:59:59Z',
    rangoEstampillas: {
      desde: 'FLA-000001',
      hasta: 'FLA-000500',
      cantidadTotal: 500,
      prefijo: 'FLA',
      numeroInicial: 1,
      numeroFinal: 500,
    },
    pago: {
      metodo: 'PSE',
      referenciaPago: 'PSE-CAUCA-9988112',
      codigoTransaccionPse: 'CUS-20260910-8841',
      banco: 'Bancolombia S.A.',
      fechaPago: '2026-09-10T14:30:00Z',
      valorPagado: totales1.totalPagar,
      estadoPago: 'APROBADO',
    },
    codigoQrData: 'GOB-CAUCA|ICL|TGN-2026-0045|RAD-2026-0001|NIT:890900123-1|BOTELLAS:500|ESTAMP:FLA-000001-FLA-000500|VENCE:2026-09-25',
    hashFirmaDigital: 'SHA256-4c9f1a28e3b7c0d691e8432bca6094821ff3d8b4e723019864ca1e92d6e4b102',
    historial: [
      {
        fecha: '2026-09-10T09:30:00Z',
        funcionario: 'Sistema Radicación Web',
        cargo: 'Plataforma Contribuyente FLA',
        accion: 'CREACION',
        observacion: 'Declaración de embarque radicada por el contribuyente FLA para despacho hacia Popayán.',
        estadoNuevo: 'EN_REVISION',
      },
      {
        fecha: '2026-09-10T11:15:00Z',
        funcionario: 'Dra. Patricia Mosquera',
        cargo: 'Auditora Fiscal de Rentas Departamentales',
        accion: 'APROBACION',
        observacion: 'Liquidación oficial aprobada. Documentación de transporte, RUT y cálculo tributario conformes con Ley 1816.',
        estadoAnterior: 'EN_REVISION',
        estadoNuevo: 'PENDIENTE_PAGO',
      },
      {
        fecha: '2026-09-10T14:30:00Z',
        funcionario: 'Pasarela PSE ACH Colombia',
        cargo: 'Sistema Integrado de Recaudo',
        accion: 'PAGO_REGISTRADO',
        observacion: `Pago en línea verificado por valor de ${totales1.totalPagar} COP.`,
        estadoAnterior: 'PENDIENTE_PAGO',
        estadoNuevo: 'PAGADO_EMITIDO',
      },
      {
        fecha: '2026-09-10T14:45:00Z',
        funcionario: 'Ing. Carlos Zambrano',
        cargo: 'Jefe de Fiscalización y Control Tributario',
        accion: 'EMISION_TORNAGUIA',
        observacion: 'Emisión oficial de Tornaguía electrónica TGN-2026-0045 y asignación de 500 estampillas serializadas FLA-000001 a FLA-000500.',
        estadoAnterior: 'PENDIENTE_PAGO',
        estadoNuevo: 'PAGADO_EMITIDO',
      },
    ],
  };

  // 2. LIQUIDACIÓN HISTÓRICA 2: EN_REVISION (Pendiente por funcionario)
  const item1Lote2 = {
    id: 'ITEM-002-A',
    productoId: prod2.id,
    producto: prod2,
    cantidad: 300,
    calculo: calcularLiquidacionItem(prod2, 300),
  };
  const item2Lote2 = {
    id: 'ITEM-002-B',
    productoId: prod3.id,
    producto: prod3,
    cantidad: 100,
    calculo: calcularLiquidacionItem(prod3, 100),
  };
  const totales2 = calcularTotalesLote([item1Lote2, item2Lote2]);

  const radicado2: LiquidacionLicores = {
    id: 'LIQ-2026-0002',
    numeroRadicado: 'RAD-2026-0002',
    fechaRadicacion: '2026-09-15T11:20:00Z',
    fechaActualizacion: '2026-09-15T11:20:00Z',
    entidadProductoraId: fla.id,
    entidadProductora: fla,
    transporte: {
      departamentoOrigen: 'Antioquia',
      municipioOrigen: 'Itagüí',
      departamentoDestino: 'Cauca',
      municipioDestino: 'Santander de Quilichao',
      direccionDestino: 'Distribuciones del Norte del Cauca - Cra 9 # 14-22',
      empresaTransportadora: 'Logística Andina Nacional S.A.S.',
      nitTransportador: '900554433-1',
      nombreConductor: 'Juan Fernando Gómez',
      cedulaConductor: '98.765.432',
      telefonoConductor: '315 789 0123',
      placaVehiculo: 'SZO-456',
      tipoVehiculo: 'Camión Doble Troque',
      rutaAutorizada: 'Medellín - Buga - Jamundí - Santander de Quilichao',
      tiempoEstimadoHoras: 12,
    },
    items: [item1Lote2, item2Lote2],
    totalBotellas: totales2.totalBotellas,
    subtotalEspecifico: totales2.subtotalEspecifico,
    subtotalAdValorem: totales2.subtotalAdValorem,
    subtotalIva: totales2.subtotalIva,
    totalPagar: totales2.totalPagar,
    estado: 'EN_REVISION',
    historial: [
      {
        fecha: '2026-09-15T11:20:00Z',
        funcionario: 'Sistema Radicación Web',
        cargo: 'Plataforma Contribuyente FLA',
        accion: 'CREACION',
        observacion: 'Pre-liquidación radicada y en cola de auditoría fiscal para despacho de 400 botellas surtidas.',
        estadoNuevo: 'EN_REVISION',
      },
    ],
  };

  // 3. LIQUIDACIÓN HISTÓRICA 3: REQUERIDO (Con observación editable de no conformidad)
  const item1Lote3 = {
    id: 'ITEM-003-A',
    productoId: prod4.id,
    producto: prod4,
    cantidad: 200,
    calculo: calcularLiquidacionItem(prod4, 200),
  };
  const totales3 = calcularTotalesLote([item1Lote3]);

  const radicado3: LiquidacionLicores = {
    id: 'LIQ-2026-0003',
    numeroRadicado: 'RAD-2026-0003',
    fechaRadicacion: '2026-09-14T08:00:00Z',
    fechaActualizacion: '2026-09-14T16:30:00Z',
    entidadProductoraId: fla.id,
    entidadProductora: fla,
    transporte: {
      departamentoOrigen: 'Antioquia',
      municipioOrigen: 'Itagüí',
      departamentoDestino: 'Cauca',
      municipioDestino: 'El Bordo - Patía',
      direccionDestino: 'Establecimiento Comercial y Depósito El Cafetero - Calle Real # 4-10',
      empresaTransportadora: 'Carga Expresa del Cauca Ltda.',
      nitTransportador: '891500200-4',
      nombreConductor: 'Rigoberto Chaux Meneses',
      cedulaConductor: '10.543.210',
      telefonoConductor: '310 998 8776',
      placaVehiculo: 'TLM-321',
      tipoVehiculo: 'Camión Turbo 4.5 Ton',
      rutaAutorizada: 'Popayán - Timbío - Rosas - El Bordo (Vía Panamericana Sur)',
      tiempoEstimadoHoras: 4,
    },
    items: [item1Lote3],
    totalBotellas: totales3.totalBotellas,
    subtotalEspecifico: totales3.subtotalEspecifico,
    subtotalAdValorem: totales3.subtotalAdValorem,
    subtotalIva: totales3.subtotalIva,
    totalPagar: totales3.totalPagar,
    estado: 'REQUERIDO',
    observacionesFuncionario: 'Inconsistencia en el volumen declarado del vehículo transportador vs capacidad de carga permitida en ruta Popayán-Patía. Adjuntar manifiesto de carga corregido y confirmar si las botellas corresponden a presentación de 1000 cm3 con registro INVIMA vigente.',
    historial: [
      {
        fecha: '2026-09-14T08:00:00Z',
        funcionario: 'Sistema Radicación Web',
        cargo: 'Plataforma Contribuyente FLA',
        accion: 'CREACION',
        observacion: 'Declaración radicada por el contribuyente.',
        estadoNuevo: 'EN_REVISION',
      },
      {
        fecha: '2026-09-14T16:30:00Z',
        funcionario: 'Dra. Patricia Mosquera',
        cargo: 'Auditora Fiscal de Rentas Departamentales',
        accion: 'REQUERIMIENTO',
        observacion: 'Inconsistencia en el volumen declarado del vehículo transportador vs capacidad de carga permitida en ruta Popayán-Patía. Adjuntar manifiesto de carga corregido y confirmar si las botellas corresponden a presentación de 1000 cm3 con registro INVIMA vigente.',
        estadoAnterior: 'EN_REVISION',
        estadoNuevo: 'REQUERIDO',
      },
    ],
  };

  return [radicado1, radicado2, radicado3];
}
