import { Routes } from '@angular/router';
import { Home } from './features/home/presentation/pages/home/home';
import { AutomotoresLayout } from './features/automotores/presentation/layout/automotores-layout';
import { Vehiculos } from './features/automotores/presentation/pages/vehiculos/vehiculos';
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
    component: AutomotoresLayout,
    children: [
      {
        path: '',
        redirectTo: 'portal-ciudadano',
        pathMatch: 'full',
      },
      {
        path: 'vehiculos',
        component: Vehiculos,
      },
      {
        path: '**',
        redirectTo: 'portal-ciudadano',
      },
    ],
  },
  {
    path: 'pasaportes',
    component: PasaportesLayout,
    children: [
      {
        path: '',
        component: InicioPasaportes,
        pathMatch: 'full',
      },
      {
        path: 'admin/login',
        component: PasaportesAdminLogin,
      },
      {
        path: 'admin',
        component: PasaportesAdminDashboard,
        canActivate: [pasaportesAdminGuard],
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
