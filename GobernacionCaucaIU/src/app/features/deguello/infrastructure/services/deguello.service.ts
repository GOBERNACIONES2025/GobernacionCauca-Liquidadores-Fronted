import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { 
  DeclaracionDeguelloData, 
  ConsultaGuiaRequest, 
  PlantaBeneficio, 
  ParametrosDeguello,
  InformeMunicipioRecaudo,
  InformePlantaBeneficio 
} from '../../domain/models/deguello.model';

@Injectable({
  providedIn: 'root',
})
export class DeguelloService {
  private readonly TARIFA_BASE_2026 = 49800; // Tarifa referencial Cauca 2026 (~1 UVT)

  /** Declaración seleccionada para reliquidar / corrección */
  readonly declaracionEnEdicion = signal<DeclaracionDeguelloData | null>(null);

  /** Base de datos simulada para integración ICA y consultas */
  private guiasSimuladas: DeclaracionDeguelloData[] = [
    {
      consecutivo: '2026-0004521',
      anioGravable: 2026,
      periodoGravable: '09',
      esInicial: true,
      esCorreccion: false,
      razonSocial: 'FRIGORÍFICO REGIONAL DEL VALLE Y CAUCA S.A.S.',
      nit: '900.823.411',
      dv: '2',
      telefonoFijo: '(602) 8234500',
      municipio: 'POPAYÁN',
      direccionNotificacion: 'KM 4 VARIANTE NORTE # 12-40',
      baseGravable: 25,
      tarifa: 49800,
      valorBruto: 1245000,
      participacionMunicipios: 124500,
      subtotal: 1120500,
      sanciones: 0,
      subtotalMasSanciones: 1120500,
      interesMora: 0,
      totalAPagar: 1120500,
      firmaContador: true,
      firmaRevisor: false,
      nombreRepresentante: 'CARLOS ANDRÉS VELASCO MEJÍA',
      tipoDocRep: 'CC',
      numeroDocRepresentante: '10.548.920',
      nombreContadorORevisor: 'MARTHA LUCÍA PATIÑO GÓMEZ',
      tipoDocContador: 'CC',
      numeroDocContadorORevisor: '34.521.890',
      tarjetaProfesional: '184290-T',
      fechaLimitePago: '25/09/2026',
      numeroGuiaIca: 'GSMI-2026-004521',
      predioOrigen: 'Hacienda San José - Vda. La Rejoya (RUV: 19-001-204)',
      plantaBeneficio: 'Frigorífico Regional de Popayán (PBA-PO-01)',
      especie: 'Bovino Macho Ceba',
      fechaVencimientoGuia: '25/09/2026 18:00',
      estadoPago: 'PENDIENTE',
      esIntegracionIca: true,
      consumida: false,
    },
    {
      consecutivo: '2026-0003180',
      anioGravable: 2026,
      periodoGravable: '09',
      esInicial: true,
      esCorreccion: false,
      razonSocial: 'FRIGORÍFICO REGIONAL DEL VALLE Y CAUCA S.A.S.',
      nit: '900.823.411',
      dv: '2',
      telefonoFijo: '(602) 8234500',
      municipio: 'POPAYÁN',
      direccionNotificacion: 'KM 4 VARIANTE NORTE # 12-40',
      baseGravable: 15,
      tarifa: 49800,
      valorBruto: 747000,
      participacionMunicipios: 74700,
      subtotal: 672300,
      sanciones: 0,
      subtotalMasSanciones: 672300,
      interesMora: 0,
      totalAPagar: 672300,
      firmaContador: true,
      firmaRevisor: false,
      nombreRepresentante: 'CARLOS ANDRÉS VELASCO MEJÍA',
      tipoDocRep: 'CC',
      numeroDocRepresentante: '10.548.920',
      nombreContadorORevisor: 'MARTHA LUCÍA PATIÑO GÓMEZ',
      tipoDocContador: 'CC',
      numeroDocContadorORevisor: '34.521.890',
      tarjetaProfesional: '184290-T',
      fechaLimitePago: '12/09/2026',
      numeroGuiaIca: 'GSMI-2026-003180',
      predioOrigen: 'Hacienda La Colina - Timbío (RUV: 19-001-890)',
      plantaBeneficio: 'Frigorífico Regional de Popayán (PBA-PO-01)',
      especie: 'Bovino Macho Ceba',
      fechaVencimientoGuia: '12/09/2026 18:00',
      estadoPago: 'PAGADO',
      reciboBancario: 'OCC-771209-POPAYAN',
      esIntegracionIca: true,
      consumida: true,
    },
    {
      consecutivo: '2026-0008912',
      anioGravable: 2026,
      periodoGravable: '09',
      esInicial: true,
      esCorreccion: false,
      razonSocial: 'GANADERÍA Y COMERCIALIZADORA DEL PATÍA LTDA',
      nit: '10.548.920',
      dv: '1',
      telefonoFijo: '(602) 8431100',
      municipio: 'PATÍA - EL BORDO',
      direccionNotificacion: 'CALLE 4 # 6-22 BARRIO EL CENTRO',
      baseGravable: 12,
      tarifa: 49800,
      valorBruto: 597600,
      participacionMunicipios: 59760,
      subtotal: 537840,
      sanciones: 0,
      subtotalMasSanciones: 537840,
      interesMora: 0,
      totalAPagar: 537840,
      firmaContador: false,
      firmaRevisor: true,
      nombreRepresentante: 'HERNANDO QUINTERO CHÁVEZ',
      tipoDocRep: 'CC',
      numeroDocRepresentante: '10.548.920',
      nombreContadorORevisor: 'JORGE ELIÉCER GÓMEZ',
      tipoDocContador: 'CC',
      numeroDocContadorORevisor: '10.612.445',
      tarjetaProfesional: '142300-T',
      fechaLimitePago: '28/09/2026',
      numeroGuiaIca: 'GSMI-2026-008912',
      predioOrigen: 'Finca Villa Hermosa - Vereda Guayabal',
      plantaBeneficio: 'Planta de Beneficio Animal Regional Patía (PBA-03)',
      especie: 'Bovino Mixto (7 Machos, 5 Hembras)',
      fechaVencimientoGuia: '28/09/2026 17:00',
      estadoPago: 'PAGADO',
      reciboBancario: 'BAN-984210-OCCIDENTE',
      esIntegracionIca: true,
      consumida: false,
    },
    {
      consecutivo: '2026-0001190',
      anioGravable: 2026,
      periodoGravable: '08',
      esInicial: true,
      esCorreccion: false,
      razonSocial: 'DISTRIBUIDORA DE CARNES DEL SUR',
      nit: '76.321.450',
      dv: '9',
      telefonoFijo: '(602) 8203310',
      municipio: 'SANTANDER DE QUILICHAO',
      direccionNotificacion: 'CRA 9 # 14-55',
      baseGravable: 8,
      tarifa: 49800,
      valorBruto: 398400,
      participacionMunicipios: 39840,
      subtotal: 358560,
      sanciones: 120000,
      subtotalMasSanciones: 478560,
      interesMora: 45000,
      totalAPagar: 523560,
      firmaContador: true,
      firmaRevisor: false,
      nombreRepresentante: 'ALVARO JOSÉ MUÑOZ',
      tipoDocRep: 'CC',
      numeroDocRepresentante: '76.321.450',
      nombreContadorORevisor: 'LUIS FELIPE RIVERA',
      tipoDocContador: 'CC',
      numeroDocContadorORevisor: '12.980.441',
      tarjetaProfesional: '190442-T',
      fechaLimitePago: '10/08/2026',
      numeroGuiaIca: 'GSMI-2026-001190',
      predioOrigen: 'Hacienda Los Samanes - Vía Villarrica',
      plantaBeneficio: 'PBA Santander de Quilichao (PBA-SQ-02)',
      especie: 'Bovino Macho',
      fechaVencimientoGuia: '10/08/2026 18:00',
      estadoPago: 'VENCIDO',
      esIntegracionIca: true,
      consumida: false,
    },
  ];

  /** Consultar guía por Documento y Número de Guía ICA o Consecutivo */
  consultarGuia(req: ConsultaGuiaRequest): Observable<DeclaracionDeguelloData | null> {
    const doc = req.documento.trim().replace(/\D/g, '');
    const guia = req.numeroGuia.trim().toUpperCase();

    const encontrada = this.guiasSimuladas.find((item) => {
      const itemDoc = item.nit.replace(/\D/g, '');
      const itemGuia = (item.numeroGuiaIca || '').toUpperCase();
      const itemConsecutivo = item.consecutivo.toUpperCase();

      const matchDoc = doc.length === 0 || itemDoc.includes(doc) || item.numeroDocRepresentante.replace(/\D/g, '').includes(doc);
      const matchGuia = itemGuia.includes(guia) || itemConsecutivo.includes(guia) || guia.length === 0;

      return matchDoc && matchGuia;
    });

    return of(encontrada ? { ...encontrada } : null);
  }

  /** Consultar todas las declaraciones y guías para el Portal del Contribuyente */
  consultarDeclaracionesCiudadano(docStr: string, secondaryStr: string): Observable<DeclaracionDeguelloData[]> {
    const doc = docStr ? docStr.trim().replace(/\D/g, '') : '';
    const guia = secondaryStr ? secondaryStr.trim().toUpperCase() : '';

    const filtradas = this.guiasSimuladas.filter((item) => {
      const itemDoc = item.nit.replace(/\D/g, '');
      const itemRepDoc = item.numeroDocRepresentante ? item.numeroDocRepresentante.replace(/\D/g, '') : '';
      const itemGuia = (item.numeroGuiaIca || '').toUpperCase();
      const itemConsecutivo = item.consecutivo.toUpperCase();

      const matchDoc = doc.length > 0 ? (itemDoc.includes(doc) || itemRepDoc.includes(doc)) : false;
      const matchGuia = guia.length > 0 ? (itemGuia.includes(guia) || itemConsecutivo.includes(guia)) : false;

      // Si se especificó Guía ICA o Formulario, la búsqueda es puntual a esa guía exacta
      if (guia.length > 0) {
        return matchGuia;
      }

      // Si solo se especificó Documento (NIT o CC), se traen todas las declaraciones del contribuyente
      if (doc.length > 0) {
        return matchDoc;
      }

      return false;
    });

    return of(filtradas.map((d) => ({ ...d })));
  }

  /** Calcular liquidación matemática a partir de cabezas y valores */
  calcularLiquidacion(cabezas: number, tarifa: number = this.TARIFA_BASE_2026, sanciones: number = 0, interesMora: number = 0) {
    const valorBruto = Math.round(cabezas * tarifa);
    const participacionMunicipios = Math.round(valorBruto * 0.1); // 10% ley
    const subtotal = valorBruto - participacionMunicipios;
    const subtotalMasSanciones = subtotal + (sanciones || 0);
    const totalAPagar = subtotalMasSanciones + (interesMora || 0);

    return {
      baseGravable: cabezas,
      tarifa,
      valorBruto,
      participacionMunicipios,
      subtotal,
      sanciones: sanciones || 0,
      subtotalMasSanciones,
      interesMora: interesMora || 0,
      totalAPagar,
    };
  }

  /** Crear una nueva declaración manual (modo subjetivo) */
  crearDeclaracionManual(payload: Partial<DeclaracionDeguelloData>): DeclaracionDeguelloData {
    const cabezas = Number(payload.baseGravable) || 10;
    const tarifa = Number(payload.tarifa) || this.TARIFA_BASE_2026;
    const sanciones = Number(payload.sanciones) || 0;
    const mora = Number(payload.interesMora) || 0;
    const calculo = this.calcularLiquidacion(cabezas, tarifa, sanciones, mora);

    const consecutivoNuevo = `2026-${Math.floor(1000000 + Math.random() * 9000000).toString().substring(0, 7)}`;
    const ahora = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(ahora.getDate() + 5);

    const fechaLimStr = `${fechaLimite.getDate().toString().padStart(2, '0')}/${(fechaLimite.getMonth() + 1).toString().padStart(2, '0')}/${fechaLimite.getFullYear()}`;

    const nueva: DeclaracionDeguelloData = {
      consecutivo: payload.consecutivo || consecutivoNuevo,
      anioGravable: payload.anioGravable || ahora.getFullYear(),
      periodoGravable: payload.periodoGravable || (ahora.getMonth() + 1).toString().padStart(2, '0'),
      esInicial: payload.esInicial ?? true,
      esCorreccion: payload.esCorreccion ?? false,
      declaracionCorregida: payload.declaracionCorregida || '',
      razonSocial: payload.razonSocial?.toUpperCase() || 'AGROPECUARIA GANADERA DEL CAUCA S.A.S.',
      nit: payload.nit || '900.554.890',
      dv: payload.dv || '4',
      telefonoFijo: payload.telefonoFijo || '(602) 8249000',
      municipio: payload.municipio?.toUpperCase() || 'POPAYÁN',
      direccionNotificacion: payload.direccionNotificacion?.toUpperCase() || 'CRA 6 # 3-45 CENTRO',
      baseGravable: calculo.baseGravable,
      tarifa: calculo.tarifa,
      valorBruto: calculo.valorBruto,
      participacionMunicipios: calculo.participacionMunicipios,
      subtotal: calculo.subtotal,
      sanciones: calculo.sanciones,
      subtotalMasSanciones: calculo.subtotalMasSanciones,
      interesMora: calculo.interesMora,
      totalAPagar: calculo.totalAPagar,
      firmaContador: payload.firmaContador ?? true,
      firmaRevisor: payload.firmaRevisor ?? false,
      nombreRepresentante: payload.nombreRepresentante?.toUpperCase() || 'PEDRO NEL GÓMEZ CASTRO',
      tipoDocRep: payload.tipoDocRep || 'CC',
      numeroDocRepresentante: payload.numeroDocRepresentante || '10.520.880',
      nombreContadorORevisor: payload.nombreContadorORevisor?.toUpperCase() || 'ANA MARÍA CHAVES',
      tipoDocContador: payload.tipoDocContador || 'CC',
      numeroDocContadorORevisor: payload.numeroDocContadorORevisor || '34.500.120',
      tarjetaProfesional: payload.tarjetaProfesional || '195400-T',
      fechaLimitePago: payload.fechaLimitePago || fechaLimStr,
      numeroGuiaIca: payload.numeroGuiaIca || `GSMI-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      predioOrigen: payload.predioOrigen || 'Predio Registrado Local - Cauca',
      plantaBeneficio: payload.plantaBeneficio || 'Frigorífico Popayán',
      especie: payload.especie || 'Bovino Macho Ceba',
      estadoPago: 'PENDIENTE',
      esIntegracionIca: false,
      consumida: false,
    };

    // Guardar en la colección temporal
    this.guiasSimuladas.unshift(nueva);
    return nueva;
  }

  /** Simular el pago en línea vía PSE */
  marcarComoPagada(consecutivo: string): boolean {
    const idx = this.guiasSimuladas.findIndex((g) => g.consecutivo === consecutivo);
    if (idx !== -1) {
      this.guiasSimuladas[idx].estadoPago = 'PAGADO';
      this.guiasSimuladas[idx].reciboBancario = `PSE-${Math.floor(100000 + Math.random() * 900000)}-APROBADO`;
      return true;
    }
    return false;
  }

  /** Listar todas las declaraciones y formularios registrados */
  listarDeclaraciones(): Observable<DeclaracionDeguelloData[]> {
    return of([...this.guiasSimuladas]);
  }

  /** Catálogo de Plantas de Beneficio Animal (PBA) autorizadas en el Cauca */
  private plantasBeneficio: PlantaBeneficio[] = [
    {
      id: 'pba-01',
      codigoInvima: 'INV-PBA-19001',
      nombre: 'Frigorífico Regional de Popayán S.A.S.',
      municipio: 'POPAYÁN',
      direccion: 'Km 4 Variante Norte # 12-40',
      capacidadDiariaCabezas: 120,
      esActiva: true,
      telefono: '(602) 8234500'
    },
    {
      id: 'pba-02',
      codigoInvima: 'INV-PBA-19517',
      nombre: 'Planta de Beneficio Animal Regional Patía',
      municipio: 'PATÍA - EL BORDO',
      direccion: 'Vereda Guayabal Lote 3',
      capacidadDiariaCabezas: 60,
      esActiva: true,
      telefono: '(602) 8431100'
    },
    {
      id: 'pba-03',
      codigoInvima: 'INV-PBA-19698',
      nombre: 'Frigorífico Santander de Quilichao',
      municipio: 'SANTANDER DE QUILICHAO',
      direccion: 'Vía Panamericana Cra 9 # 14-55',
      capacidadDiariaCabezas: 85,
      esActiva: true,
      telefono: '(602) 8203310'
    },
    {
      id: 'pba-04',
      codigoInvima: 'INV-PBA-19100',
      nombre: 'Matadero Municipal de Bolívar',
      municipio: 'BOLÍVAR',
      direccion: 'Sector San Pedro Salida al Macizo',
      capacidadDiariaCabezas: 40,
      esActiva: true,
      telefono: '(602) 8342010'
    }
  ];

  /** Parámetros tributarios de Degüello vigentes (Vigencia 2026) */
  private parametrosActuales: ParametrosDeguello = {
    vigencia: 2026,
    valorUvt: 49799,
    factorTarifaMayorUvt: 1.0,
    tarifaCalculadaCabezas: 49800,
    porcentajeParticipacionMunicipios: 10,
    sancionMinimaUvt: 10,
    diasLimiteDeclaracionMensual: 15
  };

  listarPlantasBeneficio(): Observable<PlantaBeneficio[]> {
    return of([...this.plantasBeneficio]);
  }

  obtenerParametros(): Observable<ParametrosDeguello> {
    return of({ ...this.parametrosActuales });
  }

  guardarParametros(nuevos: ParametrosDeguello): Observable<ParametrosDeguello> {
    this.parametrosActuales = { ...nuevos };
    return of({ ...this.parametrosActuales });
  }

  setDeclaracionEnEdicion(d: DeclaracionDeguelloData | null): void {
    this.declaracionEnEdicion.set(d ? { ...d } : null);
  }

  /**
   * Importar información directamente desde el servicio de ICA SIGMA
   * buscando por número de guía de movilización (GSMI)
   */
  importarDatosIca(numeroGuia: string): Observable<DeclaracionDeguelloData | null> {
    const limpia = numeroGuia.trim().toUpperCase();
    const match = this.guiasSimuladas.find(
      (g) => (g.numeroGuiaIca || '').toUpperCase().includes(limpia) || g.consecutivo.toUpperCase().includes(limpia)
    );

    if (match) {
      return of({ ...match });
    }

    // Si no está exactamente en la base, crear un lote mock realista desde ICA
    const mockIca: DeclaracionDeguelloData = {
      consecutivo: `2026-${Math.floor(1000000 + Math.random() * 9000000).toString().substring(0, 7)}`,
      anioGravable: 2026,
      periodoGravable: '09',
      esInicial: true,
      esCorreccion: false,
      razonSocial: 'GANADERÍA COLOMBIANA REGIONAL S.A.S.',
      nit: '901.442.110',
      dv: '5',
      telefonoFijo: '(602) 8291000',
      municipio: 'POPAYÁN',
      direccionNotificacion: 'KM 2 VÍA AL SUR',
      baseGravable: 18,
      tarifa: 49800,
      valorBruto: 18 * 49800,
      participacionMunicipios: Math.round(18 * 49800 * 0.1),
      subtotal: (18 * 49800) - Math.round(18 * 49800 * 0.1),
      sanciones: 0,
      subtotalMasSanciones: (18 * 49800) - Math.round(18 * 49800 * 0.1),
      interesMora: 0,
      totalAPagar: (18 * 49800) - Math.round(18 * 49800 * 0.1),
      firmaContador: true,
      firmaRevisor: false,
      nombreRepresentante: 'GUILLERMO LEÓN VALENCIA',
      tipoDocRep: 'CC',
      numeroDocRepresentante: '10.518.230',
      nombreContadorORevisor: 'CLAUDIA PATRICIA GÓMEZ',
      tipoDocContador: 'CC',
      numeroDocContadorORevisor: '34.520.119',
      tarjetaProfesional: '198420-T',
      fechaLimitePago: '28/09/2026',
      numeroGuiaIca: limpia || 'GSMI-2026-009941',
      predioOrigen: 'Finca Bellavista - Vereda El Morro (RUV: 19-001-882)',
      plantaBeneficio: 'Frigorífico Regional de Popayán (PBA-PO-01)',
      especie: 'Bovino Macho Ceba',
      fechaVencimientoGuia: '28/09/2026 18:00',
      estadoPago: 'PENDIENTE',
      esIntegracionIca: true,
      consumida: false
    };

    return of(mockIca);
  }

  /**
   * Generar Reliquidación / Declaración de Corrección
   */
  reliquidarDeclaracion(consecutivoOriginal: string, correccion: Partial<DeclaracionDeguelloData>): DeclaracionDeguelloData {
    // 1. Marcar la original como CORREGIDA
    const idx = this.guiasSimuladas.findIndex((g) => g.consecutivo === consecutivoOriginal);
    if (idx !== -1) {
      this.guiasSimuladas[idx].estadoPago = 'CORREGIDA';
    }

    // 2. Crear la nueva con marca de corrección
    const cabezas = Number(correccion.baseGravable) || 1;
    const tarifa = Number(correccion.tarifa) || this.TARIFA_BASE_2026;
    const sanciones = Number(correccion.sanciones) || 0;
    const mora = Number(correccion.interesMora) || 0;
    const calculo = this.calcularLiquidacion(cabezas, tarifa, sanciones, mora);

    const consecutivoNuevo = `2026-${Math.floor(1000000 + Math.random() * 9000000).toString().substring(0, 7)}`;
    const ahora = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(ahora.getDate() + 5);
    const fechaLimStr = `${fechaLimite.getDate().toString().padStart(2, '0')}/${(fechaLimite.getMonth() + 1).toString().padStart(2, '0')}/${fechaLimite.getFullYear()}`;

    const nuevaDeclaracion: DeclaracionDeguelloData = {
      consecutivo: consecutivoNuevo,
      anioGravable: correccion.anioGravable || ahora.getFullYear(),
      periodoGravable: correccion.periodoGravable || (ahora.getMonth() + 1).toString().padStart(2, '0'),
      esInicial: false,
      esCorreccion: true,
      declaracionCorregida: consecutivoOriginal,
      razonSocial: correccion.razonSocial || 'CONTRIBUYENTE RELIQUIDADO',
      nit: correccion.nit || '900.000.000',
      dv: correccion.dv || '0',
      telefonoFijo: correccion.telefonoFijo || '(602) 8000000',
      municipio: correccion.municipio || 'POPAYÁN',
      direccionNotificacion: correccion.direccionNotificacion || 'CRA 6 # 4-00',
      baseGravable: calculo.baseGravable,
      tarifa: calculo.tarifa,
      valorBruto: calculo.valorBruto,
      participacionMunicipios: calculo.participacionMunicipios,
      subtotal: calculo.subtotal,
      sanciones: calculo.sanciones,
      subtotalMasSanciones: calculo.subtotalMasSanciones,
      interesMora: calculo.interesMora,
      totalAPagar: calculo.totalAPagar,
      firmaContador: correccion.firmaContador ?? true,
      firmaRevisor: correccion.firmaRevisor ?? false,
      nombreRepresentante: correccion.nombreRepresentante || 'REPRESENTANTE LEGAL',
      tipoDocRep: correccion.tipoDocRep || 'CC',
      numeroDocRepresentante: correccion.numeroDocRepresentante || '10.000.000',
      nombreContadorORevisor: correccion.nombreContadorORevisor || 'CONTADOR PÚBLICO',
      tipoDocContador: correccion.tipoDocContador || 'CC',
      numeroDocContadorORevisor: correccion.numeroDocContadorORevisor || '34.000.000',
      tarjetaProfesional: correccion.tarjetaProfesional || '000000-T',
      fechaLimitePago: correccion.fechaLimitePago || fechaLimStr,
      numeroGuiaIca: correccion.numeroGuiaIca || 'GSMI-2026-REL',
      predioOrigen: correccion.predioOrigen || 'Predio Registrado',
      plantaBeneficio: correccion.plantaBeneficio || 'Frigorífico Popayán',
      especie: correccion.especie || 'Bovino Macho Ceba',
      estadoPago: 'PENDIENTE',
      esIntegracionIca: correccion.esIntegracionIca ?? false,
      consumida: false
    };

    this.guiasSimuladas.unshift(nuevaDeclaracion);
    this.setDeclaracionEnEdicion(null);
    return nuevaDeclaracion;
  }

  /**
   * Generar informe consolidado de recaudo y participación del 10% por municipio
   */
  obtenerInformeMunicipios(): Observable<InformeMunicipioRecaudo[]> {
    const mapa = new Map<string, InformeMunicipioRecaudo>();

    // Inicializar municipios oficiales del Cauca
    const listaMunicipios = ['POPAYÁN', 'PATÍA - EL BORDO', 'SANTANDER DE QUILICHAO', 'BOLÍVAR', 'EL TAMBO', 'PUERTO TEJADA'];
    listaMunicipios.forEach((m) => {
      mapa.set(m, {
        municipio: m,
        cabezas: 0,
        valorBruto: 0,
        participacion10: 0,
        totalDepartamental: 0,
        formularios: 0
      });
    });

    this.guiasSimuladas.forEach((d) => {
      const muniKey = (d.municipio || 'POPAYÁN').toUpperCase();
      let row = mapa.get(muniKey);
      if (!row) {
        row = {
          municipio: muniKey,
          cabezas: 0,
          valorBruto: 0,
          participacion10: 0,
          totalDepartamental: 0,
          formularios: 0
        };
        mapa.set(muniKey, row);
      }

      row.cabezas += d.baseGravable;
      row.valorBruto += d.valorBruto;
      row.participacion10 += d.participacionMunicipios;
      row.totalDepartamental += d.subtotalMasSanciones;
      row.formularios += 1;
    });

    return of(Array.from(mapa.values()));
  }

  /**
   * Generar informe de sacrificios y recaudo por Planta de Beneficio Animal (PBA)
   */
  obtenerInformePlantas(): Observable<InformePlantaBeneficio[]> {
    const result: InformePlantaBeneficio[] = this.plantasBeneficio.map((p) => {
      const declaracionDePlanta = this.guiasSimuladas.filter((d) =>
        (d.plantaBeneficio || '').toLowerCase().includes(p.municipio.toLowerCase()) ||
        (d.plantaBeneficio || '').toLowerCase().includes(p.nombre.toLowerCase().substring(0, 8))
      );

      const cabezas = declaracionDePlanta.reduce((acc, curr) => acc + curr.baseGravable, 0) || (p.capacidadDiariaCabezas * 15);
      const recaudo = cabezas * this.TARIFA_BASE_2026;
      const capacidadMes = p.capacidadDiariaCabezas * 30;
      const ocupacion = Math.min(100, Math.round((cabezas / capacidadMes) * 100));

      return {
        planta: p.nombre,
        municipio: p.municipio,
        cabezasFaenadas: cabezas,
        capacidadDiaria: p.capacidadDiariaCabezas,
        recaudoTotal: recaudo,
        porcentajeOcupacion: ocupacion || 68
      };
    });

    return of(result);
  }

  /** Formatear moneda colombiana */
  private formatDinero(val: number): string {
    return Math.round(val).toLocaleString('es-CO');
  }

  /**
   * Renderizar el HTML Oficial provisto por el usuario
   * inyectando dinámicamente los placeholders (|TOKEN|).
   */
  renderizarHtmlFactura(data: DeclaracionDeguelloData): string {
    const fechaImp = new Date().toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const checkInicial = data.esInicial ? 'checked="checked"' : '';
    const checkCorreccion = data.esCorreccion ? 'checked="checked"' : '';
    const checkFirmaContador = data.firmaContador ? 'checked="checked"' : '';
    const checkFirmaRevisor = data.firmaRevisor ? 'checked="checked"' : '';

    const checkRepCC = data.tipoDocRep === 'CC' ? 'checked="checked"' : '';
    const checkRepCE = data.tipoDocRep === 'CE' ? 'checked="checked"' : '';

    const checkContCC = data.tipoDocContador === 'CC' ? 'checked="checked"' : '';
    const checkContCE = data.tipoDocContador === 'CE' ? 'checked="checked"' : '';

    const barcodeBase64 = this.generarCodigoBarrasBase64(data.consecutivo, data.totalAPagar);

    const htmlTemplate = `<!doctype html>
<html>

<head>
    <meta charset="utf-8">
    <title>FORMULARIO ÚNICO DE DECLARACIÓN DE DEGÜELLO GANADO MAYOR</title>
    <style type="text/css">
        @page {
            size: A4;
            margin: 10mm;
        }

        @media print {
            body {
                padding: 0;
                margin: 0;
            }
            #pageContainer {
                width: 100% !important;
            }
        }
    </style>
</head>

<body style="margin: 0; padding: 15px; background: #fff;">
    <table id="pageContainer" width="930" align="center" cellpadding="0" cellspacing="0" border="0" style="font-family: arial, sans-serif; color: #000000; text-align: justify; line-height: 1.1em; font-size: 12px; margin: 0 auto; background: #fff;">
        <tbody>
            <tr>
                <td>
                    <table width="100%" border="0" cellspacing="0" cellpadding="5">
                        <tbody>
                            <tr>
                                <td width="19%" rowspan="2" align="center"><p><img src="/Escudo_gob.svg" style="max-width:80px; max-height:80px;" alt="Escudo Gobernación" /></p></td>
                                <td width="31%" rowspan="2" align="center"><strong>DEPARTAMENTO DEL CAUCA</strong><br> Secretaría de Hacienda Departamental <br>NIT: 891.500.999-1 <br></td>
                                <td width="50%" align="left" style="padding-top: 25px;"><strong>Formulario N°</strong></td>
                            </tr>
                            <tr>
                                <td align="right" valign="bottom" style="font-size: 22px; color: #000;"><b>${data.consecutivo}</b></td>
                            </tr>
                            <tr>
                                <td colspan="2" align="center" valign="top"><strong>FORMULARIO ÚNICO DE DECLARACIÓN DE DEGÜELLO GANADO MAYOR</strong></td>
                                <td align="center">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="5">
                                        <tbody>
                                            <tr>
                                                <td colspan="3" style="border: thin solid #000000;"><strong>PARA USO OFICIAL EXCLUSIVAMENTE</strong></td>
                                                <td width="8%" align="center" style="border: thin solid #000000; border-left: none;"><strong>DD</strong></td>
                                                <td width="7%" align="center" style="border: thin solid #000000; border-left: none;"><strong>MM</strong></td>
                                                <td width="17%" align="center" style="border: thin solid #000000; border-left: none;"><strong>AAAA</strong></td>
                                            </tr>
                                            <tr>
                                                <td width="41%" style="border-left: thin solid #000000; border-right: thin solid #000000; border-bottom: thin solid #000000;"><strong>N° DE RADICACIÓN</strong></td>
                                                <td width="27%" style="border-right: thin solid #000000; border-bottom: thin solid #000000">${data.numeroGuiaIca || 'RAD-2026-01'}</td>
                                                <td width="27%" style="border-right: thin solid #000000; border-bottom: thin solid #000000"><strong>FECHA</strong></td>
                                                <td style="border-right: thin solid #000000; border-bottom: thin solid #000000;">${new Date().getDate().toString().padStart(2, '0')}</td>
                                                <td style="border-right: thin solid #000000; border-bottom: thin solid #000000;">${(new Date().getMonth() + 1).toString().padStart(2, '0')}</td>
                                                <td style="border-right: thin solid #000000; border-bottom: thin solid #000000;">${new Date().getFullYear()}</td>
                                            </tr>
                                            <tr>
                                                <td style="border: thin solid #000000; border-top: none;"><strong>NOMBRE DEL FUNCIONARIO</strong></td>
                                                <td colspan="5" style="border-right: thin solid #000000; border-bottom: thin solid #000000;">VENTANILLA TRIBUTARIA DEPARTAMENTAL</td>
                                            </tr>
                                            <tr>
                                                <td style="border: thin solid #000000; border-top: none;"><strong>FIRMA DEL FUNCIONARIO</strong></td>
                                                <td colspan="5" style="border-right: thin solid #000000; border-bottom: thin solid #000000; font-style: italic; color: #555;">[Firmado Digitalmente Ley 527/1999]</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr>
                <td>
                    <table width="100%" border="0" cellspacing="0" cellpadding="5">
                        <tbody>
                            <tr>
                                <td colspan="7" align="left" style="border: thin solid #000000;"><strong>I. PERIODO DE DECLARACIÓN Y TIPO DE DECLARACIÓN</strong></td>
                            </tr>
                            <tr>
                                <td width="14%" style="border-left: thin solid #000000; border-right: thin solid #000000;"><strong>1. AÑO GRAVABLE</strong></td>
                                <td colspan="2" align="center" style="border-right: thin solid #000000;">${data.anioGravable}</td>
                                <td style="border-right: thin solid #000000;"><strong>2. PERIODO GRAVABLE</strong></td>
                                <td colspan="3" align="center" style="border-right: thin solid #000000;">${data.periodoGravable}</td>
                            </tr>
                            <tr>
                                <td style="border-top: thin solid #000000;border-bottom: thin solid #000000;border-left: thin solid #000000;"><strong>3. INICIAL</strong></td>
                                <td width="7%" style="border-top: thin solid #000000; border-bottom: thin solid #000000;"><input type="checkbox" ${checkInicial} name="checkbox" id="checkbox2"></td>
                                <td width="17%" style="border-top: thin solid #000000; border-bottom: thin solid #000000;"><strong>4. CORRECCIÓN</strong></td>
                                <td width="25%" style="border-top: thin solid #000000; border-bottom: thin solid #000000;"><input type="checkbox" ${checkCorreccion} name="checkbox" id="checkbox2"></td>
                                <td width="12%" style="border-top: thin solid #000000; border-bottom: thin solid #000000;"><strong>N° DECLARACIÓN</strong></td>
                                <td width="27%" colspan="2" style="border-right: thin solid #000000;border-top: thin solid #000000;border-bottom: thin solid #000000; font-size: 16px;"><b>${data.declaracionCorregida || '---'}</b></td>
                            </tr>
                            <tr>
                                <td colspan="7" align="left" style="border-right: thin solid #000000;border-left: thin solid #000000;"><strong>II. INFORMACIÓN DEL RESPONSABLE Y CALIDAD DE DECLARANTE</strong></td>
                            </tr>
                            <tr>
                                <td height="50" colspan="7" align="left" valign="top" style="border-left: thin solid #000000;border-top: thin solid #000000;border-bottom: thin solid #000000;border-right: thin solid #000000;">
                                    <p style="margin: 3px 0;"><strong>5. RAZÓN SOCIAL</strong></p>
                                    <p style="margin: 3px 0; font-size: 13px;">
                                        <strong>${data.razonSocial}</strong><br>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td height="50" colspan="2" align="left" valign="top" style="border-left: thin solid #000000;">
                                    <p style="margin: 3px 0;"><strong>6. NIT</strong></p>
                                    <span style="float:left; font-size: 13px; font-weight: bold;">${data.nit}</span>
                                </td>
                                <td align="left" valign="top">
                                    <p style="margin: 3px 0;"><strong>DV</strong></p>
                                    <p style="margin: 3px 0; font-weight: bold;">${data.dv}</p>
                                </td>
                                <td align="left" valign="top">
                                    <p style="margin: 3px 0;"><strong>7. TELÉFONO FIJO</strong></p>
                                    <p style="margin: 3px 0;">${data.telefonoFijo}</p>
                                </td>
                                <td colspan="3" align="left" valign="top" style="border-right: thin solid #000000;">
                                    <p style="margin: 3px 0;"><strong>8. MUNICIPIO</strong></p>
                                    <p style="margin: 3px 0; font-weight: bold;">${data.municipio}</p>
                                </td>
                            </tr>
                            <tr>
                                <td height="40" colspan="7" align="left" valign="top" style="border: thin solid #000000;">
                                    <p style="margin: 3px 0;"><strong>9. DIRECCIÓN DE NOTIFICACIÓN </strong></p>
                                    <p style="margin: 3px 0;">${data.direccionNotificacion}</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr>
                <td>
                    <table width="100%" border="0" cellspacing="0" cellpadding="5">
                        <tbody>
                            <tr>
                                <td colspan="4" style="border: thin solid #000000; border-top: none"><strong>III. LIQUIDACIÓN PRIVADA </strong></td>
                            </tr>
                            <tr>
                                <td width="60%" style="border: thin solid #000000; border-top: none">&nbsp;</td>
                                <td width="16%" align="center" style="border-right: thin solid #000000; border-bottom: thin solid #000000;"><strong>CANTIDAD</strong></td>
                                <td width="12%" align="center" style="border-right: thin solid #000000; border-bottom: thin solid #000000;"><strong>TARIFA</strong></td>
                                <td width="12%" align="center" style="border-right: thin solid #000000; border-bottom: thin solid #000000;"><strong>VALOR IMPUESTO</strong></td>
                            </tr>
                            <tr>
                                <td style="border: thin solid #000000; border-top: none">10. IMPUESTO DEGÜELLO GANADO MAYOR </td>
                                <td align="right" style="border-right: thin solid #000000; border-bottom: thin solid #000000; font-weight: bold;">${data.baseGravable}</td>
                                <td align="right" style="border-right: thin solid #000000; border-bottom: thin solid #000000;">$ ${this.formatDinero(data.tarifa)}</td>
                                <td align="right" style="border-right: thin solid #000000; border-bottom: thin solid #000000; font-weight: bold;">$ ${this.formatDinero(data.valorBruto)}</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="border: thin solid #000000; border-top: none">11. MENOS 10% PARTICIPACIÓN MUNICIPIOS</td>
                                <td colspan="2" align="right" style="border-right: thin solid #000000; border-bottom: thin solid #000000;">$ ${this.formatDinero(data.participacionMunicipios)}</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="border: thin solid #000000; border-top: none">12. TOTAL IMPUESTO A PAGAR</td>
                                <td colspan="2" align="right" style="border-right: thin solid #000000; border-bottom: thin solid #000000; font-weight: bold;">$ ${this.formatDinero(data.subtotal)}</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="border: thin solid #000000; border-top: none">13. SANCIONES </td>
                                <td colspan="2" align="right" style="border-right: thin solid #000000; border-bottom: thin solid #000000;">$ ${this.formatDinero(data.sanciones)}</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="border: thin solid #000000; border-top: none">14. TOTAL IMPUESTO MÁS SANCIONES</td>
                                <td colspan="2" align="right" style="border-right: thin solid #000000; border-bottom: thin solid #000000; font-weight: bold;">$ ${this.formatDinero(data.subtotalMasSanciones)}</td>
                            </tr>
                            <tr>
                                <td colspan="4" style="border: thin solid #000000; border-top: none"><strong>IV. PAGO </strong></td>
                            </tr>
                            <tr>
                                <td colspan="2" style="border: thin solid #000000; border-top: none">15. VALOR A PAGAR</td>
                                <td colspan="2" align="right" style="border-right: thin solid #000000; border-bottom: thin solid #000000;">$ ${this.formatDinero(data.subtotalMasSanciones)}</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="border: thin solid #000000; border-top: none">16. INTERÉS MORA</td>
                                <td colspan="2" align="right" style="border-right: thin solid #000000; border-bottom: thin solid #000000;">$ ${this.formatDinero(data.interesMora)}</td>
                            </tr>
                            <tr style="background: #fdf6e2;">
                                <td colspan="2" style="border: thin solid #000000; border-top: none; font-size: 13px;"><strong>17. TOTAL A PAGAR</strong></td>
                                <td colspan="2" align="right" style="border-right: thin solid #000000; border-bottom: thin solid #000000; font-size: 15px; color: #78350f;"><strong>$ ${this.formatDinero(data.totalAPagar)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr>
                <td>
                    <table width="100%" border="0" cellspacing="0" cellpadding="4">
                        <tbody>
                            <tr>
                                <td colspan="8" style="border: thin solid #000000; border-top:none;"><strong>FIRMAS</strong></td>
                                <td width="17%" colspan="3" style="border-bottom: thin solid #000000;"><strong>FIRMA DEL CONTADOR</strong></td>
                                <td width="5%" style="border-bottom: thin solid #000000;"><input type="checkbox" ${checkFirmaContador} name="checkbox3" id="checkbox4"></td>
                                <td width="16%" style="border-bottom: thin solid #000000;"><strong>O REVISOR FISCAL</strong></td>
                                <td style="border-bottom: thin solid #000000; border-right: thin solid #000000;"><input type="checkbox" ${checkFirmaRevisor} name="checkbox3" id="checkbox4"></td>
                            </tr>
                            <tr>
                                <td height="55" colspan="8" valign="top" style="border: thin solid #000000; border-top:none; width: 50%;">
                                    <strong>FIRMA DEL DECLARANTE:</strong><br>
                                    <span style="font-size: 10px; color: #666;">Firma Electrónica Autorizada / Certificado Digital</span>
                                </td>
                                <td colspan="6" style="border-right: thin solid #000000; border-bottom: thin solid #000000; width: 50%;">
                                    <strong>FIRMA CONTADOR / REVISOR:</strong><br>
                                    <span style="font-size: 10px; color: #666;">Certificación Contable sin Salvedades</span>
                                </td>
                            </tr>
                            <tr>
                                <td colspan="8" style="border: thin solid #000000; border-top:none;"><strong>NOMBRES Y APELLIDOS:</strong> ${data.nombreRepresentante}</td>
                                <td colspan="6" style="border-right: thin solid #000000; border-bottom: thin solid #000000;"><strong>NOMBRES Y APELLIDOS:</strong> ${data.nombreContadorORevisor}</td>
                            </tr>
                            <tr align="center">
                                <td width="4%" style="border-left: thin solid #000000; border-top: none; border-bottom: thin solid #000000;">C.C.</td>
                                <td width="4%" style="border-right: thin solid #000000; border-top: none; border-bottom: thin solid #000000;"><input type="checkbox" ${checkRepCC} name="checkbox" id="checkbox"></td>
                                <td width="8%" style="border-bottom: thin solid #000000;">C.E</td>
                                <td width="9%" style="border-right: thin solid #000000; border-bottom: thin solid #000000;"><input type="checkbox" ${checkRepCE} name="checkbox" id="checkbox"></td>
                                <td colspan="4" style="border-right: thin solid #000000; border-bottom: thin solid #000000; font-weight: bold;">${data.numeroDocRepresentante}</td>
                                <td style="border-bottom: thin solid #000000;">C.C.</td>
                                <td style="border-bottom: thin solid #000000; border-right: thin solid #000000;"><input type="checkbox" ${checkContCC} name="checkbox" id="checkbox"></td>
                                <td style="border-bottom: thin solid #000000;">C.E</td>
                                <td style="border-bottom: thin solid #000000;border-right: thin solid #000000;"><input type="checkbox" ${checkContCE} name="checkbox" id="checkbox"></td>
                                <td style="border-bottom: thin solid #000000; font-weight: bold;">${data.numeroDocContadorORevisor}</td>
                                <td style="border-bottom: thin solid #000000; border-right: thin solid #000000;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td colspan="8" height="35"
                                    style="border: thin solid #000000; border-top: none;">
                                    <strong style="font-size: 18px; padding: 5px; color: #b91c1c;">FECHA LÍMITE DE PAGO: ${data.fechaLimitePago}</strong>
                                </td>
                                <td colspan="6" style="border-bottom: thin solid #000000; border-right: thin solid #000000; font-weight: bold;">TARJETA PROFESIONAL: ${data.tarjetaProfesional}</td>
                            </tr>

                            <tr>
                                <td height="90" colspan="5" align="center" style="border: thin solid #000000; border-top: none; background: #fafafa;">
                                    <strong style="font-size: 11px; color: #999; text-transform: uppercase;">
                                        ${data.estadoPago === 'PAGADO' ? '✅ PAGADO - ' + (data.reciboBancario || 'BANCO') : 'ESPACIO TIMBRE BANCO'}
                                    </strong>
                                </td>
                                <td colspan="9" align="center" style="border-right: thin solid #000000; border-bottom: thin solid #000000; padding: 5px;">
                                    <img src="data:image/svg+xml;utf8,${encodeURIComponent(barcodeBase64)}" width="480" height="60" alt="Código de Barras Recaudo GS1-128" />
                                    <div style="font-size: 10px; font-family: monospace; letter-spacing: 2px;">(415)7709998001234(8020)${data.consecutivo.replace(/\D/g, '')}(3900)${data.totalAPagar}</div>
                                </td>
                            </tr>
                            <tr style="font-size: 10px; color: #555;">
                                <td colspan="8" align="left">
                                    <strong>
                                        © Gobernación del Cauca — Secretaría de Hacienda Departamental — Software
                                        <a href="http://www.1cero1.com" style="color: #1b759f; text-decoration: none;" target="_blank">101 S.A.S.</a>
                                    </strong>
                                </td>
                                <td colspan="6" align="right"><strong>Fecha de Impresión: ${fechaImp}</strong></td>
                            </tr>

                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</body>

</html>`;

    return htmlTemplate;
  }

  /**
   * Genera un código de barras SVG tipo GS1-128 vectorial limpio
   */
  private generarCodigoBarrasBase64(consecutivo: string, total: number): string {
    const raw = `${consecutivo.replace(/\D/g, '')}${total}`;
    let barsSvg = '';
    let x = 10;
    for (let i = 0; i < 75; i++) {
      const charCode = (raw.charCodeAt(i % raw.length) || 48) + i;
      const width = (charCode % 3) + 1;
      const isBlack = (charCode % 2) === 0;
      if (isBlack) {
        barsSvg += `<rect x="${x}" y="0" width="${width}" height="60" fill="#000000" />`;
      }
      x += width + 1;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="60" viewBox="0 0 ${Math.max(x + 10, 480)} 60">${barsSvg}</svg>`;
  }
}
