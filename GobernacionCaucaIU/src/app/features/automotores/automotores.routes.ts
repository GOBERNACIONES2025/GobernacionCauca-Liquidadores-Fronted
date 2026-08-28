import { Routes } from '@angular/router';
import { AutomotoresLayout } from './presentation/layout/automotores-layout';
import { Vehiculos } from './presentation/pages/vehiculos/vehiculos';
import { ContribuyentesIndex } from './presentation/pages/contribuyentes-index/contribuyentes-index';
import { LiquidacionesPage } from './presentation/pages/liquidaciones/liquidaciones';
import { AutomotoresConfiguracionLayout } from './presentation/layout/configuracion-layout/configuracion-layout';

// Catálogos & Configuración
import { DepartamentosPage } from './presentation/pages/configuracion/territorio/departamentos';
import { MunicipiosPage } from './presentation/pages/configuracion/territorio/municipios';
import { ClasesVehiculoPage } from './presentation/pages/configuracion/vehicular/clases-vehiculo';
import { TiposVehiculoPage } from './presentation/pages/configuracion/vehicular/tipos-vehiculo';
import { MarcasPage } from './presentation/pages/configuracion/vehicular/marcas';
import { LineasPage } from './presentation/pages/configuracion/vehicular/lineas';
import { CombustiblesPage } from './presentation/pages/configuracion/vehicular/combustibles';
import { ServiciosVehiculoPage } from './presentation/pages/configuracion/vehicular/servicios-vehiculo';
import { EstadosMatriculaPage } from './presentation/pages/configuracion/transito/estados-matricula';
import { OrganismosTransitoPage } from './presentation/pages/configuracion/transito/organismos-transito';
import { TiposVinculoPage } from './presentation/pages/configuracion/transito/tipos-vinculo';
import { TiposDocumentoPage } from './presentation/pages/configuracion/contribuyentes/tipos-documento';
import { NaturalezasJuridicasPage } from './presentation/pages/configuracion/contribuyentes/naturalezas-juridicas';
import { PendientesAprobacionPage } from './presentation/pages/configuracion/control/pendientes-aprobacion';

export const automotoresRoutes: Routes = [
  {
    path: '',
    component: AutomotoresLayout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('../../shared/dashboard/components/tax-dashboard/tax-dashboard').then(m => m.TaxDashboardComponent)
      },
      {
        path: 'vehiculos',
        component: Vehiculos
      },
      {
        path: 'contribuyentes-index',
        component: ContribuyentesIndex
      },
      {
        path: 'liquidaciones',
        component: LiquidacionesPage
      },
      {
        path: 'facturacion',
        redirectTo: 'liquidaciones',
        pathMatch: 'full'
      },
      {
        path: 'configuracion',
        component: AutomotoresConfiguracionLayout,
        children: [
          {
            path: '',
            redirectTo: 'territorio/departamentos',
            pathMatch: 'full'
          },
          {
            path: 'territorio/departamentos',
            component: DepartamentosPage
          },
          {
            path: 'territorio/municipios',
            component: MunicipiosPage
          },
          {
            path: 'vehicular/clases',
            component: ClasesVehiculoPage
          },
          {
            path: 'vehicular/tipos',
            component: TiposVehiculoPage
          },
          {
            path: 'vehicular/marcas',
            component: MarcasPage
          },
          {
            path: 'vehicular/lineas',
            component: LineasPage
          },
          {
            path: 'vehicular/combustibles',
            component: CombustiblesPage
          },
          {
            path: 'vehicular/servicios',
            component: ServiciosVehiculoPage
          },
          {
            path: 'transito/estados-matricula',
            component: EstadosMatriculaPage
          },
          {
            path: 'transito/organismos-transito',
            component: OrganismosTransitoPage
          },
          {
            path: 'transito/tipos-vinculo',
            component: TiposVinculoPage
          },
          {
            path: 'contribuyentes/tipos-documento',
            component: TiposDocumentoPage
          },
          {
            path: 'contribuyentes/naturalezas-juridicas',
            component: NaturalezasJuridicasPage
          },
          {
            path: 'control/pendientes-aprobacion',
            component: PendientesAprobacionPage
          }
        ]
      }
    ]
  }
];
