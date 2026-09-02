import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ValoresEstatalesApiService } from '../../infrastructure/api/valores-estatales-api.service';
import {
  ValoresEstatalesTab,
  UvtHistoricoDto,
  CreateUvtHistoricoRequest,
  UpdateUvtHistoricoRequest,
  TasasInteresDto,
  CreateTasaInteresRequest,
  UpdateTasaInteresRequest,
  SalarioMinimoDto,
  CreateSalarioMinimoRequest,
  UpdateSalarioMinimoRequest,
} from '../../domain/interfaces/valores-estatales.interface';

@Injectable({
  providedIn: 'root',
})
export class ValoresEstatalesFacade {
  private api = inject(ValoresEstatalesApiService);

  // =========================================================================
  // NAVEGACIÓN & PESTAÑA ACTIVA
  // =========================================================================
  readonly tabActiva = signal<ValoresEstatalesTab>('UVT');

  // Notificaciones Toast (Feedback)
  readonly toastMessage = signal<{ title: string; desc: string; type: 'success' | 'error' | 'info' } | null>(null);

  // =========================================================================
  // ESTADO: UVT HISTÓRICO (Puro desde API)
  // =========================================================================
  readonly uvtList = signal<UvtHistoricoDto[]>([]);
  readonly uvtLoading = signal<boolean>(false);
  readonly uvtSearchTerm = signal<string>('');
  readonly uvtAnioFiltro = signal<number | 'TODOS'>('TODOS');

  // =========================================================================
  // ESTADO: TASAS DE INTERÉS (Puro desde API)
  // =========================================================================
  readonly tasasList = signal<TasasInteresDto[]>([]);
  readonly tasasLoading = signal<boolean>(false);
  readonly tasasSearchTerm = signal<string>('');
  readonly tasasTipoFiltro = signal<string>('TODOS');
  readonly tasasPeriodicidadFiltro = signal<string>('TODOS');

  // =========================================================================
  // ESTADO: SALARIO MÍNIMO (Puro desde API)
  // =========================================================================
  readonly salariosList = signal<SalarioMinimoDto[]>([]);
  readonly salariosLoading = signal<boolean>(false);
  readonly salariosSearchTerm = signal<string>('');
  readonly salariosAnioFiltro = signal<number | 'TODOS'>('TODOS');

  constructor() {
    this.cargarTodos();
  }

  // =========================================================================
  // CARGA CENTRAL
  // =========================================================================
  public cargarTodos(): void {
    this.cargarUvt();
    this.cargarTasas();
    this.cargarSalarios();
  }

  public cambiarTab(tab: ValoresEstatalesTab): void {
    this.tabActiva.set(tab);
  }

  // =========================================================================
  // COMPUTED: FILTRADOS
  // =========================================================================
  readonly uvtFiltrados = computed(() => {
    const list = this.uvtList();
    const query = this.uvtSearchTerm().toLowerCase().trim();
    const anio = this.uvtAnioFiltro();

    return list.filter((item) => {
      const matchQuery =
        !query ||
        item.anio.toString().includes(query) ||
        item.valor.toString().includes(query) ||
        (item.fuenteLegal && item.fuenteLegal.toLowerCase().includes(query));

      const matchAnio = anio === 'TODOS' || item.anio === Number(anio);

      return matchQuery && matchAnio;
    });
  });

  readonly tasasFiltradas = computed(() => {
    const list = this.tasasList();
    const query = this.tasasSearchTerm().toLowerCase().trim();
    const tipo = this.tasasTipoFiltro();
    const periodicidad = this.tasasPeriodicidadFiltro();

    return list.filter((item) => {
      const matchQuery =
        !query ||
        item.tipoTasaInteres.toLowerCase().includes(query) ||
        item.periodicidad.toLowerCase().includes(query) ||
        item.valor.toString().includes(query) ||
        (item.fuenteLegal && item.fuenteLegal.toLowerCase().includes(query));

      const matchTipo = tipo === 'TODOS' || item.tipoTasaInteres === tipo;
      const matchPeriod = periodicidad === 'TODOS' || item.periodicidad === periodicidad;

      return matchQuery && matchTipo && matchPeriod;
    });
  });

  readonly salariosFiltrados = computed(() => {
    const list = this.salariosList();
    const query = this.salariosSearchTerm().toLowerCase().trim();
    const anio = this.salariosAnioFiltro();

    return list.filter((item) => {
      const matchQuery =
        !query ||
        item.anio.toString().includes(query) ||
        item.valor.toString().includes(query) ||
        item.auxilioTransporte.toString().includes(query);

      const matchAnio = anio === 'TODOS' || item.anio === Number(anio);

      return matchQuery && matchAnio;
    });
  });

  // Años disponibles según lo que exista en la base de datos
  readonly aniosDisponibles = computed(() => {
    const years = new Set<number>();
    this.uvtList().forEach((u) => years.add(u.anio));
    this.salariosList().forEach((s) => years.add(s.anio));
    if (years.size === 0) {
      years.add(new Date().getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  });

  // Tipos de tasas disponibles según base de datos
  readonly tiposTasasDisponibles = computed(() => {
    const set = new Set<string>();
    this.tasasList().forEach((t) => {
      if (t.tipoTasaInteres) set.add(t.tipoTasaInteres);
    });
    return Array.from(set);
  });

  // =========================================================================
  // KPIS DINÁMICOS SEGÚN LA PESTAÑA ACTIVA (SIN DATOS QUEMADOS)
  // =========================================================================
  readonly kpisActivos = computed(() => {
    const tab = this.tabActiva();

    if (tab === 'UVT') {
      const uvtItems = [...this.uvtList()].sort((a, b) => b.anio - a.anio);
      const actual = uvtItems[0];
      const previo = uvtItems[1];
      const variacion = actual && previo && previo.valor > 0
        ? (((actual.valor - previo.valor) / previo.valor) * 100).toFixed(2) + '%'
        : 'N/A';

      return [
        {
          label: 'UVT Vigente Actual',
          value: actual ? `$${actual.valor.toLocaleString('es-CO')} COP` : 'Sin registrar',
          subtext: actual ? `Año Fiscal ${actual.anio}` : 'Sin datos en BD',
          icon: 'fa-scale-balanced',
          color: 'blue',
        },
        {
          label: 'Variación Interanual',
          value: variacion,
          subtext: previo ? `Respecto a ${previo.anio}` : 'Sin comparación previa',
          icon: 'fa-arrow-trend-up',
          color: 'emerald',
        },
        {
          label: 'Años Registrados',
          value: uvtItems.length.toString(),
          subtext: 'Registros en base de datos',
          icon: 'fa-calendar-days',
          color: 'teal',
        },
        {
          label: 'Última Norma Legal',
          value: actual?.fuenteLegal ? 'Registrada' : 'Sin información',
          subtext: actual?.fuenteLegal || 'No especificada',
          icon: 'fa-file-shield',
          color: 'amber',
        },
      ];
    }

    if (tab === 'TASAS') {
      const tasas = this.tasasList();
      const mora = tasas.find((t) => t.tipoTasaInteres.toLowerCase().includes('mora')) || tasas[0];
      const corriente = tasas.find((t) => t.tipoTasaInteres.toLowerCase().includes('corriente') || t.tipoTasaInteres.toLowerCase().includes('bancario'));

      return [
        {
          label: 'Tasa Moratoria Vigente',
          value: mora ? `${mora.valor}% ${mora.periodicidad}` : 'Sin registrar',
          subtext: mora ? `Desde ${mora.vigenciaDesde}` : 'Sin datos en BD',
          icon: 'fa-percent',
          color: 'blue',
        },
        {
          label: 'Tasa Bancaria / Corriente',
          value: corriente ? `${corriente.valor}% ${corriente.periodicidad}` : 'Sin registrar',
          subtext: corriente ? 'Tasa de referencia activa' : 'Sin datos en BD',
          icon: 'fa-building-columns',
          color: 'emerald',
        },
        {
          label: 'Total Tasas Registradas',
          value: tasas.length.toString(),
          subtext: 'Parámetros de interés activos',
          icon: 'fa-chart-line',
          color: 'teal',
        },
        {
          label: 'Control de Vigencia',
          value: mora?.vigenciaHasta ? `Hasta ${mora.vigenciaHasta}` : (mora ? 'Indefinida' : 'Sin definir'),
          subtext: mora ? 'Vigencia configurada' : 'Sin datos en BD',
          icon: 'fa-clock-rotate-left',
          color: 'amber',
        },
      ];
    }

    if (tab === 'SALARIOS') {
      const salarios = [...this.salariosList()].sort((a, b) => b.anio - a.anio);
      const actual = salarios[0];
      const previo = salarios[1];
      const totalDevengado = actual ? actual.valor + actual.auxilioTransporte : 0;
      const variacion = actual && previo && previo.valor > 0
        ? (((actual.valor - previo.valor) / previo.valor) * 100).toFixed(2) + '%'
        : 'N/A';

      return [
        {
          label: 'SMLMV Vigente',
          value: actual ? `$${actual.valor.toLocaleString('es-CO')} COP` : 'Sin registrar',
          subtext: actual ? `Salario Mínimo ${actual.anio}` : 'Sin datos en BD',
          icon: 'fa-money-bill-wave',
          color: 'blue',
        },
        {
          label: 'Auxilio de Transporte',
          value: actual ? `$${actual.auxilioTransporte.toLocaleString('es-CO')} COP` : 'Sin registrar',
          subtext: actual ? 'Subsidio mensual vigente' : 'Sin datos en BD',
          icon: 'fa-bus',
          color: 'emerald',
        },
        {
          label: 'Total Devengado Mensual',
          value: actual ? `$${totalDevengado.toLocaleString('es-CO')} COP` : 'Sin registrar',
          subtext: actual ? 'Salario base + auxilio' : 'Sin datos en BD',
          icon: 'fa-wallet',
          color: 'teal',
        },
        {
          label: 'Incremento Anual',
          value: variacion,
          subtext: previo ? `Ajuste frente a ${previo.anio}` : 'Sin comparación previa',
          icon: 'fa-arrow-up-right-dots',
          color: 'amber',
        },
      ];
    }

    // Tab PARAMETROS
    return [
      {
        label: 'Módulo Estatal',
        value: 'Gobernación del Cauca',
        subtext: 'Liquidadores e Impuestos',
        icon: 'fa-landmark',
        color: 'blue',
      },
      {
        label: 'Integración Backend',
        value: '3 Entidades CRUD',
        subtext: 'UVT, Tasas, SMLMV',
        icon: 'fa-database',
        color: 'emerald',
      },
      {
        label: 'Vigencia Activa',
        value: new Date().getFullYear().toString(),
        subtext: 'Año fiscal en curso',
        icon: 'fa-calendar-check',
        color: 'teal',
      },
      {
        label: 'Estado del Servicio',
        value: 'Conectado',
        subtext: 'API Automotores en línea',
        icon: 'fa-circle-check',
        color: 'amber',
      },
    ];
  });

  // =========================================================================
  // CRUD UVT HISTÓRICO (Puro API)
  // =========================================================================
  public cargarUvt(): void {
    this.uvtLoading.set(true);
    this.api.getUvtPaged({ pageSize: 100 }).pipe(
      catchError((err) => {
        console.warn('API /UvtHistorico error:', err);
        return of(null);
      })
    ).subscribe((res: any) => {
      const items = res?.data?.items ?? [];
      this.uvtList.set(items);
      this.uvtLoading.set(false);
    });
  }

  public crearUvt(payload: CreateUvtHistoricoRequest): Observable<boolean> {
    this.uvtLoading.set(true);
    return this.api.crearUvt(payload).pipe(
      tap(() => {
        this.cargarUvt();
        this.uvtLoading.set(false);
        this.setToast('UVT Registrada', `Se registró exitosamente la UVT del año ${payload.anio}.`, 'success');
      }),
      map(() => true),
      catchError((err) => {
        this.uvtLoading.set(false);
        const msg = err?.error?.detail || err?.error?.message || 'No se pudo guardar la UVT (verifique que el año no esté duplicado).';
        this.setToast('Error al registrar UVT', msg, 'error');
        return of(false);
      })
    );
  }

  public actualizarUvt(id: number, payload: UpdateUvtHistoricoRequest): Observable<boolean> {
    this.uvtLoading.set(true);
    return this.api.actualizarUvt(id, payload).pipe(
      tap(() => {
        this.cargarUvt();
        this.uvtLoading.set(false);
        this.setToast('UVT Actualizada', `Se actualizó la UVT del año ${payload.anio}.`, 'success');
      }),
      map(() => true),
      catchError((err) => {
        this.uvtLoading.set(false);
        const msg = err?.error?.detail || err?.error?.message || 'Error al actualizar registro UVT.';
        this.setToast('Error al actualizar UVT', msg, 'error');
        return of(false);
      })
    );
  }

  public eliminarUvt(id: number): Observable<boolean> {
    this.uvtLoading.set(true);
    return this.api.eliminarUvt(id).pipe(
      tap(() => {
        this.cargarUvt();
        this.uvtLoading.set(false);
        this.setToast('UVT Eliminada', 'El registro de UVT ha sido eliminado exitosamente.', 'info');
      }),
      map(() => true),
      catchError((err) => {
        this.uvtLoading.set(false);
        const msg = err?.error?.detail || err?.error?.message || 'No se pudo eliminar el registro de UVT en el servidor.';
        this.setToast('Error al eliminar UVT', msg, 'error');
        return of(false);
      })
    );
  }

  // =========================================================================
  // CRUD TASAS DE INTERÉS (Puro API)
  // =========================================================================
  public cargarTasas(): void {
    this.tasasLoading.set(true);
    this.api.getTasasPaged({ pageSize: 100 }).pipe(
      catchError((err) => {
        console.warn('API /TasasInteres error:', err);
        return of(null);
      })
    ).subscribe((res: any) => {
      const items = res?.data?.items ?? [];
      this.tasasList.set(items);
      this.tasasLoading.set(false);
    });
  }

  public crearTasa(payload: CreateTasaInteresRequest): Observable<boolean> {
    this.tasasLoading.set(true);
    return this.api.crearTasa(payload).pipe(
      tap(() => {
        this.cargarTasas();
        this.tasasLoading.set(false);
        this.setToast('Tasa de Interés Creada', `Tasa de ${payload.tipoTasaInteres} (${payload.valor}%) guardada.`, 'success');
      }),
      map(() => true),
      catchError((err) => {
        this.tasasLoading.set(false);
        const msg = err?.error?.detail || err?.error?.message || 'Error al guardar la tasa de interés.';
        this.setToast('Error al registrar Tasa', msg, 'error');
        return of(false);
      })
    );
  }

  public actualizarTasa(id: number, payload: UpdateTasaInteresRequest): Observable<boolean> {
    this.tasasLoading.set(true);
    return this.api.actualizarTasa(id, payload).pipe(
      tap(() => {
        this.cargarTasas();
        this.tasasLoading.set(false);
        this.setToast('Tasa de Interés Modificada', `Se actualizó la tasa de ${payload.tipoTasaInteres}.`, 'success');
      }),
      map(() => true),
      catchError((err) => {
        this.tasasLoading.set(false);
        const msg = err?.error?.detail || err?.error?.message || 'Error al actualizar tasa.';
        this.setToast('Error al actualizar Tasa', msg, 'error');
        return of(false);
      })
    );
  }

  public eliminarTasa(id: number): Observable<boolean> {
    this.tasasLoading.set(true);
    return this.api.eliminarTasa(id).pipe(
      tap(() => {
        this.cargarTasas();
        this.tasasLoading.set(false);
        this.setToast('Tasa Eliminada', 'La tasa de interés seleccionada ha sido eliminada.', 'info');
      }),
      map(() => true),
      catchError((err) => {
        this.tasasLoading.set(false);
        const msg = err?.error?.detail || err?.error?.message || 'No se pudo eliminar la tasa de interés en el servidor.';
        this.setToast('Error al eliminar Tasa', msg, 'error');
        return of(false);
      })
    );
  }

  // =========================================================================
  // CRUD SALARIO MÍNIMO (Puro API)
  // =========================================================================
  public cargarSalarios(): void {
    this.salariosLoading.set(true);
    this.api.getSalariosPaged({ pageSize: 100 }).pipe(
      catchError((err) => {
        console.warn('API /SalarioMinimo error:', err);
        return of(null);
      })
    ).subscribe((res: any) => {
      const items = res?.data?.items ?? [];
      this.salariosList.set(items);
      this.salariosLoading.set(false);
    });
  }

  public crearSalario(payload: CreateSalarioMinimoRequest): Observable<boolean> {
    this.salariosLoading.set(true);
    return this.api.crearSalario(payload).pipe(
      tap(() => {
        this.cargarSalarios();
        this.salariosLoading.set(false);
        this.setToast('Salario Mínimo Registrado', `Salario Mínimo del año ${payload.anio} registrado con éxito.`, 'success');
      }),
      map(() => true),
      catchError((err) => {
        this.salariosLoading.set(false);
        const msg = err?.error?.detail || err?.error?.message || 'Error al guardar salario mínimo (posible duplicidad de año).';
        this.setToast('Error al registrar Salario', msg, 'error');
        return of(false);
      })
    );
  }

  public actualizarSalario(id: number, payload: UpdateSalarioMinimoRequest): Observable<boolean> {
    this.salariosLoading.set(true);
    return this.api.actualizarSalario(id, payload).pipe(
      tap(() => {
        this.cargarSalarios();
        this.salariosLoading.set(false);
        this.setToast('Salario Mínimo Actualizado', `Se actualizó el salario del año ${payload.anio}.`, 'success');
      }),
      map(() => true),
      catchError((err) => {
        this.salariosLoading.set(false);
        const msg = err?.error?.detail || err?.error?.message || 'Error al actualizar salario mínimo.';
        this.setToast('Error al actualizar Salario', msg, 'error');
        return of(false);
      })
    );
  }

  public eliminarSalario(id: number): Observable<boolean> {
    this.salariosLoading.set(true);
    return this.api.eliminarSalario(id).pipe(
      tap(() => {
        this.cargarSalarios();
        this.salariosLoading.set(false);
        this.setToast('Salario Eliminado', 'El registro de Salario Mínimo ha sido eliminado.', 'info');
      }),
      map(() => true),
      catchError((err) => {
        this.salariosLoading.set(false);
        const msg = err?.error?.detail || err?.error?.message || 'No se pudo eliminar el registro de salario en el servidor.';
        this.setToast('Error al eliminar Salario', msg, 'error');
        return of(false);
      })
    );
  }

  // =========================================================================
  // GESTIÓN DE TOAST FEEDBACK
  // =========================================================================
  public setToast(title: string, desc: string, type: 'success' | 'error' | 'info'): void {
    this.toastMessage.set({ title, desc, type });
  }

  public cerrarToast(): void {
    this.toastMessage.set(null);
  }
}
