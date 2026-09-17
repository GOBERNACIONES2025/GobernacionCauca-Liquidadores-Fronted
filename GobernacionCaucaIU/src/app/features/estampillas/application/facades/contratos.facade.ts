import { Injectable, inject, signal, computed } from '@angular/core';
import { EstampillasStorageService } from '../../infrastructure/storage/storage.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  Contrato,
  TipoContrato,
  EstadoContrato,
  LiquidacionEstampilla
} from '../../domain/models/estampillas.models';

@Injectable({
  providedIn: 'root'
})
export class ContratosFacade {
  private storage = inject(EstampillasStorageService);
  private toast = inject(ToastService);

  readonly loading = signal<boolean>(false);
  readonly filtroTexto = signal<string>('');
  readonly filtroTipoContrato = signal<string>('TODOS');
  readonly filtroVigencia = signal<number>(0);
  readonly filtroEstado = signal<string>('TODOS');
  
  readonly paginaActual = signal<number>(1);
  readonly elementosPorPagina = signal<number>(8);

  readonly contratos = computed(() => {
    this.storage.dataVersion();
    const items = this.storage.getContratos();
    const texto = this.filtroTexto().toLowerCase().trim();
    const tipo = this.filtroTipoContrato();
    const vig = this.filtroVigencia();
    const est = this.filtroEstado();

    return items.filter(ct => {
      const matchTexto = !texto || 
        ct.numeroContrato.toLowerCase().includes(texto) ||
        ct.contribuyenteNombre.toLowerCase().includes(texto) ||
        ct.contribuyenteDocumento.includes(texto) ||
        ct.objeto.toLowerCase().includes(texto) ||
        ct.entidadContratante.toLowerCase().includes(texto);

      const matchTipo = tipo === 'TODOS' || ct.tipoContrato === tipo;
      const matchVig = vig === 0 || ct.vigencia === vig;
      const matchEst = est === 'TODOS' || ct.estado === est;

      return matchTexto && matchTipo && matchVig && matchEst;
    });
  });

  readonly totalElementos = computed(() => this.contratos().length);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalElementos() / this.elementosPorPagina())));

  readonly contratosPaginados = computed(() => {
    const page = this.paginaActual();
    const size = this.elementosPorPagina();
    const start = (page - 1) * size;
    return this.contratos().slice(start, start + size);
  });

  setFiltroTexto(query: string): void {
    this.filtroTexto.set(query);
    this.paginaActual.set(1);
  }

  setFiltroTipoContrato(tipo: string): void {
    this.filtroTipoContrato.set(tipo);
    this.paginaActual.set(1);
  }

  setFiltroVigencia(vigencia: number): void {
    this.filtroVigencia.set(vigencia);
    this.paginaActual.set(1);
  }

  setFiltroEstado(estado: string): void {
    this.filtroEstado.set(estado);
    this.paginaActual.set(1);
  }

  setPagina(page: number): void {
    if (page >= 1 && page <= this.totalPaginas()) {
      this.paginaActual.set(page);
    }
  }

  limpiarFiltros(): void {
    this.filtroTexto.set('');
    this.filtroTipoContrato.set('TODOS');
    this.filtroVigencia.set(0);
    this.filtroEstado.set('TODOS');
    this.paginaActual.set(1);
  }

  obtenerPorId(id: string): Contrato | undefined {
    return this.storage.getContratoById(id);
  }

  obtenerContratosPorContribuyente(contribuyenteId: string): Contrato[] {
    return this.storage.getContratos().filter(c => c.contribuyenteId === contribuyenteId);
  }

  obtenerLiquidacionesPorContrato(contratoId: string): LiquidacionEstampilla[] {
    return this.storage.getLiquidaciones().filter(l => l.contratoId === contratoId);
  }

  guardarContrato(data: Partial<Contrato>): Contrato {
    this.loading.set(true);

    const isNew = !data.id;
    const now = new Date().toISOString().substring(0, 10);
    const id = data.id || `CT-${Date.now()}`;

    const numContrato = data.numeroContrato || `CT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const contratoCompleto: Contrato = {
      id,
      numeroContrato: numContrato,
      tipoContrato: data.tipoContrato || 'PRESTACION_SERVICIOS',
      tipoContratoNombre: data.tipoContratoNombre || 'Contrato de Prestación de Servicios',
      fechaSuscripcion: data.fechaSuscripcion || now,
      fechaInicio: data.fechaInicio || now,
      fechaTerminacion: data.fechaTerminacion || now,
      entidadContratante: data.entidadContratante || 'Gobernación del Cauca',
      contribuyenteId: data.contribuyenteId || '',
      contribuyenteNombre: data.contribuyenteNombre || '',
      contribuyenteDocumento: data.contribuyenteDocumento || '',
      contribuyenteTipoDoc: data.contribuyenteTipoDoc || 'NIT',
      objeto: data.objeto || '',
      valorContrato: Number(data.valorContrato || 0),
      municipioId: data.municipioId || '19001',
      municipioNombre: data.municipioNombre || 'Popayán',
      vigencia: Number(data.vigencia || 2026),
      estado: data.estado || 'EN_EJECUCION',
      observaciones: data.observaciones,
      fechaRegistro: data.fechaRegistro || now
    };

    this.storage.saveContrato(contratoCompleto);

    const currentUser = this.storage.getCurrentUser();
    this.storage.registrarAuditoria({
      usuarioNombre: currentUser.nombre,
      usuarioRol: currentUser.rol,
      accion: isNew ? 'CREACION' : 'ACTUALIZACION',
      entidadAfectada: 'CONTRATO',
      referenciaEntidad: contratoCompleto.numeroContrato,
      descripcion: isNew
        ? `Registro de nuevo contrato ${contratoCompleto.numeroContrato} contratista: ${contratoCompleto.contribuyenteNombre} por ${this.storage.formatCOP(contratoCompleto.valorContrato)}`
        : `Actualización de contrato ${contratoCompleto.numeroContrato}`
    });

    this.loading.set(false);
    this.toast.success(isNew ? 'Contrato registrado correctamente.' : 'Contrato actualizado correctamente.');
    return contratoCompleto;
  }

  eliminarContrato(id: string): void {
    const ct = this.obtenerPorId(id);
    if (!ct) return;

    this.storage.deleteContrato(id);
    const currentUser = this.storage.getCurrentUser();
    this.storage.registrarAuditoria({
      usuarioNombre: currentUser.nombre,
      usuarioRol: currentUser.rol,
      accion: 'ELIMINACION',
      entidadAfectada: 'CONTRATO',
      referenciaEntidad: ct.numeroContrato,
      descripcion: `Eliminación de contrato ${ct.numeroContrato}`
    });

    this.toast.success('Contrato eliminado exitosamente.');
  }
}
