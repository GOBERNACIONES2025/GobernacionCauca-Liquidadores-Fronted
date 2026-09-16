import { Injectable } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
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
} from '../validation-result';

/**
 * @file vehiculo-paso2.validator.ts
 * @description Validator para el Paso 2 del wizard: "Propietarios".
 * Valida la coleccion de propietarios / copropietarios o el formulario individual.
 * Asegura que la suma de porcentajes de propiedad sea exactamente 100% y que
 * exista un unico responsable principal.
 */
@Injectable({ providedIn: 'root' })
export class VehiculoPaso2Validator {

  /** ID del tipo de documento NIT en el catalogo */
  private readonly ID_NIT = 2;

  /**
   * Ejecuta todas las reglas del Paso 2.
   * @param fg FormGroup completo del wizard
   * @returns ValidationResult con todos los errores encontrados
   */
  validar(fg: FormGroup): ValidationResult {
    const val = fg.getRawValue();
    const errors: FieldError[] = [];

    // Si el usuario eligio NO incluir propietario, este paso no valida nada
    if (!val.incluirPropietario) {
      return buildResult([]);
    }

    const propietariosControl = fg.get('propietarios');

    // ── Si el formulario maneja un FormArray de propietarios ──────────────────
    if (propietariosControl instanceof FormArray && propietariosControl.length > 0) {
      const lista = propietariosControl.getRawValue() as any[];
      let sumaPorcentajes = 0;
      let tienePrincipal = false;

      lista.forEach((p, idx) => {
        // Correo electronico (opcional)
        if (isRequired(p.correoElectronico)) {
          const email = String(p.correoElectronico).trim();
          if (!isEmail(email)) {
            errors.push({
              campo: `propietario_${idx}_correoElectronico`,
              mensaje: `El formato del correo electronico no es valido en propietario ${idx + 1}.`,
              paso: 2
            });
          }
        }

        // Tipo de documento
        if (!isValidId(p.tipoDocumentoId)) {
          errors.push({
            campo: `propietario_${idx}_tipoDocumentoId`,
            mensaje: `Seleccione el tipo de documento del propietario ${idx + 1}.`,
            paso: 2
          });
        }

        // Numero de documento
        if (!isRequired(p.numeroDocumento)) {
          errors.push({
            campo: `propietario_${idx}_numeroDocumento`,
            mensaje: `El numero de documento es obligatorio para el propietario ${idx + 1}.`,
            paso: 2
          });
        } else {
          const doc = String(p.numeroDocumento).trim();
          const tipo = Number(p.tipoDocumentoId);

          if ([1, 2, 4, 6].includes(tipo)) {
            if (!isOnlyDigits(doc)) {
              errors.push({
                campo: `propietario_${idx}_numeroDocumento`,
                mensaje: `Para este tipo de documento solo se permiten numeros en propietario ${idx + 1}.`,
                paso: 2
              });
            } else if (!minLength(doc, 4)) {
              errors.push({
                campo: `propietario_${idx}_numeroDocumento`,
                mensaje: `El numero de documento debe tener al menos 4 digitos en propietario ${idx + 1}.`,
                paso: 2
              });
            } else if (!maxLength(doc, 12)) {
              errors.push({
                campo: `propietario_${idx}_numeroDocumento`,
                mensaje: `El numero de documento no puede superar 12 digitos en propietario ${idx + 1}.`,
                paso: 2
              });
            }
          } else {
            if (!minLength(doc, 4)) {
              errors.push({
                campo: `propietario_${idx}_numeroDocumento`,
                mensaje: `El numero de documento debe tener al menos 4 caracteres en propietario ${idx + 1}.`,
                paso: 2
              });
            } else if (!maxLength(doc, 20)) {
              errors.push({
                campo: `propietario_${idx}_numeroDocumento`,
                mensaje: `El numero de documento no puede superar 20 caracteres en propietario ${idx + 1}.`,
                paso: 2
              });
            } else if (!/^[a-zA-Z0-9\-]+$/.test(doc)) {
              errors.push({
                campo: `propietario_${idx}_numeroDocumento`,
                mensaje: `El numero de documento solo puede contener letras, numeros y guiones en propietario ${idx + 1}.`,
                paso: 2
              });
            }
          }
        }

        // Digito de verificacion si es NIT
        if (Number(p.tipoDocumentoId) === this.ID_NIT) {
          const dv = p.digitoVerificacion;
          if (!isRequired(dv)) {
            errors.push({
              campo: `propietario_${idx}_digitoVerificacion`,
              mensaje: `El digito de verificacion es obligatorio para NIT en propietario ${idx + 1}.`,
              paso: 2
            });
          } else if (!isOnlyDigits(String(dv))) {
            errors.push({
              campo: `propietario_${idx}_digitoVerificacion`,
              mensaje: `El digito de verificacion solo puede ser un numero (0-9) en propietario ${idx + 1}.`,
              paso: 2
            });
          }
        }

        // Naturaleza juridica
        if (!isValidId(p.naturalezaJuridicaId)) {
          errors.push({
            campo: `propietario_${idx}_naturalezaJuridicaId`,
            mensaje: `Seleccione la naturaleza juridica del propietario ${idx + 1}.`,
            paso: 2
          });
        }

        // Nombre / Razon social
        if (!isRequired(p.nombreRazonSocial)) {
          errors.push({
            campo: `propietario_${idx}_nombreRazonSocial`,
            mensaje: `El nombre o razon social es obligatorio en propietario ${idx + 1}.`,
            paso: 2
          });
        } else if (!minLength(p.nombreRazonSocial, 3)) {
          errors.push({
            campo: `propietario_${idx}_nombreRazonSocial`,
            mensaje: `El nombre debe tener al menos 3 caracteres en propietario ${idx + 1}.`,
            paso: 2
          });
        } else if (!maxLength(p.nombreRazonSocial, 250)) {
          errors.push({
            campo: `propietario_${idx}_nombreRazonSocial`,
            mensaje: `El nombre no puede superar 250 caracteres en propietario ${idx + 1}.`,
            paso: 2
          });
        }

        // Tipo de vinculo
        if (!isValidId(p.tipoVinculoPersonaId)) {
          errors.push({
            campo: `propietario_${idx}_tipoVinculoPersonaId`,
            mensaje: `Seleccione el tipo de vinculo del propietario ${idx + 1}.`,
            paso: 2
          });
        }

        // Porcentaje de propiedad individual
        const pct = Number(p.porcentajePropiedad);
        if (!isRequired(p.porcentajePropiedad) || isNaN(pct)) {
          errors.push({
            campo: `propietario_${idx}_porcentajePropiedad`,
            mensaje: `El porcentaje de propiedad es obligatorio en propietario ${idx + 1}.`,
            paso: 2
          });
        } else if (!minValue(pct, 0.01)) {
          errors.push({
            campo: `propietario_${idx}_porcentajePropiedad`,
            mensaje: `El porcentaje de propiedad debe ser mayor a 0% en propietario ${idx + 1}.`,
            paso: 2
          });
        } else if (!maxValue(pct, 100)) {
          errors.push({
            campo: `propietario_${idx}_porcentajePropiedad`,
            mensaje: `El porcentaje de propiedad no puede superar 100% en propietario ${idx + 1}.`,
            paso: 2
          });
        } else {
          sumaPorcentajes += pct;
        }

        // Fecha de inicio
        if (!isRequired(p.fechaInicio)) {
          errors.push({
            campo: `propietario_${idx}_fechaInicio`,
            mensaje: `La fecha de inicio de vinculacion es obligatoria en propietario ${idx + 1}.`,
            paso: 2
          });
        } else if (!isNotFutureDate(p.fechaInicio)) {
          errors.push({
            campo: `propietario_${idx}_fechaInicio`,
            mensaje: `La fecha de inicio no puede ser una fecha futura en propietario ${idx + 1}.`,
            paso: 2
          });
        }

        if (p.esResponsablePrincipal) {
          tienePrincipal = true;
        }
      });

      // Validacion de suma total del 100%
      const sumaRedondeada = Math.round(sumaPorcentajes * 100) / 100;
      if (Math.abs(sumaRedondeada - 100) > 0.01) {
        if (sumaRedondeada < 100) {
          const falta = (100 - sumaRedondeada).toFixed(2);
          errors.push({
            campo: 'porcentajePropiedadTotal',
            mensaje: `La suma de los porcentajes de propiedad debe ser exactamente 100%. Falta asignar el ${falta}%. Agregue o ajuste los copropietarios.`,
            paso: 2
          });
        } else {
          errors.push({
            campo: 'porcentajePropiedadTotal',
            mensaje: `La suma de los porcentajes de propiedad supera el 100% (Suma actual: ${sumaRedondeada}%). Ajuste los porcentajes asignados.`,
            paso: 2
          });
        }
      }

      // Validacion de responsable principal
      if (!tienePrincipal) {
        errors.push({
          campo: 'esResponsablePrincipal',
          mensaje: 'Debe designar a uno de los propietarios como responsable fiscal principal.',
          paso: 2
        });
      }

      return buildResult(errors);
    }

    // ── Fallback a formulario plano tradicional si no hay FormArray ────────────
    if (isRequired(val.correoElectronico)) {
      const email = String(val.correoElectronico).trim();
      if (!isEmail(email)) {
        errors.push({
          campo: 'correoElectronico',
          mensaje: 'El formato del correo electronico no es valido (ejemplo: usuario@dominio.com).',
          paso: 2
        });
      }
    }

    if (!isValidId(val.tipoDocumentoId)) {
      errors.push({
        campo: 'tipoDocumentoId',
        mensaje: 'Seleccione el tipo de documento del propietario.',
        paso: 2
      });
    }

    if (!isRequired(val.numeroDocumento)) {
      errors.push({
        campo: 'numeroDocumento',
        mensaje: 'El numero de documento es obligatorio.',
        paso: 2
      });
    } else {
      const doc = String(val.numeroDocumento).trim();
      const tipo = Number(val.tipoDocumentoId);

      if ([1, 2, 4, 6].includes(tipo)) {
        if (!isOnlyDigits(doc)) {
          errors.push({
            campo: 'numeroDocumento',
            mensaje: 'Para este tipo de documento solo se permiten numeros (sin letras ni puntos).',
            paso: 2
          });
        } else if (!minLength(doc, 4)) {
          errors.push({
            campo: 'numeroDocumento',
            mensaje: 'El numero de documento debe tener al menos 4 digitos.',
            paso: 2
          });
        } else if (!maxLength(doc, 12)) {
          errors.push({
            campo: 'numeroDocumento',
            mensaje: 'El numero de documento no puede superar 12 digitos.',
            paso: 2
          });
        }
      } else {
        if (!minLength(doc, 4)) {
          errors.push({
            campo: 'numeroDocumento',
            mensaje: 'El numero de documento debe tener al menos 4 caracteres.',
            paso: 2
          });
        } else if (!maxLength(doc, 20)) {
          errors.push({
            campo: 'numeroDocumento',
            mensaje: 'El numero de documento no puede superar 20 caracteres.',
            paso: 2
          });
        } else if (!/^[a-zA-Z0-9\-]+$/.test(doc)) {
          errors.push({
            campo: 'numeroDocumento',
            mensaje: 'El numero de documento solo puede contener letras, numeros y guiones.',
            paso: 2
          });
        }
      }
    }

    const tipoDocId = Number(val.tipoDocumentoId);
    if (tipoDocId === this.ID_NIT) {
      const dv = val.digitoVerificacion;
      if (!isRequired(dv)) {
        errors.push({
          campo: 'digitoVerificacion',
          mensaje: 'El digito de verificacion es obligatorio para NIT.',
          paso: 2
        });
      } else if (!isOnlyDigits(String(dv))) {
        errors.push({
          campo: 'digitoVerificacion',
          mensaje: 'El digito de verificacion solo puede ser un numero (0-9).',
          paso: 2
        });
      }
    }

    if (!isValidId(val.naturalezaJuridicaId)) {
      errors.push({
        campo: 'naturalezaJuridicaId',
        mensaje: 'Seleccione la naturaleza juridica del propietario.',
        paso: 2
      });
    }

    if (!isRequired(val.nombreRazonSocial)) {
      errors.push({
        campo: 'nombreRazonSocial',
        mensaje: 'El nombre o razon social es obligatorio.',
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

    if (!isValidId(val.tipoVinculoPersonaId)) {
      errors.push({
        campo: 'tipoVinculoPersonaId',
        mensaje: 'Seleccione el tipo de vinculo del propietario.',
        paso: 2
      });
    }

    const pct = Number(val.porcentajePropiedad);
    if (!isRequired(val.porcentajePropiedad) || isNaN(pct)) {
      errors.push({
        campo: 'porcentajePropiedad',
        mensaje: 'El porcentaje de propiedad es obligatorio.',
        paso: 2
      });
    } else if (pct !== 100) {
      errors.push({
        campo: 'porcentajePropiedad',
        mensaje: 'El porcentaje de propiedad debe ser del 100% para propietario unico.',
        paso: 2
      });
    }

    if (!isRequired(val.fechaInicio)) {
      errors.push({
        campo: 'fechaInicio',
        mensaje: 'La fecha de inicio de la vinculacion es obligatoria.',
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

