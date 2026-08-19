import { Routes } from '@angular/router';
import { Home } from './features/home/presentation/pages/home/home';
import { AutomotoresLayout } from './features/automotores/presentation/layout/automotores-layout';
import { Vehiculos } from './features/automotores/presentation/pages/vehiculos/vehiculos';
import { ContribuyentesIndex } from './features/automotores/presentation/pages/contribuyentes-index/contribuyentes-index';
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
    path: 'contribuyentes-index',
    component: ContribuyentesIndex,
  },
      {
        path: '**',
        redirectTo: 'portal-ciudadano',
      },
    ],
  },
];
