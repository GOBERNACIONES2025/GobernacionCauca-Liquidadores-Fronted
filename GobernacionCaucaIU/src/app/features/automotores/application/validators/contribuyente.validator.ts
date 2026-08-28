import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  buildResult,
  FieldError,
  isEmail,
  isOnlyDigits,
  isRequired,
  isValidId,
  maxLength,
  minLength,
  ValidationResult
} from './validation-result';

/**
 * @file contribuyente.validator.ts
 * @description Validator para el formulario de creación/edición de Contribuyentes.
 *
 * Equivalente a AbstractValidator<ContribuyenteDto> de FluentValidation.
 * Usado por el ContribuyenteFormComponent — NO por el wizard de vehículos.
 *
 * Campos que valida:
 *   - tipoDocumentoId      (requerido)
 *   - numeroDocumento      (requerido, 4-20 chars, alfanumérico)
 *   - digitoVerificacion   (requerido solo para NIT — id=2)
 *   - naturalezaJuridicaId (requerido)
 *   - nombreRazonSocial    (requerido, mínimo 3 chars, máx 250)
 *   - correoElectronico    (opcional, formato válido)
 *   - telefono             (opcional, solo dígitos, máx 20)
 *   - direccion            (opcional, máx 250)
 *
 * Nota: departamentoId y ciudadId son opcionales en este formulario.
 */
@Injectable({ providedIn: 'root' })
export class ContribuyenteValidator {

  /** ID del tipo de documento NIT en el catálogo */
  private readonly ID_NIT = 2;

  /**
   * Ejecuta todas las reglas del formulario de contribuyente.
   * @param fg FormGroup del ContribuyenteFormComponent
   * @returns ValidationResult con todos los errores encontrados
   */
  validar(fg: FormGroup): ValidationResult {
    const val = fg.getRawValue();
    const errors: FieldError[] = [];

    // ── TIPO DE DOCUMENTO ────────────────────────────────────────────────
    if (!isValidId(val.tipoDocumentoId)) {
      errors.push({
        campo: 'tipoDocumentoId',
        mensaje: 'Seleccione el tipo de documento.'
      });
    }

    // ── NÚMERO DE DOCUMENTO ──────────────────────────────────────────────
    if (!isRequired(val.numeroDocumento)) {
      errors.push({
        campo: 'numeroDocumento',
        mensaje: 'El número de documento es obligatorio.'
      });
    } else {
      const doc = String(val.numeroDocumento).trim();
      if (!minLength(doc, 4)) {
        errors.push({
          campo: 'numeroDocumento',
          mensaje: 'El número de documento debe tener al menos 4 caracteres.'
        });
      } else if (!maxLength(doc, 20)) {
        errors.push({
          campo: 'numeroDocumento',
          mensaje: 'El número de documento no puede superar 20 caracteres.'
        });
      } else if (!/^[a-zA-Z0-9\-]+$/.test(doc)) {
        errors.push({
          campo: 'numeroDocumento',
          mensaje: 'El número de documento solo puede contener letras, números y guiones.'
        });
      }
    }

    // ── DÍGITO DE VERIFICACIÓN (solo obligatorio para NIT) ───────────────
    if (Number(val.tipoDocumentoId) === this.ID_NIT) {
      if (!isRequired(val.digitoVerificacion)) {
        errors.push({
          campo: 'digitoVerificacion',
          mensaje: 'El dígito de verificación es obligatorio para NIT.'
        });
      } else if (!isOnlyDigits(String(val.digitoVerificacion))) {
        errors.push({
          campo: 'digitoVerificacion',
          mensaje: 'El dígito de verificación solo puede ser un número (0-9).'
        });
      }
    }

    // ── NATURALEZA JURÍDICA ──────────────────────────────────────────────
    if (!isValidId(val.naturalezaJuridicaId)) {
      errors.push({
        campo: 'naturalezaJuridicaId',
        mensaje: 'Seleccione la naturaleza jurídica.'
      });
    }

    // ── NOMBRE / RAZÓN SOCIAL ─────────────────────────────────────────────
    if (!isRequired(val.nombreRazonSocial)) {
      errors.push({
        campo: 'nombreRazonSocial',
        mensaje: 'El nombre o razón social es obligatorio.'
      });
    } else if (!minLength(val.nombreRazonSocial, 3)) {
      errors.push({
        campo: 'nombreRazonSocial',
        mensaje: 'El nombre debe tener al menos 3 caracteres.'
      });
    } else if (!maxLength(val.nombreRazonSocial, 250)) {
      errors.push({
        campo: 'nombreRazonSocial',
        mensaje: 'El nombre no puede superar 250 caracteres.'
      });
    }

    // ── CORREO ELECTRÓNICO (opcional) ─────────────────────────────────────
    if (val.correoElectronico && !isEmail(val.correoElectronico)) {
      errors.push({
        campo: 'correoElectronico',
        mensaje: 'El correo electrónico no tiene un formato válido.'
      });
    } else if (!maxLength(val.correoElectronico, 180)) {
      errors.push({
        campo: 'correoElectronico',
        mensaje: 'El correo no puede superar 180 caracteres.'
      });
    }

    // ── TELÉFONO (opcional) ──────────────────────────────────────────────
    if (val.telefono && !isOnlyDigits(val.telefono)) {
      errors.push({
        campo: 'telefono',
        mensaje: 'El teléfono solo debe contener dígitos.'
      });
    } else if (!maxLength(val.telefono, 20)) {
      errors.push({
        campo: 'telefono',
        mensaje: 'El teléfono no puede superar 20 caracteres.'
      });
    }

    // ── DIRECCIÓN (opcional) ──────────────────────────────────────────────
    if (!maxLength(val.direccion, 250)) {
      errors.push({
        campo: 'direccion',
        mensaje: 'La dirección no puede superar 250 caracteres.'
      });
    }

    return buildResult(errors);
  }
}
