import { Component, signal, computed, inject, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { 
  ConsultaCiudadanaSharedComponent, 
  ConsultaSubmitPayload,
  TIPOS_DOCUMENTO_OPCIONES
} from '../../../../../shared/components/consulta-ciudadana/consulta-ciudadana-shared';
import { 
  ConsultaRadicadoData, 
  ConsultaRadicadoRequest,
  DocumentoRadicadoDto,
  LiquidacionDocumentoDto,
  VencimientoLiquidacionDto,
  ActoDocumentoDto,
  HistorialRadicadoDto
} from '../../../domain/models/Consultas/consulta-radicado.model';
import { RegistrosConsultaApiService } from '../../../infrastructure/api/Consultas/registros-consulta-api.service';
import { RegistrosPagosApiService } from '../../../infrastructure/api/Pagos/registros-pagos-api.service';
import { ModalPagoPasarelaComponent } from '../../components/modal-pago-pasarela/modal-pago-pasarela';
import { DataMaskingUtil } from '../../../../../shared/utils/data-masking.util';

@Component({
  selector: 'app-registros-portal-ciudadano',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    ConsultaCiudadanaSharedComponent,
    ModalPagoPasarelaComponent
  ],
  templateUrl: './registros-portal-ciudadano.html',
})
export class RegistrosPortalCiudadanoComponent implements OnInit {
  @ViewChild(ConsultaCiudadanaSharedComponent) sharedComponent?: ConsultaCiudadanaSharedComponent;

  private registrosConsultaApi = inject(RegistrosConsultaApiService);
  private registrosPagosApi = inject(RegistrosPagosApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly isConsulted = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly datosProtegidos = signal<boolean>(true);
  readonly tabActivo = signal<'resumen' | 'actos' | 'liquidaciones' | 'historial'>('resumen');

  readonly criterioBusqueda = signal<{ doc: string; radicado: string; tipoDoc: number } | null>(null);
  readonly consultaData = signal<ConsultaRadicadoData | null>(null);

  // Estados de Pagos Pasarela
  readonly modalPagoAbierto = signal<boolean>(false);
  readonly liquidacionSeleccionadaPago = signal<LiquidacionDocumentoDto | null>(null);
  readonly alertaRetornoPago = signal<{ tipo: 'exito' | 'error' | 'info'; mensaje: string } | null>(null);
  readonly verificandoPago = signal<boolean>(false);

  /** Computed helpers */
  readonly solicitud = computed(() => this.consultaData()?.solicitud || null);
  readonly interviniente = computed(() => this.consultaData()?.intervinientePrincipal || null);
  readonly documentos = computed(() => this.consultaData()?.documentos || []);
  readonly historial = computed(() => this.consultaData()?.historial || []);
  readonly pago = computed(() => this.consultaData()?.pago || null);

  readonly todosLosActos = computed<ActoDocumentoDto[]>(() => {
    const docs = this.documentos();
    const acts: ActoDocumentoDto[] = [];
    docs.forEach(d => {
      if (d.actos) {
        acts.push(...d.actos);
      }
    });
    return acts;
  });

  readonly todasLasLiquidaciones = computed<LiquidacionDocumentoDto[]>(() => {
    const docs = this.documentos();
    const liqs: LiquidacionDocumentoDto[] = [];
    docs.forEach(d => {
      if (d.liquidaciones) {
        liqs.push(...d.liquidaciones);
      }
    });
    return liqs;
  });

  readonly liquidacionVigente = computed<LiquidacionDocumentoDto | null>(() => {
    const liqs = this.todasLasLiquidaciones();
    return liqs.find(l => l.esVigente) || (liqs.length > 0 ? liqs[0] : null);
  });

  readonly totalLiquidado = computed<number>(() => {
    return this.todasLasLiquidaciones().reduce((acc, curr) => acc + (Number(curr.valorTotal) || 0), 0);
  });

  readonly totalBaseDeclarada = computed<number>(() => {
    return this.todosLosActos().reduce((acc, curr) => acc + (Number(curr.baseDeclarada) || 0), 0);
  });

  readonly estaPagado = computed<boolean>(() => {
    // 1. Verificar si las liquidaciones asociadas están en estado Pagada
    const liqs = this.todasLasLiquidaciones();
    if (liqs.length > 0) {
      const algunaLiqPagada = liqs.some(l => {
        const nom = (l.estadoLiquidacionNombre || '').toUpperCase();
        return nom.includes('PAG') || nom.includes('CANCEL') || nom.includes('PAZ');
      });
      if (algunaLiqPagada) {
        return true;
      }
    }

    // 2. Verificar si el objeto Pago indica que está acreditado o pagado
    const p = this.pago();
    if (p) {
      const cod = (p.estadoPagoCodigo || '').toUpperCase();
      const nom = (p.estadoPagoNombre || '').toUpperCase();
      if (
        cod.includes('PAG') || cod.includes('APR') || cod.includes('EXITOS') ||
        nom.includes('PAG') || nom.includes('APR') || nom.includes('EXITOS')
      ) {
        return true;
      }
    }

    // 3. Verificar si la Solicitud general tiene estado de pagada / completada / paz y salvo
    const sol = this.solicitud();
    if (sol) {
      const cod = (sol.estadoSolicitudCodigo || '').toUpperCase();
      const nom = (sol.estadoSolicitudNombre || '').toUpperCase();
      if (
        cod.includes('PAG') || cod.includes('COMPLET') || cod.includes('FINALIZ') || cod.includes('PAZ') ||
        nom.includes('PAG') || nom.includes('COMPLET') || nom.includes('FINALIZ') || nom.includes('PAZ')
      ) {
        return true;
      }
    }

    return false;
  });

  readonly estaVencido = computed<boolean>(() => {
    if (this.estaPagado()) return false;
    const liqs = this.todasLasLiquidaciones();
    if (liqs.length === 0) return false;
    return liqs.some(l => 
      l.vencimiento?.estaVencida === true || 
      (l.vencimiento?.semaforo || '').toUpperCase() === 'VENCIDA' ||
      (l.vencimiento?.diasRestantes !== undefined && l.vencimiento.diasRestantes < 0) ||
      (l.estadoLiquidacionNombre || '').toUpperCase().includes('VENCID')
    );
  });

  readonly puedePagar = computed<boolean>(() => {
    if (this.estaPagado()) return false;
    if (this.estaVencido()) return false;
    const vig = this.liquidacionVigente();
    return vig ? vig.esVigente : false;
  });

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const rad = qp.get('radicado');
    const doc = qp.get('doc');
    const ref = qp.get('ref') || qp.get('referencia');
    const estado = qp.get('estado');

    // Auto-consulta si venimos redirigidos con parámetros
    if (rad && doc) {
      this.ejecutarConsulta(rad, doc, 1);
    }

    // Si retornó de la pasarela bancaria
    if (ref && estado === 'retorno') {
      this.verificarRetornoPasarela(ref);
    }
  }

  ejecutarConsulta(radNum: string, docNum: string, tipoDocId: number = 1): void {
    const cleanRad = radNum.trim();
    const cleanDoc = docNum.trim();

    this.isLoading.set(true);
    this.criterioBusqueda.set({
      doc: cleanDoc,
      radicado: cleanRad,
      tipoDoc: tipoDocId
    });

    const request: ConsultaRadicadoRequest = {
      numeroRadicado: cleanRad,
      tipoDocumentoInterviniente: tipoDocId,
      numeroDocumentoInterviniente: cleanDoc
    };

    this.registrosConsultaApi.consultarRadicado(request).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.sharedComponent?.setLoading(false);

        if (!res || !res.success || !res.data) {
          this.sharedComponent?.setErrorMessage(res?.message || 'No se encontró información con el radicado e identificación ingresados.');
          return;
        }

        this.consultaData.set(res.data);
        this.isConsulted.set(true);
        this.tabActivo.set('resumen');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.sharedComponent?.setLoading(false);
        this.sharedComponent?.setErrorMessage(this.obtenerMensajeErrorAmigable(err));
      }
    });
  }

  alConsultar(payload: ConsultaSubmitPayload): void {
    const tipoDocId = Number(payload.tipoDocumento) || 1;
    this.ejecutarConsulta(payload.secondaryValue, payload.numeroDocumento, tipoDocId);
  }

  verificarRetornoPasarela(referencia: string): void {
    this.verificandoPago.set(true);
    this.registrosPagosApi.consultarEstado(referencia).subscribe({
      next: (res) => {
        this.verificandoPago.set(false);
        const st = res.result ?? res.Result;

        if (st?.estaAprobada) {
          this.alertaRetornoPago.set({
            tipo: 'exito',
            mensaje: `¡Pago Aprobado! La entidad bancaria (${st.banco || 'PSE'}) ha confirmado la transacción exitosamente con CUS: ${st.cus || 'N/A'}. Su liquidación se encuentra al día.`
          });
          // Re-consultar para actualizar los datos en pantalla
          const crit = this.criterioBusqueda();
          if (crit) {
            this.ejecutarConsulta(crit.radicado, crit.doc, crit.tipoDoc);
          }
        } else if (st?.estaPendiente) {
          this.alertaRetornoPago.set({
            tipo: 'info',
            mensaje: 'Su transacción se encuentra en proceso de confirmación por la red bancaria (PSE). Puede consultar el estado en unos minutos.'
          });
        } else {
          this.alertaRetornoPago.set({
            tipo: 'error',
            mensaje: `La pasarela no aprobó la transacción: ${st?.mensaje || 'Pago cancelado o rechazado por el banco'}. Puede intentar nuevamente.`
          });
        }
      },
      error: () => {
        this.verificandoPago.set(false);
        this.alertaRetornoPago.set({
          tipo: 'info',
          mensaje: 'Se completó el retorno bancario. Verifique el estado de su radicado o consulte nuevamente en unos instantes.'
        });
      }
    });
  }

  limpiarAlertaRetorno(): void {
    this.alertaRetornoPago.set(null);
  }

  abrirModalPago(liq?: LiquidacionDocumentoDto): void {
    const objetivo = liq || this.liquidacionVigente();
    if (!objetivo) return;
    this.liquidacionSeleccionadaPago.set(objetivo);
    this.modalPagoAbierto.set(true);
  }

  cerrarModalPago(): void {
    this.modalPagoAbierto.set(false);
    this.liquidacionSeleccionadaPago.set(null);
  }

  toggleProteccionDatos(): void {
    this.datosProtegidos.set(!this.datosProtegidos());
  }

  getNombreIntervinienteDisplay(): string {
    const nom = this.interviniente()?.nombre;
    if (!nom) return 'No registrado';
    return this.datosProtegidos() ? DataMaskingUtil.maskNombre(nom) : nom;
  }

  getDocumentoIntervinienteDisplay(): string {
    const doc = this.interviniente()?.numeroIdentificacion;
    if (!doc) return 'No registrado';
    return this.datosProtegidos() ? DataMaskingUtil.maskDocumento(doc) : doc;
  }

  getTelefonoIntervinienteDisplay(): string {
    const tel = this.interviniente()?.telefono;
    if (!tel) return 'No registrado';
    return this.datosProtegidos() ? DataMaskingUtil.maskTelefono(tel) : tel;
  }

  getEmailIntervinienteDisplay(): string {
    const email = this.interviniente()?.email;
    if (!email) return 'No registrado';
    return this.datosProtegidos() ? DataMaskingUtil.maskEmail(email) : email;
  }

  getDireccionIntervinienteDisplay(): string {
    const dir = this.interviniente()?.direccion;
    if (!dir) return 'No registrada';
    return this.datosProtegidos() ? DataMaskingUtil.maskDireccion(dir) : dir;
  }

  private obtenerMensajeErrorAmigable(err: any): string {
    if (err?.error && typeof err.error === 'object' && typeof err.error.message === 'string' && err.error.message.trim() !== '') {
      const msg = err.error.message.trim();
      if (!msg.includes('http://') && !msg.includes('https://') && !msg.includes('localhost:')) {
        return msg;
      }
    }

    if (err?.error && typeof err.error === 'string' && !err.error.includes('<') && !err.error.includes('http') && err.error.length < 200) {
      return err.error.trim();
    }

    const status = err?.status;
    if (status === 404) {
      return 'No se encontró ningún radicado asociado a los datos ingresados. Por favor verifique el número de radicado y su número de documento.';
    }
    if (status === 400) {
      return 'Los datos ingresados no tienen el formato correcto. Por favor verifique la información e intente de nuevo.';
    }
    if (status === 0 || status === 503 || status === 504) {
      return 'No fue posible establecer conexión con el servidor en este momento. Por favor intente nuevamente en unos minutos.';
    }
    if (status === 500) {
      return 'Ocurrió un inconveniente al procesar la consulta. Por favor intente nuevamente más tarde.';
    }

    return 'No se encontró ningún radicado con los datos suministrados. Por favor verifique el número de radicado y su documento.';
  }

  getDiasAbs(dias?: number | null): number {
    return Math.abs(dias || 0);
  }

  setTab(tab: 'resumen' | 'actos' | 'liquidaciones' | 'historial'): void {
    this.tabActivo.set(tab);
  }

  nuevaConsulta(): void {
    this.isConsulted.set(false);
    this.consultaData.set(null);
    this.criterioBusqueda.set(null);
    this.tabActivo.set('resumen');
    this.alertaRetornoPago.set(null);
  }

  salir(): void {
    this.router.navigate(['/']);
  }

  getBadgeClassEstadoSolicitud(codigo?: string): string {
    const cod = (codigo || '').toUpperCase();
    if (cod.includes('PAG') || cod.includes('COMPL') || cod.includes('FINAL')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (cod.includes('LIQ')) {
      return 'bg-blue-100 text-[#0f4984] border-blue-300';
    }
    if (cod.includes('RAD') || cod.includes('REV') || cod.includes('PEND')) {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    if (cod.includes('RECH') || cod.includes('ANUL') || cod.includes('DEV')) {
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }
    return 'bg-slate-100 text-slate-800 border-slate-300';
  }

  imprimirConstancia(): void {
    window.print();
  }
}
