import { Routes } from '@angular/router';
import { RegistrosLayoutComponent } from './presentation/layout/registros-layout/registros-layout';
import { ConfiguracionLayoutComponent } from './presentation/layout/configuracion-layout/configuracion-layout';
import { Departamentos } from './presentation/pages/configuracion/territorio/departamentos/departamentos';
import { Municipios } from './presentation/pages/configuracion/territorio/municipios/municipios';
import { EstadosNorma } from './presentation/pages/configuracion/normatividad/estados-norma/estados-norma';
import { TiposNorma } from './presentation/pages/configuracion/normatividad/tipos-norma/tipos-norma';
import { Vigencias } from './presentation/pages/configuracion/normatividad/vigencias/vigencias';
import { Normas } from './presentation/pages/configuracion/normatividad/normas/normas';
import { TiposEntidadRegistro } from './presentation/pages/configuracion/entidades/tipos-entidad-registro/tipos-entidad-registro';
import { EntidadesRegistro } from './presentation/pages/configuracion/entidades/entidades-registro/entidades-registro';
import { CategoriasActo } from './presentation/pages/configuracion/actos-registrales/categorias-acto/categorias-acto';
import { NaturalezasActo } from './presentation/pages/configuracion/actos-registrales/naturalezas-acto/naturalezas-acto';
import { TiposActoRegistro } from './presentation/pages/configuracion/actos-registrales/tipos-acto-registro/tipos-acto-registro';
import { TiposCalculoTarifa } from './presentation/pages/configuracion/tarifas/tipos-calculo-tarifa/tipos-calculo-tarifa';
import { Tarifas } from './presentation/pages/configuracion/tarifas/tarifas/tarifas';

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
          },
          {
            path: 'normatividad/estado-norma',
            component: EstadosNorma
          },
          {
            path: 'normatividad/tipo-norma',
            component: TiposNorma
          },
          {
            path: 'normatividad/vigencia',
            component: Vigencias
          },
          {
            path: 'normatividad/normas',
            component: Normas
          },
          {
            path: 'entidades/tipo-entidad',
            component: TiposEntidadRegistro
          },
          {
            path: 'entidades/entidades',
            component: EntidadesRegistro
          },
          {
            path: 'actos-registrales/categoria-acto',
            component: CategoriasActo
          },
          {
            path: 'actos-registrales/naturaleza-acto',
            component: NaturalezasActo
          },
          {
            path: 'actos-registrales/tipo-acto',
            component: TiposActoRegistro
          },
          {
            path: 'tarifas/tipo-calculo',
            component: TiposCalculoTarifa
          },
          {
            path: 'tarifas/tarifas',
            component: Tarifas
          }
        ]
      }
    ]
  }
];








