import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CatalogoApiService } from '../../../infrastructure/api/catalogo-api.service';
import { DepartamentosApiService } from '../../../infrastructure/api/departamentos-api.service';
import { 
  CatalogoItem, 
  CatalogoMarca, 
  CatalogoLinea, 
  CatalogoTipoDocumento, 
  CatalogoNaturalezaJuridica, 
  CatalogoDepartamento, 
  CatalogoCiudad 
} from '../../../domain/models/vehiculo.model';
import { TodosCatalogosDto } from '../../../domain/interfaces/catalogo.interface';

@Injectable({
  providedIn: 'root',
})
export class VehiculosCatalogosFacade {
  private catalogoApi = inject(CatalogoApiService);
  private departamentosApi = inject(DepartamentosApiService);

  readonly marcas = signal<CatalogoMarca[]>([]);
  readonly marcasDisponibles = signal<CatalogoMarca[]>([]);
  readonly lineas = signal<CatalogoLinea[]>([]);
  readonly lineasDisponibles = signal<CatalogoLinea[]>([]);
  readonly estadosMatricula = signal<CatalogoItem[]>([]);
  readonly serviciosVehiculo = signal<CatalogoItem[]>([]);
  readonly tiposVinculo = signal<CatalogoItem[]>([]);
  readonly tiposVehiculo = signal<CatalogoItem[]>([]);
  readonly combustibles = signal<CatalogoItem[]>([]);
  readonly organismosTransito = signal<CatalogoItem[]>([]);
  readonly tiposDocumento = signal<CatalogoTipoDocumento[]>([]);
  readonly naturalezasJuridicas = signal<CatalogoNaturalezaJuridica[]>([]);
  readonly departamentos = signal<CatalogoDepartamento[]>([]);
  readonly ciudades = signal<CatalogoCiudad[]>([]);
  readonly ciudadesDisponibles = signal<CatalogoCiudad[]>([]);
  readonly catalogosLoading = signal<boolean>(false);
  readonly catalogosLoaded = signal<boolean>(false);

  cargarCatalogos(): void {
    if (this.catalogosLoaded() || this.catalogosLoading()) return;

    this.catalogosLoading.set(true);

    forkJoin({
      todos: this.catalogoApi.getTodos().pipe(
        map(res => res?.data || {} as TodosCatalogosDto),
        catchError(() => of({} as TodosCatalogosDto))
      ),
      departamentos: this.departamentosApi.getDepartamentos().pipe(
        map(res => (res && 'data' in res && res.data ? res.data : (Array.isArray(res) ? res : []))),
        catchError(() => of([] as CatalogoDepartamento[]))
      ),
      servicios: this.catalogoApi.getServiciosVehiculo().pipe(
        map(res => (res && 'data' in res && res.data ? res.data : (Array.isArray(res) ? res : []))),
        catchError(() => of([] as CatalogoItem[]))
      )
    }).subscribe({
      next: (results: { todos: TodosCatalogosDto; departamentos: CatalogoDepartamento[]; servicios: CatalogoItem[] }) => {
        const t = results.todos || {};

        const servs = (results.servicios && results.servicios.length > 0)
          ? results.servicios
          : (t.serviciosVehiculo && t.serviciosVehiculo.length > 0)
            ? t.serviciosVehiculo
            : ((t as any).servicios && (t as any).servicios.length > 0)
              ? (t as any).servicios
              : [];

        this.estadosMatricula.set((t.estadosMatricula && t.estadosMatricula.length > 0) ? t.estadosMatricula : []);
        this.serviciosVehiculo.set(servs);
        this.tiposVinculo.set((t.tiposVinculo && t.tiposVinculo.length > 0) ? t.tiposVinculo : []);
        this.tiposVehiculo.set((t.tiposVehiculo && t.tiposVehiculo.length > 0) ? t.tiposVehiculo : []);
        this.combustibles.set((t.combustibles && t.combustibles.length > 0) ? t.combustibles : []);
        this.organismosTransito.set((t.organismosTransito && t.organismosTransito.length > 0) ? t.organismosTransito : []);
        this.tiposDocumento.set((t.tiposDocumento && t.tiposDocumento.length > 0) ? t.tiposDocumento : []);
        this.naturalezasJuridicas.set((t.naturalezasJuridicas && t.naturalezasJuridicas.length > 0) ? t.naturalezasJuridicas : []);
        this.departamentos.set(results.departamentos && results.departamentos.length > 0 ? results.departamentos : []);
        this.catalogosLoaded.set(true);
        this.catalogosLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando catálogos unificados:', err);
        this.catalogosLoading.set(false);
      }
    });
  }

  cargarCiudadesPorDepartamento(departamentoId: number): void {
    if (!departamentoId) {
      this.ciudadesDisponibles.set([]);
      return;
    }

    this.departamentosApi.getCiudadesByDepartamento(departamentoId).pipe(
      catchError(() => of(null))
    ).subscribe((res: any) => {
      const data = (res && 'data' in res && res.data) ? res.data : (Array.isArray(res) ? res : []);
      this.ciudadesDisponibles.set(data);
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
