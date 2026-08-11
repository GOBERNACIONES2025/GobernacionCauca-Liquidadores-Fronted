import { Routes } from '@angular/router';
import { AutomotoresLayout } from '../features/automotores/presentation/layout/automotores-layout';
import { Home } from '../features/home/presentation/pages/home/home';

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
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
