import { Component, OnDestroy, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { LiquidacionPasaporteDemoService, VALOR_LIQUIDACION_DEMO } from '../../../application/demo/liquidacion-pasaporte-demo.service';
import { IntervaloDisponible, TipoPasaporte } from '../../../domain/models/agendamiento.model';
import { LiquidacionPasaporteDemo } from '../../../domain/models/liquidacion-pasaporte-demo.model';

@Component({
  selector: 'app-confirmacion-liquidacion',
  standalone: true,
  templateUrl: './confirmacion-liquidacion.html',
})
export class ConfirmacionLiquidacion implements OnDestroy {
  private readonly demo = inject(LiquidacionPasaporteDemoService);
  private readonly sanitizer = inject(DomSanitizer);
  private pdfObjectUrl: string | null = null;

  readonly formularioPersonal = input.required<FormGroup>();
  readonly formularioContacto = input.required<FormGroup>();
  readonly tipoPasaporte = input.required<TipoPasaporte>();
  readonly fecha = input.required<string>();
  readonly intervalo = input.required<IntervaloDisponible>();
  readonly liquidacion = input<LiquidacionPasaporteDemo | null>(null);
  readonly procesando = input(false);
  readonly error = input<string | null>(null);
  readonly errorPdf = input<string | null>(null);
  readonly generandoPdf = input(false);
  readonly pdfBlob = input<Blob | null>(null);

  readonly anterior = output<void>();
  readonly editarPersonal = output<void>();
  readonly editarContacto = output<void>();
  readonly cambiarAgendamiento = output<void>();
  readonly confirmar = output<void>();
  readonly reintentarPdf = output<void>();
  readonly descargar = output<void>();

  readonly valorDemo = VALOR_LIQUIDACION_DEMO;
  readonly pdfUrl = signal<SafeResourceUrl | null>(null);
  readonly barcodeSvg = computed<SafeHtml>(() => {
    const resultado = this.liquidacion();
    return resultado
      ? this.sanitizer.bypassSecurityTrustHtml(this.demo.codigoBarrasSvg(resultado.referenciaPago))
      : '';
  });

  private readonly sincronizarPdf = effect(() => {
    const blob = this.pdfBlob();
    this.liberarPdfUrl();

    if (!blob) {
      this.pdfUrl.set(null);
      return;
    }

    this.pdfObjectUrl = URL.createObjectURL(blob);
    this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl));
  });

  ngOnDestroy(): void {
    this.liberarPdfUrl();
  }

  nombreCompleto(): string {
    const personal = this.formularioPersonal().getRawValue();
    return [
      personal.primerNombre,
      personal.segundoNombre,
      personal.primerApellido,
      personal.segundoApellido,
    ].filter(Boolean).join(' ');
  }

  tipoDocumento(): string {
    const id = Number(this.formularioPersonal().controls['tipoDocumento'].value);
    return ({
      1: 'Cédula de ciudadanía',
      2: 'Registro Civil',
      3: 'Tarjeta de identidad',
    } as Record<number, string>)[id] ?? 'No especificado';
  }

  fechaVisible(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-');
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha;
  }

  horario(): string {
    const intervalo = this.intervalo();
    return `${intervalo.horaInicio.slice(0, 5)} - ${intervalo.horaFin.slice(0, 5)}`;
  }

  valorVisible(): string {
    const valor = this.liquidacion()?.valor ?? this.valorDemo;
    return valor.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }

  private liberarPdfUrl(): void {
    if (!this.pdfObjectUrl) return;
    URL.revokeObjectURL(this.pdfObjectUrl);
    this.pdfObjectUrl = null;
  }
}
