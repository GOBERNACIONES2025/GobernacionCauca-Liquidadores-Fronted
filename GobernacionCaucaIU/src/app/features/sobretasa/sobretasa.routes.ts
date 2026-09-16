import { Routes } from '@angular/router';
import { SobretasaLayout } from './presentation/layout/sobretasa-layout/sobretasa-layout';
import { SobretasaPortalCiudadanoComponent } from './presentation/pages/portal-ciudadano/portal-ciudadano';
import { TaxDashboardComponent } from '../../shared/dashboard/components/tax-dashboard/tax-dashboard';
import { SobretasaFiscalizacionComponent } from './presentation/pages/fiscalizacion/sobretasa-fiscalizacion';
import { SobretasaDeclaracionesComponent } from './presentation/pages/declaraciones/sobretasa-declaraciones';
import { SobretasaConfiguracionComponent } from './presentation/pages/configuracion/sobretasa-configuracion';

export const sobretasaRoutes: Routes = [
  // Portal del Ciudadano / Agente Mayorista (Sin el sidebar administrativo)
  {
    path: 'portal-ciudadano',
    component: SobretasaPortalCiudadanoComponent,
    title: 'Portal Mayorista - Sobretasa a la Gasolina y ACPM | Gobernación del Cauca',
  },
  // Panel Administrativo del Funcionario Fiscal (Con Layout, Sidebar y Topbar)
  {
    path: '',
    component: SobretasaLayout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: TaxDashboardComponent,
        title: 'Dashboard de Sobretasa a Combustibles | Gobernación del Cauca',
      },
      {
        path: 'fiscalizacion',
        component: SobretasaFiscalizacionComponent,
        title: 'Fiscalización y SICOM - Sobretasa | Gobernación del Cauca',
      },
      {
        path: 'declaraciones',
        component: SobretasaDeclaracionesComponent,
        title: 'Expediente de Declaraciones - Sobretasa | Gobernación del Cauca',
      },
      {
        path: 'configuracion',
        component: SobretasaConfiguracionComponent,
        title: 'Catálogos y Tarifas - Sobretasa | Gobernación del Cauca',
      },
    ],
  },
];
