import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CatalogoApiService } from '../../infrastructure/api/catalogo-api.service';
import { DepartamentosApiService } from '../../infrastructure/api/departamentos-api.service';
import { PropietariosApiService } from '../../infrastructure/api/propietarios-api.service';
import { VehiculosApiService } from '../../infrastructure/api/vehiculos-api.service';
import {
  CatalogoItemDto,
  TipoDocumentoDto,
  NaturalezaJuridicaDto,
  MarcaDto,
  LineaDto,
  TodosCatalogosDto
} from '../../domain/interfaces/catalogo.interface';
import { DepartamentoDto, CiudadDto } from '../../domain/interfaces/geografico.interface';
import { VehiculoItemDto } from '../../domain/interfaces/vehiculo.interface';

@Injectable({
  providedIn: 'root'
})
export class CatalogoVehicularFacade {
  private catalogoApi = inject(CatalogoApiService);
  private departamentosApi = inject(DepartamentosApiService);
  private propietariosApi = inject(PropietariosApiService);
  private vehiculosApi = inject(VehiculosApiService);

  // Estados reactivos (Signals) para cada catálogo
  readonly clasesVehiculo = signal<CatalogoItemDto[]>([]);
  readonly tiposVehiculo = signal<CatalogoItemDto[]>([]);
  readonly marcas = signal<MarcaDto[]>([]);
  readonly lineas = signal<LineaDto[]>([]);
  readonly combustibles = signal<CatalogoItemDto[]>([]);
  readonly serviciosVehiculo = signal<CatalogoItemDto[]>([]);
  readonly estadosMatricula = signal<CatalogoItemDto[]>([]);
  readonly organismosTransito = signal<CatalogoItemDto[]>([]);
  readonly tiposVinculo = signal<CatalogoItemDto[]>([]);
  readonly tiposDocumento = signal<TipoDocumentoDto[]>([]);
  readonly naturalezasJuridicas = signal<NaturalezaJuridicaDto[]>([]);
  readonly departamentos = signal<DepartamentoDto[]>([]);
  readonly municipios = signal<CiudadDto[]>([]);
  readonly pendientesAprobacion = signal<VehiculoItemDto[]>([]);
  readonly totalPropietarios = signal<number>(0);

  // Estado UI
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.cargarTodos();
  }

  /**
   * Carga consolidada de todos los catálogos vehiculares desde el backend
   */
  cargarTodos(): void {
    this.loading.set(true);
    this.error.set(null);

    // 1. Obtener catálogos generales consolidados
    this.catalogoApi.getTodos().subscribe({
      next: (resp: any) => {
        const data = resp?.data || resp;
        if (data) {
          if (data.clasesVehiculo) this.clasesVehiculo.set(data.clasesVehiculo);
          if (data.tiposVehiculo) this.tiposVehiculo.set(data.tiposVehiculo);
          if (data.combustibles) this.combustibles.set(data.combustibles);
          if (data.serviciosVehiculo) this.serviciosVehiculo.set(data.serviciosVehiculo);
          if (data.estadosMatricula) this.estadosMatricula.set(data.estadosMatricula);
          if (data.organismosTransito) this.organismosTransito.set(data.organismosTransito);
          if (data.tiposVinculo) this.tiposVinculo.set(data.tiposVinculo);
          if (data.tiposDocumento) this.tiposDocumento.set(data.tiposDocumento);
          if (data.naturalezasJuridicas) this.naturalezasJuridicas.set(data.naturalezasJuridicas);
        }
      },
      error: (err: any) => {
        console.error('Error cargando catálogos consolidados:', err);
      }
    });

    // 2. Cargar Marcas y Líneas
    this.catalogoApi.getMarcas().subscribe({
      next: (resp: any) => {
        const data = resp?.data || (Array.isArray(resp) ? resp : []);
        this.marcas.set(Array.isArray(data) ? data : []);
      },
      error: (err: any) => console.error('Error cargando marcas:', err)
    });

    this.catalogoApi.getLineas().subscribe({
      next: (resp: any) => {
        const data = resp?.data || (Array.isArray(resp) ? resp : []);
        this.lineas.set(Array.isArray(data) ? data : []);
      },
      error: (err: any) => console.error('Error cargando líneas:', err)
    });

    // 3. Cargar Departamentos y Municipios
    this.departamentosApi.getDepartamentos().subscribe({
      next: (resp: any) => {
        const dptos = resp.data || (Array.isArray(resp) ? resp : []);
        this.departamentos.set(dptos);
        
        // Si hay departamentos, cargar municipios de Cauca (id 19 o el primero) o todos
        if (dptos.length > 0) {
          const cauca = dptos.find((d: any) => d.nombre?.toUpperCase().includes('CAUCA')) || dptos[0];
          if (cauca && cauca.id) {
            this.departamentosApi.getCiudadesByDepartamento(cauca.id).subscribe({
              next: (muniResp: any) => {
                const munis = muniResp.data || (Array.isArray(muniResp) ? muniResp : []);
                this.municipios.set(munis);
              }
            });
          }
        }
      },
      error: (err) => console.error('Error cargando departamentos:', err)
    });

    // 4. Cargar Pendientes por Aprobación
    this.vehiculosApi.getPendientesAprobacion().subscribe({
      next: (resp: any) => {
        const data = resp.data || (Array.isArray(resp) ? resp : []);
        this.pendientesAprobacion.set(Array.isArray(data) ? data : []);
      },
      error: (err: any) => console.error('Error cargando pendientes de aprobación:', err)
    });

    // 5. Total Propietarios
    this.propietariosApi.getAll({ page: 1, pageSize: 1 }).subscribe({
      next: (resp: any) => {
        if (resp.data) {
          this.totalPropietarios.set(resp.data.totalCount || 0);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  cargarCiudadesPorDepartamento(departamentoId: number): void {
    this.departamentosApi.getCiudadesByDepartamento(departamentoId).subscribe({
      next: (resp: any) => {
        const munis = resp.data || (Array.isArray(resp) ? resp : []);
        this.municipios.set(munis);
      },
      error: (err) => console.error('Error cargando municipios:', err)
    });
  }
}
