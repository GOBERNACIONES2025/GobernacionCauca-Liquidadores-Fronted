import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  buildResult,
  FieldError,
  isEmail,
  isNotFutureDate,
  isOnlyDigits,
  isRequired,
  isValidId,
  maxLength,
  maxValue,
  minLength,
  minValue,
  ValidationResult
} from './validation-result';

/**
 * @file vehiculo-paso2.validator.ts
 * @description Validator para el Paso 2 del wizard: "Propietarios".
 * Equivalente a AbstractValidator<PropietarioInicialDto> de FluentValidation.
 * Solo conoce las reglas del Paso 2 — nada más.
 *
 * Nota: Si el usuario desactivó "incluirPropietario", se omite toda validación
 * de propietario. Esto respeta el flujo actual del negocio.
 *
 * Campos que valida (cuando incluirPropietario = true):
 *   - tipoDocumentoId      (requerido)
 *   - numeroDocumento      (requerido, 5-20 chars, solo alfanumérico)
 *   - digitoVerificacion   (requerido solo si el tipo de documento es NIT — id=2)
 *   - naturalezaJuridicaId (requerido)
 *   - nombreRazonSocial    (requerido, mínimo 3 chars)
 *   - correoElectronico    (opcional — formato email si tiene valor)
 *   - telefono             (opcional — solo dígitos si tiene valor)
 *   - porcentajePropiedad  (requerido, entre 1 y 100)
 *   - tipoVinculoPersonaId (requerido)
 *   - fechaInicio          (requerido, no puede ser fecha futura)
 */
@Injectable({ providedIn: 'root' })
export class VehiculoPaso2Validator {

  /** ID del tipo de documento NIT en el catálogo */
  private readonly ID_NIT = 2;

  /**
   * Ejecuta todas las reglas del Paso 2.
   * @param fg FormGroup completo del wizard (solo lee los campos de paso 2)
   * @returns ValidationResult con todos los errores encontrados
   */
  validar(fg: FormGroup): ValidationResult {
    const val = fg.getRawValue();
    const errors: FieldError[] = [];
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Si el usuario eligió NO incluir propietario, este paso no valida nada
    if (!val.incluirPropietario) {
      return buildResult([]);
    }


    // if (!isValidId(val.correoElectronico)) {
    //   errors.push({
    //     campo: 'correoElectronico',
    //     mensaje: "Debe completar el correo electrónico",
    //     paso: 2
    //   });
    // } else if (!emailRegex.test(val.correoElectronico)) {
    //   errors.push({
    //     campo: 'correoElectronico',
    //     mensaje: "El formato del correo electrónico no es válido (ejemplo: usuario@dominio.com)",
    //     paso: 2
    //   });
    // }

    // ── TIPO DE DOCUMENTO ────────────────────────────────────────────────
    if (!isValidId(val.tipoDocumentoId)) {
      errors.push({
        campo: 'tipoDocumentoId',
        mensaje: 'Seleccione el tipo de documento del propietario.',
        paso: 2
      });
    }

    // ── NÚMERO DE DOCUMENTO ──────────────────────────────────────────────
    if (!isRequired(val.numeroDocumento)) {
      errors.push({
        campo: 'numeroDocumento',
        mensaje: 'El número de documento es obligatorio.',
        paso: 2
      });
    } else {
      const doc = String(val.numeroDocumento).trim();
      if (!minLength(doc, 4)) {
        errors.push({
          campo: 'numeroDocumento',
          mensaje: 'El número de documento debe tener al menos 4 caracteres.',
          paso: 2
        });
      } else if (!maxLength(doc, 20)) {
        errors.push({
          campo: 'numeroDocumento',
          mensaje: 'El número de documento no puede superar 20 caracteres.',
          paso: 2
        });
      } else if (!/^[a-zA-Z0-9\-]+$/.test(doc)) {
        errors.push({
          campo: 'numeroDocumento',
          mensaje: 'El número de documento solo puede contener letras, números y guiones.',
          paso: 2
        });
      }
    }

    // ── DÍGITO DE VERIFICACIÓN (solo obligatorio para NIT) ───────────────
    const tipoDocId = Number(val.tipoDocumentoId);
    if (tipoDocId === this.ID_NIT) {
      const dv = val.digitoVerificacion;
      if (!isRequired(dv)) {
        errors.push({
          campo: 'digitoVerificacion',
          mensaje: 'El dígito de verificación es obligatorio para NIT.',
          paso: 2
        });
      } else if (!isOnlyDigits(String(dv))) {
        errors.push({
          campo: 'digitoVerificacion',
          mensaje: 'El dígito de verificación solo puede ser un número (0-9).',
          paso: 2
        });
      }
    }

    // ── NATURALEZA JURÍDICA ──────────────────────────────────────────────
    if (!isValidId(val.naturalezaJuridicaId)) {
      errors.push({
        campo: 'naturalezaJuridicaId',
        mensaje: 'Seleccione la naturaleza jurídica del propietario.',
        paso: 2
      });
    }

    // ── NOMBRE / RAZÓN SOCIAL ─────────────────────────────────────────────
    if (!isRequired(val.nombreRazonSocial)) {
      errors.push({
        campo: 'nombreRazonSocial',
        mensaje: 'El nombre o razón social es obligatorio.',
        paso: 2
      });
    } else if (!minLength(val.nombreRazonSocial, 3)) {
      errors.push({
        campo: 'nombreRazonSocial',
        mensaje: 'El nombre debe tener al menos 3 caracteres.',
        paso: 2
      });
    } else if (!maxLength(val.nombreRazonSocial, 250)) {
      errors.push({
        campo: 'nombreRazonSocial',
        mensaje: 'El nombre no puede superar 250 caracteres.',
        paso: 2
      });
    }

    // ── CORREO ELECTRÓNICO (opcional) ─────────────────────────────────────
    if (val.correoElectronico && !isEmail(val.correoElectronico)) {
      errors.push({
        campo: 'correoElectronico',
        mensaje: 'El correo electrónico no tiene un formato válido.',
        paso: 2
      });
    } else if (!maxLength(val.correoElectronico, 180)) {
      errors.push({
        campo: 'correoElectronico',
        mensaje: 'El correo no puede superar 180 caracteres.',
        paso: 2
      });
    }

    // ── TELÉFONO (opcional) ──────────────────────────────────────────────
    if (val.telefono && !isOnlyDigits(val.telefono)) {
      errors.push({
        campo: 'telefono',
        mensaje: 'El teléfono solo debe contener dígitos.',
        paso: 2
      });
    } else if (!maxLength(val.telefono, 20)) {
      errors.push({
        campo: 'telefono',
        mensaje: 'El teléfono no puede superar 20 caracteres.',
        paso: 2
      });
    }

    // ── TIPO DE VÍNCULO ──────────────────────────────────────────────────
    if (!isValidId(val.tipoVinculoPersonaId)) {
      errors.push({
        campo: 'tipoVinculoPersonaId',
        mensaje: 'Seleccione el tipo de vínculo del propietario.',
        paso: 2
      });
    }

    // ── PORCENTAJE DE PROPIEDAD ───────────────────────────────────────────
    const pct = Number(val.porcentajePropiedad);
    if (!isRequired(val.porcentajePropiedad) || isNaN(pct)) {
      errors.push({
        campo: 'porcentajePropiedad',
        mensaje: 'El porcentaje de propiedad es obligatorio.',
        paso: 2
      });
    } else if (!minValue(pct, 1)) {
      errors.push({
        campo: 'porcentajePropiedad',
        mensaje: 'El porcentaje de propiedad debe ser al menos 1%.',
        paso: 2
      });
    } else if (!maxValue(pct, 100)) {
      errors.push({
        campo: 'porcentajePropiedad',
        mensaje: 'El porcentaje de propiedad no puede superar 100%.',
        paso: 2
      });
    }

    // ── FECHA DE INICIO ───────────────────────────────────────────────────
    if (!isRequired(val.fechaInicio)) {
      errors.push({
        campo: 'fechaInicio',
        mensaje: 'La fecha de inicio de la vinculación es obligatoria.',
        paso: 2
      });
    } else if (!isNotFutureDate(val.fechaInicio)) {
      errors.push({
        campo: 'fechaInicio',
        mensaje: 'La fecha de inicio no puede ser una fecha futura.',
        paso: 2
      });
    }

    return buildResult(errors);
  }
}
