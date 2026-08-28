import { Routes } from '@angular/router';
import { Home } from './features/home/presentation/pages/home/home';
import { PortalCiudadano } from './features/automotores/presentation/pages/portal-ciudadano/portal-ciudadano';

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
