import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { EjecucionesFiscalesApiService } from '../../infrastructure/api/ejecuciones-fiscales-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  ExpedienteCobroCoactivo,
  MedidaCautelar,
  EjecucionesFiscalesKpis,
  EjecucionesFiscalesFiltros,
  TabEjecucionesFiscales,
  RegistrarNotificacionMandamientoRequest,
  DecretarMedidaCautelarRequest,
  RegistrarAutoCierreRequest
} from '../../domain/models/ejecuciones-fiscales.model';

@Injectable({ providedIn: 'root' })
export class EjecucionesFiscalesFacade {
  private api = inject(EjecucionesFiscalesApiService);
  private toast = inject(ToastService);

  // ── Signals de Estado General ──────────────────────────────────────────────
  readonly expedientes = signal<ExpedienteCobroCoactivo[]>([]);
  readonly kpis = signal<EjecucionesFiscalesKpis | null>(null);
  readonly loading = signal<boolean>(false);
  readonly loadingKpis = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Paginación
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(15);
  readonly totalCount = signal<number>(0);
  readonly totalPages = signal<number>(1);

  // Pestaña operativa activa
  readonly tabActivo = signal<TabEjecucionesFiscales>('sin_mandamiento');

  // Filtros
  readonly buscar = signal<string>('');
  readonly estadoProcesoFiltro = signal<string>('');

  // Filas expandidas (acordeón detalle medidas y trazabilidad)
  readonly expandedIds = signal<number[]>([]);

  // Selección múltiple
  readonly selectedIds = signal<number[]>([]);

  // Modales y expediente en edición
  readonly expedienteSeleccionado = signal<ExpedienteCobroCoactivo | null>(null);
  readonly modalMandamientoAbierto = signal<boolean>(false);
  readonly modalNotificacionAbierto = signal<boolean>(false);
  readonly modalConstanciaAbierto = signal<boolean>(false);
  readonly modalMedidasAbierto = signal<boolean>(false);
  readonly modalAutoCierreAbierto = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly tieneExpedientes = computed(() => this.expedientes().length > 0);
  readonly todosSeleccionados = computed(() => {
    const exps = this.expedientes();
    if (exps.length === 0) return false;
    const sels = this.selectedIds();
    return exps.every(e => sels.includes(e.id));
  });

  // ── Operaciones de Carga ───────────────────────────────────────────────────
  cargarExpedientes(): void {
    this.loading.set(true);
    this.error.set(null);

    const filtros: EjecucionesFiscalesFiltros = {
      tab: this.tabActivo(),
      page: this.page(),
      pageSize: this.pageSize(),
      placa: this.buscar()?.trim(),
      estadoProceso: this.estadoProcesoFiltro() || undefined
    };

    this.api.getExpedientes(filtros).pipe(
      catchError(err => {
        this.error.set('Error al cargar expedientes coactivos: ' + (err?.message || 'Error del servidor'));
        this.toast.error('No se pudieron obtener los expedientes de cobro coactivo.');
        return of(null);
      })
    ).subscribe(resp => {
      this.loading.set(false);
      if (resp && resp.data) {
        this.expedientes.set(resp.data.items);
        this.totalCount.set(resp.data.totalCount);
        this.totalPages.set(resp.data.totalPages);
      } else {
        this.expedientes.set([]);
      }
    });
  }

  cargarKpis(): void {
    this.loadingKpis.set(true);
    this.api.getKpis().pipe(
      catchError(() => of(null))
    ).subscribe(resp => {
      this.loadingKpis.set(false);
      if (resp && resp.data) {
        this.kpis.set(resp.data);
      }
    });
  }

  cambiarTab(tab: TabEjecucionesFiscales): void {
    if (this.tabActivo() === tab) return;
    this.tabActivo.set(tab);
    this.page.set(1);
    this.selectedIds.set([]);
    this.cargarExpedientes();
  }

  cambiarPagina(p: number): void {
    this.page.set(p);
    this.cargarExpedientes();
  }

  buscarTexto(termino: string): void {
    this.buscar.set(termino);
    this.page.set(1);
    this.cargarExpedientes();
  }

  toggleExpand(id: number): void {
    const actuales = this.expandedIds();
    if (actuales.includes(id)) {
      this.expandedIds.set(actuales.filter(x => x !== id));
    } else {
      this.expandedIds.set([...actuales, id]);
    }
  }

  toggleSeleccion(id: number): void {
    const actuales = this.selectedIds();
    if (actuales.includes(id)) {
      this.selectedIds.set(actuales.filter(x => x !== id));
    } else {
      this.selectedIds.set([...actuales, id]);
    }
  }

  seleccionarTodos(check: boolean): void {
    if (check) {
      this.selectedIds.set(this.expedientes().map(e => e.id));
    } else {
      this.selectedIds.set([]);
    }
  }

  // ── Mandamiento de Pago (Art. 826 ETN) ──────────────────────────────────────
  abrirModalMandamiento(exp: ExpedienteCobroCoactivo): void {
    this.expedienteSeleccionado.set(exp);
    this.modalMandamientoAbierto.set(true);
  }

  confirmarLibrarMandamiento(abogado?: string, observaciones?: string): void {
    const exp = this.expedienteSeleccionado();
    if (!exp) return;

    this.submitting.set(true);
    this.api.librarMandamiento(exp.id, {
      abogadoAsignado: abogado,
      observaciones: observaciones,
      usuario: 'FUNCIONARIO'
    }).pipe(
      catchError(err => {
        this.toast.error('Error al librar Mandamiento de Pago: ' + (err?.error?.message || err?.message));
        return of(null);
      })
    ).subscribe(resp => {
      this.submitting.set(false);
      this.modalMandamientoAbierto.set(false);
      if (resp && resp.data) {
        this.toast.success(`Mandamiento de Pago librado exitosamente (${resp.data.numeroMandamiento}).`);
        this.cargarExpedientes();
        this.cargarKpis();
      }
    });
  }

  // ── Notificaciones (Arts. 565, 568 ETN) ────────────────────────────────────
  abrirModalNotificacion(exp: ExpedienteCobroCoactivo): void {
    this.expedienteSeleccionado.set(exp);
    this.modalNotificacionAbierto.set(true);
  }

  confirmarNotificacion(req: RegistrarNotificacionMandamientoRequest): void {
    const exp = this.expedienteSeleccionado();
    if (!exp) return;

    this.submitting.set(true);
    this.api.registrarNotificacion(exp.id, req).pipe(
      catchError(err => {
        this.toast.error('Error al registrar notificación: ' + (err?.error?.message || err?.message));
        return of(null);
      })
    ).subscribe(resp => {
      this.submitting.set(false);
      this.modalNotificacionAbierto.set(false);
      if (resp && resp.data) {
        this.toast.success('Notificación de Mandamiento registrada. Término legal de 15 días iniciado.');
        this.cargarExpedientes();
        this.cargarKpis();
      }
    });
  }

  // ── Constancia de Ejecutoria (Art. 836 ETN) ─────────────────────────────────
  abrirModalConstancia(exp: ExpedienteCobroCoactivo): void {
    this.expedienteSeleccionado.set(exp);
    this.modalConstanciaAbierto.set(true);
  }

  confirmarConstancia(observaciones?: string): void {
    const exp = this.expedienteSeleccionado();
    if (!exp) return;

    this.submitting.set(true);
    this.api.emitirConstanciaEjecutoria(exp.id, {
      observaciones: observaciones,
      usuario: 'FUNCIONARIO'
    }).pipe(
      catchError(err => {
        this.toast.error('Error al emitir Constancia de Ejecutoria: ' + (err?.error?.message || err?.message));
        return of(null);
      })
    ).subscribe(resp => {
      this.submitting.set(false);
      this.modalConstanciaAbierto.set(false);
      if (resp && resp.data) {
        this.toast.success(`Constancia de Ejecutoria Nº ${resp.data.numeroConstanciaEjecutoria} expedida. Mandamiento en firme.`);
        this.cargarExpedientes();
        this.cargarKpis();
      }
    });
  }

  // ── Medidas Cautelares (Embargos - Arts. 837, 839 ETN) ──────────────────────
  abrirModalMedidas(exp: ExpedienteCobroCoactivo): void {
    this.expedienteSeleccionado.set(exp);
    this.modalMedidasAbierto.set(true);
  }

  confirmarMedidas(req: DecretarMedidaCautelarRequest): void {
    const exp = this.expedienteSeleccionado();
    if (!exp) return;

    this.submitting.set(true);
    this.api.decretarMedidasCautelares(exp.id, req).pipe(
      catchError(err => {
        this.toast.error('Error al decretar medidas cautelares: ' + (err?.error?.message || err?.message));
        return of(null);
      })
    ).subscribe(resp => {
      this.submitting.set(false);
      this.modalMedidasAbierto.set(false);
      if (resp && resp.data) {
        this.toast.success('Medidas Cautelares de embargo decretadas exitosamente.');
        this.cargarExpedientes();
        this.cargarKpis();
      }
    });
  }

  levantarMedida(medidaId: number, motivo: string): void {
    this.api.levantarMedidaCautelar(medidaId, {
      medidaId: medidaId,
      motivoLevantamiento: motivo,
      usuario: 'FUNCIONARIO'
    }).pipe(
      catchError(err => {
        this.toast.error('Error al levantar medida cautelar: ' + (err?.error?.message || err?.message));
        return of(null);
      })
    ).subscribe(resp => {
      if (resp && resp.data) {
        this.toast.success('Medida Cautelar levantada (Desembargo) exitosamente.');
        this.cargarExpedientes();
        this.cargarKpis();
      }
    });
  }

  // ── Auto de Cierre y Archivo ───────────────────────────────────────────────
  abrirModalAutoCierre(exp: ExpedienteCobroCoactivo): void {
    this.expedienteSeleccionado.set(exp);
    this.modalAutoCierreAbierto.set(true);
  }

  confirmarAutoCierre(req: RegistrarAutoCierreRequest): void {
    const exp = this.expedienteSeleccionado();
    if (!exp) return;

    this.submitting.set(true);
    this.api.registrarAutoCierre(exp.id, req).pipe(
      catchError(err => {
        this.toast.error('Error al emitir Auto de Cierre: ' + (err?.error?.message || err?.message));
        return of(null);
      })
    ).subscribe(resp => {
      this.submitting.set(false);
      this.modalAutoCierreAbierto.set(false);
      if (resp && resp.data) {
        this.toast.success(`Auto de Terminación y Cierre Nº ${resp.data.numeroAutoCierre} emitido. Expediente archivado.`);
        this.cargarExpedientes();
        this.cargarKpis();
      }
    });
  }

  // ── Descarga de Documentos en PDF ──────────────────────────────────────────
  descargarMandamientoPdf(expId: number): void {
    this.descargarArchivo(`/ejecuciones-fiscales/${expId}/documentos/mandamiento-pago`, `MandamientoPago_Exp_${expId}.pdf`);
  }

  descargarConstanciaPdf(expId: number): void {
    this.descargarArchivo(`/ejecuciones-fiscales/${expId}/documentos/constancia-ejecutoria`, `ConstanciaEjecutoria_Exp_${expId}.pdf`);
  }

  descargarEmbargoVehiculoPdf(expId: number): void {
    this.descargarArchivo(`/ejecuciones-fiscales/${expId}/documentos/embargo-vehiculo`, `ResolucionEmbargoVehiculo_Exp_${expId}.pdf`);
  }

  descargarEmbargoBancarioPdf(medidaId: number): void {
    this.descargarArchivo(`/ejecuciones-fiscales/medidas-cautelares/${medidaId}/documentos/embargo-bancario`, `OficioEmbargoBancario_${medidaId}.pdf`);
  }

  descargarDesembargoPdf(medidaId: number): void {
    this.descargarArchivo(`/ejecuciones-fiscales/medidas-cautelares/${medidaId}/documentos/desembargo`, `ResolucionDesembargo_${medidaId}.pdf`);
  }

  descargarAutoCierrePdf(expId: number): void {
    this.descargarArchivo(`/ejecuciones-fiscales/${expId}/documentos/auto-cierre`, `AutoCierre_Exp_${expId}.pdf`);
  }

  private descargarArchivo(endpoint: string, nombreArchivo: string): void {
    this.toast.info('Generando documento PDF oficial...');
    this.api.descargarDocumentoPdf(endpoint).pipe(
      catchError(err => {
        this.toast.error('Error al generar el documento PDF.');
        return of(null);
      })
    ).subscribe(blob => {
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    });
  }
}
