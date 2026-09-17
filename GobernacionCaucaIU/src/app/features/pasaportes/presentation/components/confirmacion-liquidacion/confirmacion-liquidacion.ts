import { Component, input, output } from '@angular/core';
import { CitaDemo } from '../../../domain/models/flujo-pasaporte-demo.model';
import { LiquidacionPasaporteDemo } from '../../../domain/models/liquidacion-pasaporte-demo.model';

@Component({ selector: 'app-confirmacion-liquidacion', standalone: true, templateUrl: './confirmacion-liquidacion.html' })
export class ConfirmacionLiquidacion {
  readonly cita = input.required<CitaDemo>();
  readonly soporte = input.required<LiquidacionPasaporteDemo>();
  readonly generandoPdf = input(false);
  readonly error = input<string | null>(null);
  readonly mensajeCorreo = input(false);
  readonly descargar = output<void>();
  readonly enviarCorreo = output<void>();
  readonly finalizar = output<void>();
}
