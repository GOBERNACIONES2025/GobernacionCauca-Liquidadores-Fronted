import { Routes } from '@angular/router';
import { Home } from './features/home/presentation/pages/home/home';
import { PortalCiudadano } from './features/automotores/presentation/pages/portal-ciudadano/portal-ciudadano';
import { PasaportesLayout } from './features/pasaportes/presentation/layout/pasaportes-layout';
import { InicioPasaportes } from './features/pasaportes/presentation/pages/inicio/inicio-pasaportes';
import { PasaportesAdminLogin } from './features/pasaportes/presentation/admin/pages/login/pasaportes-admin-login';
import { PasaportesAdminDashboard } from './features/pasaportes/presentation/admin/pages/dashboard/pasaportes-admin-dashboard';
import { pasaportesAdminGuard } from './features/pasaportes/application/auth/pasaportes-admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    pathMatch: 'full',
  },
  {
    path: 'portal-ciudadano',
    component: PortalCiudadano,
  },
  {
    path: 'automotores',
    loadChildren: () => import('./features/automotores/automotores.routes').then(m => m.automotoresRoutes)
  },
  {
    path: 'registros',
    loadChildren: () => import('./features/registros/registros.routes').then(m => m.registrosRoutes)
  }
];
