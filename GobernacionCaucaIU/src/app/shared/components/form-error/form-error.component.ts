import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (shouldShowErrors) {
      <div class="mt-1 flex items-center gap-1 text-xs text-red-500 font-medium leading-tight">
        <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>
    }
  `
})
export class FormFieldErrorComponent {
  @Input() control: AbstractControl | null = null;
  @Input() fieldName?: string;
  @Input() errorKey?: string;
  @Input() customMessages?: Record<string, string>;

  get shouldShowErrors(): boolean {
    if (!this.control) return false;
    if (!this.control.invalid) return false;
    if (!this.control.touched && !this.control.dirty) return false;

    if (this.errorKey) {
      return this.control.hasError(this.errorKey);
    }

    return !!this.control.errors && Object.keys(this.control.errors).length > 0;
  }

  get errorMessage(): string {
    if (!this.control || !this.control.errors) return '';
    const errors = this.control.errors;

    // Si se especificó un errorKey puntual
    if (this.errorKey) {
      if (this.customMessages && this.customMessages[this.errorKey]) {
        return this.customMessages[this.errorKey];
      }
      return this.formatDefaultError(this.errorKey, errors[this.errorKey]);
    }

    // Si hay customMessages que coincidan con los errores activos
    if (this.customMessages) {
      for (const key of Object.keys(this.customMessages)) {
        if (errors[key]) {
          return this.customMessages[key];
        }
      }
    }

    // Orden de prioridad de errores estándar
    const priorityKeys = [
      'required',
      'email',
      'maxlength',
      'minlength',
      'min',
      'max',
      'pattern',
      'fechaFinMenor',
      'requierePorcentaje',
      'requiereValorFijo',
      'requiereSancion'
    ];

    for (const key of priorityKeys) {
      if (errors[key]) {
        return this.formatDefaultError(key, errors[key]);
      }
    }

    // Primer error genérico
    const firstKey = Object.keys(errors)[0];
    return this.formatDefaultError(firstKey, errors[firstKey]);
  }

  private formatDefaultError(key: string, errorValue: any): string {
    switch (key) {
      case 'required':
        return this.fieldName ? `${this.fieldName} es requerido.` : 'Este campo es requerido.';
      case 'email':
        return 'Ingrese un correo electrónico válido.';
      case 'maxlength':
        return `Máximo ${errorValue?.requiredLength ?? errorValue} caracteres permitidos.`;
      case 'minlength':
        return `Mínimo ${errorValue?.requiredLength ?? errorValue} caracteres requeridos.`;
      case 'min':
        return `El valor mínimo permitido es ${errorValue?.min ?? errorValue}.`;
      case 'max':
        return `El valor máximo permitido es ${errorValue?.max ?? errorValue}.`;
      case 'pattern':
        return 'El formato ingresado no es válido.';
      case 'fechaFinMenor':
        return 'La fecha final no puede ser anterior a la fecha inicial.';
      case 'requierePorcentaje':
        return 'Debe ingresar un porcentaje válido entre 0 y 100.';
      case 'requiereValorFijo':
        return 'Debe ingresar un valor fijo mayor a 0.';
      case 'requiereSancion':
        return 'Debe ingresar al menos un porcentaje o valor fijo.';
      default:
        return typeof errorValue === 'string' ? errorValue : 'Campo inválido.';
    }
  }
}
