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
 * Todos los campos del formulario son OBLIGATORIOS según la regla de negocio.
 * Equivalente a AbstractValidator<ContribuyenteDto> de FluentValidation.
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

    // ── TIPO DE PERSONA (NATURALEZA JURÍDICA) ────────────────────────────
    if (!isValidId(val.naturalezaJuridicaId)) {
      errors.push({
        campo: 'naturalezaJuridicaId',
        mensaje: 'Seleccione el tipo de persona.'
      });
    }

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
      const tipo = Number(val.tipoDocumentoId);

      if ([1, 2, 4, 6].includes(tipo)) {
        // Tipos numéricos (CC, NIT, TI, RC)
        if (!isOnlyDigits(doc)) {
          errors.push({
            campo: 'numeroDocumento',
            mensaje: 'Para este tipo de documento solo se permiten números.'
          });
        } else if (!minLength(doc, 4)) {
          errors.push({
            campo: 'numeroDocumento',
            mensaje: 'El número de documento debe tener al menos 4 dígitos.'
          });
        } else if (!maxLength(doc, 12)) {
          errors.push({
            campo: 'numeroDocumento',
            mensaje: 'El número de documento no puede superar 12 dígitos.'
          });
        }
      } else {
        // Tipos alfanuméricos (Pasaporte, CE)
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

    // ── CORREO ELECTRÓNICO (OBLIGATORIO) ──────────────────────────────────
    if (!isRequired(val.correoElectronico)) {
      errors.push({
        campo: 'correoElectronico',
        mensaje: 'El correo electrónico es obligatorio.'
      });
    } else if (!isEmail(val.correoElectronico)) {
      errors.push({
        campo: 'correoElectronico',
        mensaje: 'El correo electrónico no tiene un formato válido (ejemplo: usuario@dominio.com).'
      });
    } else if (!maxLength(val.correoElectronico, 180)) {
      errors.push({
        campo: 'correoElectronico',
        mensaje: 'El correo no puede superar 180 caracteres.'
      });
    }

    // ── TELÉFONO (OBLIGATORIO) ────────────────────────────────────────────
    if (!isRequired(val.telefono)) {
      errors.push({
        campo: 'telefono',
        mensaje: 'El teléfono de contacto es obligatorio.'
      });
    } else {
      const tel = String(val.telefono).replace(/\s/g, '');
      if (!isOnlyDigits(tel)) {
        errors.push({
          campo: 'telefono',
          mensaje: 'El teléfono solo debe contener números.'
        });
      } else if (!minLength(tel, 7)) {
        errors.push({
          campo: 'telefono',
          mensaje: 'El teléfono debe tener al menos 7 dígitos.'
        });
      } else if (!maxLength(tel, 20)) {
        errors.push({
          campo: 'telefono',
          mensaje: 'El teléfono no puede superar 20 dígitos.'
        });
      }
    }

    // ── DIRECCIÓN (OBLIGATORIA) ───────────────────────────────────────────
    if (!isRequired(val.direccion)) {
      errors.push({
        campo: 'direccion',
        mensaje: 'La dirección de residencia / notificación es obligatoria.'
      });
    } else if (!minLength(String(val.direccion).trim(), 5)) {
      errors.push({
        campo: 'direccion',
        mensaje: 'La dirección debe tener al menos 5 caracteres.'
      });
    } else if (!maxLength(val.direccion, 250)) {
      errors.push({
        campo: 'direccion',
        mensaje: 'La dirección no puede superar 250 caracteres.'
      });
    }

    // ── DEPARTAMENTO (OBLIGATORIO) ────────────────────────────────────────
    if (!isValidId(val.departamentoId)) {
      errors.push({
        campo: 'departamentoId',
        mensaje: 'Seleccione el departamento.'
      });
    }

    // ── CIUDAD / MUNICIPIO (OBLIGATORIO) ──────────────────────────────────
    if (!isValidId(val.ciudadId)) {
      errors.push({
        campo: 'ciudadId',
        mensaje: 'Seleccione la ciudad o municipio.'
      });
    }

    // ── ESTADO TRIBUTARIO (OBLIGATORIO) ───────────────────────────────────
    if (!isRequired(val.estadoTributario)) {
      errors.push({
        campo: 'estadoTributario',
        mensaje: 'Seleccione el estado tributario.'
      });
    }

    return buildResult(errors);
  }
}
