import { Routes } from '@angular/router';
import { Home } from './features/home/presentation/pages/home/home';
import { AutomotoresLayout } from './features/automotores/presentation/layout/automotores-layout';
import { Vehiculos } from './features/automotores/presentation/pages/vehiculos/vehiculos';
import { ContribuyentesIndex } from './features/automotores/presentation/pages/contribuyentes-index/contribuyentes-index';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    pathMatch: 'full',
  },
  {
    path: 'automotores',
    component: AutomotoresLayout,
    children: [
      {
        path: '',
        redirectTo: 'vehiculos',
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
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
