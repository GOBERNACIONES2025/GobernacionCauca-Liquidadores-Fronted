import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import colombiaData from './colombia.min.json';

interface UbicacionColombia {
  departamento: string;
  ciudades: string[];
}

@Component({
  selector: 'app-informacion-contacto-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './informacion-contacto-form.html',
})
export class InformacionContactoForm {
  readonly formulario = input.required<FormGroup>();
  readonly completado = input(false);
  readonly anterior = output<void>();
  readonly continuar = output<void>();
  readonly departamentos = colombiaData as UbicacionColombia[];
  municipios(): string[] {
    const departamento = this.formulario().controls['departamento'].value as string;
    return this.departamentos.find((item) => item.departamento === departamento)?.ciudades ?? [];
  }

  actualizarDepartamento(): void {
    this.formulario().controls['municipio'].setValue('');
  }

  sanitizarTelefono(control: string): void {
    const campo = this.formulario().controls[control];
    campo.setValue(String(campo.value ?? '').replace(/\D/g, '').slice(0, 10));
  }

  coinciden(campo: string, confirmacion: string): boolean {
    const form = this.formulario().controls;
    return Boolean(form[campo].value && form[confirmacion].value && form[campo].value === form[confirmacion].value);
  }
}
