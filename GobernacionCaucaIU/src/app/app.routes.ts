import { Routes } from '@angular/router';
import { Home } from './features/home/presentation/pages/home/home';
import { PortalCiudadano } from './features/automotores/presentation/pages/portal-ciudadano/portal-ciudadano';
import { LoginComponent } from './shared/components/login/login';

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
