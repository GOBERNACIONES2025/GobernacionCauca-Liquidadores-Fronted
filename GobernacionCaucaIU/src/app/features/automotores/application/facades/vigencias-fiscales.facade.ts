import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { VigenciasFiscalesApiService } from '../../infrastructure/api/vigencias-fiscales-api.service';
import { ParametrosSharedService } from '../../../../shared/services/parametros-shared.service';
import {
  VigenciaFiscalDto,
  CreateVigenciaFiscalRequest,
  UpdateVigenciaFiscalRequest,
  FiltrosVigenciaFiscal
} from '../../domain/interfaces/vigencia-fiscal.interface';

@Injectable({
  providedIn: 'root'
})
export class VigenciasFiscalesFacade {
  private api = inject(VigenciasFiscalesApiService);
  private parametrosShared = inject(ParametrosSharedService);

  // Estados reactivos principales
  readonly vigencias = signal<VigenciaFiscalDto[]>([]);
  readonly vigenciaActiva = signal<VigenciaFiscalDto | null>(null);
  readonly totalCount = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Filtros reactivos
  readonly searchTerm = signal<string>('');
  readonly anioFiltro = signal<number | 'TODOS'>('TODOS');
  readonly estadoFiltro = signal<'TODOS' | 'ACTIVAS' | 'INACTIVAS'>('TODOS');

  // Paginación
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // KPIs computados
  readonly totalVigencias = computed(() => this.totalCount() || this.vigencias().length);
  readonly totalActivas = computed(() => this.vigencias().filter(v => v.activa).length);
  readonly totalInactivas = computed(() => this.vigencias().filter(v => !v.activa).length);
  readonly totalPages = computed(() => Math.ceil(this.totalCount() / (this.pageSize() || 10)) || 1);

  constructor() {
    this.cargarVigencias();
    this.cargarVigenciaActiva();
  }

  /**
   * Carga la lista de vigencias fiscales con los filtros aplicados
   */
  public cargarVigencias(): void {
    this.loading.set(true);
    this.error.set(null);

    const filtros: FiltrosVigenciaFiscal = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      searchTerm: this.searchTerm().trim() || undefined,
      anio: this.anioFiltro() !== 'TODOS' ? Number(this.anioFiltro()) : undefined,
      activa: this.estadoFiltro() === 'TODOS' ? undefined : this.estadoFiltro() === 'ACTIVAS'
    };

    this.api.getVigenciasPaged(filtros).pipe(
      catchError(err => {
        console.error('Error cargando vigencias fiscales:', err);
        this.error.set('No se pudo cargar el listado de vigencias fiscales.');
        return of(null);
      })
    ).subscribe(res => {
      this.loading.set(false);
      if (res) {
        let items: VigenciaFiscalDto[] = [];
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

        // Ordenar por año descendente por defecto para mejor visualización
        items.sort((a, b) => b.anio - a.anio);

        this.vigencias.set(items);
        this.totalCount.set(total);
      } else {
        this.vigencias.set([]);
        this.totalCount.set(0);
      }
    });
  }

  /**
   * Carga la vigencia fiscal activa configurada
   */
  public cargarVigenciaActiva(): void {
    this.api.getVigenciaActiva().pipe(
      catchError(err => {
        console.warn('No hay vigencia activa o error al consultar:', err);
        return of(null);
      })
    ).subscribe(res => {
      if (res?.data) {
        this.vigenciaActiva.set(res.data);
      } else if (res && !res.data && (res as any).anio) {
        this.vigenciaActiva.set(res as any);
      }
    });
  }

  /**
   * Creación de nueva vigencia fiscal
   */
  public crearVigencia(payload: CreateVigenciaFiscalRequest): Observable<{ success: boolean; message?: string }> {
    this.loading.set(true);
    return this.api.crearVigencia(payload).pipe(
      map(res => {
        this.loading.set(false);
        this.cargarVigencias();
        this.cargarVigenciaActiva();
        this.parametrosShared.refrescarVigencias();
        return { success: true, message: 'Vigencia fiscal creada exitosamente.' };
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error creando vigencia fiscal:', err);
        const msg = err?.error?.message || err?.message || 'Error al registrar la vigencia fiscal. Verifique que el año no esté duplicado.';
        return of({ success: false, message: msg });
      })
    );
  }

  /**
   * Actualización de vigencia fiscal existente
   */
  public actualizarVigencia(id: number, payload: UpdateVigenciaFiscalRequest): Observable<{ success: boolean; message?: string }> {
    this.loading.set(true);
    return this.api.actualizarVigencia(id, payload).pipe(
      map(res => {
        this.loading.set(false);
        this.cargarVigencias();
        this.cargarVigenciaActiva();
        this.parametrosShared.refrescarVigencias();
        return { success: true, message: 'Vigencia fiscal actualizada exitosamente.' };
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error actualizando vigencia fiscal:', err);
        const msg = err?.error?.message || err?.message || 'Error al actualizar la vigencia fiscal.';
        return of({ success: false, message: msg });
      })
    );
  }

  /**
   * Alternar estado Activa/Inactiva (PATCH)
   */
  public toggleActiva(item: VigenciaFiscalDto): Observable<boolean> {
    const nuevoEstado = !item.activa;
    return this.api.toggleActiva(item.id, nuevoEstado).pipe(
      tap(() => {
        this.vigencias.update(list => list.map(v => v.id === item.id ? { ...v, activa: nuevoEstado } : v));
        this.cargarVigenciaActiva();
        this.parametrosShared.refrescarVigencias();
      }),
      map(() => true),
      catchError(err => {
        console.error('Error al alternar estado de vigencia:', err);
        return of(false);
      })
    );
  }

  /**
   * Eliminación física con verificación de dependencias
   */
  public eliminarVigencia(id: number): Observable<{ success: boolean; message?: string; hasDependencies?: boolean }> {
    this.loading.set(true);
    return this.api.eliminarVigencia(id).pipe(
      map(res => {
        this.loading.set(false);
        this.cargarVigencias();
        this.cargarVigenciaActiva();
        this.parametrosShared.refrescarVigencias();
        return { success: true, message: 'Vigencia fiscal eliminada correctamente.' };
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error eliminando vigencia fiscal:', err);
        const isConflict = err?.status === 409 || err?.error?.status === 409;
        const msg = err?.error?.message || (isConflict 
          ? 'No se puede eliminar la vigencia fiscal porque posee registros asociados (liquidaciones, calendarios, tarifas o exenciones). Se recomienda desactivarla.'
          : 'Error al eliminar la vigencia fiscal.');
        return of({ success: false, message: msg, hasDependencies: isConflict });
      })
    );
  }
}
