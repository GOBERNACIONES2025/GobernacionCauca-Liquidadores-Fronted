import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DeguelloService } from '../../../infrastructure/services/deguello.service';
import { DeclaracionDeguelloData } from '../../../domain/models/deguello.model';
import { FacturaModalComponent } from '../../components/factura-modal/factura-modal';

@Component({
  selector: 'app-deguello-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule, FacturaModalComponent],
  templateUrl: './deguello-facturacion.html',
})
export class DeguelloFacturacionComponent implements OnInit {
  private deguelloService = inject(DeguelloService);
  private router = inject(Router);

  readonly listaDeclaraciones = signal<DeclaracionDeguelloData[]>([]);
  readonly filtroTexto = signal<string>('');
  readonly filtroEstado = signal<'TODOS' | 'PAGADO' | 'PENDIENTE' | 'VENCIDO'>('TODOS');

  // Modal para ver/imprimir la factura oficial
  readonly declaracionParaModal = signal<DeclaracionDeguelloData | null>(null);

  // KPIs
  readonly totalRecaudado = computed(() => {
    return this.listaDeclaraciones()
      .filter((d) => d.estadoPago === 'PAGADO')
      .reduce((acc, curr) => acc + curr.totalAPagar, 0);
  });

  readonly totalCabezas = computed(() => {
    return this.listaDeclaraciones().reduce((acc, curr) => acc + curr.baseGravable, 0);
  });

  readonly totalPendientes = computed(() => {
    return this.listaDeclaraciones().filter((d) => d.estadoPago === 'PENDIENTE').length;
  });

  // Lista Filtrada
  readonly declaracionesFiltradas = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const est = this.filtroEstado();

    return this.listaDeclaraciones().filter((d) => {
      const matchEstado = est === 'TODOS' || d.estadoPago === est;
      const matchTexto =
        texto === '' ||
        d.consecutivo.toLowerCase().includes(texto) ||
        d.razonSocial.toLowerCase().includes(texto) ||
        d.nit.toLowerCase().includes(texto) ||
        (d.numeroGuiaIca || '').toLowerCase().includes(texto) ||
        d.municipio.toLowerCase().includes(texto);

      return matchEstado && matchTexto;
    });
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.deguelloService.listarDeclaraciones().subscribe((items) => {
      this.listaDeclaraciones.set(items);
    });
  }

  abrirFacturaModal(d: DeclaracionDeguelloData): void {
    this.declaracionParaModal.set(d);
  }

  cerrarFacturaModal(): void {
    this.declaracionParaModal.set(null);
  }

  pagarPse(d: DeclaracionDeguelloData): void {
    const ok = this.deguelloService.marcarComoPagada(d.consecutivo);
    if (ok) {
      this.cargarDatos();
    }
  }

  reliquidar(d: DeclaracionDeguelloData): void {
    this.deguelloService.setDeclaracionEnEdicion(d);
    this.router.navigate(['/deguello/liquidacion']);
  }

  irANuevaLiquidacion(): void {
    this.deguelloService.setDeclaracionEnEdicion(null);
    this.router.navigate(['/deguello/liquidacion']);
  }
}
