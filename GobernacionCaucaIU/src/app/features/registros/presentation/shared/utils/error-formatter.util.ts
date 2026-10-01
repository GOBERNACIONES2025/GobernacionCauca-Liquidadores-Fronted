/**
 * Utilidad para formateo de errores centrada en la Experiencia de Usuario (UX).
 * Cumple con el Criterio 5 (Manejo de errores):
 * "Un error debe indicar: Qué ocurrió + por qué + qué puede hacer el usuario."
 */
export function formatUserErrorMessage(err: any, fallbackContext: string = 'operación'): string {
  if (!err) {
    return `No se pudo completar la ${fallbackContext}. Por favor intente nuevamente.`;
  }

  // Si err ya es un string explicativo
  if (typeof err === 'string') {
    return err;
  }

  // ASP.NET Core Validation ProblemDetails: err.error.errors { campo: ["Error 1", "Error 2"] }
  if (err.error?.errors && typeof err.error.errors === 'object') {
    const errorKeys = Object.keys(err.error.errors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const messages = err.error.errors[firstKey];
      if (Array.isArray(messages) && messages.length > 0) {
        return `Dato no válido en '${firstKey}': ${messages[0]}. Verifique el campo e intente nuevamente.`;
      }
    }
  }

  // Respuesta de la API con mensaje explícito de negocio
  if (err.error?.message && typeof err.error.message === 'string') {
    return `${err.error.message}. Verifique la información ingresada.`;
  }

  // ASP.NET ProblemDetails detail
  if (err.error?.detail && typeof err.error.detail === 'string') {
    return `${err.error.detail}. Verifique los datos del formulario.`;
  }

  // Códigos de estado HTTP con orientación clara al usuario
  switch (err.status) {
    case 0:
      return 'No hay conexión con el servidor. Verifique su acceso a internet o que el servicio esté activo.';
    case 400:
      return `La solicitud contiene información incorrecta o incompleta. Revise los campos obligatorios del formulario.`;
    case 401:
      return 'Su sesión ha vencido o no cuenta con credenciales activas. Por favor inicie sesión nuevamente.';
    case 403:
      return 'No cuenta con permisos autorizados para realizar esta acción sobre el catálogo.';
    case 404:
      return `El registro de ${fallbackContext} no fue encontrado o ya ha sido removido del sistema.`;
    case 409:
      return `Existe un conflicto con este registro: el código o nombre ya se encuentra registrado. Verifique la información para evitar duplicados.`;
    case 422:
      return 'No se puede procesar el registro debido a restricciones de reglas de negocio vigentes.';
    case 500:
      return `Ocurrió un inconveniente interno en el servidor al procesar la ${fallbackContext}. Intente nuevamente o reporte a soporte.`;
    case 503:
    case 504:
      return 'El servicio de liquidaciones se encuentra momentáneamente no disponible. Por favor reintente en unos instantes.';
    default:
      return `No se pudo guardar la información de la ${fallbackContext}. Verifique los datos e intente nuevamente.`;
  }
}
