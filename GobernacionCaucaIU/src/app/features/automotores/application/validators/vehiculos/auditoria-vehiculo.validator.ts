import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  buildResult,
  FieldError,
  isRequired,
  maxLength,
  maxValue,
  minLength,
  minValue,
  ValidationResult
} from '../validation-result';

/**
 * @file auditoria-vehiculo.validator.ts
 * @description Validador para el modal de Edición Directa de Registro / Auditoría.
 * Valida todas las especificaciones técnicas y los datos del propietario.
 */
@Injectable({ providedIn: 'root' })
export class AuditoriaVehiculoValidator {

  validar(fg: FormGroup): ValidationResult {
    const val = fg.getRawValue();
    const errors: FieldError[] = [];

    // ── MARCA ──
    if (!isRequired(val.marca)) {
      errors.push({ campo: 'marca', mensaje: 'La marca es obligatoria.' });
    } else if (!maxLength(val.marca, 80)) {
      errors.push({ campo: 'marca', mensaje: 'La marca no puede superar 80 caracteres.' });
    }

    // ── LÍNEA ──
    if (!isRequired(val.linea)) {
      errors.push({ campo: 'linea', mensaje: 'La línea es obligatoria.' });
    } else if (!maxLength(val.linea, 100)) {
      errors.push({ campo: 'linea', mensaje: 'La línea no puede superar 100 caracteres.' });
    }

    // ── AÑO MODELO ──
    const modelo = Number(val.modelo);
    const añoMax = new Date().getFullYear() + 1;
    if (!isRequired(val.modelo) || isNaN(modelo)) {
      errors.push({ campo: 'modelo', mensaje: 'El año modelo es obligatorio.' });
    } else if (!minValue(modelo, 1900) || !maxValue(modelo, añoMax)) {
      errors.push({ campo: 'modelo', mensaje: `El año modelo debe estar entre 1900 y ${añoMax}.` });
    }

    // ── CILINDRAJE ──
    const cil = Number(val.cilindraje);
    if (!isRequired(val.cilindraje) || isNaN(cil)) {
      errors.push({ campo: 'cilindraje', mensaje: 'El cilindraje es obligatorio.' });
    } else if (!minValue(cil, 50)) {
      errors.push({ campo: 'cilindraje', mensaje: 'El cilindraje debe ser mínimo de 50 cc.' });
    } else if (!maxValue(cil, 15000)) {
      errors.push({ campo: 'cilindraje', mensaje: 'El cilindraje no puede superar 15,000 cc.' });
    }

    // ── COMBUSTIBLE ──
    if (!isRequired(val.combustible)) {
      errors.push({ campo: 'combustible', mensaje: 'Seleccione el tipo de combustible.' });
    }

    // ── SERVICIO ──
    if (!isRequired(val.servicio)) {
      errors.push({ campo: 'servicio', mensaje: 'Seleccione el tipo de servicio.' });
    }

    // ── CLASE / TIPO ──
    if (!isRequired(val.clase)) {
      errors.push({ campo: 'clase', mensaje: 'La clase o tipo de vehículo es obligatoria.' });
    }

    // ── PASAJEROS ──
    const pas = Number(val.pasajeros);
    if (!isRequired(val.pasajeros) || isNaN(pas)) {
      errors.push({ campo: 'pasajeros', mensaje: 'Ingrese la cantidad de pasajeros.' });
    } else if (!minValue(pas, 1)) {
      errors.push({ campo: 'pasajeros', mensaje: 'La cantidad de pasajeros debe ser al menos 1.' });
    }

    // ── ORGANISMO DE TRÁNSITO ──
    if (!isRequired(val.organismoTransito)) {
      errors.push({ campo: 'organismoTransito', mensaje: 'El organismo de tránsito es obligatorio.' });
    }

    // ── DOCUMENTO PROPIETARIO ──
    if (!isRequired(val.propietarioDocumento)) {
      errors.push({ campo: 'propietarioDocumento', mensaje: 'El número de documento es obligatorio.' });
    } else {
      const doc = String(val.propietarioDocumento).trim();
      if (!minLength(doc, 4)) {
        errors.push({ campo: 'propietarioDocumento', mensaje: 'El documento debe tener al menos 4 caracteres.' });
      }
    }

    // ── NOMBRE PROPIETARIO ──
    if (!isRequired(val.propietarioNombre)) {
      errors.push({ campo: 'propietarioNombre', mensaje: 'El nombre o razón social es obligatorio.' });
    } else if (!minLength(val.propietarioNombre, 3)) {
      errors.push({ campo: 'propietarioNombre', mensaje: 'El nombre debe tener al menos 3 caracteres.' });
    } else if (!maxLength(val.propietarioNombre, 250)) {
      errors.push({ campo: 'propietarioNombre', mensaje: 'El nombre no puede superar 250 caracteres.' });
    }

    // ── VÍNCULO DE PROPIEDAD ──
    if (!isRequired(val.tipoVinculoPersonaId)) {
      errors.push({ campo: 'tipoVinculoPersonaId', mensaje: 'Seleccione el tipo de vínculo.' });
    }

    // ── % PROPIEDAD ──
    const porc = Number(val.porcentajePropiedad);
    if (!isRequired(val.porcentajePropiedad) || isNaN(porc)) {
      errors.push({ campo: 'porcentajePropiedad', mensaje: 'El porcentaje de propiedad es obligatorio.' });
    } else if (!minValue(porc, 1) || !maxValue(porc, 100)) {
      errors.push({ campo: 'porcentajePropiedad', mensaje: 'El porcentaje debe estar entre 1% y 100%.' });
    }

    return buildResult(errors);
  }
}
