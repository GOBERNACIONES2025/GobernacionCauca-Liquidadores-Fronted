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
  readonly filtroEstado = signal<'TODAS' | 'RADICADA' | 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'RELIQUIDADA'>('TODAS');

  /** Declaración activa para visualizar/imprimir en el modal */
  readonly declaracionSeleccionadaParaFactura = signal<DeclaracionDeguelloData | null>(null);

  /** MODAL DE PAGO EN LÍNEA PSE */
  readonly declaracionParaPse = signal<DeclaracionDeguelloData | null>(null);
  readonly tipoPersonaPse = signal<'JURIDICA' | 'NATURAL'>('JURIDICA');
  readonly bancoPse = signal<string>('Bancolombia');
  readonly nombrePagadorPse = signal<string>('');
  readonly docPagadorPse = signal<string>('');
  readonly emailPse = signal<string>('pagos@contribuyente.com');
  readonly procesandoPse = signal<boolean>(false);
  readonly ticketPseExitoso = signal<{ cus: string; banco: string; fecha: string; valor: number; consecutivo: string; autorizacion: string } | null>(null);

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

  readonly countRadicadas = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'RADICADA').length;
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

  readonly countReliquidadas = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'RELIQUIDADA').length;
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

    this.recargarDeclaraciones(payload.numeroDocumento, payload.secondaryValue);
  }

  private recargarDeclaraciones(doc: string, guia: string): void {
    this.deguelloService
      .consultarDeclaracionesCiudadano(doc, guia)
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
    this.declaracionParaPse.set(null);
    this.ticketPseExitoso.set(null);
  }

  /** Cambiar filtro de estado */
  setFiltro(estado: 'TODAS' | 'RADICADA' | 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'RELIQUIDADA'): void {
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

  // --- FLUJO PASARELA PSE (PAGO EN LÍNEA CIUDADANO/EMPRESA) ---
  abrirModalPse(d: DeclaracionDeguelloData): void {
    if (d.estadoPago === 'VENCIDO') {
      alert(`La liquidación N° ${d.consecutivo} se encuentra VENCIDA. No puede pagarse directamente; debe realizar la reliquidación correspondiente.`);
      return;
    }
    if (d.estadoPago === 'RELIQUIDADA') {
      alert(`La liquidación N° ${d.consecutivo} fue sustituida por una reliquidación (Inactiva). Debe pagar la nueva liquidación vigente.`);
      return;
    }
    if (d.estadoPago === 'RADICADA') {
      alert(`La liquidación N° ${d.consecutivo} aún se encuentra en revisión oficial por la Gobernación del Cauca. Una vez sea aprobada podrá proceder al pago con PSE.`);
      return;
    }

    this.ticketPseExitoso.set(null);
    this.nombrePagadorPse.set(d.razonSocial);
    this.docPagadorPse.set(d.nit);
    this.declaracionParaPse.set(d);
  }

  cerrarModalPse(): void {
    if (this.procesandoPse()) return;
    this.declaracionParaPse.set(null);
    this.ticketPseExitoso.set(null);
  }

  confirmarPagoPse(): void {
    const dec = this.declaracionParaPse();
    if (!dec) return;

    this.procesandoPse.set(true);

    const cus = Math.floor(100000000 + Math.random() * 900000000).toString();
    const autorizacion = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
    const reciboPse = `PSE-${cus} (${this.bancoPse()})`;

    // Simulación del débito bancario en línea con PSE (1.2 segundos)
    setTimeout(() => {
      this.deguelloService.marcarComoPagada(dec.consecutivo, reciboPse).subscribe({
        next: (ok) => {
          this.procesandoPse.set(false);
          if (ok) {
            this.ticketPseExitoso.set({
              cus,
              banco: this.bancoPse(),
              fecha: new Date().toLocaleString('es-CO'),
              valor: dec.totalAPagar,
              consecutivo: dec.consecutivo,
              autorizacion,
            });

            // Refrescar datos en el portal
            const crit = this.criterioBusqueda();
            if (crit) {
              this.recargarDeclaraciones(crit.doc, crit.guia);
            }
          } else {
            alert('No se pudo completar el débito PSE. Verifique que la liquidación esté vigente y habilitada para recaudo.');
          }
        },
        error: () => {
          this.procesandoPse.set(false);
          alert('Error de comunicación con la pasarela bancaria PSE.');
        }
      });
    }, 1200);
  }

  // --- RELIQUIDAR DESDE EL PORTAL CIUDADANO ---
  reliquidar(d: DeclaracionDeguelloData): void {
    this.deguelloService.setDeclaracionEnEdicion(d);
    this.router.navigate(['/deguello/liquidacion']);
  }
}
