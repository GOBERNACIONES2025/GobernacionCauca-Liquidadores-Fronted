import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InformacionPersonalForm } from '../../components/informacion-personal-form/informacion-personal-form';
import { InformacionContactoForm } from '../../components/informacion-contacto-form/informacion-contacto-form';
import { AgendamientoForm } from '../../components/agendamiento-form/agendamiento-form';
import { ConfirmacionLiquidacion } from '../../components/confirmacion-liquidacion/confirmacion-liquidacion';
import { IntervaloDisponible, TipoPasaporte } from '../../../domain/models/agendamiento.model';
import { TIPO_CITA_GENERAL } from '../../../domain/constants/agendamiento.constants';
import { CrearCitaRequest } from '../../../domain/models/crear-cita.model';
import { PasaportesApiService } from '../../../infrastructure/api/pasaportes-api.service';
import { LiquidacionPasaporteDemo } from '../../../domain/models/liquidacion-pasaporte-demo.model';
import { LiquidacionPasaporteDemoService } from '../../../application/demo/liquidacion-pasaporte-demo.service';

const camposCoinciden = (campo: string, confirmacion: string) => (group: AbstractControl) => {
  const valor = group.get(campo)?.value;
  const confirmacionValor = group.get(confirmacion)?.value;
  return valor === confirmacionValor ? null : { camposNoCoinciden: true };
};

@Component({
  selector: 'app-inicio-pasaportes',
  standalone: true,
  imports: [ReactiveFormsModule, InformacionPersonalForm, InformacionContactoForm, AgendamientoForm, ConfirmacionLiquidacion],
  templateUrl: './inicio-pasaportes.html',
})
export class InicioPasaportes {
  private readonly api = inject(PasaportesApiService);
  private readonly liquidacionDemo = inject(LiquidacionPasaporteDemoService);


  readonly tipoCita = TIPO_CITA_GENERAL;
  readonly pasoActual = signal<1 | 2 | 3 | 4>(1);
  readonly datosCompletos = signal(false);
  readonly tipoPasaporteSeleccionado = signal<TipoPasaporte | null>(null);
  readonly fechaSeleccionada = signal<string | null>(null);
  readonly intervaloSeleccionado = signal<IntervaloDisponible | null>(null);
  readonly creandoCita = signal(false);
  readonly consecutivoCita = signal<number | null>(null);
  readonly errorCreacionCita = signal<string | null>(null);
  readonly liquidacion = signal<LiquidacionPasaporteDemo | null>(null);
  readonly pdfBlob = signal<Blob | null>(null);
  readonly generandoPdf = signal(false);
  readonly errorPdf = signal<string | null>(null);

  readonly formularioPersonal = new FormGroup(
    {
      primerNombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      segundoNombre: new FormControl('', { nonNullable: true }),
      primerApellido: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      segundoApellido: new FormControl('', { nonNullable: true }),
      tipoDocumento: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      numeroDocumento: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d+$/)] }),
      confirmarDocumento: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      genero: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      grupoEtnico: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      discapacidad: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      fechaNacimiento: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      nombreResponsable: new FormControl('', { nonNullable: true }),
      documentoResponsable: new FormControl('', { nonNullable: true }),
      confirmarDocumentoResponsable: new FormControl('', { nonNullable: true }),
      aceptoLey: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
    },
    { validators: camposCoinciden('numeroDocumento', 'confirmarDocumento') },
  );

  readonly formularioContacto = new FormGroup(
    {
      telefono: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{10}$/)] }),
      confirmarTelefono: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      correo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[\w.-]+@[\w.-]+\.\w{2,}$/)] }),
      confirmarCorreo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      departamento: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      municipio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    {
      validators: [
        camposCoinciden('telefono', 'confirmarTelefono'),
        camposCoinciden('correo', 'confirmarCorreo'),
      ],
    },
  );

  irAContacto(): void {
    if (this.formularioPersonal.valid && this.responsableValido()) {
      this.pasoActual.set(2);
    } else {
      this.formularioPersonal.markAllAsTouched();
    }
  }

  volverAPersonal(): void {
    this.datosCompletos.set(false);
    this.pasoActual.set(1);
  }

  continuar(): void {
    if (this.formularioContacto.valid) {
      this.datosCompletos.set(false);
      this.pasoActual.set(3);
    } else {
      this.formularioContacto.markAllAsTouched();
    }
  }

  volverAContacto(): void {
    this.datosCompletos.set(false);
    this.pasoActual.set(2);
  }

  actualizarTipoPasaporte(tipo: TipoPasaporte | null): void {
    this.errorCreacionCita.set(null);
    this.tipoPasaporteSeleccionado.set(tipo);
    this.fechaSeleccionada.set(null);
    this.intervaloSeleccionado.set(null);
    this.datosCompletos.set(false);
  }

  actualizarFecha(fecha: string | null): void {
    this.errorCreacionCita.set(null);
    this.fechaSeleccionada.set(fecha);
    this.intervaloSeleccionado.set(null);
    this.datosCompletos.set(false);
  }

  actualizarIntervalo(intervalo: IntervaloDisponible | null): void {
    this.errorCreacionCita.set(null);
    this.intervaloSeleccionado.set(intervalo);
    this.datosCompletos.set(false);
  }

  avanzarAConfirmacion(): void {
    if (!this.tipoPasaporteSeleccionado() || !this.fechaSeleccionada() || !this.intervaloSeleccionado()?.idCitaHora) {
      this.errorCreacionCita.set('Seleccione el tipo de pasaporte, la fecha y un horario válido antes de continuar.');
      return;
    }
    this.errorCreacionCita.set(null);
    this.pasoActual.set(4);
  }

  confirmarYGenerar(): void {
    if (this.creandoCita() || this.consecutivoCita()) return;

    this.errorCreacionCita.set(null);
    const personal = this.formularioPersonal.getRawValue();
    const intervalo = this.intervaloSeleccionado();
    const tipoPasaporte = this.tipoPasaporteSeleccionado();
    const fecha = this.fechaSeleccionada();
    if (
      !this.formularioPersonal.valid ||
      !this.responsableValido() ||
      !this.formularioContacto.valid ||
      !tipoPasaporte ||
      !fecha ||
      !intervalo?.idCitaHora
    ) {
      this.formularioPersonal.markAllAsTouched();
      this.formularioContacto.markAllAsTouched();
      this.errorCreacionCita.set('Complete correctamente todos los datos antes de crear la cita.');
      return;
    }

    const request = this.construirCrearCitaRequest(tipoPasaporte, fecha, intervalo);
    this.creandoCita.set(true);
    this.api.crearCita(request).subscribe({
      next: ({ consecutivo }) => {
        this.consecutivoCita.set(consecutivo);
        this.datosCompletos.set(true);
        const liquidacion = this.liquidacionDemo.crearLiquidacion({
          consecutivo,
          tipoPasaporte,
          ciudadano: this.nombreCompleto(personal),
          documento: personal.numeroDocumento,
          fechaCita: fecha,
          horario: `${intervalo.horaInicio.slice(0, 5)} - ${intervalo.horaFin.slice(0, 5)}`,
        });
        this.liquidacion.set(liquidacion);
        this.creandoCita.set(false);
        this.generarPdfDemo(liquidacion);
      },
      error: (error: HttpErrorResponse) => {
        const mensaje = this.obtenerMensajeError(error);
        this.errorCreacionCita.set(mensaje);
        this.creandoCita.set(false);
        if (this.esErrorDisponibilidad(mensaje)) {
          this.intervaloSeleccionado.set(null);
          this.pasoActual.set(3);
        }
      },
    });
  }

  editarPersonal(): void {
    this.errorCreacionCita.set(null);
    this.pasoActual.set(1);
  }

  editarContacto(): void {
    this.errorCreacionCita.set(null);
    this.pasoActual.set(2);
  }

  cambiarAgendamiento(): void {
    this.errorCreacionCita.set(null);
    this.pasoActual.set(3);
  }
  descargarLiquidacion(): void {
    const liquidacion = this.liquidacion();
    if (!liquidacion) return;
    const blob = this.pdfBlob();
    if (blob) {
      this.descargarBlobPdf(liquidacion, blob);
      return;
    }

    this.generarPdfDemo(liquidacion, true);
  }

  reintentarPdf(): void {
    const liquidacion = this.liquidacion();
    if (!liquidacion) return;
    this.generarPdfDemo(liquidacion);
  }

  private generarPdfDemo(liquidacion: LiquidacionPasaporteDemo, descargarAlFinal = false): void {
    if (this.generandoPdf()) return;

    this.generandoPdf.set(true);
    this.errorPdf.set(null);
    void this.liquidacionDemo.generarPdf(liquidacion).then((blob) => {
      this.pdfBlob.set(blob);
      if (descargarAlFinal) this.descargarBlobPdf(liquidacion, blob);
    }).catch(() => {
      this.pdfBlob.set(null);
      this.errorPdf.set('La cita fue creada correctamente, pero no fue posible generar el PDF de demostración.');
    }).finally(() => this.generandoPdf.set(false));
  }

  private descargarBlobPdf(liquidacion: LiquidacionPasaporteDemo, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `liquidacion-pasaporte-${liquidacion.consecutivoCita}.pdf`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private construirCrearCitaRequest(
    tipoPasaporte: TipoPasaporte,
    fecha: string,
    intervalo: IntervaloDisponible,
  ): CrearCitaRequest {
    const personal = this.formularioPersonal.getRawValue();
    const contacto = this.formularioContacto.getRawValue();
    const requiereResponsable = this.esMenor(personal.fechaNacimiento);

    return {
      idTipoDoc: Number(personal.tipoDocumento),
      idTipoPasaporte: tipoPasaporte.id,
      documento: personal.numeroDocumento.trim(),
      nombres: this.unirNombres(personal.primerNombre, personal.segundoNombre),
      apellidos: this.unirNombres(personal.primerApellido, personal.segundoApellido),
      correo: contacto.correo.trim(),
      telefono: contacto.telefono.trim(),
      municipio: contacto.municipio.trim(),
      departamento: contacto.departamento.trim(),
      genero: personal.genero,
      discapacidad: personal.discapacidad,
      etnia: personal.grupoEtnico,
      nombreResponsable: requiereResponsable ? personal.nombreResponsable.trim() : '',
      documentoResponsable: requiereResponsable ? personal.documentoResponsable.trim() : '',
      fechaNacimiento: this.formatearFecha(personal.fechaNacimiento),
      idCitaHora: intervalo.idCitaHora,
      fecha: this.formatearFecha(fecha),
    };
  }

  private unirNombres(...partes: string[]): string {
    return partes.map((parte) => parte.trim()).filter(Boolean).join(' ');
  }

  private nombreCompleto(personal: ReturnType<typeof this.formularioPersonal.getRawValue>): string {
    return this.unirNombres(personal.primerNombre, personal.segundoNombre, personal.primerApellido, personal.segundoApellido);
  }

  private formatearFecha(fecha: string): string {
    return fecha.trim().slice(0, 10);
  }

  private obtenerMensajeError(error: HttpErrorResponse): string {
    const cuerpo = error.error;
    const mensaje = typeof cuerpo === 'string'
      ? cuerpo
      : cuerpo?.mensaje ?? cuerpo?.message ?? cuerpo?.detail ?? cuerpo?.title;
    return typeof mensaje === 'string' && mensaje.trim()
      ? mensaje.trim()
      : 'No fue posible crear la cita. Verifique la disponibilidad e inténtelo nuevamente.';
  }

  private esErrorDisponibilidad(mensaje: string): boolean {
    return /cupo|disponib|horario|d[ií]a/i.test(mensaje);
  }

  private responsableValido(): boolean {
    const fecha = this.formularioPersonal.controls.fechaNacimiento.value;
    if (!fecha || !this.esMenor(fecha)) return true;

    const nombre = this.formularioPersonal.controls.nombreResponsable.value.trim();
    const documento = this.formularioPersonal.controls.documentoResponsable.value.trim();
    const confirmacion = this.formularioPersonal.controls.confirmarDocumentoResponsable.value.trim();
    return nombre !== '' && documento !== '' && confirmacion !== '' && documento === confirmacion;
  }

  private esMenor(fecha: string): boolean {
    const hoy = new Date();
    const nacimiento = new Date(`${fecha}T00:00:00`);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();
    if (diferenciaMes < 0 || (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad < 18;
  }
}
