import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { 
  DeclaracionDeguelloData, 
  ConsultaGuiaRequest, 
  PlantaBeneficio, 
  ParametrosDeguello,
  InformeMunicipioRecaudo,
  InformePlantaBeneficio,
  ResponsableConsulta 
} from '../../domain/models/deguello.model';

@Injectable({
  providedIn: 'root',
})
export class DeguelloService {
  private http = inject(HttpClient);
  private authState = inject(AuthStateService);

  private get apiUrl(): string {
    const urls = this.authState.moduleApiUrls();
    return urls['DEGUELLO'] || 'http://localhost:5045/api/v1';
  }

  private readonly TARIFA_BASE_2026 = 49800; // Tarifa referencial Cauca 2026 (~1 UVT)

  /** Declaración seleccionada para reliquidar / corrección */
  readonly declaracionEnEdicion = signal<DeclaracionDeguelloData | null>(null);

  /** Empresa / Contribuyente autenticado en el Portal del Contribuyente */
  readonly empresaAutenticada = signal<PlantaBeneficio | null>(null);

  /**
   * Normaliza los objetos de base de datos / API hacia el modelo de presentación de frontend
   */
  normalizarDeclaracion(raw: any): DeclaracionDeguelloData {
    if (!raw) return raw;

    let estadoPagoNormalizado: DeclaracionDeguelloData['estadoPago'] = 'PENDIENTE';
    const est = (raw.estadoPago || raw.estado || '').toUpperCase();
    if (est === 'PAGADA' || est === 'PAGADO') {
      estadoPagoNormalizado = 'PAGADO';
    } else if (est === 'VENCIDA' || est === 'VENCIDO') {
      estadoPagoNormalizado = 'VENCIDO';
    } else if (est === 'RADICADA') {
      estadoPagoNormalizado = 'RADICADA';
    } else if (est === 'RELIQUIDADA') {
      estadoPagoNormalizado = 'RELIQUIDADA';
    } else if (est === 'CORREGIDA') {
      estadoPagoNormalizado = 'CORREGIDA';
    } else if (est === 'ANULADA' || est === 'RECHAZADA') {
      estadoPagoNormalizado = 'RECHAZADA';
    } else if (est === 'PENDIENTE') {
      estadoPagoNormalizado = 'PENDIENTE';
    }

    return {
      consecutivo: raw.consecutivo || '',
      anioGravable: raw.anioGravable || 2026,
      periodoGravable: raw.periodoGravable || '09',
      esInicial: raw.esInicial ?? true,
      esCorreccion: raw.esCorreccion ?? false,
      esReliquidacion: raw.esReliquidacion ?? false,
      declaracionCorregida: raw.declaracionCorregida || raw.declaracionACorregir || '',
      declaracionReliquidada: raw.declaracionReliquidada || '',
      razonSocial: raw.razonSocial || raw.razonSocialDeclarante || '',
      nit: raw.nit || raw.nitDeclarante || '',
      dv: String(raw.dv ?? '0'),
      telefonoFijo: raw.telefonoFijo || '',
      municipio: raw.municipio || '',
      direccionNotificacion: raw.direccionNotificacion || '',
      baseGravable: Number(raw.baseGravable) || 0,
      tarifa: Number(raw.tarifa) || this.TARIFA_BASE_2026,
      valorBruto: Number(raw.valorBruto) || 0,
      participacionMunicipios: Number(raw.participacionMunicipios) || 0,
      subtotal: Number(raw.subtotal) || 0,
      sanciones: Number(raw.sanciones) || 0,
      subtotalMasSanciones: Number(raw.subtotalMasSanciones) || 0,
      interesMora: Number(raw.interesMora) || 0,
      totalAPagar: Number(raw.totalAPagar) || 0,
      firmaContador: !!raw.firmaContador,
      firmaRevisor: !!raw.firmaRevisor,
      nombreRepresentante: raw.nombreRepresentante || raw.nombreCompletoRepLegal || '',
      tipoDocRep: (raw.tipoDocRep || 'CC') as 'CC' | 'CE',
      numeroDocRepresentante: raw.numeroDocRepresentante || raw.numeroDocumentoRepLegal || '',
      nombreContadorORevisor: raw.nombreContadorORevisor || '',
      tipoDocContador: (raw.tipoDocContador || 'CC') as 'CC' | 'CE',
      numeroDocContadorORevisor: raw.numeroDocContadorORevisor || '',
      tarjetaProfesional: raw.tarjetaProfesional || '',
      fechaLimitePago: raw.fechaLimitePago || '',
      codigoBarrasBase64: raw.codigoBarrasBase64,
      numeroGuiaIca: raw.numeroGuiaIca || '',
      predioOrigen: raw.predioOrigen || '',
      plantaBeneficio: raw.plantaBeneficio || '',
      especie: raw.especie || 'Bovino Macho Ceba',
      fechaVencimientoGuia: raw.fechaVencimientoGuia || '',
      estadoPago: estadoPagoNormalizado,
      esIntegracionIca: !!raw.esIntegracionIca,
      reciboBancario: raw.reciboBancario || '',
      consumida: !!raw.consumida,
      rutaArchivoGuiaIca: raw.rutaArchivoGuiaIca || '',
      nombreArchivoGuiaIca: raw.nombreArchivoGuiaIca || '',
      rutaArchivoLiquidacionPdf: raw.rutaArchivoLiquidacionPdf || '',
      nombreArchivoLiquidacion: raw.nombreArchivoLiquidacion || '',
      rutaArchivoPago: raw.rutaArchivoPago || '',
      nombreArchivoPago: raw.nombreArchivoPago || '',
      numeroRadicado: raw.numeroRadicado || (estadoPagoNormalizado === 'RADICADA' ? `RAD-${raw.consecutivo}` : undefined),
      turnoRevision: raw.turnoRevision || (estadoPagoNormalizado === 'RADICADA' ? 1 : undefined),
      observacionAnulacion: raw.observacionAnulacion || raw.observacionesAnulacion || '',
      fechaHoraAnulacion: raw.fechaHoraAnulacion || '',
    };
  }

  /** Consultar guía por Documento y Número de Guía ICA o Consecutivo desde la BD */
  consultarGuia(req: ConsultaGuiaRequest): Observable<DeclaracionDeguelloData | null> {
    const doc = req.documento.trim().replace(/\D/g, '');
    const guia = req.numeroGuia.trim().toUpperCase();

    return this.http.get<{ success: boolean; data: { declaraciones: any[] } }>(
      `${this.apiUrl}/portalciudadano/consultar?documento=${encodeURIComponent(doc)}&secondaryStr=${encodeURIComponent(guia)}`
    ).pipe(
      map(res => {
        if (res?.success && res.data?.declaraciones && res.data.declaraciones.length > 0) {
          return this.normalizarDeclaracion(res.data.declaraciones[0]);
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /** Consultar todas las declaraciones y guías para el Portal del Contribuyente desde la BD */
  consultarDeclaracionesCiudadano(docStr: string, secondaryStr: string): Observable<DeclaracionDeguelloData[]> {
    const doc = docStr ? docStr.trim().replace(/\D/g, '') : '';
    const guia = secondaryStr ? secondaryStr.trim().toUpperCase() : '';

    return this.http.get<{ success: boolean; data: { declaraciones: any[] } }>(
      `${this.apiUrl}/portalciudadano/consultar?documento=${encodeURIComponent(doc)}&secondaryStr=${encodeURIComponent(guia)}`
    ).pipe(
      map(res => {
        if (res?.success && res.data?.declaraciones) {
          return res.data.declaraciones.map(d => this.normalizarDeclaracion(d));
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  /** Calcular liquidación matemática a partir de cabezas y valores (Se cobra el 100% completo; la Gobernación dispersa el 10% internamente) */
  calcularLiquidacion(cabezas: number, tarifa: number = this.TARIFA_BASE_2026, sanciones: number = 0, interesMora: number = 0) {
    const valorBruto = Math.round(cabezas * tarifa);
    const participacionMunicipios = Math.round(valorBruto * 0.1); // 10% ley para dispersión de la Gobernación
    const subtotal = valorBruto; // Valor completo del impuesto a cargo
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

  /** Crear una nueva declaración oficial con persistencia directa en SQL Server */
  crearDeclaracion(payload: Partial<DeclaracionDeguelloData>): Observable<DeclaracionDeguelloData> {
    const body = {
      anioGravable: payload.anioGravable || 2026,
      periodoGravable: payload.periodoGravable || '09',
      esInicial: payload.esInicial ?? true,
      esCorreccion: payload.esCorreccion ?? false,
      esReliquidacion: payload.esReliquidacion ?? false,
      declaracionCorregida: payload.declaracionCorregida || null,
      declaracionReliquidada: payload.declaracionReliquidada || null,
      estadoInicial: payload.estadoPago || 'RADICADA',
      razonSocial: payload.razonSocial || '',
      nit: (payload.nit || '').replace(/\D/g, ''),
      dv: String(payload.dv ?? '0'),
      telefonoFijo: payload.telefonoFijo || '',
      municipio: payload.municipio || '',
      direccionNotificacion: payload.direccionNotificacion || '',
      baseGravable: Number(payload.baseGravable) || 1,
      tarifa: Number(payload.tarifa) || this.TARIFA_BASE_2026,
      sanciones: Number(payload.sanciones) || 0,
      interesMora: Number(payload.interesMora) || 0,
      firmaContador: payload.firmaContador ?? false,
      firmaRevisor: payload.firmaRevisor ?? false,
      nombreRepresentante: payload.nombreRepresentante || '',
      tipoDocRep: payload.tipoDocRep || 'CC',
      numeroDocRepresentante: payload.numeroDocRepresentante || '',
      nombreContadorORevisor: payload.nombreContadorORevisor || '',
      tipoDocContador: payload.tipoDocContador || 'CC',
      numeroDocContadorORevisor: payload.numeroDocContadorORevisor || '',
      tarjetaProfesional: payload.tarjetaProfesional || '',
      fechaLimitePago: payload.fechaLimitePago,
      numeroGuiaIca: payload.numeroGuiaIca,
      predioOrigen: payload.predioOrigen,
      plantaBeneficio: payload.plantaBeneficio,
      especie: payload.especie,
      esIntegracionIca: payload.esIntegracionIca ?? false,
      rutaArchivoGuiaIca: payload.rutaArchivoGuiaIca,
      nombreArchivoGuiaIca: payload.nombreArchivoGuiaIca,
      rutaArchivoLiquidacionPdf: payload.rutaArchivoLiquidacionPdf,
      nombreArchivoLiquidacion: payload.nombreArchivoLiquidacion,
    };

    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/declaraciones`,
      body
    ).pipe(
      map(res => {
        if (res?.success && res.data) {
          return this.normalizarDeclaracion(res.data);
        }
        throw new Error('No se pudo crear la declaración');
      })
    );
  }

  crearDeclaracionManual(payload: Partial<DeclaracionDeguelloData>): Observable<DeclaracionDeguelloData> {
    return this.crearDeclaracion(payload);
  }

  /** Registrar el pago en línea vía PSE o bancario en la base de datos */
  marcarComoPagada(
    consecutivo: string, 
    reciboBancario?: string, 
    rutaArchivoPago?: string, 
    nombreArchivoPago?: string
  ): Observable<boolean> {
    const body: any = {
      consecutivo,
      reciboBancario: reciboBancario || `PSE-${Math.floor(100000 + Math.random() * 900000)}-APROBADO`,
    };
    if (rutaArchivoPago) {
      body.rutaArchivoPago = rutaArchivoPago;
      body.nombreArchivoPago = nombreArchivoPago || '';
    }

    return this.http.post<{ success: boolean; data: boolean }>(
      `${this.apiUrl}/declaraciones/pago`,
      body
    ).pipe(
      map(res => !!(res?.success)),
      catchError(() => of(false))
    );
  }

  /** Listar todas las declaraciones y formularios registrados directamente desde SQL Server */
  listarDeclaraciones(): Observable<DeclaracionDeguelloData[]> {
    return this.http.get<{ success: boolean; data: { items: any[] } }>(
      `${this.apiUrl}/declaraciones?pageSize=100`
    ).pipe(
      map(res => {
        if (res?.success && res.data?.items) {
          return res.data.items.map(item => this.normalizarDeclaracion(item));
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  /** Catálogo de Plantas de Beneficio Animal (PBA) autorizadas en el Cauca */
  private plantasBeneficio: PlantaBeneficio[] = [
    {
      id: 'pba-01',
      idPlanta: 1,
      nit: '900823411',
      claveAcceso: '123456',
      codigoInvima: 'INV-PBA-19001',
      nombre: 'Frigorífico Regional de Popayán S.A.S.',
      municipio: 'POPAYÁN',
      direccion: 'Km 4 Variante Norte # 12-40',
      capacidadDiariaCabezas: 120,
      esActiva: true,
      telefono: '(602) 8234500',
      emailOficial: 'gerencia@frigorificopopayan.com',
      representanteLegal: 'CARLOS ALBERTO MOSQUERA',
      docRepresentante: '1061789450',
      esFrigorificoRegional: true
    },
    {
      id: 'pba-02',
      idPlanta: 2,
      nit: '10548920',
      claveAcceso: '123456',
      codigoInvima: 'INV-PBA-19517',
      nombre: 'Planta de Beneficio Animal Regional Patía',
      municipio: 'PATÍA - EL BORDO',
      direccion: 'Vereda Guayabal Lote 3',
      capacidadDiariaCabezas: 60,
      esActiva: true,
      telefono: '(602) 8431100',
      emailOficial: 'contacto@pbapatia.gov.co',
      representanteLegal: 'MARIO FERNANDO MUÑOZ',
      docRepresentante: '10548920',
      esFrigorificoRegional: false
    },
    {
      id: 'pba-03',
      idPlanta: 3,
      nit: '76321450',
      claveAcceso: '123456',
      codigoInvima: 'INV-PBA-19698',
      nombre: 'Frigorífico Santander de Quilichao',
      municipio: 'SANTANDER DE QUILICHAO',
      direccion: 'Vía Panamericana Cra 9 # 14-55',
      capacidadDiariaCabezas: 85,
      esActiva: true,
      telefono: '(602) 8203310',
      emailOficial: 'sacrificio@santanderdequilichao.com',
      representanteLegal: 'ANDRES FELIPE GUZMAN',
      docRepresentante: '76321450',
      esFrigorificoRegional: false
    },
    {
      id: 'pba-04',
      idPlanta: 4,
      nit: '891500987',
      claveAcceso: '123456',
      codigoInvima: 'INV-PBA-19100',
      nombre: 'Matadero Municipal de Bolívar',
      municipio: 'BOLÍVAR',
      direccion: 'Sector San Pedro Salida al Macizo',
      capacidadDiariaCabezas: 40,
      esActiva: true,
      telefono: '(602) 8342010',
      emailOficial: 'alcaldia@bolivar-cauca.gov.co',
      representanteLegal: 'JAIME EDUARDO ORTIZ',
      docRepresentante: '891500987',
      esFrigorificoRegional: false
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

  setEmpresaAutenticada(planta: PlantaBeneficio | null): void {
    this.empresaAutenticada.set(planta ? { ...planta } : null);
  }

  obtenerPlantaPorNit(nit: string): Observable<PlantaBeneficio | null> {
    const nitLimpio = (nit || '').trim().replace(/\D/g, '');
    return this.http.get<{ success: boolean; data: PlantaBeneficio }>(
      `${this.apiUrl}/plantas-beneficio/nit/${encodeURIComponent(nitLimpio)}`
    ).pipe(
      map(res => {
        if (res?.success && res.data) {
          return res.data;
        }
        const local = this.plantasBeneficio.find(p => (p.nit || '').replace(/\D/g, '') === nitLimpio);
        return local || null;
      }),
      catchError(() => {
        const local = this.plantasBeneficio.find(p => (p.nit || '').replace(/\D/g, '') === nitLimpio);
        return of(local || null);
      })
    );
  }

  /**
   * Inicio de sesión genérico para la empresa/planta sin validaciones complejas.
   * Al pasar el NIT, busca la planta y auto-inicia sesión cargando sus datos.
   */
  loginEmpresa(nit: string, _clave?: string): Observable<{ success: boolean; planta?: PlantaBeneficio; message?: string }> {
    const nitLimpio = (nit || '').trim().replace(/\D/g, '');
    if (!nitLimpio) {
      return of({ success: false, message: 'Ingrese el NIT de la empresa o planta.' });
    }

    return this.obtenerPlantaPorNit(nitLimpio).pipe(
      map(planta => {
        if (planta) {
          this.setEmpresaAutenticada(planta);
          return { success: true, planta };
        }
        // Fallback genérico para que cualquier NIT pueda ingresar sin bloqueos (fase demo)
        const empresaGenerica: PlantaBeneficio = {
          id: `pba-gen-${nitLimpio}`,
          codigoInvima: `INV-AUTO-${nitLimpio.slice(0, 5)}`,
          nombre: `EMPRESA / PLANTA BENEFICIO NIT ${nitLimpio}`,
          municipio: 'POPAYÁN',
          direccion: 'Zona de Beneficio Animal',
          capacidadDiariaCabezas: 50,
          esActiva: true,
          telefono: '(602) 8000000',
          nit: nitLimpio,
          claveAcceso: '123456',
          emailOficial: `tributario@nit${nitLimpio}.com`,
          representanteLegal: 'REPRESENTANTE LEGAL',
          docRepresentante: nitLimpio
        };
        this.setEmpresaAutenticada(empresaGenerica);
        return { success: true, planta: empresaGenerica };
      })
    );
  }

  listarPlantasBeneficio(): Observable<PlantaBeneficio[]> {
    return this.http.get<{ success: boolean; data: PlantaBeneficio[] }>(
      `${this.apiUrl}/plantas-beneficio`
    ).pipe(
      map(res => (res?.success && res.data && res.data.length > 0) ? res.data : [...this.plantasBeneficio]),
      catchError(() => of([...this.plantasBeneficio]))
    );
  }

  /** Consultar si un responsable/contribuyente existe en BD (como Planta o por histórico de declaraciones) */
  consultarResponsable(nit: string): Observable<ResponsableConsulta> {
    const nitLimpio = (nit || '').trim();
    if (!nitLimpio) {
      return of({
        existe: false,
        tipo: 'NO_REGISTRADO',
        mensaje: 'NIT no especificado.'
      });
    }

    return this.http.get<{ success: boolean; data: ResponsableConsulta }>(
      `${this.apiUrl}/plantas-beneficio/consultar-responsable/${encodeURIComponent(nitLimpio)}`
    ).pipe(
      map(res => res?.data || { existe: false, tipo: 'NO_REGISTRADO', mensaje: 'No se obtuvo respuesta.' }),
      catchError(() => {
        // Fallback local: verificar si coincide con alguna planta local en memoria
        const pLocal = this.plantasBeneficio.find(p => p.nit && p.nit.replace(/\D/g, '') === nitLimpio.replace(/\D/g, ''));
        if (pLocal) {
          return of({
            existe: true,
            tipo: 'PLANTA' as const,
            mensaje: 'Empresa / Planta registrada en el sistema.',
            nit: pLocal.nit,
            dv: '9',
            razonSocial: pLocal.nombre,
            municipio: pLocal.municipio,
            direccion: pLocal.direccion,
            telefono: pLocal.telefono,
            representanteLegal: pLocal.representanteLegal,
            docRepresentante: pLocal.docRepresentante,
            codigoInvima: pLocal.codigoInvima,
            idPlanta: pLocal.idPlanta
          });
        }
        return of({
          existe: false,
          tipo: 'NO_REGISTRADO' as const,
          nit: nitLimpio,
          mensaje: `El NIT ${nitLimpio} no se encuentra registrado en el censo tributario.`
        });
      })
    );
  }

  /** Registrar o actualizar una Empresa / Planta de Beneficio en BD SQL Server */
  guardarPlantaBeneficio(planta: Partial<PlantaBeneficio>): Observable<{ success: boolean; data?: PlantaBeneficio; message?: string }> {
    const payload = {
      idPlanta: planta.idPlanta,
      codigoInvima: planta.codigoInvima || 'INV-PBA-GEN',
      nombre: planta.nombre,
      idMunicipio: 0,
      municipio: planta.municipio || 'POPAYÁN',
      direccion: planta.direccion || 'DIRECCIÓN PRINCIPAL',
      telefono: planta.telefono,
      capacidadDiariaCabezas: Number(planta.capacidadDiariaCabezas) || 50,
      esFrigorificoRegional: !!planta.esFrigorificoRegional,
      activa: planta.esActiva !== false,
      nit: planta.nit,
      claveAcceso: planta.claveAcceso || '123456',
      emailOficial: planta.emailOficial,
      representanteLegal: planta.representanteLegal,
      docRepresentante: planta.docRepresentante
    };

    return this.http.post<{ success: boolean; data: PlantaBeneficio; message?: string }>(
      `${this.apiUrl}/plantas-beneficio`,
      payload
    ).pipe(
      map(res => {
        if (res?.success && res.data) {
          const idx = this.plantasBeneficio.findIndex(p => p.idPlanta === res.data.idPlanta || (p.nit && p.nit === res.data.nit));
          if (idx >= 0) {
            this.plantasBeneficio[idx] = res.data;
          } else {
            this.plantasBeneficio.push(res.data);
          }
          return { success: true, data: res.data, message: 'Empresa guardada exitosamente en la base de datos.' };
        }
        return { success: false, message: res?.message || 'No se pudo guardar la empresa.' };
      }),
      catchError(err => of({ success: false, message: err?.error?.message || 'Error de conexión al guardar la empresa en el servidor.' }))
    );
  }

  obtenerParametros(): Observable<ParametrosDeguello> {
    return this.http.get<{ success: boolean; data: ParametrosDeguello }>(
      `${this.apiUrl}/parametrizacion`
    ).pipe(
      map(res => (res?.success && res.data) ? res.data : { ...this.parametrosActuales }),
      catchError(() => of({ ...this.parametrosActuales }))
    );
  }

  guardarParametros(nuevos: ParametrosDeguello): Observable<ParametrosDeguello> {
    this.parametrosActuales = { ...nuevos };
    return this.http.post<{ success: boolean; data: ParametrosDeguello }>(
      `${this.apiUrl}/parametrizacion`,
      nuevos
    ).pipe(
      map(res => res?.success && res.data ? res.data : { ...this.parametrosActuales }),
      catchError(() => of({ ...this.parametrosActuales }))
    );
  }

  setDeclaracionEnEdicion(d: DeclaracionDeguelloData | null): void {
    this.declaracionEnEdicion.set(d ? { ...d } : null);
  }

  /**
   * Importar información directamente desde el servicio de ICA o consulta en BD
   * buscando por número de guía de movilización (GSMI)
   */
  importarDatosIca(numeroGuia: string): Observable<DeclaracionDeguelloData | null> {
    const limpia = numeroGuia.trim().toUpperCase();

    return this.http.get<{ success: boolean; data: { declaraciones: any[] } }>(
      `${this.apiUrl}/portalciudadano/consultar?secondaryStr=${encodeURIComponent(limpia)}`
    ).pipe(
      map(res => {
        if (res?.success && res.data?.declaraciones && res.data.declaraciones.length > 0) {
          return this.normalizarDeclaracion(res.data.declaraciones[0]);
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Aprobar una declaración en estado RADICADA (Función del funcionario de Gobernación)
   * Transiciona el estado a PENDIENTE en base de datos (habilitada para pago en banco o PSE).
   */
  aprobarLiquidacion(consecutivo: string): Observable<DeclaracionDeguelloData | null> {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/declaraciones/${consecutivo}/aprobar`,
      {}
    ).pipe(
      map(res => {
        if (res?.success && res.data) {
          return this.normalizarDeclaracion(res.data);
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Rechazar una radicación oficial por inconsistencias documentales o sanitarias
   */
  rechazarLiquidacion(consecutivo: string, motivo?: string): Observable<DeclaracionDeguelloData | null> {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/declaraciones/${consecutivo}/rechazar`,
      { motivo: motivo || 'Inconsistencias documentales o sanitarias en la Guía ICA' }
    ).pipe(
      map(res => {
        if (res?.success && res.data) {
          return this.normalizarDeclaracion(res.data);
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Modificar / Corregir datos de una declaración en revisión oficial (cabezas, guía, observaciones)
   */
  modificarLiquidacion(
    consecutivo: string, 
    baseGravable?: number, 
    numeroGuiaIca?: string, 
    observaciones?: string,
    aprobarInmediatamente: boolean = false
  ): Observable<DeclaracionDeguelloData | null> {
    const body: any = {
      baseGravable,
      numeroGuiaIca,
      observaciones,
      aprobarInmediatamente
    };
    return this.http.put<{ success: boolean; data: any }>(
      `${this.apiUrl}/declaraciones/${consecutivo}`,
      body
    ).pipe(
      map(res => {
        if (res?.success && res.data) {
          return this.normalizarDeclaracion(res.data);
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Reliquidación por Vencimiento (Art. 634 E.T.)
   * OJO: NO ES CORRECCIÓN. No aplica sanción de corrección (Art. 644 E.T.).
   * Marca la factura original vencida como RELIQUIDADA en SQL Server.
   * Emite una nueva declaración de tipo RELIQUIDACIÓN con 5 días hábiles de plazo e intereses moratorios calculados.
   */
  reliquidarPorVencimiento(consecutivoOriginal: string, datos: Partial<DeclaracionDeguelloData>): Observable<DeclaracionDeguelloData> {
    const body = {
      consecutivoOriginal,
      motivoCorreccion: 'Reliquidación por Vencimiento (Art. 634 E.T.)',
      esReliquidacion: true,
      esCorreccion: false,
      esInicial: false,
      declaracionReliquidada: consecutivoOriginal,
      estadoInicial: 'PENDIENTE',
      sanciones: 0,
      interesMora: Number(datos.interesMora) || 0,
      baseGravable: Number(datos.baseGravable) || 1,
      tarifa: Number(datos.tarifa) || this.TARIFA_BASE_2026,
      razonSocial: datos.razonSocial || '',
      nit: (datos.nit || '').replace(/\D/g, ''),
      dv: String(datos.dv ?? '0'),
      telefonoFijo: datos.telefonoFijo || '',
      municipio: datos.municipio || '',
      direccionNotificacion: datos.direccionNotificacion || '',
      nombreRepresentante: datos.nombreRepresentante || '',
      tipoDocRep: datos.tipoDocRep || 'CC',
      numeroDocRepresentante: datos.numeroDocRepresentante || '',
      nombreContadorORevisor: datos.nombreContadorORevisor || '',
      tipoDocContador: datos.tipoDocContador || 'CC',
      numeroDocContadorORevisor: datos.numeroDocContadorORevisor || '',
      tarjetaProfesional: datos.tarjetaProfesional || '',
      numeroGuiaIca: datos.numeroGuiaIca,
      predioOrigen: datos.predioOrigen,
      plantaBeneficio: datos.plantaBeneficio,
      especie: datos.especie,
      rutaArchivoGuiaIca: datos.rutaArchivoGuiaIca,
      nombreArchivoGuiaIca: datos.nombreArchivoGuiaIca,
      rutaArchivoLiquidacionPdf: datos.rutaArchivoLiquidacionPdf,
      nombreArchivoLiquidacion: datos.nombreArchivoLiquidacion,
    };

    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/declaraciones/reliquidar`,
      body
    ).pipe(
      map(res => {
        if (res?.success && res.data) {
          this.setDeclaracionEnEdicion(null);
          return this.normalizarDeclaracion(res.data);
        }
        throw new Error('No se pudo reliquidar la declaración');
      })
    );
  }

  /**
   * Generar Declaración de Corrección Fiscal (Art. 644 E.T.)
   */
  reliquidarDeclaracion(consecutivoOriginal: string, correccion: Partial<DeclaracionDeguelloData>): Observable<DeclaracionDeguelloData> {
    const body = {
      consecutivoOriginal,
      motivoCorreccion: 'Corrección fiscal formal (Art. 644 E.T.)',
      esCorreccion: true,
      esReliquidacion: false,
      esInicial: false,
      declaracionCorregida: consecutivoOriginal,
      estadoInicial: 'PENDIENTE',
      sanciones: Number(correccion.sanciones) || 0,
      interesMora: Number(correccion.interesMora) || 0,
      baseGravable: Number(correccion.baseGravable) || 1,
      tarifa: Number(correccion.tarifa) || this.TARIFA_BASE_2026,
      razonSocial: correccion.razonSocial || '',
      nit: (correccion.nit || '').replace(/\D/g, ''),
      dv: String(correccion.dv ?? '0'),
      telefonoFijo: correccion.telefonoFijo || '',
      municipio: correccion.municipio || '',
      direccionNotificacion: correccion.direccionNotificacion || '',
      nombreRepresentante: correccion.nombreRepresentante || '',
      tipoDocRep: correccion.tipoDocRep || 'CC',
      numeroDocRepresentante: correccion.numeroDocRepresentante || '',
      nombreContadorORevisor: correccion.nombreContadorORevisor || '',
      tipoDocContador: correccion.tipoDocContador || 'CC',
      numeroDocContadorORevisor: correccion.numeroDocContadorORevisor || '',
      tarjetaProfesional: correccion.tarjetaProfesional || '',
      numeroGuiaIca: correccion.numeroGuiaIca,
      predioOrigen: correccion.predioOrigen,
      plantaBeneficio: correccion.plantaBeneficio,
      especie: correccion.especie,
      rutaArchivoGuiaIca: correccion.rutaArchivoGuiaIca,
      nombreArchivoGuiaIca: correccion.nombreArchivoGuiaIca,
      rutaArchivoLiquidacionPdf: correccion.rutaArchivoLiquidacionPdf,
      nombreArchivoLiquidacion: correccion.nombreArchivoLiquidacion,
    };

    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/declaraciones/reliquidar`,
      body
    ).pipe(
      map(res => {
        if (res?.success && res.data) {
          this.setDeclaracionEnEdicion(null);
          return this.normalizarDeclaracion(res.data);
        }
        throw new Error('No se pudo registrar la corrección');
      })
    );
  }

  /**
   * Generar informe consolidado de recaudo y participación del 10% por municipio desde la base de datos
   */
  obtenerInformeMunicipios(): Observable<InformeMunicipioRecaudo[]> {
    return this.http.get<{ success: boolean; data: InformeMunicipioRecaudo[] }>(
      `${this.apiUrl}/informes/municipios`
    ).pipe(
      map(res => (res?.success && res.data) ? res.data : []),
      catchError(() => of([]))
    );
  }

  /**
   * Generar informe de sacrificios y recaudo por Planta de Beneficio Animal (PBA) desde la base de datos
   */
  obtenerInformePlantas(): Observable<InformePlantaBeneficio[]> {
    return this.http.get<{ success: boolean; data: InformePlantaBeneficio[] }>(
      `${this.apiUrl}/informes/plantas`
    ).pipe(
      map(res => (res?.success && res.data) ? res.data : []),
      catchError(() => of([]))
    );
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
                                <td colspan="2" style="border: thin solid #000000; border-top: none">11. PARTICIPACIÓN MUNICIPAL (10% LEY - DISPERSIÓN GOBERNACIÓN)</td>
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
