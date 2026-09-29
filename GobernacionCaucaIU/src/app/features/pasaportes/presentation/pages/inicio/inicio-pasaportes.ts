import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { InformacionPersonalForm } from '../../components/informacion-personal-form/informacion-personal-form';
import { InformacionContactoForm } from '../../components/informacion-contacto-form/informacion-contacto-form';
import { AgendamientoForm } from '../../components/agendamiento-form/agendamiento-form';
import { ConfirmacionLiquidacion } from '../../components/confirmacion-liquidacion/confirmacion-liquidacion';

import { FlujoPasaporteDemoService } from '../../../application/demo/flujo-pasaporte-demo.service';
import { LiquidacionPasaporteDemoService } from '../../../application/demo/liquidacion-pasaporte-demo.service';

import { TipoPasaporte } from '../../../domain/models/agendamiento.model';
import {
  CalculoPasaporteDemo,
  CitaDemo,
} from '../../../domain/models/flujo-pasaporte-demo.model';
import { LiquidacionPasaporteDemo } from '../../../domain/models/liquidacion-pasaporte-demo.model';

const coinciden =
  (a: string, b: string) =>
  (grupo: AbstractControl) =>
    grupo.get(a)?.value === grupo.get(b)?.value
      ? null
      : { noCoinciden: true };

@Component({
  selector: 'app-inicio-pasaportes',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InformacionPersonalForm,
    InformacionContactoForm,
    AgendamientoForm,
    ConfirmacionLiquidacion,
  ],
  templateUrl: './inicio-pasaportes.html',
})
export class InicioPasaportes {
  private readonly demo = inject(FlujoPasaporteDemoService);
  private readonly pdf = inject(LiquidacionPasaporteDemoService);

  readonly configuracion = this.demo.obtenerConfiguracion();
  readonly tipos = this.demo.obtenerTiposPasaporte();

  readonly pasoActual = signal<1 | 2 | 3 | 4 | 5>(1);
  readonly tipo = signal<TipoPasaporte | null>(null);
  readonly calculo = signal<CalculoPasaporteDemo | null>(null);
  readonly cita = signal<CitaDemo | null>(null);
  readonly citaRecuperada = signal(false);

  readonly fecha = signal<string | null>(null);
  readonly hora = signal<string | null>(null);

  readonly pasarelaAbierta = signal(false);
  readonly procesando = signal(false);
  readonly error = signal<string | null>(null);

  readonly soporte = signal<LiquidacionPasaporteDemo | null>(null);
  readonly generandoPdf = signal(false);
  readonly mensajeCorreo = signal(false);

  readonly formularioPersonal = new FormGroup(
    {
      primerNombre: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      segundoNombre: new FormControl('', {
        nonNullable: true,
      }),
      primerApellido: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      segundoApellido: new FormControl('', {
        nonNullable: true,
      }),
      tipoDocumento: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      numeroDocumento: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^\d+$/)],
      }),
      confirmarDocumento: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      genero: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      grupoEtnico: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      discapacidad: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      fechaNacimiento: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      nombreResponsable: new FormControl('', {
        nonNullable: true,
      }),
      documentoResponsable: new FormControl('', {
        nonNullable: true,
      }),
      confirmarDocumentoResponsable: new FormControl('', {
        nonNullable: true,
      }),
      aceptoLey: new FormControl(false, {
        nonNullable: true,
        validators: [Validators.requiredTrue],
      }),
    },
    {
      validators: coinciden('numeroDocumento', 'confirmarDocumento'),
    },
  );

  readonly formularioContacto = new FormGroup(
    {
      telefono: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/^\d{10}$/),
        ],
      }),
      confirmarTelefono: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      correo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      confirmarCorreo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      departamento: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      municipio: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    {
      validators: [
        coinciden('telefono', 'confirmarTelefono'),
        coinciden('correo', 'confirmarCorreo'),
      ],
    },
  );

  irAContacto(): void {
    if (this.formularioPersonal.valid && this.responsableValido()) {
      const pendiente = this.demo.recuperarCitaPendiente(
        this.formularioPersonal.controls.numeroDocumento.value,
      );

      this.citaRecuperada.set(!!pendiente);

      if (pendiente) {
        this.cita.set(pendiente);
        this.tipo.set(pendiente.tipoPasaporte);
        this.calculo.set(pendiente.calculo);
      }

      this.pasoActual.set(2);
      return;
    }

    this.formularioPersonal.markAllAsTouched();
  }

  continuarATramite(): void {
    if (this.formularioContacto.valid) {
      this.pasoActual.set(this.cita() ? 4 : 3);
      return;
    }

    this.formularioContacto.markAllAsTouched();
  }

  seleccionarTipo(event: Event): void {
    const id = Number(
      (event.target as HTMLSelectElement).value,
    );

    this.tipo.set(
      this.tipos.find((t) => t.id === id) ?? null,
    );

    this.calculo.set(null);
    this.cita.set(null);
    this.error.set(null);

    if (this.tipo()) {
      this.calculo.set(
        this.demo.calcularLiquidacion(
          this.tipo()!,
          {
            documento:
              this.formularioPersonal.controls.numeroDocumento.value,
          },
        ),
      );
    }
  }

  continuarAPago(): void {
    if (!this.calculo()) {
      return;
    }

    this.error.set(null);

    if (this.configuracion.pagoWebHabilitado) {
      this.pasarelaAbierta.set(true);
      return;
    }

    this.cita.set(
      this.demo.continuarSinPago(this.calculo()!),
    );

    this.pasoActual.set(4);
  }

  aprobarPago(): void {
    if (!this.calculo() || this.procesando()) {
      return;
    }

    this.procesando.set(true);

    window.setTimeout(() => {
      this.cita.set(
        this.demo.simularPago(this.calculo()!),
      );

      this.pasarelaAbierta.set(false);
      this.procesando.set(false);
      this.pasoActual.set(4);
    }, 450);
  }

  seleccionarFecha(fecha: string): void {
    this.fecha.set(fecha);
    this.hora.set(null);
    this.error.set(null);
  }

  programar(): void {
    const cita = this.cita();
    const fecha = this.fecha();
    const hora = this.hora();

    if (!cita || !fecha || !hora) {
      return;
    }

    try {
      const programada =
        this.demo.programarCita(
          cita,
          fecha,
          hora,
        );

      this.cita.set(programada);

      const personal =
        this.formularioPersonal.getRawValue();

      const ciudadano = [
        personal.primerNombre,
        personal.segundoNombre,
        personal.primerApellido,
        personal.segundoApellido,
      ]
        .filter(Boolean)
        .join(' ');

      this.soporte.set(
        this.pdf.crearLiquidacion({
          consecutivo: programada.consecutivo,
          referenciaPago:
            programada.referenciaPago,
          pagoAprobado:
            programada.pagoAprobado,
          tipoPasaporte:
            programada.tipoPasaporte,
          ciudadano,
          documento:
            personal.numeroDocumento,
          fechaCita: fecha,
          horario: hora,

          // Se envía exactamente el cálculo
          // que ya vio el ciudadano.
          conceptos:
            programada.calculo.conceptos,
          totalLiquidado:
            programada.calculo.total,
          primerPago:
            programada.calculo.primerPago,
          saldoPendiente:
            programada.calculo.saldo,
        }),
      );

      this.error.set(null);
      this.pasoActual.set(5);
    } catch (e) {
      this.error.set(
        (e as Error).message,
      );
      this.hora.set(null);
    }
  }

  async descargar(): Promise<void> {
    const soporte = this.soporte();

    if (
      !soporte ||
      this.generandoPdf()
    ) {
      return;
    }

    this.generandoPdf.set(true);
    this.error.set(null);

    try {
      const blob =
        await this.pdf.generarPdf(
          soporte,
        );

      const url =
        URL.createObjectURL(blob);

      const enlace =
        document.createElement('a');

      enlace.href = url;

      enlace.download =
        `liquidacion-pasaporte-${soporte.referenciaPago}.pdf`;

      document.body.appendChild(enlace);

      enlace.click();
      enlace.remove();

      window.setTimeout(
        () => URL.revokeObjectURL(url),
        1000,
      );
    } catch (e) {
      console.error(
        'Error generando la factura/liquidación de pasaporte:',
        e,
      );

      this.error.set(
        'No fue posible generar el soporte. Intente de nuevo.',
      );
    } finally {
      this.generandoPdf.set(false);
    }
  }

finalizar(): void {
  this.formularioPersonal.reset();
  this.formularioContacto.reset();

  this.tipo.set(null);
  this.calculo.set(null);
  this.cita.set(null);
  this.citaRecuperada.set(false);

  this.fecha.set(null);
  this.hora.set(null);

  this.pasarelaAbierta.set(false);
  this.procesando.set(false);

  this.soporte.set(null);
  this.generandoPdf.set(false);

  this.error.set(null);
  this.mensajeCorreo.set(false);

  this.pasoActual.set(1);

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}
  moneda(valor: number): string {
    return valor.toLocaleString(
      'es-CO',
      {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      },
    );
  }

  private responsableValido(): boolean {
    const p =
      this.formularioPersonal.getRawValue();

    const nacimiento = new Date(
      `${p.fechaNacimiento}T00:00:00`,
    );

    const hoy = new Date();

    let edad =
      hoy.getFullYear() -
      nacimiento.getFullYear();

    if (
      hoy.getMonth() <
        nacimiento.getMonth() ||
      (hoy.getMonth() ===
        nacimiento.getMonth() &&
        hoy.getDate() <
          nacimiento.getDate())
    ) {
      edad--;
    }

    return (
      edad >= 18 ||
      !!(
        p.nombreResponsable.trim() &&
        p.documentoResponsable.trim() &&
        p.documentoResponsable ===
          p.confirmarDocumentoResponsable
      )
    );
  }
}