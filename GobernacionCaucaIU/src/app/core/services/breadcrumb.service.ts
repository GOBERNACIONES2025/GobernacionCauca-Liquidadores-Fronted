import { Injectable, inject, signal, computed } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private location = inject(Location);

  private readonly _breadcrumbs = signal<BreadcrumbItem[]>([]);
  private readonly _customOverride = signal<BreadcrumbItem[] | null>(null);

  /** Signal público con las migas de pan calculadas o sobreescritas dinámicamente */
  readonly breadcrumbs = computed(() => {
    const custom = this._customOverride();
    if (custom && custom.length > 0) {
      return custom;
    }
    return this._breadcrumbs();
  });

  constructor() {
    // Generar migas iniciales
    this.updateBreadcrumbsFromUrl(this.router.url);

    // Escuchar cambios de navegación
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this._customOverride.set(null); // Reiniciar sobreescritura al navegar
      this.updateBreadcrumbsFromUrl(event.urlAfterRedirects || event.url);
    });
  }

  /**
   * Permite a un componente establecer migas de pan personalizadas en tiempo de ejecución
   * (ej. para mostrar un radicado específico o placa de vehículo).
   */
  setCustomBreadcrumbs(crumbs: (string | BreadcrumbItem)[]): void {
    const formatted: BreadcrumbItem[] = crumbs.map((c, idx) => {
      if (typeof c === 'string') {
        const isLast = idx === crumbs.length - 1;
        return {
          label: c,
          active: isLast,
          url: isLast ? undefined : this.resolveUrlByLabel(c)
        };
      }
      return {
        ...c,
        active: c.active !== undefined ? c.active : (idx === crumbs.length - 1)
      };
    });

    // Asegurar que Inicio esté presente al principio si no se incluyó
    if (formatted.length > 0 && formatted[0].label.toLowerCase() !== 'inicio') {
      formatted.unshift({ label: 'Inicio', url: '/' });
    }

    this._customOverride.set(formatted);
  }

  /** Actualiza la etiqueta del último elemento activo */
  setPageTitle(title: string): void {
    const current = this.breadcrumbs();
    if (current.length > 0) {
      const updated = [...current];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        label: title
      };
      this._customOverride.set(updated);
    }
  }

  /** Limpia sobreescrituras personalizadas y vuelve a las automáticas */
  reset(): void {
    this._customOverride.set(null);
    this.updateBreadcrumbsFromUrl(this.router.url);
  }

  /**
   * Navega a un elemento de la miga de pan de forma segura con fallback
   */
  navigateTo(crumb: BreadcrumbItem, index: number): void {
    if (crumb.active) return;

    if (crumb.url) {
      this.router.navigateByUrl(crumb.url);
      return;
    }

    // Si el elemento no tiene URL explícita, intentamos resolverla por su etiqueta
    const resolvedUrl = this.resolveUrlByLabel(crumb.label);
    if (resolvedUrl) {
      this.router.navigateByUrl(resolvedUrl);
      return;
    }

    // Fallback si no tiene navegación directa: ir a la ruta anterior válida
    this.navigateFallback(index);
  }

  navigateFallback(index: number): void {
    const current = this.breadcrumbs();
    // Buscar el elemento anterior con URL válida
    for (let i = index - 1; i >= 0; i--) {
      if (current[i] && current[i].url) {
        this.router.navigateByUrl(current[i].url!);
        return;
      }
    }

    // Fallbacks generales según el módulo activo
    const url = this.router.url;
    if (url.includes('/automotores')) {
      this.router.navigateByUrl('/automotores/dashboard');
    } else if (url.includes('/registros')) {
      this.router.navigateByUrl('/registros/dashboard');
    } else if (url.includes('/pasaportes')) {
      this.router.navigateByUrl('/pasaportes');
    } else if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PARSER DE RUTAS Y JERARQUÍAS
  // ──────────────────────────────────────────────────────────────────────────

  private updateBreadcrumbsFromUrl(rawUrl: string): void {
    const url = rawUrl.split('?')[0].split('#')[0];
    if (url === '/' || url === '') {
      this._breadcrumbs.set([{ label: 'Inicio', url: '/', active: true }]);
      return;
    }

    const segments = url.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ label: 'Inicio', url: '/' }];

    let accumulatedUrl = '';

    // Módulos Principales
    const rootModule = segments[0]?.toLowerCase();

    if (rootModule === 'automotores') {
      crumbs.push({ label: 'Módulo Vehicular', url: '/automotores/dashboard' });
      accumulatedUrl = '/automotores';

      if (segments.length === 1 || segments[1] === 'dashboard') {
        crumbs.push({ label: 'Dashboard General', active: true });
      } else if (segments[1] === 'vehiculos') {
        crumbs.push({ label: 'Expediente Vehicular', active: true });
      } else if (segments[1] === 'contribuyentes-index' || segments[1] === 'contribuyentes') {
        crumbs.push({ label: 'Contribuyentes', active: true });
      } else if (segments[1] === 'liquidaciones' || segments[1] === 'facturacion') {
        crumbs.push({ label: 'Liquidaciones & Facturación', active: true });
      } else if (segments[1] === 'certificados') {
        crumbs.push({ label: 'Certificados', active: true });
      } else if (segments[1] === 'auditoria') {
        crumbs.push({ label: 'Auditoría', active: true });
      } else if (segments[1] === 'reglas-tributarias') {
        crumbs.push({ label: 'Reglas Tributarias', active: true });
      } else if (segments[1] === 'valores-estatales') {
        crumbs.push({ label: 'Valores Estatales', active: true });
      } else if (segments[1] === 'portal-ciudadano') {
        crumbs.push({ label: 'Portal Ciudadano', active: true });
      } else if (segments[1] === 'configuracion') {
        crumbs.push({ label: 'Configuración', url: '/automotores/configuracion' });
        
        if (segments.length >= 3) {
          const category = segments[2]?.toLowerCase();
          const subItem = segments[3]?.toLowerCase();
          
          const catInfo = this.getAutomotoresConfigCategory(category);
          if (catInfo) {
            crumbs.push({ label: catInfo.label, url: catInfo.url });
          }

          if (subItem) {
            const subLabel = this.getAutomotoresConfigSubItem(category, subItem);
            crumbs.push({ label: subLabel, active: true });
          } else if (catInfo) {
            crumbs[crumbs.length - 1].active = true;
            crumbs[crumbs.length - 1].url = undefined;
          }
        } else {
          crumbs[crumbs.length - 1].active = true;
          crumbs[crumbs.length - 1].url = undefined;
        }
      }
    } else if (rootModule === 'registros') {
      crumbs.push({ label: 'Registro', url: '/registros/dashboard' });
      accumulatedUrl = '/registros';

      if (segments.length === 1 || segments[1] === 'dashboard') {
        crumbs.push({ label: 'Dashboard', active: true });
      } else if (segments[1] === 'solicitudes') {
        if (segments[2] === 'wizard') {
          crumbs.push({ label: 'Solicitudes', url: '/registros/solicitudes' });
          crumbs.push({ label: segments[3] ? `Expediente ${segments[3]}` : 'Nueva Solicitud', active: true });
        } else {
          crumbs.push({ label: 'Solicitudes', active: true });
        }
      } else if (segments[1] === 'liquidaciones') {
        crumbs.push({ label: 'Liquidaciones Oficiales', active: true });
      } else if (segments[1] === 'portal-ciudadano') {
        crumbs.push({ label: 'Portal Ciudadano', active: true });
      } else if (segments[1] === 'configuracion') {
        crumbs.push({ label: 'Configuración', url: '/registros/configuracion' });

        if (segments.length >= 3) {
          const category = segments[2]?.toLowerCase();
          const subItem = segments[3]?.toLowerCase();

          const catInfo = this.getRegistrosConfigCategory(category);
          if (catInfo) {
            crumbs.push({ label: catInfo.label, url: catInfo.url });
          }

          if (subItem) {
            const subLabel = this.getRegistrosConfigSubItem(category, subItem);
            crumbs.push({ label: subLabel, active: true });
          } else if (catInfo) {
            crumbs[crumbs.length - 1].active = true;
            crumbs[crumbs.length - 1].url = undefined;
          }
        } else {
          crumbs[crumbs.length - 1].active = true;
          crumbs[crumbs.length - 1].url = undefined;
        }
      }
    } else if (rootModule === 'pasaportes') {
      crumbs.push({ label: 'Pasaportes', url: '/pasaportes' });
      if (segments[1] === 'admin') {
        crumbs.push({ label: 'Panel de Administración', active: true });
      } else if (segments[1] === 'portal-ciudadano') {
        crumbs.push({ label: 'Portal Ciudadano', active: true });
      } else {
        crumbs[crumbs.length - 1].active = true;
      }
    } else if (rootModule === 'login') {
      crumbs.push({ label: 'Iniciar Sesión', active: true });
    } else {
      // Rutas genéricas
      segments.forEach((seg, idx) => {
        accumulatedUrl += `/${seg}`;
        const isLast = idx === segments.length - 1;
        const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
        crumbs.push({
          label,
          url: isLast ? undefined : accumulatedUrl,
          active: isLast
        });
      });
    }

    // Asegurar que el último elemento siempre esté marcado como activo
    if (crumbs.length > 0) {
      crumbs[crumbs.length - 1].active = true;
      crumbs[crumbs.length - 1].url = undefined;
    }

    this._breadcrumbs.set(crumbs);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DICCIONARIOS DE CONFIGURACIÓN Y MAPEOS
  // ──────────────────────────────────────────────────────────────────────────

  private getAutomotoresConfigCategory(category: string): { label: string; url: string } | null {
    switch (category) {
      case 'territorio':
        return { label: 'Territorio', url: '/automotores/configuracion/territorio/departamentos' };
      case 'vehicular':
        return { label: 'Vehicular', url: '/automotores/configuracion/vehicular/clases' };
      case 'transito':
        return { label: 'Tránsito', url: '/automotores/configuracion/transito/estados-matricula' };
      case 'contribuyentes':
        return { label: 'Contribuyentes', url: '/automotores/configuracion/contribuyentes/tipos-documento' };
      case 'control':
        return { label: 'Control', url: '/automotores/configuracion/control/pendientes-aprobacion' };
      case 'valores-estatales':
        return { label: 'Valores Estatales', url: '/automotores/configuracion/valores-estatales' };
      default:
        return { label: category.charAt(0).toUpperCase() + category.slice(1), url: `/automotores/configuracion` };
    }
  }

  private getAutomotoresConfigSubItem(category: string, subItem: string): string {
    const map: Record<string, string> = {
      'departamentos': 'Departamentos',
      'municipios': 'Municipios',
      'clases': 'Clases de Vehículo',
      'tipos': 'Tipos de Vehículo',
      'marcas': 'Marcas',
      'lineas': 'Líneas',
      'combustibles': 'Combustibles',
      'servicios': 'Servicios de Vehículo',
      'estados-matricula': 'Estados de Matrícula',
      'organismos-transito': 'Organismos de Tránsito',
      'tipos-vinculo': 'Tipos de Vínculo',
      'tipos-documento': 'Tipos de Documento',
      'naturalezas-juridicas': 'Naturalezas Jurídicas',
      'pendientes-aprobacion': 'Pendientes de Aprobación',
      'uvt': 'UVT Histórico',
      'tasas': 'Tasas de Interés',
      'salarios': 'Salario Mínimo'
    };
    return map[subItem] || subItem.charAt(0).toUpperCase() + subItem.slice(1).replace(/-/g, ' ');
  }

  private getRegistrosConfigCategory(category: string): { label: string; url: string } | null {
    switch (category) {
      case 'territorio':
        return { label: 'Territorio', url: '/registros/configuracion/territorio/departamento' };
      case 'normatividad':
        return { label: 'Normatividad', url: '/registros/configuracion/normatividad/estado-norma' };
      case 'entidades':
        return { label: 'Entidades', url: '/registros/configuracion/entidades/tipo-entidad' };
      case 'actos-registrales':
        return { label: 'Actos Registrales', url: '/registros/configuracion/actos-registrales/categoria-acto' };
      case 'tarifas':
        return { label: 'Tarifas', url: '/registros/configuracion/tarifas/tipo-calculo' };
      case 'exenciones':
        return { label: 'Exenciones', url: '/registros/configuracion/exenciones/tipo-beneficiario' };
      case 'contribuyentes':
        return { label: 'Contribuyentes', url: '/registros/configuracion/contribuyentes/directorio' };
      case 'intervinientes':
        return { label: 'Intervinientes', url: '/registros/configuracion/intervinientes/roles-interviniente' };
      case 'liquidacion':
        return { label: 'Liquidación', url: '/registros/configuracion/liquidacion/estados-liquidacion' };
      case 'pagos':
        return { label: 'Pagos', url: '/registros/configuracion/pagos/estados-pago' };
      case 'radicacion':
        return { label: 'Radicación', url: '/registros/configuracion/radicacion/estados-solicitud' };
      case 'seguridad':
        return { label: 'Seguridad', url: '/registros/configuracion/seguridad/roles' };
      case 'inmuebles':
        return { label: 'Inmuebles', url: '/registros/configuracion/inmuebles/inmuebles' };
      default:
        return { label: category.charAt(0).toUpperCase() + category.slice(1), url: `/registros/configuracion` };
    }
  }

  private getRegistrosConfigSubItem(category: string, subItem: string): string {
    const map: Record<string, string> = {
      'departamento': 'Departamentos',
      'municipio': 'Municipios',
      'inmuebles': 'Inmuebles y Avalúos',
      'estado-norma': 'Estados de Norma',
      'tipo-norma': 'Tipos de Norma',
      'vigencia': 'Vigencias',
      'normas': 'Normas',
      'tipo-entidad': 'Tipos de Entidad',
      'entidades': 'Entidades de Registro',
      'actos-permitidos': 'Actos Permitidos por Entidad',
      'categoria-acto': 'Categorías de Acto',
      'naturaleza-acto': 'Naturalezas de Acto',
      'tipo-acto': 'Tipos de Acto',
      'tipo-calculo': 'Tipos de Cálculo de Tarifa',
      'tarifas': 'Tarifas',
      'extemporaneidad': 'Configuración de Extemporaneidad',
      'tasas-mora': 'Tasas de Interés de Mora',
      'tipo-beneficiario': 'Tipos de Beneficiario de Exención',
      'exenciones': 'Exenciones',
      'directorio': 'Directorio de Contribuyentes',
      'tipo-persona': 'Tipos de Persona',
      'tipo-documento': 'Tipos de Documento',
      'roles-interviniente': 'Roles de Interviniente',
      'estados-liquidacion': 'Estados de Liquidación',
      'estados-pago': 'Estados de Pago',
      'estados-solicitud': 'Estados de Solicitud',
      'roles': 'Roles de Seguridad',
      'usuarios': 'Usuarios del Sistema'
    };
    return map[subItem] || subItem.charAt(0).toUpperCase() + subItem.slice(1).replace(/-/g, ' ');
  }

  private resolveUrlByLabel(rawLabel: string): string | undefined {
    const label = rawLabel.toLowerCase().trim();
    const url = this.router.url;
    const isAutomotores = url.includes('/automotores');

    if (label === 'inicio') return '/';
    if (label === 'módulo vehicular' || label === 'vehicular' || label === 'automotores') return '/automotores/dashboard';
    if (label === 'registro' || label === 'registros') return '/registros/dashboard';
    if (label === 'configuración' || label === 'configuracion') return isAutomotores ? '/automotores/configuracion' : '/registros/configuracion';

    if (isAutomotores) {
      if (label === 'territorio') return '/automotores/configuracion/territorio/departamentos';
      if (label === 'vehicular') return '/automotores/configuracion/vehicular/clases';
      if (label === 'tránsito' || label === 'transito') return '/automotores/configuracion/transito/estados-matricula';
      if (label === 'contribuyentes') return '/automotores/configuracion/contribuyentes/tipos-documento';
      if (label === 'control') return '/automotores/configuracion/control/pendientes-aprobacion';
      if (label === 'valores estatales') return '/automotores/configuracion/valores-estatales';
      if (label === 'vehículos' || label === 'vehiculos') return '/automotores/vehiculos';
      if (label === 'liquidaciones' || label === 'liquidaciones & facturación') return '/automotores/liquidaciones';
    } else {
      if (label === 'territorio') return '/registros/configuracion/territorio/departamento';
      if (label === 'normatividad') return '/registros/configuracion/normatividad/estado-norma';
      if (label === 'entidades') return '/registros/configuracion/entidades/tipo-entidad';
      if (label === 'actos registrales' || label === 'actos') return '/registros/configuracion/actos-registrales/categoria-acto';
      if (label === 'tarifas') return '/registros/configuracion/tarifas/tipo-calculo';
      if (label === 'exenciones') return '/registros/configuracion/exenciones/tipo-beneficiario';
      if (label === 'contribuyentes') return '/registros/configuracion/contribuyentes/directorio';
      if (label === 'intervinientes') return '/registros/configuracion/intervinientes/roles-interviniente';
      if (label === 'liquidación' || label === 'liquidacion') return '/registros/configuracion/liquidacion/estados-liquidacion';
      if (label === 'pagos') return '/registros/configuracion/pagos/estados-pago';
      if (label === 'radicación' || label === 'radicacion') return '/registros/configuracion/radicacion/estados-solicitud';
      if (label === 'seguridad') return '/registros/configuracion/seguridad/roles';
      if (label === 'inmuebles') return '/registros/configuracion/inmuebles/inmuebles';
      if (label === 'solicitudes') return '/registros/solicitudes';
      if (label === 'liquidaciones') return '/registros/liquidaciones';
    }

    return undefined;
  }
}
