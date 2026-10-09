import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ConceptosTributariosApiService } from '../../infrastructure/api/conceptos-tributarios-api.service';
import {
  ConceptoTributarioDto,
  CreateConceptoTributarioRequest,
  UpdateConceptoTributarioRequest,
  FiltrosConceptoTributario,
  TipoConceptoTributarioOption
} from '../../domain/interfaces/conceptos-tributarios.interface';

@Injectable({
  providedIn: 'root'
})
export class ConceptosTributariosFacade {
  private api = inject(ConceptosTributariosApiService);

  readonly conceptos = signal<ConceptoTributarioDto[]>([]);
  readonly todosConceptos = signal<ConceptoTributarioDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Conceptos activos reactivos para Select Options en toda la aplicación
  readonly conceptosActivos = computed(() => this.todosConceptos().filter(c => c.activo));

  // Tipos de Concepto Tributario disponibles
  readonly tiposConcepto = signal<TipoConceptoTributarioOption[]>([
    { id: 1, nombre: 'Impuesto / Tarifa Base', descripcion: 'Conceptos directos de liquidación tributaria' },
    { id: 2, nombre: 'Sanción', descripcion: 'Conceptos por extemporaneidad o incumplimiento' },
    { id: 3, nombre: 'Interés', descripcion: 'Conceptos por mora o recargos financieros' },
    { id: 4, nombre: 'Estampilla / Sobretasa', descripcion: 'Cobros complementarios y destinación específica' },
    { id: 5, nombre: 'Derechos de Tránsito', descripcion: 'Sistematización y trámites administrativos' }
  ]);

  // Filtros reactivos
  readonly searchTerm = signal<string>('');
  readonly tipoConceptoFiltro = signal<number | 'TODOS'>('TODOS');
  readonly estadoFiltro = signal<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');

  // Paginación
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // KPIs
  readonly totalConceptos = computed(() => this.totalCount() || this.conceptos().length);
  readonly totalActivos = computed(() => this.todosConceptos().length ? this.todosConceptos().filter(c => c.activo).length : this.conceptos().filter(c => c.activo).length);
  readonly totalInactivos = computed(() => this.todosConceptos().length ? this.todosConceptos().filter(c => !c.activo).length : this.conceptos().filter(c => !c.activo).length);

  constructor() {
    this.cargarConceptos();
    this.cargarTodosConceptos();
  }

  private extraerItems(res: any): { items: ConceptoTributarioDto[]; total: number } {
    let rawItems: any[] = [];
    let total = 0;

    if (Array.isArray(res)) {
      rawItems = res;
      total = res.length;
    } else if (res?.data) {
      if (Array.isArray(res.data)) {
        rawItems = res.data;
        total = res.data.length;
      } else if (res.data.items && Array.isArray(res.data.items)) {
        rawItems = res.data.items;
        total = res.data.totalCount ?? res.data.items.length;
      }
    } else if (res?.items && Array.isArray(res.items)) {
      rawItems = res.items;
      total = res.totalCount ?? res.items.length;
    }

    const items: ConceptoTributarioDto[] = rawItems.map((c: any) => ({
      id: c.id ?? c.Id,
      tipoConceptoTributarioId: c.tipoConceptoTributarioId ?? c.TipoConceptoTributarioId ?? 1,
      tipoConceptoCodigo: c.tipoConceptoCodigo ?? c.TipoConceptoCodigo,
      tipoConceptoNombre: c.tipoConceptoNombre ?? c.TipoConceptoNombre,
      codigo: c.codigo ?? c.Codigo ?? '',
      nombre: c.nombre ?? c.Nombre ?? '',
      activo: c.activo !== undefined ? Boolean(c.activo) : (c.Activo !== undefined ? Boolean(c.Activo) : true),
      createdAt: c.createdAt ?? c.CreatedAt,
      updatedAt: c.updatedAt ?? c.UpdatedAt,
      rowVersion: c.rowVersion ?? c.RowVersion
    }));

    return { items, total };
  }

  public cargarConceptos(): void {
    this.loading.set(true);
    this.error.set(null);

    const filtros: FiltrosConceptoTributario = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      searchTerm: this.searchTerm().trim() || undefined,
      tipoConceptoTributarioId: this.tipoConceptoFiltro() !== 'TODOS' ? Number(this.tipoConceptoFiltro()) : undefined,
      activo: this.estadoFiltro() === 'TODOS' ? undefined : this.estadoFiltro() === 'ACTIVOS'
    };

    this.api.getConceptosPaged(filtros).pipe(
      catchError(err => {
        console.error('Error cargando conceptos tributarios:', err);
        this.error.set('No se pudo cargar el listado de conceptos tributarios.');
        return of(null);
      })
    ).subscribe(res => {
      this.loading.set(false);
      if (res) {
        const { items, total } = this.extraerItems(res);
        this.conceptos.set(items);
        this.totalCount.set(total);
      } else {
        this.conceptos.set([]);
        this.totalCount.set(0);
      }
    });
  }

  public cargarTodosConceptos(): void {
    this.api.getConceptosPaged({ pageSize: 1000 }).pipe(
      catchError(err => {
        console.error('Error cargando todos los conceptos:', err);
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        const { items } = this.extraerItems(res);
        this.todosConceptos.set(items);
      }
    });
  }

  public crearConcepto(payload: CreateConceptoTributarioRequest): Observable<boolean> {
    this.loading.set(true);
    return this.api.crearConcepto(payload).pipe(
      map(() => {
        this.loading.set(false);
        this.cargarConceptos();
        this.cargarTodosConceptos();
        return true;
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error creando concepto tributario:', err);
        return of(false);
      })
    );
  }

  public actualizarConcepto(id: number, payload: UpdateConceptoTributarioRequest): Observable<boolean> {
    this.loading.set(true);
    return this.api.actualizarConcepto(id, payload).pipe(
      map(() => {
        this.loading.set(false);
        this.cargarConceptos();
        this.cargarTodosConceptos();
        return true;
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error actualizando concepto tributario:', err);
        return of(false);
      })
    );
  }

  public eliminarConcepto(id: number): Observable<boolean> {
    this.loading.set(true);
    return this.api.eliminarConcepto(id).pipe(
      map(() => {
        this.loading.set(false);
        this.cargarConceptos();
        this.cargarTodosConceptos();
        return true;
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error eliminando concepto tributario:', err);
        return of(false);
      })
    );
  }

  public toggleActivo(item: ConceptoTributarioDto): Observable<boolean> {
    const nuevoEstado = !item.activo;
    return this.api.toggleActivo(item.id, nuevoEstado).pipe(
      tap(() => {
        this.conceptos.update(list => list.map(c => c.id === item.id ? { ...c, activo: nuevoEstado } : c));
        this.todosConceptos.update(list => list.map(c => c.id === item.id ? { ...c, activo: nuevoEstado } : c));
      }),
      map(() => true),
      catchError(err => {
        console.error('Error al cambiar estado de concepto tributario:', err);
        return of(false);
      })
    );
  }

  public getTipoConceptoLabel(tipoId?: number | null): string {
    if (!tipoId) return 'General';
    const tipo = this.tiposConcepto().find(t => t.id === tipoId);
    return tipo ? tipo.nombre : `Tipo #${tipoId}`;
  }
}
