import { Component, Input, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../../../../../shared/components/breadcrumb/breadcrumb.component';
import { BreadcrumbService, BreadcrumbItem } from '../../../../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css'
})
export class PageHeaderComponent {
  private router = inject(Router);
  private location = inject(Location);
  public breadcrumbService = inject(BreadcrumbService);

  @Input() breadcrumbs: (string | BreadcrumbItem)[] = [];
  @Input() title: string = '';
  @Input() tags: { text: string; type: string }[] = [];
  @Input() counts: { total?: number; active?: number; inactive?: number } | null = null;
  @Input() showHome: boolean = true;

  getLabel(crumb: string | { label: string; url?: string }): string {
    return typeof crumb === 'string' ? crumb : crumb.label;
  }

  getUrl(crumb: string | { label: string; url?: string }, index: number): string | null {
    if (typeof crumb !== 'string' && crumb.url) {
      return crumb.url;
    }
    const label = this.getLabel(crumb).toLowerCase().trim();
    const currentUrl = this.router.url;
    const isAutomotores = currentUrl.includes('/automotores');
    const baseConfig = isAutomotores ? '/automotores/configuracion' : '/registros/configuracion';

    if (label === 'inicio') return '/';
    if (label === 'registro' || label === 'registros') return '/registros/dashboard';
    if (label === 'vehicular' || label === 'automotores' || label === 'módulo vehicular') return '/automotores/dashboard';
    if (label === 'configuración' || label === 'configuracion') return baseConfig;

    if (!isAutomotores) {
      // Registros config categories
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
    } else {
      // Automotores config categories
      if (label === 'territorio') return '/automotores/configuracion/territorio/departamentos';
      if (label === 'vehicular') return '/automotores/configuracion/vehicular/clases';
      if (label === 'tránsito' || label === 'transito') return '/automotores/configuracion/transito/estados-matricula';
      if (label === 'contribuyentes') return '/automotores/configuracion/contribuyentes/tipos-documento';
      if (label === 'control') return '/automotores/configuracion/control/pendientes-aprobacion';
      if (label === 'valores estatales') return '/automotores/configuracion/valores-estatales';
      if (label === 'vehículos' || label === 'vehiculos') return '/automotores/vehiculos';
      if (label === 'liquidaciones') return '/automotores/liquidaciones';
    }

    return null;
  }

  onCrumbClick(crumb: string | { label: string; url?: string }, index: number, isLast: boolean): void {
    if (isLast) return;

    const url = this.getUrl(crumb, index);
    if (url) {
      this.router.navigateByUrl(url);
    } else {
      this.navigateFallback(index);
    }
  }

  navigateFallback(index: number): void {
    const currentUrl = this.router.url;
    const isAutomotores = currentUrl.includes('/automotores');

    if (currentUrl.includes('/configuracion')) {
      this.router.navigateByUrl(isAutomotores ? '/automotores/configuracion' : '/registros/configuracion');
    } else if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl(isAutomotores ? '/automotores/dashboard' : '/registros/dashboard');
    }
  }
}
