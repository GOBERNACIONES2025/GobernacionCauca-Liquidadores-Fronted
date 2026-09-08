import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-informacion-personal-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './informacion-personal-form.html',
})
export class InformacionPersonalForm {
  readonly formulario = input.required<FormGroup>();
  readonly continuar = output<void>();

  readonly tiposDocumento = [
    { id: 1, nombre: 'Cédula de ciudadanía' },
    { id: 2, nombre: 'Registro Civil' },
    { id: 3, nombre: 'Tarjeta de identidad' },
  ];
  readonly generos = ['Masculino', 'Femenino'];
  readonly gruposEtnicos = ['No aplica', 'Indígena', 'Afrocolombiano / Afrodescendiente', 'Negro', 'Mulato', 'Palenquero de San Basilio', 'Raizal del Archipiélago de San Andrés y Providencia', 'Rom o Gitano', 'Otro'];
  readonly discapacidades = ['Ninguna', 'Discapacidad física', 'Discapacidad visual', 'Discapacidad auditiva', 'Discapacidad intelectual', 'Discapacidad psicosocial o mental', 'Discapacidad múltiple', 'Otra'];

  esMenorDeEdad(): boolean {
    const fecha = this.formulario().controls['fechaNacimiento'].value as string;
    if (!fecha) return false;
    const hoy = new Date();
    const nacimiento = new Date(`${fecha}T00:00:00`);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();
    if (diferenciaMes < 0 || (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad < 18;
  }

  sanitizarNombre(control: string): void {
    const campo = this.formulario().controls[control];
    campo.setValue(String(campo.value ?? '').replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, ''));
  }

  sanitizarNumero(control: string): void {
    const campo = this.formulario().controls[control];
    campo.setValue(String(campo.value ?? '').replace(/\D/g, ''));
  }

  documentosCoinciden(): boolean {
    const form = this.formulario().controls;
    return form['numeroDocumento'].value === form['confirmarDocumento'].value;
  }

  responsableCoincide(): boolean {
    const form = this.formulario().controls;
    return form['documentoResponsable'].value === form['confirmarDocumentoResponsable'].value;
  }

  puedeContinuar(): boolean {
    if (!this.formulario().valid) return false;
    if (!this.esMenorDeEdad()) return true;
    const form = this.formulario().controls;
    return Boolean(form['nombreResponsable'].value?.trim() && form['documentoResponsable'].value?.trim() && form['confirmarDocumentoResponsable'].value?.trim() && this.responsableCoincide());
  }
}
