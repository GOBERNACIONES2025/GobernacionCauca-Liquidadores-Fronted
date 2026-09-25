import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CalendariosTributariosApiService } from '../../infrastructure/api/calendarios-tributarios-api.service';
import { ParametrosSharedService } from '../../../../shared/services/parametros-shared.service';
import {
  CalendarioTributarioDto,
  CreateCalendarioTributarioRequest,
  UpdateCalendarioTributarioRequest,
  FiltrosCalendarioTributario
} from '../../domain/interfaces/calendarios-tributarios.interface';

@Injectable({
  providedIn: 'root'
})
export class CalendariosTributariosFacade {
  private api = inject(CalendariosTributariosApiService);
  readonly shared = inject(ParametrosSharedService);

  // Estados reactivos principales
  readonly calendarios = signal<CalendarioTributarioDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Catálogos delegados a ParametrosSharedService
  readonly vigencias = computed(() => this.shared.vigencias());
  readonly normas = computed(() => this.shared.normas());
  readonly vigenciaActivaAnio = computed(() => this.shared.anioVigenciaSeleccionada());

  // Filtros reactivos
  readonly searchTerm = signal<string>('');
  readonly vigenciaFiltro = signal<number | 'TODOS'>('TODOS');
  readonly normaFiltro = signal<number | 'TODOS'>('TODOS');
  readonly codigoImpuestoFiltro = signal<string>('TODOS');
  readonly estadoFiltro = signal<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');

  // Paginación
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // KPIs computados
  readonly totalCalendarios = computed(() => this.totalCount() || this.calendarios().length);
  readonly totalActivos = computed(() => this.calendarios().filter(c => c.activo).length);
  readonly totalInactivos = computed(() => this.calendarios().filter(c => !c.activo).length);
  readonly totalConDescuento = computed(() => this.calendarios().filter(c => (c.porcentajeDescuento > 0)).length);
  readonly totalVigentes = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.calendarios().filter(c => {
      const vencimiento = c.fechaVencimiento || c.fechaFinVencimiento;
      return c.activo && (!vencimiento || vencimiento.split('T')[0] >= today);
    }).length;
  });

  constructor() {
    this.shared.cargarParametrosGenerales();
    this.cargarCalendarios();
  }

  /**
   * Carga la lista de calendarios tributarios según los filtros activos
   */
  public cargarCalendarios(): void {
    this.loading.set(true);
    this.error.set(null);

    const filtros: FiltrosCalendarioTributario = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      searchTerm: this.searchTerm().trim() || undefined,
      vigenciaFiscalId: this.vigenciaFiltro() !== 'TODOS' ? Number(this.vigenciaFiltro()) : undefined,
      normaTributariaId: this.normaFiltro() !== 'TODOS' ? Number(this.normaFiltro()) : undefined,
      codigoImpuesto: this.codigoImpuestoFiltro() !== 'TODOS' ? this.codigoImpuestoFiltro() : undefined,
      activo: this.estadoFiltro() === 'TODOS' ? undefined : this.estadoFiltro() === 'ACTIVOS'
    };

    this.api.getCalendariosPaged(filtros).pipe(
      catchError(err => {
        console.error('Error cargando calendarios tributarios:', err);
        this.error.set('No se pudo cargar el listado de calendarios tributarios.');
        return of(null);
      })
    ).subscribe(res => {
      this.loading.set(false);
      if (res) {
        let items: CalendarioTributarioDto[] = [];
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

        this.calendarios.set(items);
        this.totalCount.set(total);
      } else {
        this.calendarios.set([]);
        this.totalCount.set(0);
      }
    });
  }

  /**
   * Creación de nuevo calendario tributario
   */
  public crearCalendario(payload: CreateCalendarioTributarioRequest): Observable<boolean> {
    this.loading.set(true);
    return this.api.crearCalendario(payload).pipe(
      map(() => {
        this.loading.set(false);
        this.cargarCalendarios();
        return true;
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error creando calendario tributario:', err);
        return of(false);
      })
    );
  }

  /**
   * Actualización de calendario tributario existente
   */
  public actualizarCalendario(id: number, payload: UpdateCalendarioTributarioRequest): Observable<boolean> {
    this.loading.set(true);
    return this.api.actualizarCalendario(id, payload).pipe(
      map(() => {
        this.loading.set(false);
        this.cargarCalendarios();
        return true;
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error actualizando calendario tributario:', err);
        return of(false);
      })
    );
  }

  /**
   * Eliminación física de calendario tributario
   */
  public eliminarCalendario(id: number): Observable<boolean> {
    this.loading.set(true);
    return this.api.eliminarCalendario(id).pipe(
      map(() => {
        this.loading.set(false);
        this.cargarCalendarios();
        return true;
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error eliminando calendario tributario:', err);
        return of(false);
      })
    );
  }

  /**
   * Alternar estado Activo/Inactivo (PATCH)
   */
  public toggleActivo(item: CalendarioTributarioDto): Observable<boolean> {
    const nuevoEstado = !item.activo;
    return this.api.toggleActivo(item.id, nuevoEstado).pipe(
      tap(() => {
        this.calendarios.update(list => list.map(c => c.id === item.id ? { ...c, activo: nuevoEstado } : c));
      }),
      map(() => true),
      catchError(err => {
        console.error('Error al cambiar estado de calendario tributario:', err);
        return of(false);
      })
    );
  }

  public getVigenciaLabel(id: number): string {
    const v = this.vigencias().find(item => item.id === id || item.anio === id);
    return v ? String(v.anio) : String(id);
  }

  public getNormaLabel(id?: number | null): string {
    if (!id) return 'Sin norma asociada';
    const n = this.normas().find(item => item.id === id);
    if (!n) return `Norma #${id}`;
    return `${n.tipoNorma} ${n.numero}${n.titulo ? ' - ' + n.titulo : ''}`;
  }
}
