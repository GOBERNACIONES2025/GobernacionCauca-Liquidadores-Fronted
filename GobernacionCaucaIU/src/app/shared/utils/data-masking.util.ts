/**
 * Utilidades puras para el enmascaramiento de datos personales sensibles (Habeas Data - Ley 1581 de 2012).
 * Permiten ofuscar identificaciones, nombres, correos, teléfonos y direcciones manteniendo formato de referencia.
 */
export class DataMaskingUtil {

  /**
   * Enmascara un número de documento o NIT.
   * Ejemplo: '1061789456' -> '1061***456'
   * Ejemplo con DV: '900123456', '7' -> '900***456-7'
   */
  static maskDocumento(doc: string | number | null | undefined, dv?: string | number | null): string {
    if (!doc) return '***';
    const str = String(doc).trim();
    if (str.length <= 4) {
      return str.length > 1 ? str[0] + '***' : '***';
    }

    const start = str.slice(0, 4);
    const end = str.length > 7 ? str.slice(-3) : str.slice(-2);
    const masked = `${start}***${end}`;
    
    return dv !== undefined && dv !== null && dv !== '' ? `${masked}-${dv}` : masked;
  }

  /**
   * Enmascara un nombre o razón social.
   * Ejemplo: 'CARLOS ALBERTO PEREZ GOMEZ' -> 'C***** A****** P**** G****'
   * Ejemplo Razón Social: 'CONSTRUCCIONES DEL CAUCA S.A.S' -> 'C************* DEL CAUCA S.A.S'
   */
  static maskNombre(nombre: string | null | undefined): string {
    if (!nombre) return '***';
    const trimmed = nombre.trim();
    if (!trimmed) return '***';

    const words = trimmed.split(/\s+/);
    const maskedWords = words.map(word => {
      if (word.length <= 2) return word; // Palabras cortas como 'DE', 'EL', 'LA' o iniciales
      const firstChar = word[0];
      const asterisks = '*'.repeat(Math.min(word.length - 1, 5));
      return `${firstChar}${asterisks}`;
    });

    return maskedWords.join(' ');
  }

  /**
   * Enmascara un correo electrónico.
   * Ejemplo: 'carlos.perez@gmail.com' -> 'c****z@gmail.com'
   */
  static maskEmail(email: string | null | undefined): string {
    if (!email || !email.includes('@')) return '***@***';
    const [user, domain] = email.trim().split('@');
    if (!domain) return '***@***';

    let maskedUser: string;
    if (user.length <= 2) {
      maskedUser = user[0] + '***';
    } else {
      maskedUser = `${user[0]}****${user[user.length - 1]}`;
    }

    return `${maskedUser}@${domain}`;
  }

  /**
   * Enmascara un número de teléfono o celular.
   * Ejemplo: '3128904567' -> '312****567'
   * Ejemplo fijo: '8234567' -> '823****67'
   */
  static maskTelefono(telefono: string | number | null | undefined): string {
    if (!telefono) return '***';
    const str = String(telefono).trim();
    if (str.length < 6) return '***';

    const start = str.slice(0, 3);
    const end = str.slice(-3);
    return `${start}****${end}`;
  }

  /**
   * Enmascara una dirección física residencial o comercial.
   * Ejemplo: 'Carrera 6 # 10N - 25 Barrio Bolívar' -> 'Carrera 6 # ** - ** Barrio Bolívar'
   */
  static maskDireccion(direccion: string | null | undefined): string {
    if (!direccion) return '***';
    const trimmed = direccion.trim();
    if (!trimmed) return '***';

    // Ocultar números de nomenclatura específicos (# 12 - 34)
    return trimmed.replace(/#\s*[\w\d-]+\s*-\s*[\w\d-]+/gi, '# ** - **')
                  .replace(/#\s*[\w\d-]+/gi, '# ***');
  }
}
