import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { 
  ConsultaCiudadanaSharedComponent, 
  ConsultaSubmitPayload 
} from '../../../../../shared/components/consulta-ciudadana/consulta-ciudadana-shared';
import { DeclaracionDeguelloData } from '../../../domain/models/deguello.model';
import { DeguelloService } from '../../../infrastructure/services/deguello.service';
import { FacturaModalComponent } from '../../components/factura-modal/factura-modal';

@Component({
  selector: 'app-deguello-portal-ciudadano',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink, 
    ConsultaCiudadanaSharedComponent, 
    FacturaModalComponent
  ],
  templateUrl: './deguello-portal-ciudadano.html',
})
export class DeguelloPortalCiudadanoComponent {
  private deguelloService = inject(DeguelloService);
  private router = inject(Router);

  /** Control de visualización */
  readonly isConsulted = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  /** Criterio ingresado en la búsqueda */
  readonly criterioBusqueda = signal<{ doc: string; guia: string; tipoDoc: number } | null>(null);

  /** Lista de declaraciones encontradas */
  readonly declaraciones = signal<DeclaracionDeguelloData[]>([]);

  /** Filtro de estado para la lista de resultados */
  readonly filtroEstado = signal<'TODAS' | 'PENDIENTE' | 'PAGADO' | 'VENCIDO'>('TODAS');

  /** Declaración activa para visualizar/imprimir en el modal */
  readonly declaracionSeleccionadaParaFactura = signal<DeclaracionDeguelloData | null>(null);

  /** Información del contribuyente a partir de los resultados */
  readonly contribuyenteInfo = computed(() => {
    const list = this.declaraciones();
    if (list.length === 0) return null;
    const item = list[0];
    return {
      razonSocial: item.razonSocial,
      nit: item.nit,
      dv: item.dv,
      municipio: item.municipio,
      direccion: item.direccionNotificacion,
      telefono: item.telefonoFijo,
      representante: item.nombreRepresentante,
      docRepresentante: item.numeroDocRepresentante,
      predioOrigen: item.predioOrigen,
      plantaBeneficio: item.plantaBeneficio,
    };
  });

  /** Conteo y totales */
  readonly totalDeclaraciones = computed(() => this.declaraciones().length);

  readonly totalCabezas = computed(() => {
    return this.declaraciones().reduce((acc, curr) => acc + curr.baseGravable, 0);
  });

  readonly countPendientes = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'PENDIENTE').length;
  });

  readonly countPagadas = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'PAGADO').length;
  });

  readonly countVencidas = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'VENCIDO').length;
  });

  readonly totalPendientePagar = computed(() => {
    return this.declaraciones()
      .filter((d) => d.estadoPago === 'PENDIENTE')
      .reduce((acc, curr) => acc + curr.totalAPagar, 0);
  });

  /** Determina si es una consulta puntual de una guía ICA / formulario específico */
  readonly esBusquedaPuntual = computed(() => {
    const crit = this.criterioBusqueda();
    const tieneGuia = !!crit?.guia && crit.guia.trim().length > 0;
    return tieneGuia || this.declaraciones().length === 1;
  });

  /** Declaraciones filtradas según el tab seleccionado */
  readonly declaracionesFiltradas = computed(() => {
    const estado = this.filtroEstado();
    if (estado === 'TODAS') {
      return this.declaraciones();
    }
    return this.declaraciones().filter((d) => d.estadoPago === estado);
  });

  /** Al ejecutar la consulta desde el componente compartido */
  alConsultar(payload: ConsultaSubmitPayload): void {
    this.isLoading.set(true);
    this.criterioBusqueda.set({
      doc: payload.numeroDocumento,
      guia: payload.secondaryValue,
      tipoDoc: payload.tipoDocumento,
    });

    this.deguelloService
      .consultarDeclaracionesCiudadano(payload.numeroDocumento, payload.secondaryValue)
      .subscribe({
        next: (res) => {
          this.declaraciones.set(res);
          this.isConsulted.set(true);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al consultar declaraciones de degüello:', err);
          this.declaraciones.set([]);
          this.isConsulted.set(true);
          this.isLoading.set(false);
        },
      });
  }

  /** Volver a la pantalla de consulta inicial */
  nuevaConsulta(): void {
    this.isConsulted.set(false);
    this.declaraciones.set([]);
    this.criterioBusqueda.set(null);
    this.filtroEstado.set('TODAS');
    this.declaracionSeleccionadaParaFactura.set(null);
  }

  /** Cambiar filtro de estado */
  setFiltro(estado: 'TODAS' | 'PENDIENTE' | 'PAGADO' | 'VENCIDO'): void {
    this.filtroEstado.set(estado);
  }

  /** Abrir modal de factura oficial para visualización e impresión */
  verFactura(d: DeclaracionDeguelloData): void {
    this.declaracionSeleccionadaParaFactura.set(d);
  }

  /** Cerrar modal de factura */
  cerrarModalFactura(): void {
    this.declaracionSeleccionadaParaFactura.set(null);
  }
}
