import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ExencionesTributariasApiService } from '../../infrastructure/api/exenciones-tributarias-api.service';
import { CatalogoApiService } from '../../infrastructure/api/catalogo-api.service';
import { DepartamentosApiService } from '../../infrastructure/api/departamentos-api.service';
import {
  ExencionTributariaDto,
  CreateExencionTributariaRequest,
  UpdateExencionTributariaRequest,
  FiltrosExencionTributaria
} from '../../domain/interfaces/exenciones-tributarias.interface';
import { CatalogoItemDto, NaturalezaJuridicaDto } from '../../domain/interfaces/catalogo.interface';
import { DepartamentoDto } from '../../domain/interfaces/geografico.interface';

@Injectable({
  providedIn: 'root'
})
export class ExencionesTributariasFacade {
  private api = inject(ExencionesTributariasApiService);
  private catalogoApi = inject(CatalogoApiService);
  private departamentosApi = inject(DepartamentosApiService);

  // Estados reactivos principales
  readonly exenciones = signal<ExencionTributariaDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Catálogos dinámicos cargados desde el backend (CERO DATOS QUEMADOS)
  readonly vigencias = signal<any[]>([]);
  readonly normas = signal<any[]>([]);
  readonly departamentos = signal<DepartamentoDto[]>([]);
  readonly clasesVehiculo = signal<CatalogoItemDto[]>([]);
  readonly serviciosVehiculo = signal<CatalogoItemDto[]>([]);
  readonly combustibles = signal<CatalogoItemDto[]>([]);
  readonly naturalezasJuridicas = signal<NaturalezaJuridicaDto[]>([]);

  // Filtros reactivos
  readonly searchTerm = signal<string>('');
  readonly vigenciaFiltro = signal<number | 'TODOS'>('TODOS');
  readonly departamentoFiltro = signal<number | 'TODOS'>('TODOS');
  readonly ambitoFiltro = signal<string>('TODOS');
  readonly tipoBeneficioFiltro = signal<string>('TODOS');
  readonly estadoFiltro = signal<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');

  // Paginación
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // KPIs
  readonly totalExenciones = computed(() => this.totalCount() || this.exenciones().length);
  readonly totalActivas = computed(() => this.exenciones().filter(e => e.activa).length);
  readonly totalInactivas = computed(() => this.exenciones().filter(e => !e.activa).length);
  readonly totalExoneracionTotal = computed(() => this.exenciones().filter(e => e.porcentajeExoneracion === 100).length);

  constructor() {
    this.cargarCatalogos();
    this.cargarExenciones();
  }

  /**
   * Carga dinámica de todos los catálogos requeridos desde el backend
   */
  public cargarCatalogos(): void {
    // 1. Catálogos generales
    this.catalogoApi.getTodos().pipe(catchError(() => of(null))).subscribe((res: any) => {
      const data = res?.data || res;
      if (data) {
        if (data.clasesVehiculo) this.clasesVehiculo.set(data.clasesVehiculo);
        if (data.serviciosVehiculo) this.serviciosVehiculo.set(data.serviciosVehiculo);
        if (data.combustibles) this.combustibles.set(data.combustibles);
        if (data.naturalezasJuridicas) this.naturalezasJuridicas.set(data.naturalezasJuridicas);
      }
    });

    // 2. Naturalezas Jurídicas explícitas si falta
    this.catalogoApi.getNaturalezasJuridicas().pipe(catchError(() => of(null))).subscribe((res: any) => {
      const nats = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(nats) && nats.length > 0) {
        this.naturalezasJuridicas.set(nats);
      }
    });

    // 3. Departamentos
    this.departamentosApi.getDepartamentos().pipe(catchError(() => of(null))).subscribe((res: any) => {
      const dptos = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(dptos)) {
        this.departamentos.set(dptos);
      }
    });

    // 4. Vigencias Fiscales
    this.catalogoApi.getVigencias().pipe(catchError(() => of(null))).subscribe((res: any) => {
      let items = res?.data?.items || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(items) && items.length > 0) {
        this.vigencias.set(items);
      }
    });

    // 5. Normas Tributarias
    this.catalogoApi.getNormas().pipe(catchError(() => of(null))).subscribe((res: any) => {
      let items = res?.data?.items || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(items) && items.length > 0) {
        this.normas.set(items);
      }
    });
  }

  /**
   * Carga la lista de exenciones tributarias según los filtros activos
   */
  public cargarExenciones(): void {
    this.loading.set(true);
    this.error.set(null);

    const filtros: FiltrosExencionTributaria = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      search: this.searchTerm().trim() || undefined,
      vigenciaFiscalId: this.vigenciaFiltro() !== 'TODOS' ? Number(this.vigenciaFiltro()) : undefined,
      departamentoId: this.departamentoFiltro() !== 'TODOS' ? Number(this.departamentoFiltro()) : undefined,
      ambito: this.ambitoFiltro() !== 'TODOS' ? this.ambitoFiltro() : undefined,
      tipoBeneficio: this.tipoBeneficioFiltro() !== 'TODOS' ? this.tipoBeneficioFiltro() : undefined,
      activa: this.estadoFiltro() === 'TODOS' ? undefined : this.estadoFiltro() === 'ACTIVOS'
    };

    this.api.getExencionesPaged(filtros).pipe(
      catchError(err => {
        console.error('Error cargando exenciones tributarias:', err);
        this.error.set('No se pudo cargar el listado de exenciones tributarias.');
        return of(null);
      })
    ).subscribe(res => {
      this.loading.set(false);
      if (res) {
        let items: ExencionTributariaDto[] = [];
        let total = 0;

        if (Array.isArray(res)) {
          items = res;
          total = res.length;
        } else if (res.data) {
          if (Array.isArray(res.data)) {
            items = res.data;
            total = res.data.length;
          } else if (res.data.items && Array.isArray(res.data.items)) {
            items = res.data.items;
            total = res.data.totalCount ?? res.data.items.length;
          }
        }

        this.exenciones.set(items);
        this.totalCount.set(total);
      } else {
        this.exenciones.set([]);
        this.totalCount.set(0);
      }
    });
  }

  /**
   * Creación de nueva exención
   */
  public crearExencion(payload: CreateExencionTributariaRequest): Observable<boolean> {
    this.loading.set(true);
    return this.api.crearExencion(payload).pipe(
      map(res => {
        this.loading.set(false);
        this.cargarExenciones();
        return true;
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error creando exención tributaria:', err);
        return of(false);
      })
    );
  }

  /**
   * Actualización de exención existente
   */
  public actualizarExencion(id: number, payload: UpdateExencionTributariaRequest): Observable<boolean> {
    this.loading.set(true);
    return this.api.actualizarExencion(id, payload).pipe(
      map(res => {
        this.loading.set(false);
        this.cargarExenciones();
        return true;
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error actualizando exención tributaria:', err);
        return of(false);
      })
    );
  }

  /**
   * Eliminación física de exención
   */
  public eliminarExencion(id: number): Observable<boolean> {
    this.loading.set(true);
    return this.api.eliminarExencion(id).pipe(
      map(res => {
        this.loading.set(false);
        this.cargarExenciones();
        return true;
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error eliminando exención tributaria:', err);
        return of(false);
      })
    );
  }

  /**
   * Alternar estado Activa/Inactiva (PATCH)
   */
  public toggleActiva(item: ExencionTributariaDto): Observable<boolean> {
    const nuevoEstado = !item.activa;
    return this.api.toggleActiva(item.id, nuevoEstado).pipe(
      tap(() => {
        this.exenciones.update(list => list.map(e => e.id === item.id ? { ...e, activa: nuevoEstado } : e));
      }),
      map(() => true),
      catchError(err => {
        console.error('Error al cambiar estado de exención tributaria:', err);
        return of(false);
      })
    );
  }

  // Métodos de resolución de nombres de catálogos
  public getVigenciaLabel(id: number): string {
    const v = this.vigencias().find(item => item.id === id || item.anio === id);
    return v ? (v.anio ? String(v.anio) : (v.nombre || String(id))) : String(id);
  }

  public getNormaLabel(id: number): string {
    const n = this.normas().find(item => item.id === id);
    return n ? (n.nombre || n.codigo || `Norma #${id}`) : `Norma #${id}`;
  }

  public getDepartamentoLabel(id: number): string {
    const d = this.departamentos().find(item => item.id === id);
    return d ? d.nombre : `Dpto #${id}`;
  }

  public getNaturalezaLabel(id: number | null | undefined): string {
    if (!id) return 'Todas las Naturalezas';
    const n = this.naturalezasJuridicas().find(item => item.id === id);
    return n ? (n.nombre || n.codigo) : `Naturaleza #${id}`;
  }

  public getClaseLabel(id: number | null | undefined): string {
    if (!id) return 'Todas las Clases';
    const c = this.clasesVehiculo().find(item => item.id === id);
    return c ? c.nombre : `Clase #${id}`;
  }

  public getServicioLabel(id: number | null | undefined): string {
    if (!id) return 'Todos los Servicios';
    const s = this.serviciosVehiculo().find(item => item.id === id);
    return s ? s.nombre : `Servicio #${id}`;
  }

  public getCombustibleLabel(id: number | null | undefined): string {
    if (!id) return 'Todos los Combustibles';
    const c = this.combustibles().find(item => item.id === id);
    return c ? c.nombre : `Combustible #${id}`;
  }
}
