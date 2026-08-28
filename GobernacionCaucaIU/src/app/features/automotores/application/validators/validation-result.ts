/**
 * @file validation-result.ts
 * @description Tipo base compartido para todos los validators del módulo Automotores.
 *
 * Equivalente a `ValidationResult` de FluentValidation en C#.
 * Es un tipo PURO TypeScript — sin dependencias de Angular.
 * Todos los validators del módulo devuelven este contrato.
 *
 * Uso:
 *   const result = validator.validarPaso1(formGroup);
 *   if (!result.isValid) {
 *     const msg = result.getError('placa'); // 'La placa es obligatoria'
 *   }
 */

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de error por campo
// ─────────────────────────────────────────────────────────────────────────────

/** Representa un error de validación para un campo específico del formulario */
export interface FieldError {
  /** Nombre del control del FormGroup (e.g. 'placa', 'numeroDocumento') */
  campo: string;
  /** Mensaje legible en español para mostrar al usuario */
  mensaje: string;
  /** Paso del wizard donde vive este campo (1, 2 o 3). Opcional. */
  paso?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resultado de validación
// ─────────────────────────────────────────────────────────────────────────────

/** Resultado de una operación de validación. Inmutable después de construirse. */
export interface ValidationResult {
  /** true si el formulario (o paso) pasó todas las reglas */
  isValid: boolean;
  /** Lista de errores encontrados. Vacía si isValid === true */
  errors: FieldError[];

  /**
   * Obtiene el mensaje de error de un campo específico.
   * @returns El mensaje de error, o null si el campo no tiene errores.
   */
  getError(campo: string): string | null;

  /**
   * Indica si un campo específico tiene error.
   */
  hasError(campo: string): boolean;

  /**
   * Filtra los errores que pertenecen a un paso específico del wizard.
   */
  erroresDePaso(paso: number): FieldError[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory: construye un ValidationResult a partir de una lista de errores
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construye un ValidationResult a partir de un array de FieldError.
 * Úsala dentro de los validators para retornar el resultado final.
 *
 * @example
 * const errors: FieldError[] = [];
 * if (!placa) errors.push({ campo: 'placa', mensaje: 'La placa es obligatoria', paso: 1 });
 * return buildResult(errors);
 */
export function buildResult(errors: FieldError[]): ValidationResult {
  return {
    isValid: errors.length === 0,
    errors,
    getError(campo: string): string | null {
      return this.errors.find(e => e.campo === campo)?.mensaje ?? null;
    },
    hasError(campo: string): boolean {
      return this.errors.some(e => e.campo === campo);
    },
    erroresDePaso(paso: number): FieldError[] {
      return this.errors.filter(e => e.paso === paso);
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de regla reutilizables (equivalentes a IRuleBuilder de Fluent)
// ─────────────────────────────────────────────────────────────────────────────

/** Verifica que un valor no sea null, undefined ni string vacío/espacios */
export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  return true;
}

/** Verifica que un string cumpla una longitud mínima (sin espacios al inicio/fin) */
export function minLength(value: string | null | undefined, min: number): boolean {
  return (value?.trim().length ?? 0) >= min;
}

/** Verifica que un string no supere una longitud máxima */
export function maxLength(value: string | null | undefined, max: number): boolean {
  return (value?.trim().length ?? 0) <= max;
}

/** Verifica que un número sea mayor o igual a un mínimo */
export function minValue(value: number | null | undefined, min: number): boolean {
  return value !== null && value !== undefined && !isNaN(value) && value >= min;
}

/** Verifica que un número sea menor o igual a un máximo */
export function maxValue(value: number | null | undefined, max: number): boolean {
  return value !== null && value !== undefined && !isNaN(value) && value <= max;
}

/** Verifica formato de email básico (RFC simplificado) */
export function isEmail(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true; // opcional: vacío es válido
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Verifica que un string solo contenga dígitos (o vacío — campo opcional) */
export function isOnlyDigits(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true;
  return /^\d+$/.test(value.trim());
}

/** Verifica que una fecha string (YYYY-MM-DD) no sea futura */
export function isNotFutureDate(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true;
  const date = new Date(value);
  if (isNaN(date.getTime())) return false;
  return date <= new Date();
}

/** Verifica que un número ID seleccionado sea válido (> 0 y no null) */
export function isValidId(value: number | string | null | undefined): boolean {
  if (value === null || value === undefined || value === '' || value === 0 || value === '0') return false;
  const num = Number(value);
  return !isNaN(num) && num > 0;
}
