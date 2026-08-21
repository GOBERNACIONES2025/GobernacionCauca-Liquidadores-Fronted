import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DepartamentosFacade } from '../../../../application/facades/Territorios/departamentos.facade';
import { MunicipiosFacade } from '../../../../application/facades/Territorios/municipios.facade';
import { EstadosNormaFacade } from '../../../../application/facades/Normatividad/estados-norma.facade';
import { TiposNormaFacade } from '../../../../application/facades/Normatividad/tipos-norma.facade';
import { VigenciasFacade } from '../../../../application/facades/Normatividad/vigencias.facade';
import { NormasFacade } from '../../../../application/facades/Normatividad/normas.facade';
import { TiposEntidadRegistroFacade } from '../../../../application/facades/Registro/tipos-entidad-registro.facade';
import { EntidadesRegistroFacade } from '../../../../application/facades/Registro/entidades-registro.facade';
import { CategoriasActoFacade } from '../../../../application/facades/Registro/categorias-acto.facade';
import { NaturalezasActoFacade } from '../../../../application/facades/Registro/naturalezas-acto.facade';
import { TiposActoRegistroFacade } from '../../../../application/facades/Registro/tipos-acto-registro.facade';
import { TiposCalculoTarifaFacade } from '../../../../application/facades/Tarifas/tipos-calculo-tarifa.facade';
import { TarifasFacade } from '../../../../application/facades/Tarifas/tarifas.facade';
import { TiposBeneficiarioExencionFacade } from '../../../../application/facades/Exenciones/tipos-beneficiario-exencion.facade';
import { ExencionesFacade } from '../../../../application/facades/Exenciones/exenciones.facade';
import { TiposPersonaFacade } from '../../../../application/facades/Contribuyentes/tipos-persona.facade';
import { TiposIdentificacionFacade } from '../../../../application/facades/Contribuyentes/tipos-identificacion.facade';
import { RolesFacade } from '../../../../application/facades/Seguridad/roles.facade';
import { UsuariosFacade } from '../../../../application/facades/Seguridad/usuarios.facade';
import { RolesIntervinienteFacade } from '../../../../application/facades/Intervinientes/roles-interviniente.facade';

export interface CatalogItem {
  name: string;
  route?: string;
  count?: number;
  countFn?: () => number;
  hasWarning?: boolean;
}

export interface CatalogGroup {
  name: string;
  items: CatalogItem[];
}

@Component({
  selector: 'app-config-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './config-sidebar.html',
  styleUrl: './config-sidebar.css',
})
export class ConfigSidebar {
  private departamentosFacade = inject(DepartamentosFacade);
  private municipiosFacade = inject(MunicipiosFacade);
  private estadosNormaFacade = inject(EstadosNormaFacade);
  private tiposNormaFacade = inject(TiposNormaFacade);
  private vigenciasFacade = inject(VigenciasFacade);
  private normasFacade = inject(NormasFacade);
  private tiposEntidadFacade = inject(TiposEntidadRegistroFacade);
  private entidadesRegistroFacade = inject(EntidadesRegistroFacade);
  private categoriasFacade = inject(CategoriasActoFacade);
  private naturalezasFacade = inject(NaturalezasActoFacade);
  private tiposActoFacade = inject(TiposActoRegistroFacade);
  private tiposCalculoFacade = inject(TiposCalculoTarifaFacade);
  private tarifasFacade = inject(TarifasFacade);
  private tiposBeneficiarioFacade = inject(TiposBeneficiarioExencionFacade);
  private exencionesFacade = inject(ExencionesFacade);
  private tiposPersonaFacade = inject(TiposPersonaFacade);
  private tiposIdentificacionFacade = inject(TiposIdentificacionFacade);
  private rolesFacade = inject(RolesFacade);
  private usuariosFacade = inject(UsuariosFacade);
  private rolesIntervinienteFacade = inject(RolesIntervinienteFacade);

  readonly closeSidebar = output<void>();

  searchTerm = signal('');

  catalogGroups = computed<CatalogGroup[]>(() => [
    {
      name: 'Territorio',
      items: [
        { 
          name: 'Departamento', 
          route: '/registros/configuracion/territorio/departamento', 
          count: this.departamentosFacade.totalDepartamentos() || this.departamentosFacade.departamentos().length 
        },
        { 
          name: 'Municipio', 
          route: '/registros/configuracion/territorio/municipio', 
          count: this.municipiosFacade.totalMunicipios() || this.municipiosFacade.municipios().length, 
          hasWarning: true 
        }
      ]
    },
    {
      name: 'Normatividad',
      items: [
        { 
          name: 'Estado de Norma', 
          route: '/registros/configuracion/normatividad/estado-norma', 
          count: this.estadosNormaFacade.totalEstadosNorma() || this.estadosNormaFacade.estadosNorma().length 
        },
        { 
          name: 'Tipo de Norma', 
          route: '/registros/configuracion/normatividad/tipo-norma', 
          count: this.tiposNormaFacade.totalTiposNorma() || this.tiposNormaFacade.tiposNorma().length 
        },
        { 
          name: 'Vigencia', 
          route: '/registros/configuracion/normatividad/vigencia', 
          count: this.vigenciasFacade.totalVigencias() || this.vigenciasFacade.vigencias().length 
        },
        { 
          name: 'Norma', 
          route: '/registros/configuracion/normatividad/normas', 
          count: this.normasFacade.totalNormas() || this.normasFacade.normas().length,
          hasWarning: true 
        }
      ]
    },
    {
      name: 'Entidades',
      items: [
        { 
          name: 'Tipo de Entidad de Registro', 
          route: '/registros/configuracion/entidades/tipo-entidad',
          count: this.tiposEntidadFacade.totalTiposEntidadRegistro() || this.tiposEntidadFacade.tiposEntidadRegistro().length 
        },
        { 
          name: 'Entidad de Registro', 
          route: '/registros/configuracion/entidades/entidades',
          count: this.entidadesRegistroFacade.totalEntidadesRegistro() || this.entidadesRegistroFacade.entidadesRegistro().length, 
          hasWarning: true 
        }
      ]
    },
    {
      name: 'Actos Registrales',
      items: [
        { 
          name: 'Categoría de Acto', 
          route: '/registros/configuracion/actos-registrales/categoria-acto',
          count: this.categoriasFacade.totalCategoriasActo() || this.categoriasFacade.categoriasActo().length 
        },
        { 
          name: 'Naturaleza de Acto', 
          route: '/registros/configuracion/actos-registrales/naturaleza-acto',
          count: this.naturalezasFacade.totalNaturalezasActo() || this.naturalezasFacade.naturalezasActo().length 
        },
        { 
          name: 'Tipo de Acto de Registro', 
          route: '/registros/configuracion/actos-registrales/tipo-acto',
          count: this.tiposActoFacade.totalTiposActoRegistro() || this.tiposActoFacade.tiposActoRegistro().length, 
          hasWarning: true 
        }
      ]
    },

    {
      name: 'Tarifas',
      items: [
        { 
          name: 'Tipo de Cálculo de Tarifa', 
          route: '/registros/configuracion/tarifas/tipo-calculo',
          count: this.tiposCalculoFacade.totalTiposCalculoTarifa() || this.tiposCalculoFacade.tiposCalculoTarifa().length 
        },
        { 
          name: 'Tarifa', 
          route: '/registros/configuracion/tarifas/tarifas',
          count: this.tarifasFacade.totalTarifas() || this.tarifasFacade.tarifas().length, 
          hasWarning: true 
        }
      ]
    },
    {
      name: 'Exenciones',
      items: [
        { 
          name: 'Tipo de Beneficiario de Exención', 
          route: '/registros/configuracion/exenciones/tipo-beneficiario',
          count: this.tiposBeneficiarioFacade.totalTiposBeneficiario() || this.tiposBeneficiarioFacade.tiposBeneficiario().length 
        },
        { 
          name: 'Exención', 
          route: '/registros/configuracion/exenciones/exenciones',
          count: this.exencionesFacade.totalExenciones() || this.exencionesFacade.exenciones().length, 
          hasWarning: true 
        }
      ]
    },
    {
      name: 'Contribuyentes',
      items: [
        { 
          name: 'Tipo de Persona', 
          route: '/registros/configuracion/contribuyentes/tipo-persona',
          count: this.tiposPersonaFacade.totalTiposPersona() || this.tiposPersonaFacade.tiposPersona().length 
        },
        { 
          name: 'Tipo de Documento', 
          route: '/registros/configuracion/contribuyentes/tipo-documento',
          count: this.tiposIdentificacionFacade.totalTiposIdentificacion() || this.tiposIdentificacionFacade.tiposIdentificacion().length 
        }
      ]
    },
    {
      name: 'Intervinientes',
      items: [
        { 
          name: 'Rol de Interviniente', 
          route: '/registros/configuracion/intervinientes/roles-interviniente',
          count: this.rolesIntervinienteFacade.totalRolesInterviniente() || this.rolesIntervinienteFacade.rolesInterviniente().length 
        }
      ]
    },
    {
      name: 'Seguridad',
      items: [
        { 
          name: 'Roles', 
          route: '/registros/configuracion/seguridad/roles',
          count: this.rolesFacade.totalRoles() || this.rolesFacade.roles().length 
        },
        { 
          name: 'Usuarios', 
          route: '/registros/configuracion/seguridad/usuarios',
          count: this.usuariosFacade.totalUsuarios() || this.usuariosFacade.usuarios().length 
        }
      ]
    }
  ]);


  totalCount = computed(() => {
    return this.catalogGroups().reduce((acc, g) => acc + g.items.length, 0);
  });

  filteredGroups = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.catalogGroups();

    return this.catalogGroups()
      .map(group => ({
        ...group,
        items: group.items.filter(item => 
          item.name.toLowerCase().includes(term) || group.name.toLowerCase().includes(term)
        )
      }))
      .filter(group => group.items.length > 0);
  });

  onItemClick() {
    this.closeSidebar.emit();
  }
}

