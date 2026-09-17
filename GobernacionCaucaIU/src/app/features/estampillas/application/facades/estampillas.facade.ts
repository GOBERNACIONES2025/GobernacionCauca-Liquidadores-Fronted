import { Injectable, inject, signal, computed } from '@angular/core';
import { EstampillasStorageService } from '../../infrastructure/storage/storage.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  Estampilla,
  TarifaEstampilla,
  VigenciaTributaria,
  ExencionEstampilla
} from '../../domain/models/estampillas.models';

@Injectable({
  providedIn: 'root'
})
export class EstampillasFacade {
  private storage = inject(EstampillasStorageService);
  private toast = inject(ToastService);

  readonly loading = signal<boolean>(false);
  readonly filtroTexto = signal<string>('');
  readonly filtroEstado = signal<string>('TODOS');
  readonly filtroVigencia = signal<number>(0);

  readonly estampillas = computed(() => {
    this.storage.dataVersion();
    const items = this.storage.getEstampillas();
    const texto = this.filtroTexto().toLowerCase().trim();
    const est = this.filtroEstado();
    const vig = this.filtroVigencia();

    return items.filter(e => {
      const matchTexto = !texto ||
        e.nombre.toLowerCase().includes(texto) ||
        e.codigo.toLowerCase().includes(texto) ||
        e.descripcion.toLowerCase().includes(texto);

      const matchEst = est === 'TODOS' || e.estado === est;
      const matchVig = vig === 0 || e.vigencia === vig;

      return matchTexto && matchEst && matchVig;
    });
  });

  readonly estampillasActivas = computed(() => {
    return this.storage.getEstampillas().filter(e => e.estado === 'ACTIVA');
  });

  readonly tarifas = computed(() => {
    this.storage.dataVersion();
    return this.storage.getTarifas();
  });

  readonly vigencias = computed(() => {
    this.storage.dataVersion();
    return this.storage.getVigencias();
  });

  readonly exenciones = computed(() => {
    this.storage.dataVersion();
    return this.storage.getExenciones();
  });

  setFiltroTexto(query: string): void {
    this.filtroTexto.set(query);
  }

  setFiltroEstado(estado: string): void {
    this.filtroEstado.set(estado);
  }

  setFiltroVigencia(vigencia: number): void {
    this.filtroVigencia.set(vigencia);
  }

  obtenerPorId(id: string): Estampilla | undefined {
    return this.storage.getEstampillaById(id);
  }

  guardarEstampilla(data: Partial<Estampilla>): Estampilla {
    this.loading.set(true);
    const isNew = !data.id;
    const id = data.id || `EST-${Date.now()}`;

    const estampilla: Estampilla = {
      id,
      codigo: data.codigo || `EST-${Date.now()}`,
      nombre: data.nombre || '',
      descripcion: data.descripcion || '',
      fundamentoLegal: data.fundamentoLegal || '',
      tipoBase: data.tipoBase || 'VALOR_BRUTO_CONTRATO',
      tarifaPorcentaje: Number(data.tarifaPorcentaje || 1.0),
      vigencia: Number(data.vigencia || 2026),
      estado: data.estado || 'ACTIVA',
      cuentaBancariaRecaudo: data.cuentaBancariaRecaudo,
      bancoDestino: data.bancoDestino,
      requiereExencionValidada: data.requiereExencionValidada ?? true
    };

    this.storage.saveEstampilla(estampilla);

    const currentUser = this.storage.getCurrentUser();
    this.storage.registrarAuditoria({
      usuarioNombre: currentUser.nombre,
      usuarioRol: currentUser.rol,
      accion: isNew ? 'CREACION' : 'ACTUALIZACION',
      entidadAfectada: 'ESTAMPILLA',
      referenciaEntidad: estampilla.codigo,
      descripcion: `${isNew ? 'Creación' : 'Actualización'} de estampilla ${estampilla.nombre} (Tarifa: ${estampilla.tarifaPorcentaje}%)`
    });

    this.loading.set(false);
    this.toast.success(isNew ? 'Estampilla creada correctamente.' : 'Estampilla actualizada correctamente.');
    return estampilla;
  }

  toggleEstadoEstampilla(id: string): void {
    const est = this.obtenerPorId(id);
    if (!est) return;

    est.estado = est.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
    this.storage.saveEstampilla(est);

    const currentUser = this.storage.getCurrentUser();
    this.storage.registrarAuditoria({
      usuarioNombre: currentUser.nombre,
      usuarioRol: currentUser.rol,
      accion: 'ACTUALIZACION',
      entidadAfectada: 'ESTAMPILLA',
      referenciaEntidad: est.codigo,
      descripcion: `Cambio de estado a ${est.estado} para estampilla ${est.nombre}`
    });

    this.toast.info(`Estampilla ${est.nombre} ahora está ${est.estado}.`);
  }
}
