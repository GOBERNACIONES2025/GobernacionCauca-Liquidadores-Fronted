import { Routes } from '@angular/router';
import { Home } from './features/home/presentation/pages/home/home';
import { LoginComponent } from './shared/components/login/login';
import { ConsultaCiudadanaSharedComponent } from './shared/components/consulta-ciudadana/consulta-ciudadana-shared';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'deguello/portal-ciudadano',
    component: ConsultaCiudadanaSharedComponent,
  },
  {
    path: 'portal-ciudadano',
    redirectTo: 'automotores/portal-ciudadano',
    pathMatch: 'full',
  },
  {
    path: 'automotores',
    loadChildren: () => import('./features/automotores/automotores.routes').then(m => m.automotoresRoutes)
  },
  {
    path: 'registros',
    loadChildren: () => import('./features/registros/registros.routes').then(m => m.registrosRoutes)
  },
  {
    path: 'pasaportes',
    loadChildren: () => import('./features/pasaportes/pasaportes.routes').then(m => m.pasaportesRoutes)
  },
  {
    path: '**',
    redirectTo: '',
  }
];
