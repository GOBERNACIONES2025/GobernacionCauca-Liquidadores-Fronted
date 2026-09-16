import { Routes } from '@angular/router';
import { LicoresLayout } from './presentation/layout/licores-layout/licores-layout';
import { PortalCiudadanoLicoresComponent } from './presentation/pages/portal-ciudadano/portal-ciudadano';
import { TaxDashboardComponent } from '../../shared/dashboard/components/tax-dashboard/tax-dashboard';
import { LicoresAuditoriaComponent } from './presentation/pages/auditoria/licores-auditoria';
import { LicoresLiquidacionesComponent } from './presentation/pages/liquidaciones/licores-liquidaciones';
import { LicoresLegalizacionComponent } from './presentation/pages/legalizacion/licores-legalizacion';
import { LicoresConfiguracionComponent } from './presentation/pages/configuracion/licores-configuracion';

export const licoresRoutes: Routes = [
  // 1. PORTAL CIUDADANO / CONTRIBUYENTE (VISTA PÚBLICA / FORMULARIO Y CONSULTA)
  {
    path: 'portal-ciudadano',
    component: PortalCiudadanoLicoresComponent,
    title: 'Portal Ciudadano - Licores & Tornaguías | Gobernación del Cauca',
  },
  {
    path: 'portal-contribuyente',
    redirectTo: 'portal-ciudadano',
    pathMatch: 'full',
  },
  {
    path: 'contribuyente',
    redirectTo: 'portal-ciudadano',
    pathMatch: 'full',
  },

  // 2. PANEL ADMINISTRATIVO DEL FUNCIONARIO DE RENTAS (CON SIDEBAR Y TOPBAR)
  {
    path: '',
    component: LicoresLayout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: TaxDashboardComponent,
        title: 'Dashboard Licores ICL | Gobernación del Cauca',
      },
      {
        path: 'auditoria',
        component: LicoresAuditoriaComponent,
        title: 'Bandeja de Aprobación Fiscal | Gobernación del Cauca',
      },
      {
        path: 'solicitudes',
        redirectTo: 'auditoria',
        pathMatch: 'full',
      },
      {
        path: 'liquidaciones',
        component: LicoresLiquidacionesComponent,
        title: 'Expediente de Liquidaciones ICL | Gobernación del Cauca',
      },
      {
        path: 'legalizacion',
        component: LicoresLegalizacionComponent,
        title: 'Control y Legalización de Tornaguías | Gobernación del Cauca',
      },
      {
        path: 'tornaguias',
        redirectTo: 'legalizacion',
        pathMatch: 'full',
      },
      {
        path: 'configuracion',
        component: LicoresConfiguracionComponent,
        title: 'Configuración y Catálogos Ley 1816 | Gobernación del Cauca',
      },
      {
        path: 'catalogo',
        redirectTo: 'configuracion',
        pathMatch: 'full',
      },
      {
        path: 'rentas',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'admin',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
