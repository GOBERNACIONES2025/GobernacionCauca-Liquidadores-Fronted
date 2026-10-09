import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { 
  ConsultaCiudadanaSharedComponent, 
  ConsultaSubmitPayload 
} from '../../../../../shared/components/consulta-ciudadana/consulta-ciudadana-shared';
import { DeclaracionDeguelloData, PlantaBeneficio } from '../../../domain/models/deguello.model';
import { DeguelloService } from '../../../infrastructure/services/deguello.service';
import { DeguelloFtpService } from '../../../infrastructure/services/deguello-ftp.service';
import { FacturaModalComponent } from '../../components/factura-modal/factura-modal';

@Component({
  selector: 'app-deguello-portal-ciudadano',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink, 
    ConsultaCiudadanaSharedComponent, 
    FacturaModalComponent
  ],
  templateUrl: './deguello-portal-ciudadano.html',
})
export class DeguelloPortalCiudadanoComponent implements OnInit {
  private deguelloService = inject(DeguelloService);
  private deguelloFtpService = inject(DeguelloFtpService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** Modo de vista: 'login' (Autogestión PBA) | 'dashboard' (Portal Empresa) | 'consulta_publica' (Puntual ICA) */
  readonly modoVista = signal<'login' | 'dashboard' | 'consulta_publica'>('login');

  /** Formulario de Login Genérico */
  readonly loginNit = signal<string>('900823411');
  readonly loginClave = signal<string>('123456');
  readonly loginError = signal<string>('');

  /** Empresa autenticada en el servicio */
  readonly empresaActiva = computed(() => this.deguelloService.empresaAutenticada());

  /** Catálogo de plantas demo autorizadas para acceso rápido en 1 clic */
  readonly plantasDemo = [
    {
      nombre: 'Frigorífico Regional de Popayán S.A.S.',
      nit: '900823411',
      municipio: 'POPAYÁN',
      invima: 'INV-PBA-19001',
      capacidad: 120,
      icono: 'fa-building-columns'
    },
    {
      nombre: 'Planta de Beneficio Animal Regional Patía',
      nit: '10548920',
      municipio: 'PATÍA - EL BORDO',
      invima: 'INV-PBA-19517',
      capacidad: 60,
      icono: 'fa-wheat-awn'
    },
    {
      nombre: 'Frigorífico Santander de Quilichao',
      nit: '76321450',
      municipio: 'SANTANDER DE QUILICHAO',
      invima: 'INV-PBA-19698',
      capacidad: 85,
      icono: 'fa-industry'
    },
    {
      nombre: 'Matadero Municipal de Bolívar',
      nit: '891500987',
      municipio: 'BOLÍVAR',
      invima: 'INV-PBA-19100',
      capacidad: 40,
      icono: 'fa-mountain'
    }
  ];

  /** Control de visualización */
  readonly isConsulted = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  /** Criterio ingresado en la búsqueda */
  readonly criterioBusqueda = signal<{ doc: string; guia: string; tipoDoc: number } | null>(null);

  /** Lista de declaraciones encontradas */
  readonly declaraciones = signal<DeclaracionDeguelloData[]>([]);

  /** Filtro de estado para la lista de resultados */
  readonly filtroEstado = signal<'TODAS' | 'RADICADA' | 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'RELIQUIDADA' | 'RECHAZADA'>('TODAS');

  /** Declaración activa para visualizar/imprimir en el modal */
  readonly declaracionSeleccionadaParaFactura = signal<DeclaracionDeguelloData | null>(null);

  /** Modal de resumen previo al pago y pasarela de pagos Fintech / PSE */
  readonly declaracionParaPago = signal<DeclaracionDeguelloData | null>(null);
  readonly simulandoPago = signal<boolean>(false);
  readonly fasePago = signal<'resumen' | 'procesando' | 'exito'>('resumen');
  readonly textoLoaderPago = signal<string>('Conectando con la pasarela de pagos PSE...');
  readonly reciboGenerado = signal<string>('');

  /** Datos del pagador para la transacción en pasarela oficial */
  readonly emailPago = signal<string>('');
  readonly telefonoPago = signal<string>('');
  readonly procesandoPagoReal = signal<boolean>(false);
  readonly errorPagoReal = signal<string | null>(null);

  /** Feedback y banner de confirmación/conciliación bancaria al retornar de PSE */
  readonly feedbackRetornoBancario = signal<{
    tipo: 'success' | 'warning' | 'error';
    titulo: string;
    mensaje: string;
    referencia?: string;
    cus?: string;
    banco?: string;
  } | null>(null);

  /** Modal de Radicación de Guía ICA (Descentralizado en portal de contribuyente) */
  readonly modalRadicarGuiaAbierto = signal<boolean>(false);
  readonly radicandoGuia = signal<boolean>(false);
  readonly radicadoResultado = signal<{ radicado: string; turno: number; consecutivo: string } | null>(null);
  readonly errorRadicacion = signal<string>('');

  /** Formulario de Radicación de Guía */
  readonly formRadicacion = {
    numeroGuiaIca: '',
    predioOrigen: '',
    municipioProcedenciaGanado: '',
    especie: 'Bovino Macho Ceba',
    periodoGravable: '09',
    anioGravable: 2026,
    rutaArchivoGuiaIca: '',
    nombreArchivoGuiaIca: '',
  };

  /** Municipios del Cauca para procedencia del ganado */
  readonly municipiosCauca = [
    'POPAYÁN',
    'PATÍA - EL BORDO',
    'SANTANDER DE QUILICHAO',
    'BOLÍVAR',
    'EL TAMBO',
    'PUERTO TEJADA',
    'PIENDAMÓ',
    'TIMBÍO',
    'SILVIA',
    'CALOTO',
    'MERCADERES',
    'LA SIERRA',
    'SUCRE',
    'ALMAGUER',
    'BALBOA',
    'BUENOS AIRES',
    'CAJIBÍO',
    'CORINTO',
    'MORALES',
    'PADILLA',
    'ROSAS',
    'SOTARÁ',
    'TORIBÍO',
  ];

  /** Archivo soporte de Guía ICA */
  readonly archivoGuiaSeleccionado = signal<File | null>(null);
  readonly subiendoGuiaFtp = signal<boolean>(false);

  /** Búsqueda en ICA SIGMA dentro del modal */
  readonly buscandoIcaModal = signal<boolean>(false);
  readonly mensajeIcaModal = signal<{ texto: string; tipo: 'success' | 'error' } | null>(null);

  /** Valores financieros reactivos para el modal de radicación */
  readonly baseGravableRadicacion = signal<number | null>(null);
  readonly tarifaRadicacion = signal<number>(49800);

  readonly valorBrutoRadicacion = computed(() => {
    const cab = Number(this.baseGravableRadicacion()) || 0;
    return cab * (this.tarifaRadicacion() || 49800);
  });

  readonly dispersionMpalRadicacion = computed(() => {
    return Math.round(this.valorBrutoRadicacion() * 0.1);
  });

  readonly totalRadicacion = computed(() => {
    return this.valorBrutoRadicacion();
  });

  /** Modal de Reliquidación por Vencimiento */
  readonly declaracionParaReliquidar = signal<DeclaracionDeguelloData | null>(null);
  readonly reliquidando = signal<boolean>(false);

  /** Información del contribuyente a partir de la empresa o de los resultados */
  readonly contribuyenteInfo = computed(() => {
    const emp = this.empresaActiva();
    if (emp) {
      return {
        razonSocial: emp.nombre,
        nit: emp.nit || '',
        dv: '9',
        municipio: emp.municipio,
        direccion: emp.direccion,
        telefono: emp.telefono,
        representante: emp.representanteLegal || 'REPRESENTANTE LEGAL REGISTRADO',
        docRepresentante: emp.docRepresentante || emp.nit || '',
        emailOficial: emp.emailOficial || `tributario@${(emp.nit || 'cauca')}.gov.co`,
        codigoInvima: emp.codigoInvima || 'INV-PBA-CAUCA',
        capacidadDiaria: emp.capacidadDiariaCabezas || 60,
        esFrigorifico: !!emp.esFrigorificoRegional,
        predioOrigen: '',
        plantaBeneficio: emp.nombre
      };
    }
    const list = this.declaraciones();
    if (list.length === 0) return null;
    const item = list[0];
    return {
      razonSocial: item.razonSocial,
      nit: item.nit,
      dv: item.dv,
      municipio: item.municipio,
      direccion: item.direccionNotificacion,
      telefono: item.telefonoFijo,
      representante: item.nombreRepresentante,
      docRepresentante: item.numeroDocRepresentante,
      emailOficial: '',
      codigoInvima: '',
      capacidadDiaria: 0,
      esFrigorifico: false,
      predioOrigen: item.predioOrigen,
      plantaBeneficio: item.plantaBeneficio,
    };
  });

  /** Conteo y totales */
  readonly totalDeclaraciones = computed(() => this.declaraciones().length);

  readonly totalCabezas = computed(() => {
    return this.declaraciones().reduce((acc, curr) => acc + curr.baseGravable, 0);
  });

  readonly countRadicadas = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'RADICADA').length;
  });

  readonly countPendientes = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'PENDIENTE').length;
  });

  readonly countPagadas = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'PAGADO').length;
  });

  readonly countVencidas = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'VENCIDO').length;
  });

  readonly countReliquidadas = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'RELIQUIDADA').length;
  });

  readonly countRechazadas = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'RECHAZADA').length;
  });

  readonly totalPendientePagar = computed(() => {
    return this.declaraciones()
      .filter((d) => d.estadoPago === 'PENDIENTE')
      .reduce((acc, curr) => acc + curr.totalAPagar, 0);
  });

  /** Determina si es una consulta puntual de una guía ICA / formulario específico */
  readonly esBusquedaPuntual = computed(() => {
    const crit = this.criterioBusqueda();
    const tieneGuia = !!crit?.guia && crit.guia.trim().length > 0;
    return tieneGuia || this.declaraciones().length === 1;
  });

  /** Declaraciones filtradas según el tab seleccionado */
  readonly declaracionesFiltradas = computed(() => {
    const estado = this.filtroEstado();
    if (estado === 'TODAS') {
      return this.declaraciones();
    }
    return this.declaraciones().filter((d) => d.estadoPago === estado);
  });

  ngOnInit(): void {
    const emp = this.deguelloService.empresaAutenticada();
    if (emp && emp.nit) {
      this.modoVista.set('dashboard');
      this.isConsulted.set(true);
      this.criterioBusqueda.set({
        doc: emp.nit,
        guia: '',
        tipoDoc: 1,
      });
      this.recargarDeclaraciones(emp.nit, '');
    }

    // Escuchar parámetros de retorno bancario oficial (PSE / Pasarela Fintech)
    this.route.queryParams.subscribe((params) => {
      const ref = params['ref'];
      const estado = params['estado'];
      const doc = params['doc'];

      if (ref && estado === 'retorno') {
        this.verificarRetornoPasarela(ref, doc);
      }
    });
  }

  /** Selección rápida de una de las 4 plantas de beneficio autorizadas en Cauca */
  seleccionarPlantaDemo(planta: { nit: string }): void {
    this.loginNit.set(planta.nit);
    this.iniciarSesion(planta.nit);
  }

  /** Iniciar sesión genérico de empresa / planta sin validaciones complejas */
  iniciarSesion(nitOverride?: string): void {
    const nit = (nitOverride || this.loginNit()).trim();
    if (!nit) {
      this.loginError.set('Por favor ingrese el NIT de la planta de beneficio o empresa.');
      return;
    }

    this.loginError.set('');
    this.isLoading.set(true);

    this.deguelloService.loginEmpresa(nit, this.loginClave()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.planta) {
          this.criterioBusqueda.set({
            doc: res.planta.nit || nit,
            guia: '',
            tipoDoc: 1,
          });
          this.modoVista.set('dashboard');
          this.isConsulted.set(true);
          this.recargarDeclaraciones(res.planta.nit || nit, '');
        } else {
          this.loginError.set(res.message || 'Error al iniciar sesión.');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.loginError.set('No se pudo establecer conexión con el servidor.');
      }
    });
  }

  /** Cierre de sesión de la empresa */
  cerrarSesion(): void {
    this.deguelloService.setEmpresaAutenticada(null);
    this.declaraciones.set([]);
    this.criterioBusqueda.set(null);
    this.filtroEstado.set('TODAS');
    this.declaracionSeleccionadaParaFactura.set(null);
    this.modoVista.set('login');
    this.isConsulted.set(false);
  }

  /** Radicar una nueva guía desde el portal de la empresa - ABRE EL MODAL SIN IR AL PANEL ADMIN */
  radicarNuevaGuia(): void {
    this.abrirModalRadicarGuia();
  }

  /** Navegar a la consulta pública por guía ICA */
  irAConsultaPublica(): void {
    this.modoVista.set('consulta_publica');
  }

  /** Volver a la pantalla de login de empresa */
  volverALogin(): void {
    this.modoVista.set('login');
  }

  /** Al ejecutar la consulta desde el componente compartido */
  alConsultar(payload: ConsultaSubmitPayload): void {
    this.isLoading.set(true);
    this.criterioBusqueda.set({
      doc: payload.numeroDocumento,
      guia: payload.secondaryValue,
      tipoDoc: payload.tipoDocumento,
    });
    this.modoVista.set('dashboard');
    this.recargarDeclaraciones(payload.numeroDocumento, payload.secondaryValue);
  }

  private recargarDeclaraciones(doc: string, guia: string): void {
    this.isLoading.set(true);
    this.deguelloService
      .consultarDeclaracionesCiudadano(doc, guia)
      .subscribe({
        next: (res) => {
          this.declaraciones.set(res);
          this.isConsulted.set(true);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al consultar declaraciones de degüello:', err);
          this.declaraciones.set([]);
          this.isConsulted.set(true);
          this.isLoading.set(false);
        },
      });
  }

  /** Volver a la pantalla de consulta inicial */
  nuevaConsulta(): void {
    if (this.empresaActiva()) {
      const nit = this.empresaActiva()?.nit || '';
      this.recargarDeclaraciones(nit, '');
    } else {
      this.cerrarSesion();
    }
  }

  /** Cambiar filtro de estado */
  setFiltro(estado: 'TODAS' | 'RADICADA' | 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'RELIQUIDADA' | 'RECHAZADA'): void {
    this.filtroEstado.set(estado);
  }

  /** Abrir modal de factura oficial para visualización e impresión */
  verFactura(d: DeclaracionDeguelloData): void {
    this.declaracionSeleccionadaParaFactura.set(d);
  }

  /** Cerrar modal de factura */
  cerrarModalFactura(): void {
    this.declaracionSeleccionadaParaFactura.set(null);
  }

  /** Validaciones del formulario de pago */
  get emailPagoValido(): boolean {
    const email = this.emailPago().trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  get telefonoPagoValido(): boolean {
    const tel = this.telefonoPago().trim();
    return tel.length >= 7;
  }

  get formularioPagoValido(): boolean {
    return this.emailPagoValido && this.telefonoPagoValido;
  }

  /** Abrir modal de resumen previo al pago */
  abrirModalPago(d: DeclaracionDeguelloData): void {
    if (d.estadoPago !== 'PENDIENTE') return;
    this.declaracionParaPago.set(d);
    this.fasePago.set('resumen');
    this.simulandoPago.set(false);
    this.procesandoPagoReal.set(false);
    this.errorPagoReal.set(null);
    this.reciboGenerado.set('');

    const emp = this.empresaActiva();
    const info = this.contribuyenteInfo();
    this.emailPago.set(emp?.emailOficial || info?.emailOficial || 'contribuyente@cauca.gov.co');
    this.telefonoPago.set(emp?.telefono || info?.telefono || d.telefonoFijo || '3000000000');
  }

  /** Cerrar modal de pago */
  cerrarModalPago(): void {
    if ((this.simulandoPago() && this.fasePago() === 'procesando') || this.procesandoPagoReal()) {
      return;
    }
    this.declaracionParaPago.set(null);
    this.simulandoPago.set(false);
    this.procesandoPagoReal.set(false);
    this.errorPagoReal.set(null);
    this.fasePago.set('resumen');
  }

  /** Iniciar pago oficial contra la pasarela corporativa Fintech / PSE con redirección bancaria */
  iniciarPagoPasarelaReal(): void {
    const dec = this.declaracionParaPago();
    if (!dec || dec.estadoPago !== 'PENDIENTE' || this.procesandoPagoReal()) return;

    if (!this.emailPagoValido) {
      this.errorPagoReal.set('Por favor ingrese un correo electrónico válido para recibir el soporte bancario.');
      return;
    }

    if (!this.telefonoPagoValido) {
      this.errorPagoReal.set('Por favor ingrese un teléfono de contacto válido (mínimo 7 dígitos).');
      return;
    }

    this.procesandoPagoReal.set(true);
    this.errorPagoReal.set(null);

    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/deguello/portal-ciudadano';
    const docEfectivo = (this.criterioBusqueda()?.doc || dec.nit || '').trim();

    const urlRetorno = `${currentOrigin}${currentPath}?doc=${encodeURIComponent(docEfectivo)}&ref=${encodeURIComponent(dec.consecutivo)}&estado=retorno`;

    this.deguelloService.iniciarPagoPasarela({
      consecutivo: dec.consecutivo,
      nitContribuyente: docEfectivo,
      email: this.emailPago().trim(),
      telefono: this.telefonoPago().trim(),
      direccion: dec.direccionNotificacion,
      urlRetorno
    }).subscribe({
      next: (res) => {
        const exitoso = res.isSuccess ?? res.IsSuccess ?? false;
        const resultado = res.result ?? res.Result;

        if (!exitoso || !resultado) {
          this.procesandoPagoReal.set(false);
          const msg = res.message ?? res.Message ?? 'No fue posible iniciar la transacción con la pasarela. Intente nuevamente en unos minutos.';
          this.errorPagoReal.set(msg);
          return;
        }

        const urlPasarela = resultado.urlPagoEfectiva 
          ?? resultado.url 
          ?? resultado.Url 
          ?? resultado.urlBanco 
          ?? resultado.UrlBanco;

        if (urlPasarela) {
          // Redirigir al ciudadano a la pasarela bancaria / PSE oficial
          window.location.href = urlPasarela;
        } else {
          this.procesandoPagoReal.set(false);
          this.errorPagoReal.set('La pasarela no retornó una dirección bancaria válida. Por favor contacte a la Secretaría de Hacienda.');
        }
      },
      error: (err) => {
        this.procesandoPagoReal.set(false);
        const msg = err?.error?.message 
          ?? err?.error?.Message 
          ?? err?.message 
          ?? 'Error de conexión con el servicio de pagos. Verifique su red e intente nuevamente.';
        this.errorPagoReal.set(msg);
      }
    });
  }

  /** Consulta el estado bancario oficial al volver de la pasarela y actualiza la vista */
  verificarRetornoPasarela(referencia: string, documento?: string): void {
    this.isLoading.set(true);

    this.deguelloService.consultarEstadoPago(referencia).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const result = res.result ?? res.Result;

        if (result?.estaAprobada ?? result?.EstaAprobada) {
          this.feedbackRetornoBancario.set({
            tipo: 'success',
            titulo: '¡Pago Bancario Acreditado Exitosamente!',
            mensaje: `La pasarela bancaria oficial certificó el recaudo para la liquidación ${referencia}. El título tributario ha sido conciliado a estado PAGADO ante la Secretaría de Hacienda del Cauca.`,
            referencia,
            cus: result.cus || result.ticketId || result.transactionId || 'PSE-APROBADO',
            banco: result.banco || 'PSE / Redeban Pasarela Fintech'
          });

          // Actualizar vista del contribuyente si hay documento o empresa activa
          const docEfectivo = documento || this.empresaActiva()?.nit || this.criterioBusqueda()?.doc;
          if (docEfectivo) {
            this.modoVista.set('dashboard');
            this.isConsulted.set(true);
            this.criterioBusqueda.set({
              doc: docEfectivo,
              guia: '',
              tipoDoc: 1,
            });
            this.recargarDeclaraciones(docEfectivo, '');
          }
        } else if (result?.estaPendiente ?? result?.EstaPendiente) {
          this.feedbackRetornoBancario.set({
            tipo: 'warning',
            titulo: 'Transacción en Tránsito Bancario (Pendiente)',
            mensaje: `Su entidad financiera está confirmando la transacción para la liquidación ${referencia}. La conciliación se completará automáticamente en cuanto el banco notifique la acreditación.`,
            referencia,
            cus: result.cus || result.ticketId
          });
        } else {
          this.feedbackRetornoBancario.set({
            tipo: 'error',
            titulo: 'Transacción No Aprobada',
            mensaje: `La entidad bancaria no aprobó la transacción para la declaración ${referencia}. Motivo: ${result?.mensaje || 'Pago cancelado o fondos insuficientes'}. La liquidación sigue pendiente de pago.`,
            referencia
          });
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.feedbackRetornoBancario.set({
          tipo: 'error',
          titulo: 'Verificación de Pago',
          mensaje: `No fue posible validar el estado bancario inmediato para la referencia ${referencia}. Si el débito fue realizado en su cuenta, se conciliará automáticamente en el próximo corte del banco.`,
          referencia
        });
      }
    });
  }

  cerrarFeedbackRetorno(): void {
    this.feedbackRetornoBancario.set(null);
  }

  /** Simular el pago con loader y actualizar el estado a PAGADO como está dispuesto */
  ejecutarPagoSimulado(): void {
    const dec = this.declaracionParaPago();
    if (!dec || dec.estadoPago !== 'PENDIENTE') return;

    this.simulandoPago.set(true);
    this.fasePago.set('procesando');
    this.textoLoaderPago.set('Conectando con la pasarela de pagos oficial (PSE / Redeban)...');

    // Animación fluida de pasos
    setTimeout(() => {
      this.textoLoaderPago.set('Validando transacción y debitando fondos de la cuenta...');
    }, 800);

    setTimeout(() => {
      this.textoLoaderPago.set('Acreditando recaudo tributario ante la Tesorería del Cauca...');
    }, 1600);

    setTimeout(() => {
      const ref = `PSE-${Math.floor(100000000 + Math.random() * 900000000)}`;
      this.deguelloService.marcarComoPagada(dec.consecutivo, ref).subscribe({
        next: (ok) => {
          this.simulandoPago.set(false);
          this.fasePago.set('exito');
          this.reciboGenerado.set(ref);

          // Actualizar inmediatamente en memoria para que se muestre como pagada tal como está dispuesto
          const hoy = new Date().toLocaleDateString('es-CO');
          this.declaraciones.update((lista) =>
            lista.map((item) =>
              item.consecutivo === dec.consecutivo
                ? {
                    ...item,
                    estadoPago: 'PAGADO',
                    reciboBancario: ref,
                    fechaPago: hoy,
                  }
                : item
            )
          );

          // Cerrar modal automáticamente después de mostrar el éxito brevemente
          setTimeout(() => {
            this.cerrarModalPago();
            // Refrescar en segundo plano con el servidor
            const crit = this.criterioBusqueda();
            if (crit) {
              this.recargarDeclaraciones(crit.doc, crit.guia);
            }
          }, 1400);
        },
        error: () => {
          this.simulandoPago.set(false);
          this.fasePago.set('resumen');
        }
      });
    }, 2400);
  }

  // --- BOTÓN DE PAGO (ABRE MODAL DE CONCEPTO) ---
  pagar(d: DeclaracionDeguelloData): void {
    this.abrirModalPago(d);
  }

  /** Abrir modal de radicación de guía ICA */
  abrirModalRadicarGuia(): void {
    this.modalRadicarGuiaAbierto.set(true);
    this.radicadoResultado.set(null);
    this.errorRadicacion.set('');
    this.mensajeIcaModal.set(null);
    this.archivoGuiaSeleccionado.set(null);
    this.subiendoGuiaFtp.set(false);

    const emp = this.empresaActiva();
    const info = this.contribuyenteInfo();
    const mesActual = (new Date().getMonth() + 1).toString().padStart(2, '0');

    this.formRadicacion.numeroGuiaIca = '';
    this.formRadicacion.predioOrigen = '';
    this.formRadicacion.municipioProcedenciaGanado = '';
    this.formRadicacion.especie = 'Bovino Macho Ceba';
    this.formRadicacion.periodoGravable = mesActual;
    this.formRadicacion.anioGravable = new Date().getFullYear();
    this.formRadicacion.rutaArchivoGuiaIca = '';
    this.formRadicacion.nombreArchivoGuiaIca = '';

    this.baseGravableRadicacion.set(null);
    this.tarifaRadicacion.set(49800);
  }

  /** Cerrar modal de radicación de guía ICA */
  cerrarModalRadicarGuia(): void {
    const huboRadicado = !!this.radicadoResultado();
    this.modalRadicarGuiaAbierto.set(false);
    this.radicadoResultado.set(null);
    this.errorRadicacion.set('');

    if (huboRadicado) {
      const crit = this.criterioBusqueda();
      if (crit) {
        this.recargarDeclaraciones(crit.doc, crit.guia);
      }
    }
  }

  /** Manejo de archivo digital de la Guía ICA para FTP */
  onArchivoGuiaSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.archivoGuiaSeleccionado.set(file);
      this.subirGuiaAlFtp(file);
    }
  }

  subirGuiaAlFtp(file: File): void {
    const emp = this.empresaActiva();
    const info = this.contribuyenteInfo();
    const nit = emp?.nit || info?.nit || 'GENERAL';
    const anio = this.formRadicacion.anioGravable || 2026;
    this.subiendoGuiaFtp.set(true);

    this.deguelloFtpService.subirGuiaIca(file, nit, anio).subscribe({
      next: (res) => {
        this.subiendoGuiaFtp.set(false);
        this.formRadicacion.rutaArchivoGuiaIca = res.remoteFullPath;
        this.formRadicacion.nombreArchivoGuiaIca = res.originalFileName || file.name;
      },
      error: () => {
        this.subiendoGuiaFtp.set(false);
      }
    });
  }

  eliminarArchivoGuia(): void {
    this.archivoGuiaSeleccionado.set(null);
    this.formRadicacion.rutaArchivoGuiaIca = '';
    this.formRadicacion.nombreArchivoGuiaIca = '';
  }

  /** Búsqueda en línea ICA SIGMA dentro del modal */
  consultarGuiaEnIca(): void {
    const guia = this.formRadicacion.numeroGuiaIca.trim().toUpperCase();
    if (!guia) {
      this.mensajeIcaModal.set({ texto: 'Ingrese el número de Guía ICA para consultar.', tipo: 'error' });
      return;
    }

    this.buscandoIcaModal.set(true);
    this.mensajeIcaModal.set(null);

    this.deguelloService.importarDatosIca(guia).subscribe({
      next: (data) => {
        this.buscandoIcaModal.set(false);
        if (data) {
          this.formRadicacion.numeroGuiaIca = data.numeroGuiaIca || guia;
          this.formRadicacion.predioOrigen = data.predioOrigen || '';
          this.formRadicacion.especie = data.especie || 'Bovino Macho Ceba';
          this.baseGravableRadicacion.set(data.baseGravable);
          this.tarifaRadicacion.set(data.tarifa || 49800);
          this.mensajeIcaModal.set({
            texto: `Información de la Guía ICA "${guia}" importada exitosamente (${data.baseGravable} Bovinos).`,
            tipo: 'success'
          });
        } else {
          this.mensajeIcaModal.set({
            texto: `Guía "${guia}" no encontrada en SIGMA en línea. Puede diligenciar los campos manualmente.`,
            tipo: 'error'
          });
        }
      },
      error: () => {
        this.buscandoIcaModal.set(false);
        this.mensajeIcaModal.set({ texto: 'No se pudo conectar con el servicio ICA. Ingrese los datos manualmente.', tipo: 'error' });
      }
    });
  }

  /** Confirmar y registrar radicación oficial en la base de datos */
  confirmarRadicacionGuia(): void {
    const cabezas = Number(this.baseGravableRadicacion()) || 0;
    if (!this.formRadicacion.numeroGuiaIca.trim()) {
      this.errorRadicacion.set('Debe ingresar el número de la Guía Sanitaria ICA (GSMI).');
      return;
    }
    if (cabezas <= 0) {
      this.errorRadicacion.set('Debe ingresar una cantidad de bovinos mayor a cero.');
      return;
    }

    this.errorRadicacion.set('');
    this.radicandoGuia.set(true);

    const emp = this.empresaActiva();
    const info = this.contribuyenteInfo();

    // Procedencia de los animales según la Guía ICA (predio o municipio de origen)
    const partesProcedencia: string[] = [];
    if (this.formRadicacion.predioOrigen.trim()) {
      partesProcedencia.push(this.formRadicacion.predioOrigen.trim());
    }
    if (this.formRadicacion.municipioProcedenciaGanado.trim()) {
      partesProcedencia.push(this.formRadicacion.municipioProcedenciaGanado.trim());
    }
    const procedenciaAnimales = partesProcedencia.join(' - ');

    const payload: Partial<DeclaracionDeguelloData> = {
      anioGravable: this.formRadicacion.anioGravable,
      periodoGravable: this.formRadicacion.periodoGravable,
      esInicial: true,
      esCorreccion: false,
      esReliquidacion: false,
      estadoPago: 'RADICADA',
      razonSocial: emp?.nombre || info?.razonSocial || 'EMPRESA CONTRIBUYENTE',
      nit: emp?.nit || info?.nit || '',
      dv: info?.dv || '9',
      telefonoFijo: emp?.telefono || info?.telefono || '',
      municipio: emp?.municipio || info?.municipio || 'POPAYÁN',
      direccionNotificacion: emp?.direccion || info?.direccion || '',
      plantaBeneficio: emp?.nombre || info?.plantaBeneficio || 'Planta Regional',
      nombreRepresentante: emp?.representanteLegal || info?.representante || '',
      tipoDocRep: 'CC',
      numeroDocRepresentante: emp?.docRepresentante || info?.docRepresentante || '',
      numeroGuiaIca: this.formRadicacion.numeroGuiaIca.trim().toUpperCase(),
      predioOrigen: procedenciaAnimales,
      especie: this.formRadicacion.especie,
      baseGravable: cabezas,
      tarifa: this.tarifaRadicacion(),
      sanciones: 0,
      interesMora: 0,
      rutaArchivoGuiaIca: this.formRadicacion.rutaArchivoGuiaIca,
      nombreArchivoGuiaIca: this.formRadicacion.nombreArchivoGuiaIca,
    };

    this.deguelloService.crearDeclaracion(payload).subscribe({
      next: (creada) => {
        this.radicandoGuia.set(false);
        this.radicadoResultado.set({
          radicado: creada.numeroRadicado || `RAD-${creada.consecutivo}`,
          turno: creada.turnoRevision || 1,
          consecutivo: creada.consecutivo,
        });

        // Insertar en la lista local para reflejo inmediato
        this.declaraciones.update((lista) => [creada, ...lista]);
        this.filtroEstado.set('TODAS');
      },
      error: () => {
        this.radicandoGuia.set(false);
        this.errorRadicacion.set('Ocurrió un error al registrar la radicación en base de datos. Intente nuevamente.');
      }
    });
  }

  // --- RELIQUIDAR DESDE EL PORTAL CIUDADANO (SIN SALIR AL PANEL ADMIN) ---
  reliquidar(d: DeclaracionDeguelloData): void {
    this.abrirModalReliquidar(d);
  }

  abrirModalReliquidar(d: DeclaracionDeguelloData): void {
    this.declaracionParaReliquidar.set(d);
  }

  cerrarModalReliquidar(): void {
    this.declaracionParaReliquidar.set(null);
  }

  confirmarReliquidacion(): void {
    const dec = this.declaracionParaReliquidar();
    if (!dec) return;

    this.reliquidando.set(true);
    const moraEstimada = Math.round(dec.subtotal * 0.05); // Interés de mora conforme al Art. 634 E.T.

    this.deguelloService.reliquidarPorVencimiento(dec.consecutivo, {
      ...dec,
      interesMora: moraEstimada,
    }).subscribe({
      next: (nueva) => {
        this.reliquidando.set(false);
        this.cerrarModalReliquidar();

        // Actualizar en memoria
        this.declaraciones.update((lista) => [
          nueva,
          ...lista.map((item) => item.consecutivo === dec.consecutivo ? { ...item, estadoPago: 'RELIQUIDADA' as const } : item)
        ]);

        const crit = this.criterioBusqueda();
        if (crit) {
          this.recargarDeclaraciones(crit.doc, crit.guia);
        }
      },
      error: () => {
        this.reliquidando.set(false);
      }
    });
  }


  obtenerUrlDescarga(ruta?: string): string {
    return ruta ? this.deguelloFtpService.obtenerUrlDescarga(ruta) : '#';
  }
}
