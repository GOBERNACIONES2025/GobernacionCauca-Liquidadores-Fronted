import { Injectable, inject, signal, computed } from '@angular/core';
import { EstampillasStorageService } from '../../infrastructure/storage/storage.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  Contribuyente,
  TipoPersona,
  TipoDocumento,
  TipoContribuyente,
  EstadoContribuyente,
  Contrato,
  LiquidacionEstampilla,
  PagoEstampilla
} from '../../domain/models/estampillas.models';

export interface ContribuyenteDetalle360 {
  contribuyente: Contribuyente;
  contratos: Contrato[];
  liquidaciones: LiquidacionEstampilla[];
  pagos: PagoEstampilla[];
  totalContratosMonto: number;
  totalLiquidadoMonto: number;
  totalPagadoMonto: number;
  saldoPendienteMonto: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContribuyentesFacade {
  private storage = inject(EstampillasStorageService);
  private toast = inject(ToastService);

  readonly loading = signal<boolean>(false);
  readonly filtroTexto = signal<string>('');
  readonly filtroTipoPersona = signal<string>('TODOS');
  readonly filtroMunicipio = signal<string>('TODOS');
  readonly filtroEstado = signal<string>('TODOS');
  
  readonly paginaActual = signal<number>(1);
  readonly elementosPorPagina = signal<number>(8);

  readonly contribuyentes = computed(() => {
    this.storage.dataVersion(); // Reaccionar a cambios
    const items = this.storage.getContribuyentes();
    const texto = this.filtroTexto().toLowerCase().trim();
    const tipo = this.filtroTipoPersona();
    const mun = this.filtroMunicipio();
    const est = this.filtroEstado();

    return items.filter(c => {
      const matchTexto = !texto || 
        c.nombreCompleto.toLowerCase().includes(texto) ||
        c.numeroDocumento.includes(texto) ||
        (c.razonSocial && c.razonSocial.toLowerCase().includes(texto)) ||
        (c.correoElectronico && c.correoElectronico.toLowerCase().includes(texto));

      const matchTipo = tipo === 'TODOS' || c.tipoPersona === tipo;
      const matchMun = mun === 'TODOS' || c.municipioId === mun || c.municipioNombre.toLowerCase() === mun.toLowerCase();
      const matchEst = est === 'TODOS' || c.estado === est;

      return matchTexto && matchTipo && matchMun && matchEst;
    });
  });

  readonly totalElementos = computed(() => this.contribuyentes().length);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalElementos() / this.elementosPorPagina())));

  readonly contribuyentesPaginados = computed(() => {
    const page = this.paginaActual();
    const size = this.elementosPorPagina();
    const start = (page - 1) * size;
    return this.contribuyentes().slice(start, start + size);
  });

  setFiltroTexto(query: string): void {
    this.filtroTexto.set(query);
    this.paginaActual.set(1);
  }

  setFiltroTipoPersona(tipo: string): void {
    this.filtroTipoPersona.set(tipo);
    this.paginaActual.set(1);
  }

  setFiltroMunicipio(municipio: string): void {
    this.filtroMunicipio.set(municipio);
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
    this.filtroTipoPersona.set('TODOS');
    this.filtroMunicipio.set('TODOS');
    this.filtroEstado.set('TODOS');
    this.paginaActual.set(1);
  }

  obtenerPorId(id: string): Contribuyente | undefined {
    return this.storage.getContribuyenteById(id);
  }

  obtenerDetalle360(id: string): ContribuyenteDetalle360 | null {
    const c = this.obtenerPorId(id);
    if (!c) return null;

    const allContratos = this.storage.getContratos().filter(ct => ct.contribuyenteId === c.id);
    const allLiquidaciones = this.storage.getLiquidaciones().filter(l => l.contribuyenteId === c.id);
    const allPagos = this.storage.getPagos().filter(p => p.contribuyenteId === c.id);

    const totalContratosMonto = allContratos.reduce((sum, ct) => sum + ct.valorContrato, 0);
    const totalLiquidadoMonto = allLiquidaciones.filter(l => l.estado !== 'ANULADA').reduce((sum, l) => sum + l.totalPagar, 0);
    const totalPagadoMonto = allPagos.reduce((sum, p) => sum + p.valorPagado, 0);
    const saldoPendienteMonto = Math.max(0, totalLiquidadoMonto - totalPagadoMonto);

    return {
      contribuyente: c,
      contratos: allContratos,
      liquidaciones: allLiquidaciones,
      pagos: allPagos,
      totalContratosMonto,
      totalLiquidadoMonto,
      totalPagadoMonto,
      saldoPendienteMonto
    };
  }

  guardarContribuyente(data: Partial<Contribuyente>): Contribuyente {
    this.loading.set(true);

    const isNew = !data.id;
    const now = new Date().toISOString().substring(0, 10);
    const id = data.id || `CONT-${Date.now()}`;

    let nombreComp = '';
    if (data.tipoPersona === 'NATURAL') {
      nombreComp = `${data.primerNombre || ''} ${data.segundoNombre || ''} ${data.primerApellido || ''} ${data.segundoApellido || ''}`.replace(/\s+/g, ' ').trim();
    } else {
      nombreComp = data.razonSocial || '';
    }

    const dv = data.tipoDocumento === 'NIT' && data.numeroDocumento 
      ? this.storage.calcularDigitoVerificacion(data.numeroDocumento) 
      : data.digitoVerificacion;

    const contribuyenteCompleto: Contribuyente = {
      id,
      tipoPersona: data.tipoPersona || 'JURIDICA',
      tipoDocumento: data.tipoDocumento || 'NIT',
      numeroDocumento: data.numeroDocumento || '',
      digitoVerificacion: dv,
      primerNombre: data.primerNombre,
      segundoNombre: data.segundoNombre,
      primerApellido: data.primerApellido,
      segundoApellido: data.segundoApellido,
      razonSocial: data.razonSocial,
      nombreCompleto: nombreComp,
      direccion: data.direccion || '',
      municipioId: data.municipioId || '19001',
      municipioNombre: data.municipioNombre || 'Popayán',
      departamentoId: data.departamentoId || '19',
      departamentoNombre: data.departamentoNombre || 'Cauca',
      telefono: data.telefono || '',
      correoElectronico: data.correoElectronico || '',
      tipoContribuyente: data.tipoContribuyente || 'REGIMEN_ORDINARIO',
      esResponsableIVA: data.esResponsableIVA ?? true,
      estado: data.estado || 'ACTIVO',
      observaciones: data.observaciones,
      fechaRegistro: data.fechaRegistro || now,
      fechaActualizacion: now
    };

    this.storage.saveContribuyente(contribuyenteCompleto);

    const currentUser = this.storage.getCurrentUser();
    this.storage.registrarAuditoria({
      usuarioNombre: currentUser.nombre,
      usuarioRol: currentUser.rol,
      accion: isNew ? 'CREACION' : 'ACTUALIZACION',
      entidadAfectada: 'CONTRIBUYENTE',
      referenciaEntidad: `${contribuyenteCompleto.numeroDocumento} - ${contribuyenteCompleto.nombreCompleto}`,
      descripcion: isNew 
        ? `Creación de contribuyente ${contribuyenteCompleto.nombreCompleto} (${contribuyenteCompleto.tipoDocumento} ${contribuyenteCompleto.numeroDocumento})`
        : `Actualización de datos para contribuyente ${contribuyenteCompleto.nombreCompleto}`
    });

    this.loading.set(false);
    this.toast.success(isNew ? 'Contribuyente creado correctamente.' : 'Contribuyente actualizado correctamente.');
    return contribuyenteCompleto;
  }

  eliminarContribuyente(id: string): void {
    const c = this.obtenerPorId(id);
    if (!c) return;

    this.storage.deleteContribuyente(id);
    const currentUser = this.storage.getCurrentUser();
    this.storage.registrarAuditoria({
      usuarioNombre: currentUser.nombre,
      usuarioRol: currentUser.rol,
      accion: 'ELIMINACION',
      entidadAfectada: 'CONTRIBUYENTE',
      referenciaEntidad: c.numeroDocumento,
      descripcion: `Eliminación de contribuyente ${c.nombreCompleto}`
    });

    this.toast.success('Contribuyente eliminado exitosamente.');
  }
}
