import { Routes } from '@angular/router';
import { DeguelloLayoutComponent } from './presentation/layout/deguello-layout/deguello-layout';

export const deguelloRoutes: Routes = [
  {
    path: 'portal-ciudadano',
    loadComponent: () =>
      import('./presentation/pages/portal-ciudadano/deguello-portal-ciudadano').then(
        (m) => m.DeguelloPortalCiudadanoComponent
      ),
  },
  {
    path: '',
    component: DeguelloLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../../shared/dashboard/components/tax-dashboard/tax-dashboard').then(
            (m) => m.TaxDashboardComponent
          ),
      },
      {
        path: 'liquidacion',
        loadComponent: () =>
          import('./presentation/pages/liquidacion/deguello-liquidacion').then(
            (m) => m.DeguelloLiquidacionComponent
          ),
      },
      {
        path: 'facturacion',
        loadComponent: () =>
          import('./presentation/pages/facturacion/deguello-facturacion').then(
            (m) => m.DeguelloFacturacionComponent
          ),
      },
      {
        path: 'parametrizacion',
        loadComponent: () =>
          import('./presentation/pages/parametrizacion/deguello-parametrizacion').then(
            (m) => m.DeguelloParametrizacionComponent
          ),
      },
      {
        path: 'informes',
        loadComponent: () =>
          import('./presentation/pages/informes/deguello-informes').then(
            (m) => m.DeguelloInformesComponent
          ),
      },
    ],
  },
];
