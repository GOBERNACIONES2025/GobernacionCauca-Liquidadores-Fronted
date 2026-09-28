import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { TarifasTributariasApiService } from '../../infrastructure/api/tarifas-tributarias-api.service';
import { ParametrosSharedService } from '../../../../shared/services/parametros-shared.service';
import {
  TarifaTributariaDto,
  CreateTarifaTributariaRequest,
  UpdateTarifaTributariaRequest,
  FiltrosTarifaTributaria
} from '../../domain/interfaces/tarifas-tributarias.interface';
import { VigenciaFiscalDto } from '../../domain/interfaces/vigencia-fiscal.interface';

@Injectable({
  providedIn: 'root'
})
export class TarifasTributariasFacade {
  private api = inject(TarifasTributariasApiService);
  /** Single source of truth: vigencias + catálogos en memoria con cookie como respaldo */
  readonly shared = inject(ParametrosSharedService);

  // Estados reactivos principales
  readonly tarifas = signal<TarifaTributariaDto[]>([]);
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
  /** Vigencia fiscal activa (leída de cookie si ya fue seleccionada) */
  readonly vigenciaActivaAnio = computed(() => this.shared.anioVigenciaSeleccionada());

  // Filtros reactivos
  readonly searchTerm = signal<string>('');
  readonly vigenciaFiltro = signal<number | 'TODOS'>('TODOS');
  readonly departamentoFiltro = signal<number | 'TODOS'>('TODOS');
  readonly claseFiltro = signal<number | 'TODOS'>('TODOS');
  readonly servicioFiltro = signal<number | 'TODOS'>('TODOS');
  readonly combustibleFiltro = signal<number | 'TODOS'>('TODOS');
  readonly estadoFiltro = signal<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');

  // Paginación
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // KPIs
  readonly totalTarifas = computed(() => this.totalCount() || this.tarifas().length);
  readonly totalActivas = computed(() => this.tarifas().filter(t => t.activa).length);
  readonly totalInactivas = computed(() => this.tarifas().filter(t => !t.activa).length);

  constructor() {
    // Asegura que los catálogos estén disponibles; si ya cargaron, no hace nada
    this.shared.cargarParametrosGenerales();
    this.cargarTarifas();
  }

  /**
   * Carga la lista de tarifas tributarias según los filtros activos
   */
  public cargarTarifas(): void {
    this.loading.set(true);
    this.error.set(null);

    const filtros: FiltrosTarifaTributaria = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      search: this.searchTerm().trim() || undefined,
      vigenciaFiscalId: this.vigenciaFiltro() !== 'TODOS' ? Number(this.vigenciaFiltro()) : undefined,
      departamentoId: this.departamentoFiltro() !== 'TODOS' ? Number(this.departamentoFiltro()) : undefined,
      claseVehiculoId: this.claseFiltro() !== 'TODOS' ? Number(this.claseFiltro()) : undefined,
      servicioVehiculoId: this.servicioFiltro() !== 'TODOS' ? Number(this.servicioFiltro()) : undefined,
      combustibleId: this.combustibleFiltro() !== 'TODOS' ? Number(this.combustibleFiltro()) : undefined,
      activa: this.estadoFiltro() === 'TODOS' ? undefined : this.estadoFiltro() === 'ACTIVOS'
    };

    this.api.getTarifasPaged(filtros).pipe(
      catchError(err => {
        console.error('Error cargando tarifas tributarias:', err);
        this.error.set('No se pudo cargar el listado de tarifas tributarias.');
        return of(null);
      })
    ).subscribe(res => {
      this.loading.set(false);
      if (res) {
        let items: TarifaTributariaDto[] = [];
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

        this.tarifas.set(items);
        this.totalCount.set(total);
      } else {
        this.tarifas.set([]);
        this.totalCount.set(0);
      }
    });
  }

  /**
   * Creación de nueva tarifa
   */
  public crearTarifa(payload: CreateTarifaTributariaRequest): Observable<boolean> {
    this.loading.set(true);
    return this.api.crearTarifa(payload).pipe(
      map(res => {
        this.loading.set(false);
        this.cargarTarifas();
        return true;
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error creando tarifa tributaria:', err);
        return of(false);
      })
    );
  }

  /**
   * Actualización de tarifa existente
   */
  public actualizarTarifa(id: number, payload: UpdateTarifaTributariaRequest): Observable<boolean> {
    this.loading.set(true);
    return this.api.actualizarTarifa(id, payload).pipe(
      map(res => {
        this.loading.set(false);
        this.cargarTarifas();
        return true;
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error actualizando tarifa tributaria:', err);
        return of(false);
      })
    );
  }

  /**
   * Eliminación física de tarifa
   */
  public eliminarTarifa(id: number): Observable<boolean> {
    this.loading.set(true);
    return this.api.eliminarTarifa(id).pipe(
      map(res => {
        this.loading.set(false);
        this.cargarTarifas();
        return true;
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error eliminando tarifa tributaria:', err);
        return of(false);
      })
    );
  }

  /**
   * Alternar estado Activa/Inactiva (PATCH)
   */
  public toggleActiva(item: TarifaTributariaDto): Observable<boolean> {
    const nuevoEstado = !item.activa;
    return this.api.toggleActiva(item.id, nuevoEstado).pipe(
      tap(() => {
        this.tarifas.update(list => list.map(t => t.id === item.id ? { ...t, activa: nuevoEstado } : t));
      }),
      map(() => true),
      catchError(err => {
        console.error('Error al cambiar estado de tarifa tributaria:', err);
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

  public getClaseLabel(id: number): string {
    const c = this.clasesVehiculo().find(item => item.id === id);
    return c ? c.nombre : `Clase #${id}`;
  }

  public getServicioLabel(id: number): string {
    const s = this.serviciosVehiculo().find(item => item.id === id);
    return s ? s.nombre : `Servicio #${id}`;
  }

  public getCombustibleLabel(id: number): string {
    const c = this.combustibles().find(item => item.id === id);
    return c ? c.nombre : `Combustible #${id}`;
  }
}
