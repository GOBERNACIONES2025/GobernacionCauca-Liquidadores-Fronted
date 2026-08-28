import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  buildResult,
  FieldError,
  isNotFutureDate,
  isRequired,
  isValidId,
  maxLength,
  minValue,
  maxValue,
  ValidationResult
} from './validation-result';

/**
 * @file vehiculo-paso1.validator.ts
 * @description Validator para el Paso 1 del wizard: "Datos del Vehículo".
 *
 * Equivalente a AbstractValidator<CreateVehiculoRequest> de FluentValidation.
 * Solo conoce las reglas del Paso 1 — nada más.
 *
 * Campos que valida:
 *   - tipoVehiculo  (requerido)
 *   - marca         (requerido, dependiente de tipoVehiculo)
 *   - linea         (requerido, dependiente de marca)
 *   - placa         (requerido, formato colombiano permisivo: 3-7 alfanuméricos)
 *   - estadoMatriculaId (requerido, ID válido)
 *   - modelo        (requerido, entre 1900 y año_actual + 1)
 *   - cilindraje    (requerido, > 0)
 */
@Injectable({ providedIn: 'root' })
export class VehiculoPaso1Validator {

  private readonly AÑO_MIN = 1900;
  private readonly AÑO_MAX = new Date().getFullYear() + 1;

  /**
   * Ejecuta todas las reglas del Paso 1.
   * @param fg FormGroup completo del wizard (solo lee los campos de paso 1)
   * @returns ValidationResult con todos los errores encontrados
   */
  validar(fg: FormGroup): ValidationResult {
    const val = fg.getRawValue();
    const errors: FieldError[] = [];
    // ── PASAJEROS ─────────────────────────────────────────────────────────
    const pasajeros = Number(val.pasajeros);
    if (!isRequired(val.pasajeros) || isNaN(pasajeros)) {
      errors.push({
        campo: 'pasajeros',
        mensaje: 'Ingrese una cantidad de pasajeros válida.',
        paso: 1
      });
    } else if (!minValue(pasajeros, 1)) {
      errors.push({
        campo: 'pasajeros',
        mensaje: 'La cantidad de pasajeros debe ser al menos 1.',
        paso: 1
      });
    }

    // ── SERVICIO ─────────────────────────────────────────────────────────
    if (!isRequired(val.servicio)) {
      errors.push({
        campo: 'servicio',
        mensaje: 'Seleccione un tipo de servicio.',
        paso: 1
      });
    }

    // ── COMBUSTIBLE ───────────────────────────────────────────────────────
    if (!isRequired(val.combustible)) {
      errors.push({
        campo: 'combustible',
        mensaje: 'Seleccione el tipo de combustible.',
        paso: 1
      });
    }

    // ── TIPO DE VEHÍCULO ──────────────────────────────────────────────────
    if (!isRequired(val.tipoVehiculo)) {
      errors.push({
        campo: 'tipoVehiculo',
        mensaje: 'Seleccione el tipo de vehículo.',
        paso: 1
      });
    }

    // ── MARCA ─────────────────────────────────────────────────────────────
    if (!isRequired(val.marca)) {
      errors.push({
        campo: 'marca',
        mensaje: 'Seleccione la marca del vehículo.',
        paso: 1
      });
    } else if (!maxLength(val.marca, 80)) {
      errors.push({
        campo: 'marca',
        mensaje: 'La marca no puede superar 80 caracteres.',
        paso: 1
      });
    }

    // ── LÍNEA / MODELO COMERCIAL ──────────────────────────────────────────
    if (!isRequired(val.linea)) {
      errors.push({
        campo: 'linea',
        mensaje: 'Seleccione la línea / modelo comercial.',
        paso: 1
      });
    } else if (!maxLength(val.linea, 100)) {
      errors.push({
        campo: 'linea',
        mensaje: 'La línea no puede superar 100 caracteres.',
        paso: 1
      });
    }

    // ── PLACA ─────────────────────────────────────────────────────────────
    if (!isRequired(val.placa)) {
      errors.push({
        campo: 'placa',
        mensaje: 'La placa es obligatoria.',
        paso: 1
      });
    } else {
      const placaLimpia = String(val.placa).replace(/[-\s]/g, '').toUpperCase();
      // Formato permisivo: entre 3 y 7 caracteres alfanuméricos
      // Acepta: ABC123, ABC12D, AB123C (motos), placas diplomáticas, etc.
      if (!/^[A-Z0-9]{3,7}$/.test(placaLimpia)) {
        errors.push({
          campo: 'placa',
          mensaje: 'La placa debe tener entre 3 y 7 caracteres alfanuméricos (sin caracteres especiales).',
          paso: 1
        });
      } else if (!maxLength(val.placa, 10)) {
        errors.push({
          campo: 'placa',
          mensaje: 'La placa no puede superar 10 caracteres.',
          paso: 1
        });
      }
    }

    // ── ESTADO MATRÍCULA ─────────────────────────────────────────────────
    if (!isValidId(val.estadoMatriculaId)) {
      errors.push({
        campo: 'estadoMatriculaId',
        mensaje: 'Seleccione el estado de matrícula.',
        paso: 1
      });
    }

    // ── AÑO MODELO ───────────────────────────────────────────────────────
    const modelo = Number(val.modelo);
    if (!isRequired(val.modelo) || isNaN(modelo)) {
      errors.push({
        campo: 'modelo',
        mensaje: 'El año modelo es obligatorio.',
        paso: 1
      });
    } else if (!minValue(modelo, this.AÑO_MIN)) {
      errors.push({
        campo: 'modelo',
        mensaje: `El año modelo no puede ser anterior a ${this.AÑO_MIN}.`,
        paso: 1
      });
    } else if (!maxValue(modelo, this.AÑO_MAX)) {
      errors.push({
        campo: 'modelo',
        mensaje: `El año modelo no puede ser posterior a ${this.AÑO_MAX}.`,
        paso: 1
      });
    }

    // ── CILINDRAJE ────────────────────────────────────────────────────────
    const cilindraje = Number(val.cilindraje);
    if (!isRequired(val.cilindraje) || isNaN(cilindraje)) {
      errors.push({
        campo: 'cilindraje',
        mensaje: 'El cilindraje es obligatorio.',
        paso: 1
      });
    } else if (!minValue(cilindraje, 50)) {
      errors.push({
        campo: 'cilindraje',
        mensaje: 'El cilindraje debe ser mínimo de 50 cc.',
        paso: 1
      });
    } else if (!maxValue(cilindraje, 15000)) {
      errors.push({
        campo: 'cilindraje',
        mensaje: 'Verifique el cilindraje ingresado (máximo 15,000 cc).',
        paso: 1
      });
    }

    // ── ORGANISMO DE TRÁNSITO ─────────────────────────────────────────────
    if (!isValidId(val.organismoTransitoId)) {
      errors.push({
        campo: 'organismoTransitoId',
        mensaje: 'Seleccione el organismo de tránsito.',
        paso: 1
      });
    }

    // ── FECHA DE MATRÍCULA ────────────────────────────────────────────────
    if (!isRequired(val.fechaMatricula)) {
      errors.push({
        campo: 'fechaMatricula',
        mensaje: 'La fecha de matrícula es obligatoria.',
        paso: 1
      });
    } else if (!isNotFutureDate(val.fechaMatricula)) {
      errors.push({
        campo: 'fechaMatricula',
        mensaje: 'La fecha de matrícula no puede ser posterior a hoy.',
        paso: 1
      });
    }

    return buildResult(errors);
  }
}
