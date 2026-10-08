import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { OtrosValoresApiService } from '../../infrastructure/api/otros-valores-api.service';
import { ParametrosSharedService } from '../../../../shared/services/parametros-shared.service';
import {
  OtroValorDto,
  CreateOtroValorRequest,
  UpdateOtroValorRequest,
  FiltrosOtroValor,
  ConceptoTributarioDto
} from '../../domain/interfaces/otros-valores.interface';

import { ConceptosTributariosFacade } from './conceptos-tributarios.facade';

@Injectable({
  providedIn: 'root'
})
export class OtrosValoresFacade {
  private api = inject(OtrosValoresApiService);
  readonly shared = inject(ParametrosSharedService);
  readonly conceptosFacade = inject(ConceptosTributariosFacade);

  readonly otrosValores = signal<OtroValorDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly vigencias = computed(() => this.shared.vigencias());

  // Conceptos tributarios ACTIVOS para select options (se actualiza automáticamente al crear/editar/activar)
  readonly conceptosActivos = computed<ConceptoTributarioDto[]>(() => {
    return this.conceptosFacade.conceptosActivos().map(c => ({
      id: c.id,
      tipoConceptoTributarioId: c.tipoConceptoTributarioId,
      codigo: c.codigo,
      nombre: c.nombre,
      activo: c.activo,
      rowVersion: c.rowVersion
    }));
  });

  // Todos los conceptos (para etiquetas en tablas y reportes)
  readonly conceptos = computed<ConceptoTributarioDto[]>(() => {
    return this.conceptosFacade.todosConceptos().map(c => ({
      id: c.id,
      tipoConceptoTributarioId: c.tipoConceptoTributarioId,
      codigo: c.codigo,
      nombre: c.nombre,
      activo: c.activo,
      rowVersion: c.rowVersion
    }));
  });

  readonly searchTerm = signal<string>('');
  readonly vigenciaFiltro = signal<number | 'TODOS'>('TODOS');
  readonly conceptoFiltro = signal<number | 'TODOS'>('TODOS');
  readonly estadoFiltro = signal<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');

  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);

  readonly totalOtrosValores = computed(() => this.totalCount() || this.otrosValores().length);
  readonly totalActivos = computed(() => this.otrosValores().filter(o => o.activo).length);
  readonly totalInactivos = computed(() => this.otrosValores().filter(o => !o.activo).length);
  readonly totalConceptos = computed(() => new Set(this.otrosValores().map(o => o.conceptoTributarioId)).size);

  constructor() {
    this.shared.cargarParametrosGenerales();
    this.cargar();
  }

  private extraerItems(res: any): { items: any[]; total: number } {
    if (Array.isArray(res)) return { items: res, total: res.length };
    if (res?.data) {
      if (Array.isArray(res.data)) return { items: res.data, total: res.data.length };
      if (Array.isArray(res.data.items)) return { items: res.data.items, total: res.data.totalCount ?? res.data.items.length };
    }
    if (res?.items && Array.isArray(res.items)) {
      return { items: res.items, total: res.totalCount ?? res.items.length };
    }
    return { items: [], total: 0 };
  }

  public cargarConceptos(): void {
    this.conceptosFacade.cargarTodosConceptos();
  }

  public cargar(): void {
    this.loading.set(true);
    this.error.set(null);

    const filtros: FiltrosOtroValor = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      searchTerm: this.searchTerm().trim() || undefined,
      vigenciaFiscalId: this.vigenciaFiltro() !== 'TODOS' ? Number(this.vigenciaFiltro()) : undefined,
      conceptoTributarioId: this.conceptoFiltro() !== 'TODOS' ? Number(this.conceptoFiltro()) : undefined,
      activo: this.estadoFiltro() === 'TODOS' ? undefined : this.estadoFiltro() === 'ACTIVOS'
    };

    this.api.getOtrosValoresPaged(filtros).pipe(
      catchError(err => {
        console.error('Error cargando otros valores:', err);
        this.error.set('No se pudo cargar el listado de otros valores.');
        return of(null);
      })
    ).subscribe(res => {
      this.loading.set(false);
      if (res) {
        const { items, total } = this.extraerItems(res);
        this.otrosValores.set(items);
        this.totalCount.set(total);
      } else {
        this.otrosValores.set([]);
        this.totalCount.set(0);
      }
    });
  }

  public crear(payload: CreateOtroValorRequest): Observable<boolean> {
    this.loading.set(true);
    return this.api.crear(payload).pipe(
      map(() => { this.loading.set(false); this.cargar(); return true; }),
      catchError(err => { this.loading.set(false); console.error('Error creando otro valor:', err); return of(false); })
    );
  }

  public actualizar(id: number, payload: UpdateOtroValorRequest): Observable<boolean> {
    this.loading.set(true);
    return this.api.actualizar(id, payload).pipe(
      map(() => { this.loading.set(false); this.cargar(); return true; }),
      catchError(err => { this.loading.set(false); console.error('Error actualizando otro valor:', err); return of(false); })
    );
  }

  public eliminar(id: number): Observable<boolean> {
    this.loading.set(true);
    return this.api.eliminar(id).pipe(
      map(() => { this.loading.set(false); this.cargar(); return true; }),
      catchError(err => { this.loading.set(false); console.error('Error eliminando otro valor:', err); return of(false); })
    );
  }

  public getVigenciaLabel(id?: number | null): string {
    if (id === null || id === undefined) return '';
    const v = this.vigencias().find(item => item.id === id);
    return v ? String(v.anio) : String(id);
  }

  public getConceptoLabel(id?: number | null): string {
    if (!id) return '';
    const c = this.conceptos().find(item => item.id === id);
    return c ? c.nombre : `Concepto #${id}`;
  }

  public getConceptoCodigo(id?: number | null): string {
    if (!id) return '';
    const c = this.conceptos().find(item => item.id === id);
    return c ? c.codigo : '';
  }
}
