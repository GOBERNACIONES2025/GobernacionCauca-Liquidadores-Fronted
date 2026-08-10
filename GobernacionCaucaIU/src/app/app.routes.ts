import { Routes } from '@angular/router';
import { AutomotoresLayout } from '../features/automotores/presentation/layout/automotores-layout';
import { AutomotoresIndex } from './features/automotores/presentation/pages/automotores-index/automotores-index';

export const routes: Routes = [
  // {
  //   path: '',
  //   redirectTo: 'automotores',
  //   pathMatch: 'full',
  // },
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
        path: '**',
        redirectTo: 'vehiculos',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'automotores',
  },
  {
    path: '',
    redirectTo: 'automotores-index',
    pathMatch: 'full'
  },
  {
    path: 'automotores-index',
    component: AutomotoresIndex
  }
];
