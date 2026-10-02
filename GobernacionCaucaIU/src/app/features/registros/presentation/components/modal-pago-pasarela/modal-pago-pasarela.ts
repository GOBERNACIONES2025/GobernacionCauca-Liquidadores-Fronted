// Autor: Juan Sebastián Montaño Pérez
// Fecha: 02/10/2026
// Módulo: Impuesto de Registro - Pagos en Línea
// Descripción: Modal interactivo para la confirmación de datos y redirección segura a la pasarela Fintech / PSE.

import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LiquidacionDocumentoDto, 
  SolicitudRadicadoDto, 
  IntervinientePrincipalDto 
} from '../../../domain/models/Consultas/consulta-radicado.model';
import { RegistrosPagosApiService } from '../../../infrastructure/api/Pagos/registros-pagos-api.service';
import { IniciarPagoRegistrosRequest } from '../../../domain/models/Pagos/pago-pasarela.model';

@Component({
  selector: 'app-modal-pago-pasarela',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-pago-pasarela.html'
})
export class ModalPagoPasarelaComponent implements OnInit {
  @Input({ required: true }) liquidacion!: LiquidacionDocumentoDto;
  @Input({ required: true }) solicitud!: SolicitudRadicadoDto;
  @Input() contribuyente: IntervinientePrincipalDto | null = null;
  @Input() documentoConsultado: string = '';

  @Output() cerrar = new EventEmitter<void>();

  private pagosApi = inject(RegistrosPagosApiService);

  readonly emailContacto = signal<string>('');
  readonly telefonoContacto = signal<string>('');
  readonly aceptaTerminos = signal<boolean>(true);

  readonly cargando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);

  ngOnInit(): void {
    if (this.contribuyente?.email && this.contribuyente.email.includes('@')) {
      this.emailContacto.set(this.contribuyente.email);
    }
    if (this.contribuyente?.telefono) {
      this.telefonoContacto.set(this.contribuyente.telefono);
    }
  }

  get valorTotalDisplay(): number {
    return Number(this.liquidacion?.valorTotal) || 0;
  }

  get emailValido(): boolean {
    const email = this.emailContacto().trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  get telefonoValido(): boolean {
    const tel = this.telefonoContacto().trim();
    return tel.length >= 7;
  }

  get formularioValido(): boolean {
    return this.emailValido && this.telefonoValido && this.aceptaTerminos();
  }

  cerrarModal(): void {
    if (this.cargando()) return;
    this.cerrar.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cerrarModal();
    }
  }

  confirmarPago(): void {
    if (!this.formularioValido || this.cargando()) return;

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const docEfectivo = (this.documentoConsultado || this.contribuyente?.numeroIdentificacion || '').trim();
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/registros/portal-ciudadano';

    const urlRetorno = `${currentOrigin}${currentPath}?radicado=${encodeURIComponent(this.solicitud.numeroRadicado)}&doc=${encodeURIComponent(docEfectivo)}&ref=${encodeURIComponent(this.liquidacion.numeroLiquidacion)}&estado=retorno`;

    const request: IniciarPagoRegistrosRequest = {
      liquidacionId: 0,
      numeroLiquidacion: this.liquidacion.numeroLiquidacion,
      numeroRadicado: this.solicitud.numeroRadicado,
      numeroDocumento: docEfectivo,
      email: this.emailContacto().trim(),
      telefono: this.telefonoContacto().trim(),
      urlRetorno
    };

    this.pagosApi.iniciarPago(request).subscribe({
      next: (res) => {
        const exitoso = res.isSuccess ?? res.IsSuccess ?? false;
        const resultado = res.result ?? res.Result;

        if (!exitoso || !resultado) {
          this.cargando.set(false);
          const msg = res.message ?? res.Message ?? 'No fue posible conectar con la pasarela de pagos. Por favor intente nuevamente en unos minutos.';
          this.errorMensaje.set(msg);
          return;
        }

        const urlPasarela = resultado.urlPagoEfectiva 
          ?? resultado.url 
          ?? resultado.Url 
          ?? resultado.urlBanco 
          ?? resultado.UrlBanco;

        if (urlPasarela) {
          // Redirigir al contribuyente a la pasarela bancaria oficial
          window.location.href = urlPasarela;
        } else {
          this.cargando.set(false);
          this.errorMensaje.set('La pasarela no retornó una dirección de pago válida. Por favor contacte a la Secretaría de Hacienda.');
        }
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err?.error?.message 
          ?? err?.error?.Message 
          ?? err?.message 
          ?? 'Ocurrió un error de comunicación con el servicio de pagos. Verifique su conexión e intente nuevamente.';
        this.errorMensaje.set(msg);
      }
    });
  }
}
