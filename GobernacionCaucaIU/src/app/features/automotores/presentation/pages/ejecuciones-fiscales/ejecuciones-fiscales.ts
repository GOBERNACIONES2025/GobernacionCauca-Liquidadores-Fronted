import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EjecucionesFiscalesFacade } from '../../../application/facades/ejecuciones-fiscales.facade';
import {
  ExpedienteCobroCoactivo,
  TabEjecucionesFiscales,
  RegistrarNotificacionMandamientoRequest,
  DecretarMedidaCautelarRequest,
  RegistrarAutoCierreRequest
} from '../../../domain/models/ejecuciones-fiscales.model';

@Component({
  selector: 'app-ejecuciones-fiscales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ejecuciones-fiscales.html',
})
export class EjecucionesFiscalesPage implements OnInit {
  readonly facade = inject(EjecucionesFiscalesFacade);
  private route = inject(ActivatedRoute);

  // Filtros de búsqueda
  textoBuscar = '';

  // Formulario Modal Mandamiento
  formAbogadoMandamiento = 'Abg. Carlos Alberto Medina';
  formObservacionesMandamiento = '';

  // Formulario Modal Notificación
  formTipoNotificacion = 'CORREO_472';
  formNumeroGuia = '';
  formEmpresaEnvio = 'Servicios Postales Nacionales 4-72';
  formFechaEnvio = new Date().toISOString().split('T')[0];
  formFechaEntrega = new Date().toISOString().split('T')[0];
  formEstadoPostal = 'ENTREGADO';
  formPublicadoAvisoWeb = false;
  formFechaPublicacionWeb = '';
  formFechaDesfijacionWeb = '';
  formObservacionesNotificacion = '';

  // Formulario Modal Constancia Ejecutoria
  formObservacionesConstancia = 'Vencido el término de 15 días hábiles sin acreditación de pago ni interposición de excepciones.';

  // Formulario Modal Medidas Cautelares
  formTipoMedida = 'EMBARGO_BANCARIO';
  bancosSeleccionados: { [key: string]: boolean } = {
    'Bancolombia S.A.': true,
    'Banco de Bogotá S.A.': true,
    'Banco Davivienda S.A.': true,
    'Banco BBVA Colombia S.A.': false,
    'Banco Agrario de Colombia': true,
    'Banco Popular S.A.': false,
    'Banco de Occidente': false,
    'Banco AV Villas': false
  };
  formEntidadTransito = 'Secretaría de Tránsito y Transporte de Popayán';
  formLimiteCuantia = 0;
  formObservacionesMedidas = '';

  // Formulario Modal Auto de Cierre
  formFechaPago = new Date().toISOString().split('T')[0];
  formNumeroReciboPago = '';
  formValorPagado = 0;
  formMotivoCierre = 'PAGO_TOTAL_OBLIGACION';
  formObservacionesCierre = 'Pago total acreditado mediante comprobante de recaudo oficial.';

  ngOnInit(): void {
    const placaParam = this.route.snapshot.queryParamMap.get('placa');
    if (placaParam) {
      this.textoBuscar = placaParam.toUpperCase();
      this.facade.buscar.set(this.textoBuscar);
    }
    this.facade.cargarExpedientes();
    this.facade.cargarKpis();
  }

  onSelectTab(tab: TabEjecucionesFiscales): void {
    this.facade.cambiarTab(tab);
  }

  onBuscar(): void {
    this.facade.buscarTexto(this.textoBuscar);
  }

  onBuscarKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onBuscar();
    }
  }

  onLimpiarBusqueda(): void {
    this.textoBuscar = '';
    this.facade.buscarTexto('');
  }

  // ── Acciones Modales ──

  abrirMandamiento(exp: ExpedienteCobroCoactivo): void {
    this.formAbogadoMandamiento = exp.abogadoAsignado || 'Abg. Carlos Alberto Medina';
    this.formObservacionesMandamiento = '';
    this.facade.abrirModalMandamiento(exp);
  }

  confirmarMandamiento(): void {
    this.facade.confirmarLibrarMandamiento(this.formAbogadoMandamiento, this.formObservacionesMandamiento);
  }

  abrirNotificacion(exp: ExpedienteCobroCoactivo): void {
    this.formTipoNotificacion = 'CORREO_472';
    this.formNumeroGuia = exp.numeroGuiaPostal || '';
    this.formEmpresaEnvio = exp.empresaEnvio || 'Servicios Postales Nacionales 4-72';
    this.formFechaEnvio = exp.fechaEnvioPostal || new Date().toISOString().split('T')[0];
    this.formFechaEntrega = exp.fechaEntregaNotificacion || new Date().toISOString().split('T')[0];
    this.formEstadoPostal = exp.estadoPostal || 'ENTREGADO';
    this.formPublicadoAvisoWeb = exp.publicadoAvisoWeb;
    this.formFechaPublicacionWeb = exp.fechaPublicacionWeb || '';
    this.formFechaDesfijacionWeb = exp.fechaDesfijacionWeb || '';
    this.formObservacionesNotificacion = '';
    this.facade.abrirModalNotificacion(exp);
  }

  confirmarNotificacion(): void {
    const req: RegistrarNotificacionMandamientoRequest = {
      tipoNotificacion: this.formTipoNotificacion,
      numeroGuiaPostal: this.formNumeroGuia,
      empresaEnvio: this.formEmpresaEnvio,
      fechaEnvioPostal: this.formFechaEnvio || undefined,
      fechaEntregaNotificacion: this.formFechaEntrega || undefined,
      estadoPostal: this.formEstadoPostal,
      publicadoAvisoWeb: this.formPublicadoAvisoWeb,
      fechaPublicacionWeb: this.formFechaPublicacionWeb || undefined,
      fechaDesfijacionWeb: this.formFechaDesfijacionWeb || undefined,
      observacionesNotificacion: this.formObservacionesNotificacion,
      usuario: 'FUNCIONARIO'
    };
    this.facade.confirmarNotificacion(req);
  }

  abrirConstancia(exp: ExpedienteCobroCoactivo): void {
    this.formObservacionesConstancia = 'Vencido el término de 15 días hábiles sin acreditación de pago ni interposición de excepciones.';
    this.facade.abrirModalConstancia(exp);
  }

  confirmarConstancia(): void {
    this.facade.confirmarConstancia(this.formObservacionesConstancia);
  }

  abrirMedidas(exp: ExpedienteCobroCoactivo): void {
    this.formTipoMedida = 'EMBARGO_BANCARIO';
    this.formLimiteCuantia = exp.totalDeuda * 2;
    this.formObservacionesMedidas = '';
    this.facade.abrirModalMedidas(exp);
  }

  confirmarMedidas(): void {
    let entidades: string[] = [];
    if (this.formTipoMedida === 'EMBARGO_BANCARIO') {
      entidades = Object.keys(this.bancosSeleccionados).filter(k => this.bancosSeleccionados[k]);
      if (entidades.length === 0) {
        entidades = ['Bancolombia S.A.', 'Banco de Bogotá S.A.'];
      }
    } else {
      entidades = [this.formEntidadTransito, 'Policía Nacional de Carreteras - Seccional Cauca'];
    }

    const req: DecretarMedidaCautelarRequest = {
      tipoMedida: this.formTipoMedida,
      entidadesDestino: entidades,
      limiteCuantiaEmbargo: this.formLimiteCuantia,
      observaciones: this.formObservacionesMedidas,
      usuario: 'FUNCIONARIO'
    };
    this.facade.confirmarMedidas(req);
  }

  levantarMedida(medidaId: number): void {
    if (confirm('¿Está seguro de levantar esta medida cautelar (Desembargo)?')) {
      this.facade.levantarMedida(medidaId, 'LEVANTAMIENTO_POR_PAGO');
    }
  }

  abrirAutoCierre(exp: ExpedienteCobroCoactivo): void {
    this.formFechaPago = new Date().toISOString().split('T')[0];
    this.formNumeroReciboPago = '';
    this.formValorPagado = exp.totalDeuda;
    this.formObservacionesCierre = 'Pago total acreditado mediante recibo oficial.';
    this.facade.abrirModalAutoCierre(exp);
  }

  confirmarAutoCierre(): void {
    const req: RegistrarAutoCierreRequest = {
      fechaPagoTotal: this.formFechaPago,
      numeroReciboPago: this.formNumeroReciboPago || `REC-${Date.now().toString().slice(-6)}`,
      valorPagado: this.formValorPagado,
      motivoTerminacion: this.formMotivoCierre,
      observaciones: this.formObservacionesCierre,
      usuario: 'FUNCIONARIO'
    };
    this.facade.confirmarAutoCierre(req);
  }
}
