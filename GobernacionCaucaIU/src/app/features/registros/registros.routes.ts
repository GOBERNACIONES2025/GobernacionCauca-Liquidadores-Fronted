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
import { TiposBeneficiarioExencionComponent } from './presentation/pages/configuracion/exenciones/tipos-beneficiario-exencion/tipos-beneficiario-exencion';
import { Exenciones } from './presentation/pages/configuracion/exenciones/exenciones/exenciones';
import { TiposPersona } from './presentation/pages/configuracion/contribuyentes/tipos-persona/tipos-persona';
import { TiposIdentificacion } from './presentation/pages/configuracion/contribuyentes/tipos-identificacion/tipos-identificacion';
import { RolesComponent } from './presentation/pages/configuracion/seguridad/roles/roles';
import { UsuariosComponent } from './presentation/pages/configuracion/seguridad/usuarios/usuarios';
import { RolesInterviniente } from './presentation/pages/configuracion/intervinientes/roles-interviniente/roles-interviniente';
import { EstadosLiquidacion } from './presentation/pages/configuracion/liquidacion/estados-liquidacion/estados-liquidacion';
import { EstadosPago } from './presentation/pages/configuracion/pagos/estados-pago/estados-pago';
import { EstadosSolicitud } from './presentation/pages/configuracion/radicacion/estados-solicitud/estados-solicitud';
import { Contribuyentes } from './presentation/pages/configuracion/contribuyentes/contribuyentes/contribuyentes';
import { EntidadesTipoActoPermitidoComponent } from './presentation/pages/configuracion/entidades/entidades-tipo-acto-permitido/entidades-tipo-acto-permitido';
import { ActosExencionComponent } from './presentation/pages/configuracion/exenciones/actos-exencion/actos-exencion';
import { InmueblesComponent } from './presentation/pages/configuracion/inmuebles/inmuebles/inmuebles';

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
            path: 'inmuebles/inmuebles',
            component: InmueblesComponent
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
            path: 'entidades/actos-permitidos',
            component: EntidadesTipoActoPermitidoComponent
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
          },
          {
            path: 'exenciones/tipo-beneficiario',
            component: TiposBeneficiarioExencionComponent
          },
          {
            path: 'exenciones/exenciones',
            component: Exenciones
          },
          {
            path: 'exenciones/actos-exencion',
            component: ActosExencionComponent
          },
          {
            path: 'contribuyentes/directorio',
            component: Contribuyentes
          },
          {
            path: 'contribuyentes/tipo-persona',
            component: TiposPersona
          },
          {
            path: 'contribuyentes/tipo-documento',
            component: TiposIdentificacion
          },
          {
            path: 'intervinientes/roles-interviniente',
            component: RolesInterviniente
          },
          {
            path: 'liquidacion/estados-liquidacion',
            component: EstadosLiquidacion
          },
          {
            path: 'pagos/estados-pago',
            component: EstadosPago
          },
          {
            path: 'radicacion/estados-solicitud',
            component: EstadosSolicitud
          },
          {
            path: 'seguridad/roles',
            component: RolesComponent
          },
          {
            path: 'seguridad/usuarios',
            component: UsuariosComponent
          }
        ]
      }
    ]
  }
];











