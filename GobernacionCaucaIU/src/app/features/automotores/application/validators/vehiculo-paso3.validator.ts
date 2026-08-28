import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  buildResult,
  FieldError,
  maxLength,
  ValidationResult
} from './validation-result';

/**
 * @file vehiculo-paso3.validator.ts
 * @description Validator para el Paso 3 del wizard: "Observaciones".
 *
 * Equivalente a AbstractValidator<ObservacionesDto> de FluentValidation.
 * Solo conoce las reglas del Paso 3 — nada más.
 *
 * Campos que valida:
 *   - observaciones (opcional, máx 1000 chars)
 *
 * Nota: Aunque el paso 3 solo tiene un campo opcional hoy,
 * esta clase existe para que puedas agregar futuras reglas
 * (e.g., observaciones requeridas para ciertos estados de matrícula)
 * sin tocar la lógica de la facade ni del componente principal.
 */
@Injectable({ providedIn: 'root' })
export class VehiculoPaso3Validator {

  private readonly MAX_OBSERVACIONES = 1000;

  /**
   * Ejecuta todas las reglas del Paso 3.
   * @param fg FormGroup completo del wizard (solo lee los campos de paso 3)
   * @returns ValidationResult con todos los errores encontrados
   */
  validar(fg: FormGroup): ValidationResult {
    const val = fg.getRawValue();
    const errors: FieldError[] = [];

    // ── OBSERVACIONES (opcional) ─────────────────────────────────────────
    if (val.observaciones && !maxLength(val.observaciones, this.MAX_OBSERVACIONES)) {
      errors.push({
        campo: 'observaciones',
        mensaje: `Las observaciones no pueden superar ${this.MAX_OBSERVACIONES} caracteres.`,
        paso: 3
      });
    }

    return buildResult(errors);
  }
}
