import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { NormasTributariasApiService } from '../../infrastructure/api/normas-tributarias-api.service';
import { VehiculosFtpFacade } from './vehiculos/vehiculos-ftp.facade';
import {
  NormaTributariaDto,
  CreateNormaTributariaRequest,
  UpdateNormaTributariaRequest,
  FiltrosNormaTributaria
} from '../../domain/interfaces/normas-tributarias.interface';

@Injectable({
  providedIn: 'root'
})
export class NormasTributariasFacade {
  private api = inject(NormasTributariasApiService);
  private ftpFacade = inject(VehiculosFtpFacade);

  // Estados reactivos principales
  readonly normas = signal<NormaTributariaDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedNorma = signal<NormaTributariaDto | null>(null);

  // Filtros reactivos
  readonly searchTerm = signal<string>('');
  readonly tipoNormaFiltro = signal<string>('TODOS');
  readonly estadoFiltro = signal<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');

  // Paginación
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // KPIs computados
  readonly totalNormas = computed(() => this.totalCount() || this.normas().length);
  readonly totalActivas = computed(() => this.normas().filter(n => n.activa).length);
  readonly totalInactivas = computed(() => this.normas().filter(n => !n.activa).length);
  readonly totalConDocumento = computed(() => this.normas().filter(n => Boolean(n.urlFuente)).length);
  readonly totalPages = computed(() => Math.ceil(this.totalNormas() / this.pageSize()) || 1);

  constructor() {
    this.cargarNormas();
  }

  /**
   * Carga la lista de normas tributarias según los filtros activos
   */
  public cargarNormas(): void {
    this.loading.set(true);
    this.error.set(null);

    const filtros: FiltrosNormaTributaria = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      search: this.searchTerm().trim() || undefined,
      tipoNorma: this.tipoNormaFiltro() !== 'TODOS' ? this.tipoNormaFiltro() : undefined,
      activa: this.estadoFiltro() === 'TODOS' ? undefined : this.estadoFiltro() === 'ACTIVOS'
    };

    this.api.getNormasPaged(filtros).pipe(
      catchError(err => {
        console.error('Error cargando normas tributarias:', err);
        this.error.set('No se pudo cargar el listado de normas tributarias.');
        return of(null);
      })
    ).subscribe(res => {
      this.loading.set(false);
      if (res) {
        let items: NormaTributariaDto[] = [];
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

        this.normas.set(items);
        this.totalCount.set(total);
      } else {
        this.normas.set([]);
        this.totalCount.set(0);
      }
    });
  }

  /**
   * Creación de nueva norma tributaria.
   * Si se adjunta un archivo, primero ejecuta /api/Ftp/up-document y guarda la ruta devuelta (remoteFullPath) en urlFuente.
   */
  public crearNorma(payload: CreateNormaTributariaRequest, file?: File | null): Observable<{ success: boolean; message?: string; data?: any }> {
    this.loading.set(true);

    const guardarEnApi = (datos: CreateNormaTributariaRequest) => {
      return this.api.crearNorma(datos).pipe(
        map((res: any) => {
          this.loading.set(false);
          if (res && typeof res === 'object' && 'success' in res && res.success === false) {
            const errDetail = (Array.isArray(res.errors) ? res.errors.join(', ') : res.errors) || res.message || 'Error al crear la norma tributaria.';
            return { success: false, message: errDetail };
          }
          this.cargarNormas();
          return { success: true, message: res?.message || 'Norma tributaria creada correctamente.', data: res?.data };
        }),
        catchError(err => {
          this.loading.set(false);
          console.error('Error creando norma tributaria en backend:', err);
          const msg = err?.error?.message || (Array.isArray(err?.error?.errors) ? err.error.errors.join(', ') : err?.error?.errors) || err?.message || 'Error al crear la norma tributaria.';
          return of({ success: false, message: msg });
        })
      );
    };

    if (file) {
      return this.ftpFacade.uploadAnyDocument(file, 'NormasTributarias').pipe(
        switchMap(ftpResp => {
          const resp: any = ftpResp || {};
          const rutaFtp = resp.remoteFullPath || resp.fileName || resp.url || (typeof resp === 'string' ? resp : null);
          const hashDoc = resp.fileId || resp.fileName || null;
          const datosActualizados: CreateNormaTributariaRequest = {
            ...payload,
            urlFuente: rutaFtp,
            hashDocumento: hashDoc
          };
          return guardarEnApi(datosActualizados);
        }),
        catchError(ftpErr => {
          this.loading.set(false);
          console.error('Error subiendo documento al FTP:', ftpErr);
          const msg = ftpErr?.error?.message || ftpErr?.message || 'Error al subir el documento PDF al servidor FTP.';
          return of({ success: false, message: msg });
        })
      );
    }

    return guardarEnApi(payload);
  }

  /**
   * Actualización de norma tributaria existente.
   * Si se adjunta un nuevo archivo, primero lo sube al FTP y actualiza urlFuente.
   */
  public actualizarNorma(id: number, payload: UpdateNormaTributariaRequest, file?: File | null): Observable<{ success: boolean; message?: string }> {
    this.loading.set(true);

    const guardarEnApi = (datos: UpdateNormaTributariaRequest) => {
      return this.api.actualizarNorma(id, datos).pipe(
        map((res: any) => {
          this.loading.set(false);
          if (res && typeof res === 'object' && 'success' in res && res.success === false) {
            const errDetail = (Array.isArray(res.errors) ? res.errors.join(', ') : res.errors) || res.message || 'Error al actualizar la norma tributaria.';
            return { success: false, message: errDetail };
          }
          this.cargarNormas();
          return { success: true, message: res?.message || 'Norma tributaria actualizada correctamente.' };
        }),
        catchError(err => {
          this.loading.set(false);
          console.error('Error actualizando norma tributaria en backend:', err);
          const msg = err?.error?.message || (Array.isArray(err?.error?.errors) ? err.error.errors.join(', ') : err?.error?.errors) || err?.message || 'Error al actualizar la norma tributaria.';
          return of({ success: false, message: msg });
        })
      );
    };

    if (file) {
      return this.ftpFacade.uploadAnyDocument(file, 'NormasTributarias').pipe(
        switchMap(ftpResp => {
          const resp: any = ftpResp || {};
          const rutaFtp = resp.remoteFullPath || resp.fileName || resp.url || (typeof resp === 'string' ? resp : null);
          const hashDoc = resp.fileId || resp.fileName || null;
          const datosActualizados: UpdateNormaTributariaRequest = {
            ...payload,
            urlFuente: rutaFtp,
            hashDocumento: hashDoc
          };
          return guardarEnApi(datosActualizados);
        }),
        catchError(ftpErr => {
          this.loading.set(false);
          console.error('Error subiendo documento al FTP:', ftpErr);
          const msg = ftpErr?.error?.message || ftpErr?.message || 'Error al subir el documento PDF al servidor FTP.';
          return of({ success: false, message: msg });
        })
      );
    }

    return guardarEnApi(payload);
  }

  /**
   * Eliminación física de norma tributaria (elimina en BD y en FTP)
   */
  public eliminarNorma(id: number): Observable<{ success: boolean; message?: string }> {
    this.loading.set(true);
    return this.api.eliminarNorma(id).pipe(
      map(res => {
        this.loading.set(false);
        this.cargarNormas();
        return { success: true, message: res?.message || 'Norma tributaria eliminada correctamente.' };
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('Error eliminando norma tributaria:', err);
        const msg = err?.error?.message || 'Error al eliminar la norma tributaria.';
        return of({ success: false, message: msg });
      })
    );
  }

  /**
   * Alternar estado Activa/Inactiva (PATCH)
   */
  public toggleActiva(item: NormaTributariaDto): Observable<boolean> {
    const nuevoEstado = !item.activa;
    return this.api.toggleActiva(item.id, nuevoEstado).pipe(
      tap(() => {
        this.normas.update(list => list.map(n => n.id === item.id ? { ...n, activa: nuevoEstado } : n));
      }),
      map(() => true),
      catchError(err => {
        console.error('Error al cambiar estado de norma tributaria:', err);
        return of(false);
      })
    );
  }

  /**
   * Obtener detalle por ID
   */
  public obtenerPorId(id: number): Observable<NormaTributariaDto | null> {
    return this.api.getNormaById(id).pipe(
      map(res => res?.data || null),
      catchError(err => {
        console.error('Error obteniendo norma tributaria por ID:', err);
        return of(null);
      })
    );
  }
}
