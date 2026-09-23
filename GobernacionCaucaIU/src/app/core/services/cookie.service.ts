import { Injectable } from '@angular/core';

export interface CookieOptions {
  days?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
}

@Injectable({
  providedIn: 'root',
})
export class CookieService {
  private isBrowser(): boolean {
    return typeof document !== 'undefined';
  }

  /**
   * Obtiene el valor de una cookie por su nombre
   */
  get(name: string): string | null {
    if (!this.isBrowser()) return null;

    const nameEQ = encodeURIComponent(name) + '=';
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        try {
          return decodeURIComponent(c.substring(nameEQ.length, c.length));
        } catch {
          return c.substring(nameEQ.length, c.length);
        }
      }
    }
    return null;
  }

  /**
   * Establece una cookie con políticas de seguridad recomendadas (SameSite=Lax, Secure en HTTPS)
   */
  set(name: string, value: string, options?: CookieOptions): void {
    if (!this.isBrowser()) return;

    const opts: CookieOptions = {
      path: '/',
      sameSite: 'Lax',
      secure: window.location.protocol === 'https:',
      ...options,
    };

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (opts.days) {
      const date = new Date();
      date.setTime(date.getTime() + opts.days * 24 * 60 * 60 * 1000);
      cookieString += `; expires=${date.toUTCString()}`;
    }

    if (opts.path) {
      cookieString += `; path=${opts.path}`;
    }

    if (opts.domain) {
      cookieString += `; domain=${opts.domain}`;
    }

    if (opts.sameSite) {
      cookieString += `; samesite=${opts.sameSite}`;
    }

    if (opts.secure) {
      cookieString += '; secure';
    }

    document.cookie = cookieString;
  }

  /**
   * Elimina una cookie
   */
  delete(name: string, path: string = '/'): void {
    if (!this.isBrowser()) return;
    this.set(name, '', { days: -1, path });
  }

  /**
   * Verifica si una cookie existe
   */
  check(name: string): boolean {
    if (!this.isBrowser()) return false;
    return this.get(name) !== null;
  }
}
