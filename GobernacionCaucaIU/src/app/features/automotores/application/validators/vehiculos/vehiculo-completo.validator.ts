import { Injectable, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { buildResult, FieldError, ValidationResult } from '../validation-result';
import { VehiculoPaso1Validator } from './vehiculo-paso1.validator';
import { VehiculoPaso2Validator } from './vehiculo-paso2.validator';
import { VehiculoPaso3Validator } from './vehiculo-paso3.validator';

/**
 * @file vehiculo-completo.validator.ts
 * @description Validator orquestador del wizard completo de registro vehicular.
 *
 * Equivalente a un ValidatorFactory que combina múltiples
 * AbstractValidator<T> de FluentValidation en C#.
 *
 * Esta clase:
 *  1. Inyecta los 3 validators de paso (P1, P2, P3)
 *  2. Expone métodos para validar un paso individual
 *  3. Expone un método para validar TODO el formulario antes del submit final
 *  4. Determina cuál es el primer paso con error (para navegar automáticamente)
 *
 * La FACADE no conoce esta clase. Solo el componente del wizard la usa.
 * La FACADE solo orquesta llamadas HTTP y estado — nunca valida.
 *
 * Uso en el componente wizard:
 *
 *   readonly validator = inject(VehiculoCompletoValidator);
 *
 *   onSiguiente(): void {
 *     const result = this.validator.validarPaso(this.facade.currentStep(), this.form);
 *     if (!result.isValid) {
 *       this.erroresPaso.set(result.errors);
 *       return;
 *     }
 *     this.erroresPaso.set([]);
 *     this.facade.siguientePaso();
 *   }
 *
 *   onFinalizarRegistro(): void {
 *     const result = this.validator.validarCompleto(this.form);
 *     if (!result.isValid) {
 *       const paso = this.validator.primerPasoConError(result);
 *       this.facade.setStep(paso);
 *       this.erroresPaso.set(result.errors);
 *       return;
 *     }
 *     // Solo aquí se construye el DTO y se llama a la facade
 *   }
 */
@Injectable({ providedIn: 'root' })
export class VehiculoCompletoValidator {

  private paso1 = inject(VehiculoPaso1Validator);
  private paso2 = inject(VehiculoPaso2Validator);
  private paso3 = inject(VehiculoPaso3Validator);

  // ─────────────────────────────────────────────────────────────────────────
  // Validación por paso individual (para el botón "Siguiente")
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Valida únicamente el paso indicado.
   * Llamar antes de avanzar al siguiente paso del wizard.
   *
   * @param paso Número del paso actual (1, 2 o 3)
   * @param fg   FormGroup completo del wizard
   */
  validarPaso(paso: number, fg: FormGroup): ValidationResult {
    switch (paso) {
      case 1: return this.paso1.validar(fg);
      case 2: return this.paso2.validar(fg);
      case 3: return this.paso3.validar(fg);
      default: return buildResult([]);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Validación completa (para el botón "Guardar / Finalizar")
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Ejecuta los 3 validators de paso y combina todos sus errores.
   * Llamar justo antes de construir el DTO y enviarlo a la facade.
   *
   * @param fg FormGroup completo del wizard
   */
  validarCompleto(fg: FormGroup): ValidationResult {
    const erroresPaso1 = this.paso1.validar(fg).errors;
    const erroresPaso2 = this.paso2.validar(fg).errors;
    const erroresPaso3 = this.paso3.validar(fg).errors;

    const todosLosErrores: FieldError[] = [
      ...erroresPaso1,
      ...erroresPaso2,
      ...erroresPaso3
    ];

    return buildResult(todosLosErrores);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers de navegación
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Determina el número del primer paso que tiene errores.
   * Útil para redirigir automáticamente al wizard al paso correcto.
   *
   * @param result ValidationResult devuelto por validarCompleto()
   * @returns El número del primer paso con error, o 1 si no hay información de paso
   */
  primerPasoConError(result: ValidationResult): number {
    const primerError = result.errors.find(e => e.paso !== undefined);
    return primerError?.paso ?? 1;
  }

  /**
   * Devuelve un resumen legible de los errores agrupados por paso.
   * Útil para mostrar un toast con un resumen antes de redirigir.
   *
   * @example
   * "Paso 1: Placa obligatoria. Paso 2: Documento inválido."
   */
  resumenErrores(result: ValidationResult): string {
    if (result.isValid) return '';

    const porPaso: Record<number, string[]> = {};
    result.errors.forEach(e => {
      const paso = e.paso ?? 0;
      if (!porPaso[paso]) porPaso[paso] = [];
      porPaso[paso].push(e.mensaje);
    });

    return Object.entries(porPaso)
      .map(([paso, msgs]) => `Paso ${paso}: ${msgs[0]}`)
      .join(' · ');
  }
}
