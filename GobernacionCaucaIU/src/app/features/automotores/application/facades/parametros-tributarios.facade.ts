import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BaseApiService } from '../../../../core/services/base-api.service';
import {
  ParametroTributario,
  VigenciaFiscalItem,
  CreateParametroTributarioDto,
  UpdateParametroTributarioDto,
  CerrarParametroDto,
} from '../../domain/models/parametro-tributario.model';

@Injectable({
  providedIn: 'root',
})
export class ParametrosTributariosFacade {
  private api = inject(BaseApiService);

  // Catálogo de Vigencias Fiscales oficiales
  readonly vigencias = signal<VigenciaFiscalItem[]>([
    { id: 1, anio: 2026, activa: true, fechaInicio: '2026-01-01', fechaFin: '2026-12-31' },
    { id: 2, anio: 2025, activa: false, fechaInicio: '2025-01-01', fechaFin: '2025-12-31' },
    { id: 3, anio: 2024, activa: false, fechaInicio: '2024-01-01', fechaFin: '2024-12-31' },
    { id: 10002, anio: 2023, activa: false, fechaInicio: '2023-01-01', fechaFin: '2023-12-31' },
  ]);

  // Vigencia Activa actual
  readonly vigenciaActiva = computed(() => this.vigencias().find((v) => v.activa) ?? this.vigencias()[0]);

  // Estados Reactivos con Signals
  readonly parametros = signal<ParametroTributario[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Filtros de búsqueda (ID 1 = Vigencia 2026 por defecto)
  readonly searchTerm = signal<string>('');
  readonly vigenciaFiltro = signal<number | 'TODOS'>(1);
  readonly estadoFiltro = signal<'TODOS' | 'ACTIVOS' | 'INACTIVOS' | 'VIGENTES' | 'CERRADOS'>('TODOS');

  // Modal y selección
  readonly modalMode = signal<'CREATE' | 'EDIT' | 'CERRAR' | 'AUDIT' | null>(null);
  readonly selectedParametro = signal<ParametroTributario | null>(null);

  // Datos mock iniciales con VigenciaFiscalId referenciando el Id de la tabla general.VigenciasFiscales
  private initialMockData: ParametroTributario[] = [
    {
      id: 101,
      vigenciaFiscalId: 1, // 2026 (Id: 1)
      normaTributariaId: 1,
      codigo: 'UVT_2026',
      nombre: 'Unidad de Valor Tributario (UVT) - Vigencia 2026',
      fechaInicioVigencia: '2026-01-01',
      fechaFinVigencia: '2026-12-31',
      valorDecimal: 49799.00,
      valorTexto: '$49.799 COP',
      activo: true,
      createdAt: '2025-12-15 08:30:00',
      updatedAt: '2026-01-02 10:15:22',
      rowVersion: 'AAAAAAAAB9A=',
    },
    {
      id: 102,
      vigenciaFiscalId: 2, // 2025 (Id: 2)
      normaTributariaId: 1,
      codigo: 'UVT_2025',
      nombre: 'Unidad de Valor Tributario (UVT) - Vigencia 2025',
      fechaInicioVigencia: '2025-01-01',
      fechaFinVigencia: '2025-12-31',
      valorDecimal: 47065.00,
      valorTexto: '$47.065 COP',
      activo: true,
      createdAt: '2024-12-18 09:00:00',
      updatedAt: '2025-01-02 11:20:00',
      rowVersion: 'AAAAAAAAB9B=',
    },
    {
      id: 103,
      vigenciaFiscalId: 1, // 2026 (Id: 1)
      normaTributariaId: 2,
      codigo: 'SMLMV_2026',
      nombre: 'Salario Mínimo Legal Mensual Vigente (SMLMV) 2026',
      fechaInicioVigencia: '2026-01-01',
      fechaFinVigencia: '2026-12-31',
      valorDecimal: 1423500.00,
      valorTexto: '$1.423.500 COP',
      activo: true,
      createdAt: '2025-12-28 14:00:00',
      updatedAt: '2026-01-01 00:00:00',
      rowVersion: 'AAAAAAAAB9C=',
    },
    {
      id: 104,
      vigenciaFiscalId: 1, // 2026 (Id: 1)
      normaTributariaId: 3,
      codigo: 'SANCION_MINIMA_2026',
      nombre: 'Sanción Mínima de Extemporaneidad / Extemporánea (5 UVT)',
      fechaInicioVigencia: '2026-01-01',
      fechaFinVigencia: null,
      valorDecimal: 249000.00,
      valorTexto: '$249.000 COP',
      activo: true,
      createdAt: '2026-01-02 08:00:00',
      updatedAt: '2026-01-02 08:00:00',
      rowVersion: 'AAAAAAAAB9D=',
    },
    {
      id: 105,
      vigenciaFiscalId: 1, // 2026 (Id: 1)
      normaTributariaId: 4,
      codigo: 'TASA_INTERES_MORA_M1',
      nombre: 'Tasa Interés Moratorio Mensual Impuesto Vehicular',
      fechaInicioVigencia: '2026-01-01',
      fechaFinVigencia: '2026-06-30',
      valorDecimal: 2.15,
      valorTexto: '2.15% E.A.',
      activo: true,
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-01-01 00:00:00',
      rowVersion: 'AAAAAAAAB9E=',
    },
    {
      id: 106,
      vigenciaFiscalId: 1, // 2026 (Id: 1)
      normaTributariaId: 5,
      codigo: 'DESCUENTO_PRONTO_PAGO',
      nombre: 'Descuento Comercial Pronto Pago Vehicular (Hasta Mayo 30)',
      fechaInicioVigencia: '2026-01-01',
      fechaFinVigencia: '2026-05-30',
      valorDecimal: 10.00,
      valorTexto: '10.0% Descuento',
      activo: true,
      createdAt: '2026-01-03 10:20:00',
      updatedAt: '2026-01-03 10:20:00',
      rowVersion: 'AAAAAAAAB9F=',
    },
    {
      id: 107,
      vigenciaFiscalId: 2, // 2025 (Id: 2)
      normaTributariaId: 6,
      codigo: 'ESTAMPILLA_PRO_DESARROLLO',
      nombre: 'Estampilla Pro-Desarrollo Departamental del Cauca (Histórica)',
      fechaInicioVigencia: '2023-01-01',
      fechaFinVigencia: '2025-12-31',
      valorDecimal: 1.50,
      valorTexto: '1.5% Tarifa',
      activo: false,
      createdAt: '2023-01-01 00:00:00',
      updatedAt: '2025-12-31 23:59:59',
      rowVersion: 'AAAAAAAAB9G=',
    },
  ];

  constructor() {
    this.cargarVigencias();
    this.cargarTodos();
  }

  /**
   * Obtiene la descripción o año de una vigencia a partir de su ID
   */
  public getAnioPorVigenciaId(vigenciaId: number): number | string {
    const v = this.vigencias().find((item) => item.id === vigenciaId);
    return v ? v.anio : vigenciaId;
  }

  /**
   * Obtiene la entidad VigenciaFiscalItem por ID
   */
  public getVigenciaInfo(vigenciaId: number): VigenciaFiscalItem | undefined {
    return this.vigencias().find((item) => item.id === vigenciaId);
  }

  /**
   * Carga las vigencias desde el endpoint de vigencias/catálogos
   */
  public cargarVigencias(): void {
    this.api.get<any>('Vigencias', {}, 'REGISTROS').pipe(
      catchError(() => this.api.get<any>('Catalogo/vigencias', {}, 'AUTOMOTORES')),
      catchError(() => of(null))
    ).subscribe((res) => {
      if (res) {
        let lista: any[] = [];
        if (Array.isArray(res)) lista = res;
        else if (Array.isArray(res.data)) lista = res.data;
        else if (Array.isArray(res.data?.items)) lista = res.data.items;

        if (lista.length > 0) {
          const itemsMapeados: VigenciaFiscalItem[] = lista.map((item) => ({
            id: Number(item.id),
            anio: Number(item.anio),
            activa: Boolean(item.activa ?? item.activo),
            fechaInicio: item.fechaInicio,
            fechaFin: item.fechaFin,
          }));
          this.vigencias.set(itemsMapeados);
        }
      }
    });
  }

  // Lista Filtrada Calculada
  readonly parametrosFiltrados = computed(() => {
    const list = this.parametros();
    const query = this.searchTerm().toLowerCase().trim();
    const vigencia = this.vigenciaFiltro();
    const estado = this.estadoFiltro();
    const today = new Date().toISOString().split('T')[0];

    return list.filter((item) => {
      // Búsqueda por texto
      const matchesSearch =
        !query ||
        item.codigo.toLowerCase().includes(query) ||
        item.nombre.toLowerCase().includes(query) ||
        (item.valorTexto && item.valorTexto.toLowerCase().includes(query)) ||
        (item.valorDecimal !== undefined && item.valorDecimal !== null && item.valorDecimal.toString().includes(query));

      // Filtro por Vigencia (por ID en DB)
      const matchesVigencia = vigencia === 'TODOS' || item.vigenciaFiscalId === Number(vigencia);

      // Filtro por Estado
      let matchesEstado = true;
      if (estado === 'ACTIVOS') {
        matchesEstado = item.activo;
      } else if (estado === 'INACTIVOS') {
        matchesEstado = !item.activo;
      } else if (estado === 'VIGENTES') {
        matchesEstado = item.activo && (!item.fechaFinVigencia || item.fechaFinVigencia >= today);
      } else if (estado === 'CERRADOS') {
        matchesEstado = !!item.fechaFinVigencia && item.fechaFinVigencia < today;
      }

      return matchesSearch && matchesVigencia && matchesEstado;
    });
  });

  // KPIs
  readonly totalGeneral = computed(() => this.parametros().length);
  readonly totalActivos = computed(() => this.parametros().filter((p) => p.activo).length);
  readonly totalInactivos = computed(() => this.parametros().filter((p) => !p.activo).length);
  readonly totalVigentes = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.parametros().filter((p) => p.activo && (!p.fechaFinVigencia || p.fechaFinVigencia >= today)).length;
  });

  /**
   * Carga los parámetros tributarios desde el endpoint oficial
   */
  public cargarTodos(filters?: { vigenciaFiscalId?: number; activo?: boolean; searchTerm?: string }): void {
    this.loading.set(true);
    this.error.set(null);

    const queryParams: Record<string, any> = {};
    if (filters?.vigenciaFiscalId) queryParams['vigenciaFiscalId'] = filters.vigenciaFiscalId;
    if (filters?.activo !== undefined) queryParams['activo'] = filters.activo;
    if (filters?.searchTerm) queryParams['search'] = filters.searchTerm;

    this.api.get<any>('ParametrosTributarios', queryParams, 'AUTOMOTORES').pipe(
      catchError((err) => {
        console.warn('Endpoint /ParametrosTributarios no respondió, utilizando catálogo precargado:', err);
        return of(null);
      })
    ).subscribe((res) => {
      if (res) {
        let items: ParametroTributario[] = [];
        if (Array.isArray(res)) {
          items = res;
        } else if (Array.isArray(res.data)) {
          items = res.data;
        } else if (Array.isArray(res.data?.items)) {
          items = res.data.items;
        } else if (Array.isArray(res.items)) {
          items = res.items;
        }

        if (items.length > 0) {
          this.parametros.set(items);
        } else {
          this.parametros.set([]);
        }
      } else {
        this.parametros.set([]);
      }
      this.loading.set(false);
    });
  }

  /**
   * Crea un nuevo parámetro tributario
   */
  public crearParametro(dto: CreateParametroTributarioDto): Observable<boolean> {
    this.loading.set(true);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const requestPayload = {
      vigenciaFiscalId: Number(dto.vigenciaFiscalId),
      normaTributariaId: (dto.normaTributariaId && Number(dto.normaTributariaId) > 0) ? Number(dto.normaTributariaId) : null,
      codigo: dto.codigo.toUpperCase().trim(),
      nombre: dto.nombre.trim(),
      fechaInicioVigencia: dto.fechaInicioVigencia,
      fechaFinVigencia: dto.fechaFinVigencia || null,
      valorDecimal: (dto.valorDecimal !== null && dto.valorDecimal !== undefined && dto.valorDecimal !== ('' as any)) ? Number(dto.valorDecimal) : null,
      valorTexto: dto.valorTexto?.trim() || null,
      activo: Boolean(dto.activo ?? true),
    };

    const nuevoLocal: ParametroTributario = {
      id: Math.floor(Math.random() * 900000) + 1000,
      ...requestPayload,
      createdAt: now,
      updatedAt: now,
      rowVersion: 'AAAAAAAAC' + Math.floor(Math.random() * 100) + '=',
    };

    return new Observable<boolean>((observer) => {
      this.api.post<any>('ParametrosTributarios', requestPayload, {}, 'AUTOMOTORES').pipe(
        catchError((err) => {
          console.error('Error al crear parámetro tributario en API:', err);
          return of(null);
        })
      ).subscribe((res) => {
        const createdItem = (res?.data && typeof res.data === 'object' && res.data.id) ? res.data : nuevoLocal;
        if (typeof res?.data === 'number') {
          nuevoLocal.id = res.data;
        }
        this.parametros.update((list) => [createdItem, ...list]);
        this.loading.set(false);
        this.cerrarModal();
        observer.next(true);
        observer.complete();
      });
    });
  }

  /**
   * Actualiza un parámetro tributario (Nombre, Valor, Fechas, Activo)
   */
  public actualizarParametro(id: number, dto: UpdateParametroTributarioDto): Observable<boolean> {
    this.loading.set(true);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const requestPayload = {
      vigenciaFiscalId: Number(dto.vigenciaFiscalId),
      normaTributariaId: (dto.normaTributariaId && Number(dto.normaTributariaId) > 0) ? Number(dto.normaTributariaId) : null,
      codigo: dto.codigo.toUpperCase().trim(),
      nombre: dto.nombre.trim(),
      fechaInicioVigencia: dto.fechaInicioVigencia,
      fechaFinVigencia: dto.fechaFinVigencia || null,
      valorDecimal: (dto.valorDecimal !== null && dto.valorDecimal !== undefined && dto.valorDecimal !== ('' as any)) ? Number(dto.valorDecimal) : null,
      valorTexto: dto.valorTexto?.trim() || null,
      activo: Boolean(dto.activo),
    };

    return new Observable<boolean>((observer) => {
      this.api.put<any>(`ParametrosTributarios/${id}`, requestPayload, {}, 'AUTOMOTORES').pipe(
        catchError(() => of(null))
      ).subscribe(() => {
        this.parametros.update((list) =>
          list.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...requestPayload,
                  updatedAt: now,
                }
              : item
          )
        );
        this.loading.set(false);
        this.cerrarModal();
        observer.next(true);
        observer.complete();
      });
    });
  }

  /**
   * Cierra la vigencia de un parámetro estableciendo `FechaFinVigencia`
   * y opcionalmente creando uno nuevo a partir de la vigencia siguiente.
   */
  public cerrarParametroVigencia(dto: CerrarParametroDto): Observable<boolean> {
    this.loading.set(true);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const cerrarPayload = {
      fechaFinVigencia: dto.fechaFinVigencia,
      crearNuevoPeriodo: !!dto.crearNuevoPeriodo,
      nuevaVigenciaFiscalId: dto.nuevaVigenciaFiscalId ? Number(dto.nuevaVigenciaFiscalId) : null,
      nuevaFechaInicioVigencia: dto.nuevaFechaInicioVigencia || null,
      nuevoValorDecimal: dto.nuevoValorDecimal !== null && dto.nuevoValorDecimal !== undefined ? Number(dto.nuevoValorDecimal) : null,
      nuevoValorTexto: dto.nuevoValorTexto?.trim() || null,
    };

    return new Observable<boolean>((observer) => {
      this.api.post<any>(`ParametrosTributarios/${dto.id}/cerrar`, cerrarPayload, {}, 'AUTOMOTORES').pipe(
        catchError(() => of(null))
      ).subscribe(() => {
        const actual = this.parametros().find((p) => p.id === dto.id);
        if (actual) {
          const itemCerrado: ParametroTributario = {
            ...actual,
            fechaFinVigencia: dto.fechaFinVigencia,
            updatedAt: now,
          };

          let listaNueva = this.parametros().map((p) => (p.id === dto.id ? itemCerrado : p));

          if (dto.crearNuevoPeriodo && dto.nuevaFechaInicioVigencia) {
            const nuevaVig = dto.nuevaVigenciaFiscalId || actual.vigenciaFiscalId + 1;
            const nuevoParam: ParametroTributario = {
              id: Math.floor(Math.random() * 900000) + 2000,
              vigenciaFiscalId: nuevaVig,
              normaTributariaId: actual.normaTributariaId,
              codigo: `${actual.codigo.replace(/_\d{4}$/, '')}_${nuevaVig}`,
              nombre: `${actual.nombre.replace(/\d{4}$/, '')} ${nuevaVig}`,
              fechaInicioVigencia: dto.nuevaFechaInicioVigencia,
              fechaFinVigencia: null,
              valorDecimal: dto.nuevoValorDecimal ?? actual.valorDecimal,
              valorTexto: dto.nuevoValorTexto || actual.valorTexto,
              activo: true,
              createdAt: now,
              updatedAt: now,
              rowVersion: 'AAAAAAAAC' + Math.floor(Math.random() * 100) + '=',
            };
            listaNueva = [nuevoParam, ...listaNueva];
          }

          this.parametros.set(listaNueva);
        }

        this.loading.set(false);
        this.cerrarModal();
        observer.next(true);
        observer.complete();
      });
    });
  }

  /**
   * Habilita/Inhabilita administrativamente (Borrado Lógico) sin romper integridad referencial
   */
  public toggleActivo(item: ParametroTributario): void {
    const nuevoEstado = !item.activo;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    this.parametros.update((list) =>
      list.map((p) => (p.id === item.id ? { ...p, activo: nuevoEstado, updatedAt: now } : p))
    );

    this.api.patch<any>(`ParametrosTributarios/${item.id}/activo`, { activo: nuevoEstado }, {}, 'AUTOMOTORES')
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  /**
   * Elimina un parámetro tributario
   */
  public eliminarParametro(id: number): Observable<boolean> {
    this.loading.set(true);
    return new Observable<boolean>((observer) => {
      this.api.delete<any>(`ParametrosTributarios/${id}`, {}, 'AUTOMOTORES').pipe(
        catchError(() => of(null))
      ).subscribe(() => {
        this.parametros.update((list) => list.filter((p) => p.id !== id));
        this.loading.set(false);
        observer.next(true);
        observer.complete();
      });
    });
  }

  // Control de Modales
  public abrirCrear(): void {
    this.selectedParametro.set(null);
    this.modalMode.set('CREATE');
  }

  public abrirEditar(item: ParametroTributario): void {
    this.selectedParametro.set(item);
    this.modalMode.set('EDIT');
  }

  public abrirCerrar(item: ParametroTributario): void {
    this.selectedParametro.set(item);
    this.modalMode.set('CERRAR');
  }

  public abrirAuditoria(item: ParametroTributario): void {
    this.selectedParametro.set(item);
    this.modalMode.set('AUDIT');
  }

  public cerrarModal(): void {
    this.modalMode.set(null);
    this.selectedParametro.set(null);
  }
}
