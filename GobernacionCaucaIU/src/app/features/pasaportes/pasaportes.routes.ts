import { Routes } from '@angular/router';
import { PasaportesLayout } from './presentation/layout/pasaportes-layout';
import { InicioPasaportes } from './presentation/pages/inicio/inicio-pasaportes';
import { PasaportesAdminDashboard } from './presentation/admin/pages/dashboard/pasaportes-admin-dashboard';
import { pasaportesAdminGuard } from './application/auth/pasaportes-admin.guard';
import { ConsultaCiudadanaSharedComponent } from '../../shared/components/consulta-ciudadana/consulta-ciudadana-shared';

export const pasaportesRoutes: Routes = [
  {
    path: 'portal-ciudadano',
    component: ConsultaCiudadanaSharedComponent,
  },
  {
    path: '',
    component: PasaportesLayout,
    children: [
      {
        path: '',
        component: InicioPasaportes,
        pathMatch: 'full',
      },
      {
        path: 'admin/login',
        redirectTo: '/login',
        pathMatch: 'full',
      },
      {
        path: 'admin',
        component: PasaportesAdminDashboard,
        canActivate: [pasaportesAdminGuard],
      },
    ],
  },
];
