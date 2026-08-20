import { Routes } from '@angular/router';
import { RegistrosLayoutComponent } from './presentation/layout/registros-layout/registros-layout';
import { ConfiguracionLayoutComponent } from './presentation/layout/configuracion-layout/configuracion-layout';
import { Departamentos } from './presentation/pages/configuracion/territorio/departamentos/departamentos';
import { Municipios } from './presentation/pages/configuracion/territorio/municipios/municipios';

export const registrosRoutes: Routes = [
  {
    path: '',
    component: RegistrosLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'configuracion',
        pathMatch: 'full'
      },
      {
        path: 'configuracion',
        component: ConfiguracionLayoutComponent,
        children: [
          {
            path: '',
            redirectTo: 'territorio/departamento',
            pathMatch: 'full'
          },
          {
            path: 'territorio/departamento',
            component: Departamentos
          },
          {
            path: 'territorio/municipio',
            component: Municipios
          }
        ]
      }
    ]
  }
];

