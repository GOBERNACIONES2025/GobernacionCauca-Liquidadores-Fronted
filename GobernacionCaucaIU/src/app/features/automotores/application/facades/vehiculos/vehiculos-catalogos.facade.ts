import { Injectable, inject, signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CatalogoApiService } from '../../../infrastructure/api/catalogo-api.service';
import { DepartamentosApiService } from '../../../infrastructure/api/departamentos-api.service';
import { ParametrosSharedService } from '../../../../../shared/services/parametros-shared.service';
import { 
  CatalogoItem, 
  CatalogoMarca, 
  CatalogoLinea, 
  CatalogoTipoDocumento, 
  CatalogoNaturalezaJuridica, 
  CatalogoDepartamento, 
  CatalogoCiudad 
} from '../../../domain/models/vehiculo.model';

@Injectable({
  providedIn: 'root',
})
export class VehiculosCatalogosFacade {
  private catalogoApi = inject(CatalogoApiService);
  private departamentosApi = inject(DepartamentosApiService);
  private parametrosShared = inject(ParametrosSharedService);

  // Marcas y Líneas: Peticiones estrictas bajo demanda (NO persistidas en memoria compartida ni cookies)
  readonly marcas = signal<CatalogoMarca[]>([]);
  readonly marcasDisponibles = signal<CatalogoMarca[]>([]);
  readonly lineas = signal<CatalogoLinea[]>([]);
  readonly lineasDisponibles = signal<CatalogoLinea[]>([]);

  // Catálogos paramétricos delegados al servicio compartido en memoria
  readonly estadosMatricula = computed(() => this.parametrosShared.estadosMatricula() as CatalogoItem[]);
  readonly serviciosVehiculo = computed(() => this.parametrosShared.serviciosVehiculo() as CatalogoItem[]);
  readonly tiposVinculo = computed(() => this.parametrosShared.tiposVinculo() as CatalogoItem[]);
  readonly tiposVehiculo = computed(() => this.parametrosShared.tiposVehiculo() as CatalogoItem[]);
  readonly combustibles = computed(() => this.parametrosShared.combustibles() as CatalogoItem[]);
  readonly organismosTransito = computed(() => this.parametrosShared.organismosTransito() as CatalogoItem[]);
  readonly tiposDocumento = computed(() => this.parametrosShared.tiposDocumento() as CatalogoTipoDocumento[]);
  readonly naturalezasJuridicas = computed(() => this.parametrosShared.naturalezasJuridicas() as CatalogoNaturalezaJuridica[]);
  readonly departamentos = computed(() => this.parametrosShared.departamentos() as CatalogoDepartamento[]);
  
  // Ciudades dinámicas
  readonly ciudades = signal<CatalogoCiudad[]>([]);
  readonly ciudadesDisponibles = signal<CatalogoCiudad[]>([]);

  // Estados de carga
  readonly catalogosLoading = computed(() => this.parametrosShared.loading());
  readonly catalogosLoaded = computed(() => this.parametrosShared.loaded());

  cargarCatalogos(): void {
    this.parametrosShared.cargarParametrosGenerales();
  }

  cargarCiudadesPorDepartamento(departamentoId: number): void {
    if (!departamentoId) {
      this.ciudadesDisponibles.set([]);
      return;
    }

    this.parametrosShared.cargarCiudadesPorDepartamento(departamentoId, (ciudades) => {
      this.ciudadesDisponibles.set(ciudades as CatalogoCiudad[]);
    });
  }

  cargarMarcasPorTipo(tipoVehiculo?: string): void {
    if (!tipoVehiculo?.trim()) {
      this.marcasDisponibles.set([]);
      this.lineasDisponibles.set([]);
      return;
    }

    this.catalogoApi.getMarcas(tipoVehiculo).pipe(
      catchError(() => of({ data: [] as CatalogoMarca[] }))
    ).subscribe((res: any) => {
      this.marcasDisponibles.set(res?.data || []);
    });
  }

  cargarLineasPorMarca(marcaNombre: string, tipoVehiculo?: string): void {
    const marcaNorm = (marcaNombre || '').toUpperCase().trim();
    if (!marcaNorm) {
      this.lineasDisponibles.set([]);
      return;
    }

    this.catalogoApi.getLineas(marcaNorm, undefined, tipoVehiculo).pipe(
      catchError(() => of({ data: [] as CatalogoLinea[] }))
    ).subscribe((res: any) => {
      this.lineasDisponibles.set(res?.data || []);
    });
  }
}
