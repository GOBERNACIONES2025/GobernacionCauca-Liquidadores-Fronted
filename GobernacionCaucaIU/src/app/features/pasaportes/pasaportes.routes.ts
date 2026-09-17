import { Routes } from '@angular/router';
import { PasaportesLayout } from './presentation/layout/pasaportes-layout';
import { InicioPasaportes } from './presentation/pages/inicio/inicio-pasaportes';
import { PasaportesAdminDashboard } from './presentation/admin/pages/dashboard/pasaportes-admin-dashboard';
import { PasaportesAdminLayout } from './presentation/admin/layout/pasaportes-admin-layout';
import { PasaportesAdminConfiguracion } from './presentation/admin/pages/configuracion/pasaportes-admin-configuracion';
import { PasaportesAdminPlaceholder } from './presentation/admin/pages/placeholder/pasaportes-admin-placeholder';
import { PasaportesAdminCalendario } from './presentation/admin/pages/calendario/pasaportes-admin-calendario';
import { PasaportesAdminCitas } from './presentation/admin/pages/citas/pasaportes-admin-citas';
import { PasaportesAdminFormalizadores } from './presentation/admin/pages/formalizadores/pasaportes-admin-formalizadores';
import { PasaportesAdminPagos } from './presentation/admin/pages/pagos/pasaportes-admin-pagos';
import { pasaportesAdminGuard } from './application/auth/pasaportes-admin.guard';
import { ConsultaCiudadanaSharedComponent } from '../../shared/components/consulta-ciudadana/consulta-ciudadana-shared';

export const pasaportesRoutes: Routes = [
  {
    path: 'portal-ciudadano',
    component: ConsultaCiudadanaSharedComponent,
  },
  {
    path: 'admin/login',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    component: PasaportesAdminLayout,
    canActivate: [pasaportesAdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PasaportesAdminDashboard },
      { path: 'configuracion', component: PasaportesAdminConfiguracion },
      {
        path: 'citas',
        component: PasaportesAdminCitas,
      },
      {
        path: 'calendario',
        component: PasaportesAdminCalendario,
      },
      {
        path: 'formalizadores',
        component: PasaportesAdminFormalizadores,
      },
      {
        path: 'pagos',
        component: PasaportesAdminPagos,
      },
    ],
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
    ],
  },
];
