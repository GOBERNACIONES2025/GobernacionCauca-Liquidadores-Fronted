import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CookieService } from '../../core/services/cookie.service';
import { VigenciasFiscalesApiService } from '../../features/automotores/infrastructure/api/vigencias-fiscales-api.service';
import { DepartamentosApiService } from '../../features/automotores/infrastructure/api/departamentos-api.service';
import { CatalogoApiService } from '../../features/automotores/infrastructure/api/catalogo-api.service';
import { NormasTributariasApiService } from '../../features/automotores/infrastructure/api/normas-tributarias-api.service';
import { VigenciaFiscalDto } from '../../features/automotores/domain/interfaces/vigencia-fiscal.interface';
import { NormaTributariaDto } from '../../features/automotores/domain/interfaces/normas-tributarias.interface';
import { DepartamentoDto, CiudadDto } from '../../features/automotores/domain/interfaces/geografico.interface';
import {
  CatalogoItemDto,
  TipoDocumentoDto,
  NaturalezaJuridicaDto,
  TodosCatalogosDto,
} from '../../features/automotores/domain/interfaces/catalogo.interface';

const COOKIE_VIGENCIA_KEY = 'gov_vigencia_activa';

@Injectable({
  providedIn: 'root',
})
export class ParametrosSharedService {
  private vigenciasApi = inject(VigenciasFiscalesApiService);
  private departamentosApi = inject(DepartamentosApiService);
  private catalogoApi = inject(CatalogoApiService);
  private normasApi = inject(NormasTributariasApiService);
  private cookieService = inject(CookieService);

  // ==========================================
  // ESTADOS REACTIVOS EN MEMORIA (SIGNALS)
  // ==========================================

  // Vigencias Fiscales y Normas
  readonly vigencias = signal<VigenciaFiscalDto[]>([]);
  readonly vigenciaActiva = signal<VigenciaFiscalDto | null>(null);
  readonly anioVigenciaSeleccionada = signal<number | null>(this.leerVigenciaCookie());
  readonly normas = signal<NormaTributariaDto[]>([]);

  // Territorio (Departamentos y caché en memoria de Ciudades)
  readonly departamentos = signal<DepartamentoDto[]>([]);
  readonly ciudadesPorDepto = signal<Record<number, CiudadDto[]>>({});

  // Catálogos Generales Paramétricos
  readonly organismosTransito = signal<CatalogoItemDto[]>([]);
  readonly tiposDocumento = signal<TipoDocumentoDto[]>([]);
  readonly naturalezasJuridicas = signal<NaturalezaJuridicaDto[]>([]);
  readonly serviciosVehiculo = signal<CatalogoItemDto[]>([]);
  readonly combustibles = signal<CatalogoItemDto[]>([]);
  readonly clasesVehiculo = signal<CatalogoItemDto[]>([]);
  readonly tiposVehiculo = signal<CatalogoItemDto[]>([]);
  readonly estadosMatricula = signal<CatalogoItemDto[]>([]);
  readonly tiposVinculo = signal<CatalogoItemDto[]>([]);

  // Estados de Control de Carga
  readonly loading = signal<boolean>(false);
  readonly loaded = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // ==========================================
  // COMPUTED SIGNALS
  // ==========================================
  readonly vigenciasActivas = computed(() => this.vigencias().filter((v) => v.activa));
  readonly totalVigencias = computed(() => this.vigencias().length);

  constructor() {
    this.cargarParametrosGenerales();
  }

  /**
   * Carga inicial unificada de los catálogos y vigencias en memoria (Cache-Aside).
   * Si ya están cargados o se están cargando, omite la petición al backend.
   */
  cargarParametrosGenerales(): void {
    if (this.loaded() || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      vigenciasPaged: this.vigenciasApi.getVigenciasPaged({ pageSize: 100 }).pipe(
        map((res: any) => {
          if (Array.isArray(res)) return res;
          if (res?.data) {
            if (Array.isArray(res.data)) return res.data;
            if (Array.isArray(res.data.items)) return res.data.items;
          }
          return [] as VigenciaFiscalDto[];
        }),
        catchError(() => of([] as VigenciaFiscalDto[]))
      ),
      vigenciaActiva: this.vigenciasApi.getVigenciaActiva().pipe(
        map((res: any) => (res?.data ? res.data : (res?.anio ? res : null))),
        catchError(() => of(null))
      ),
      departamentos: this.departamentosApi.getDepartamentos().pipe(
        map((res: any) => (res && 'data' in res && res.data ? res.data : (Array.isArray(res) ? res : []))),
        catchError(() => of([] as DepartamentoDto[]))
      ),
      catalogos: this.catalogoApi.getTodos().pipe(
        map((res) => res?.data || ({} as TodosCatalogosDto)),
        catchError(() => of({} as TodosCatalogosDto))
      ),
      servicios: this.catalogoApi.getServiciosVehiculo().pipe(
        map((res: any) => (res && 'data' in res && res.data ? res.data : (Array.isArray(res) ? res : []))),
        catchError(() => of([] as CatalogoItemDto[]))
      ),
      normas: this.normasApi.getNormasPaged({ pageSize: 100 }).pipe(
        map((res: any) => {
          if (Array.isArray(res)) return res;
          if (res?.data) {
            if (Array.isArray(res.data)) return res.data;
            if (Array.isArray(res.data.items)) return res.data.items;
          }
          return [] as NormaTributariaDto[];
        }),
        catchError(() => of([] as NormaTributariaDto[]))
      ),
    }).subscribe({
      next: ({ vigenciasPaged, vigenciaActiva, departamentos, catalogos, servicios, normas }) => {
        // Ordenar vigencias descendente
        vigenciasPaged.sort((a: VigenciaFiscalDto, b: VigenciaFiscalDto) => b.anio - a.anio);
        this.vigencias.set(vigenciasPaged);

        if (vigenciaActiva) {
          this.vigenciaActiva.set(vigenciaActiva);
          if (!this.anioVigenciaSeleccionada()) {
            this.setVigenciaSeleccionada(vigenciaActiva.anio);
          }
        } else if (vigenciasPaged.length > 0 && !this.anioVigenciaSeleccionada()) {
          const primeraActiva = vigenciasPaged.find((v: VigenciaFiscalDto) => v.activa) || vigenciasPaged[0];
          this.vigenciaActiva.set(primeraActiva);
          this.setVigenciaSeleccionada(primeraActiva.anio);
        }

        // Departamentos
        this.departamentos.set(departamentos);

        // Normas Tributarias
        this.normas.set(normas);

        // Catálogos vehiculares y tributarios
        const servs = servicios.length > 0 ? servicios : (catalogos.serviciosVehiculo || []);
        this.serviciosVehiculo.set(servs);
        this.estadosMatricula.set(catalogos.estadosMatricula || []);
        this.tiposVinculo.set(catalogos.tiposVinculo || []);
        this.tiposVehiculo.set(catalogos.tiposVehiculo || []);
        this.combustibles.set(catalogos.combustibles || []);
        this.organismosTransito.set(catalogos.organismosTransito || []);
        this.tiposDocumento.set(catalogos.tiposDocumento || []);
        this.naturalezasJuridicas.set(catalogos.naturalezasJuridicas || []);
        this.clasesVehiculo.set(catalogos.clasesVehiculo || []);

        this.loaded.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando parámetros compartidos:', err);
        this.error.set('No se pudieron cargar todos los parámetros del sistema.');
        this.loading.set(false);
      },
    });
  }

  /**
   * Carga y almacena en caché en memoria las ciudades de un departamento específico.
   * Evita consultar a la API si ya fueron consultadas previamente en la sesión.
   */
  cargarCiudadesPorDepartamento(departamentoId: number, callback?: (ciudades: CiudadDto[]) => void): void {
    if (!departamentoId) {
      if (callback) callback([]);
      return;
    }

    const cacheActual = this.ciudadesPorDepto();
    if (cacheActual[departamentoId]) {
      if (callback) callback(cacheActual[departamentoId]);
      return;
    }

    this.departamentosApi.getCiudadesByDepartamento(departamentoId).pipe(
      catchError(() => of(null))
    ).subscribe((res: any) => {
      const data: CiudadDto[] = (res && 'data' in res && res.data) ? res.data : (Array.isArray(res) ? res : []);
      this.ciudadesPorDepto.update((prev) => ({
        ...prev,
        [departamentoId]: data,
      }));
      if (callback) callback(data);
    });
  }

  /**
   * Obtiene las ciudades en memoria de un departamento sin disparar petición
   */
  getCiudadesCached(departamentoId: number): CiudadDto[] {
    return this.ciudadesPorDepto()[departamentoId] || [];
  }

  /**
   * Establece el año de vigencia seleccionado en memoria y sincroniza la cookie segura
   */
  setVigenciaSeleccionada(anio: number): void {
    this.anioVigenciaSeleccionada.set(anio);
    this.cookieService.set(COOKIE_VIGENCIA_KEY, anio.toString(), {
      days: 30,
      path: '/',
      sameSite: 'Lax',
    });

    // Actualiza el objeto vigenciaActiva correspondiente si existe en la lista
    const vig = this.vigencias().find((v) => v.anio === anio);
    if (vig) {
      this.vigenciaActiva.set(vig);
    }
  }

  /**
   * Forzar refresco exclusivo de las vigencias fiscales (ej. tras crear o editar una vigencia)
   */
  refrescarVigencias(): void {
    this.vigenciasApi.getVigenciasPaged({ pageSize: 100 }).pipe(
      catchError(() => of([] as VigenciaFiscalDto[]))
    ).subscribe((res: any) => {
      let items: VigenciaFiscalDto[] = [];
      if (Array.isArray(res)) items = res;
      else if (res?.data) items = Array.isArray(res.data) ? res.data : (res.data.items || []);

      items.sort((a, b) => b.anio - a.anio);
      this.vigencias.set(items);

      this.vigenciasApi.getVigenciaActiva().pipe(
        catchError(() => of(null))
      ).subscribe((resActiva: any) => {
        const activa = resActiva?.data || (resActiva?.anio ? resActiva : null);
        if (activa) {
          this.vigenciaActiva.set(activa);
        }
      });
    });
  }

  /**
   * Forzar refresco exclusivo de las normas tributarias (ej. tras crear o editar una norma)
   */
  refrescarNormas(): void {
    this.normasApi.getNormasPaged({ pageSize: 100 }).pipe(
      catchError(() => of([] as NormaTributariaDto[]))
    ).subscribe((res: any) => {
      let items: NormaTributariaDto[] = [];
      if (Array.isArray(res)) items = res;
      else if (res?.data) items = Array.isArray(res.data) ? res.data : (res.data.items || []);

      this.normas.set(items);
    });
  }

  /**
   * Forzar recarga total de parámetros (invalida la caché en memoria)
   */
  forzarRecarga(): void {
    this.loaded.set(false);
    this.ciudadesPorDepto.set({});
    this.cargarParametrosGenerales();
  }

  private leerVigenciaCookie(): number | null {
    const raw = this.cookieService.get(COOKIE_VIGENCIA_KEY);
    if (raw) {
      const num = parseInt(raw, 10);
      return isNaN(num) ? null : num;
    }
    return null;
  }
}
