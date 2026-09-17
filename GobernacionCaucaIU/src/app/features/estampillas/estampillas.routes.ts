import { Routes } from '@angular/router';
import { EstampillasLayoutComponent } from './presentation/layout/estampillas-layout/estampillas-layout';

export const estampillasRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./presentation/pages/login/login').then(m => m.EstampillasLoginComponent)
  },
  {
    path: '',
    component: EstampillasLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./presentation/pages/dashboard/dashboard').then(m => m.EstampillasDashboardComponent)
      },
      // Liquidación
      {
        path: 'liquidar',
        loadComponent: () => import('./presentation/pages/liquidar/liquidar-wizard').then(m => m.LiquidarWizardComponent)
      },
      {
        path: 'liquidaciones',
        loadComponent: () => import('./presentation/pages/liquidaciones/liquidaciones-listado/liquidaciones-listado').then(m => m.LiquidacionesListadoComponent)
      },
      {
        path: 'liquidaciones/:id',
        loadComponent: () => import('./presentation/pages/liquidaciones/liquidacion-detalle/liquidacion-detalle').then(m => m.LiquidacionDetalleComponent)
      },
      {
        path: 'consultar',
        loadComponent: () => import('./presentation/pages/consultar/consultar-liquidacion').then(m => m.ConsultarLiquidacionComponent)
      },
      // Contribuyentes
      {
        path: 'contribuyentes',
        loadComponent: () => import('./presentation/pages/contribuyentes/contribuyentes-listado/contribuyentes-listado').then(m => m.ContribuyentesListadoComponent)
      },
      {
        path: 'contribuyentes/nuevo',
        loadComponent: () => import('./presentation/pages/contribuyentes/contribuyente-form/contribuyente-form').then(m => m.ContribuyenteFormComponent)
      },
      {
        path: 'contribuyentes/:id',
        loadComponent: () => import('./presentation/pages/contribuyentes/contribuyente-detalle/contribuyente-detalle').then(m => m.ContribuyenteDetalleComponent)
      },
      {
        path: 'contribuyentes/:id/editar',
        loadComponent: () => import('./presentation/pages/contribuyentes/contribuyente-form/contribuyente-form').then(m => m.ContribuyenteFormComponent)
      },
      // Contratos
      {
        path: 'contratos',
        loadComponent: () => import('./presentation/pages/contratos/contratos-listado/contratos-listado').then(m => m.ContratosListadoComponent)
      },
      {
        path: 'contratos/nuevo',
        loadComponent: () => import('./presentation/pages/contratos/contrato-form/contrato-form').then(m => m.ContratoFormComponent)
      },
      {
        path: 'contratos/:id/editar',
        loadComponent: () => import('./presentation/pages/contratos/contrato-form/contrato-form').then(m => m.ContratoFormComponent)
      },
      // Pagos
      {
        path: 'pagos',
        loadComponent: () => import('./presentation/pages/pagos/pagos-page').then(m => m.PagosPageComponent)
      },
      {
        path: 'pagos/pendientes',
        loadComponent: () => import('./presentation/pages/pagos/pagos-page').then(m => m.PagosPageComponent)
      },
      {
        path: 'pagos/realizados',
        loadComponent: () => import('./presentation/pages/pagos/pagos-page').then(m => m.PagosPageComponent)
      },
      {
        path: 'pagos/conciliacion',
        loadComponent: () => import('./presentation/pages/pagos/pagos-page').then(m => m.PagosPageComponent)
      },
      // Reportes
      {
        path: 'reportes',
        loadComponent: () => import('./presentation/pages/reportes/reportes-page').then(m => m.ReportesPageComponent)
      },
      {
        path: 'reportes/recaudo',
        loadComponent: () => import('./presentation/pages/reportes/reportes-page').then(m => m.ReportesPageComponent)
      },
      {
        path: 'reportes/liquidaciones',
        loadComponent: () => import('./presentation/pages/reportes/reportes-page').then(m => m.ReportesPageComponent)
      },
      {
        path: 'reportes/estadisticas',
        loadComponent: () => import('./presentation/pages/reportes/reportes-page').then(m => m.ReportesPageComponent)
      },
      // Administración
      {
        path: 'administracion/estampillas',
        loadComponent: () => import('./presentation/pages/administracion/estampillas-admin/estampillas-admin').then(m => m.EstampillasAdminComponent)
      },
      {
        path: 'administracion/tarifas',
        loadComponent: () => import('./presentation/pages/administracion/tarifas-admin/tarifas-admin').then(m => m.TarifasAdminComponent)
      },
      {
        path: 'administracion/vigencias',
        loadComponent: () => import('./presentation/pages/administracion/vigencias-admin/vigencias-admin').then(m => m.VigenciasAdminComponent)
      },
      {
        path: 'administracion/parametros',
        loadComponent: () => import('./presentation/pages/administracion/parametros-admin/parametros-admin').then(m => m.ParametrosAdminComponent)
      }
    ]
  }
];
