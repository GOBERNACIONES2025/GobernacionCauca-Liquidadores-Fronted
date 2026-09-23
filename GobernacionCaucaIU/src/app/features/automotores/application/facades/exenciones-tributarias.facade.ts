import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ExencionesTributariasApiService } from '../../infrastructure/api/exenciones-tributarias-api.service';
import { ParametrosSharedService } from '../../../../shared/services/parametros-shared.service';
import {
  ExencionTributariaDto,
  CreateExencionTributariaRequest,
  UpdateExencionTributariaRequest,
  FiltrosExencionTributaria
} from '../../domain/interfaces/exenciones-tributarias.interface';


@Injectable({
  providedIn: 'root'
})
export class ExencionesTributariasFacade {
  private api = inject(ExencionesTributariasApiService);
  /** Single source of truth: vigencias + catálogos en memoria con cookie como respaldo */
  readonly shared = inject(ParametrosSharedService);

  // Estados reactivos principales
  readonly exenciones = signal<ExencionTributariaDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // ── Catálogos delegados a ParametrosSharedService (señales computadas) ──
  /** Lista de vigencias fiscales ordenada descendente. Vienen de memoria o cookie. */
  readonly vigencias = computed(() => this.shared.vigencias());
  readonly normas = computed(() => this.shared.normas());
  readonly departamentos = computed(() => this.shared.departamentos());
  readonly clasesVehiculo = computed(() => this.shared.clasesVehiculo());
  readonly serviciosVehiculo = computed(() => this.shared.serviciosVehiculo());
  readonly combustibles = computed(() => this.shared.combustibles());
  readonly naturalezasJuridicas = computed(() => this.shared.naturalezasJuridicas());
  /** Vigencia fiscal activa (leída de cookie si ya fue seleccionada) */
  readonly vigenciaActivaAnio = computed(() => this.shared.anioVigenciaSeleccionada());

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
    // Asegura que los catálogos estén disponibles; si ya cargaron, no hace nada
    this.shared.cargarParametrosGenerales();
    this.cargarExenciones();
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

  public getVigenciaLabel(id: number): string {
    const v = this.vigencias().find(item => item.id === id || item.anio === id);
    return v ? String(v.anio) : String(id);
  }

  public getNormaLabel(id: number): string {
    const n = this.normas().find(item => item.id === id);
    if (!n) return `Norma #${id}`;
    return `${n.tipoNorma} ${n.numero}${n.titulo ? ' - ' + n.titulo : ''}`;
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
