// Autor: Juan Sebastián Montaño Pérez
// Fecha: 01/10/2026
// Módulo: Portal Ciudadano / Detalle Pago
// Descripción: Modal de confirmación y ejecución del pago vía pasarela. Redirige al URL retornado por la API.

import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidacionCiudadano, PropietarioCiudadano } from '../../../../domain/interfaces/consulta-vehicular.interface';
import { PagosApiService } from '../../../../infrastructure/api/pagos-api.service';

@Component({
  selector: 'app-portal-ciudadano-detalle-pago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portal-ciudadano-detalle-pago.html'
})
export class PortalCiudadanoDetallePago {
  @Input() liquidacion: LiquidacionCiudadano | null = null;
  @Input() propietario: PropietarioCiudadano | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() pagar = new EventEmitter<void>();

  private pagosApi = inject(PagosApiService);

  readonly cargando = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);

  cerrarModal(): void {
    if (this.cargando()) return;
    this.cerrar.emit();
  }

  confirmarPago(): void {
    if (!this.liquidacion || this.cargando()) return;

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const request = {
      // liquidacionId e identidad del ciudadano vienen de la sesión — nunca del input del usuario
      liquidacionId: this.liquidacion.liquidacionId,
      placa: this.liquidacion.placa,
      documento: this.propietario?.documento ?? '',
      email: this.propietario?.email ?? undefined,
      telefono: this.propietario?.telefono ?? undefined,
      urlRetorno: `${window.location.origin}/automotores/portal-ciudadano`
    };

    this.pagosApi.iniciarPago(request).subscribe({
      next: (res) => {
        const exitoso = res.isSuccess ?? res.IsSuccess ?? false;
        const resultado = res.result ?? res.Result;

        if (!exitoso || !resultado) {
          this.cargando.set(false);
          const msg = res.message ?? res.Message ?? 'No fue posible iniciar el proceso de pago. Intente nuevamente.';
          this.errorMensaje.set(msg);
          return;
        }

        const urlPasarela = resultado.urlPagoEfectiva 
          ?? resultado.url 
          ?? resultado.Url 
          ?? resultado.urlBanco 
          ?? resultado.UrlBanco;

        if (urlPasarela) {
          // Redirigir directamente al portal de pagos PSE / Pasarela 1cero1
          window.location.href = urlPasarela;
        } else {
          this.cargando.set(false);
          this.errorMensaje.set('La pasarela no retornó una URL de pago válida. Contacte al administrador.');
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(
          err?.error?.message ?? err?.error?.Message ?? err?.message ?? 'Error de conexión con el servidor de pagos.'
        );
      }
    });
  }
}
