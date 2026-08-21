import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';

export interface ExpedienteLiquidacion {
  id: number;
  radicado: string;
  fecha: string;
  contribuyenteNombre: string;
  contribuyenteDocumento: string;
  tipoDocumento: string;
  tipoActo: string;
  naturalezaActo?: string;
  valorLiquidado: number | null; // null si es 'Por calcular' o '—'
  fechaVencimiento?: string | null;
  estado: 'Borrador' | 'Pendiente' | 'Liquidado' | 'Pagado';
  tieneAlerta?: boolean;
  municipio?: string;
  notaria?: string;
}

@Component({
  selector: 'app-registros',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registros.html',
  styleUrl: './registros.css',
})
export class Registros {
  private toast = inject(ToastService);

  searchQuery = signal<string>('');
  selectedEstadoFilter = signal<'Todos' | 'Borrador' | 'Pendiente' | 'Liquidado' | 'Pagado'>('Todos');
  isLoading = signal<boolean>(false);

  // Expediente seleccionado para modal de detalle
  selectedExpediente = signal<ExpedienteLiquidacion | null>(null);
  isDetailModalOpen = signal<boolean>(false);

  // Lista de expedientes de liquidación
  expedientes = signal<ExpedienteLiquidacion[]>([
    {
      id: 1,
      radicado: 'RAD-2025-001847',
      fecha: '2025-08-04',
      contribuyenteNombre: 'CONSTRUCTORA BIENES & RAÍCES POPAYÁN S.A.S.',
      contribuyenteDocumento: '901.234.567-8',
      tipoDocumento: 'NIT',
      tipoActo: 'Compraventa de bien inmueble',
      naturalezaActo: 'Traslación de dominio',
      valorLiquidado: null,
      fechaVencimiento: null,
      estado: 'Pendiente',
      tieneAlerta: false,
      municipio: 'Popayán',
      notaria: 'Notaría Primera de Popayán'
    },
    {
      id: 2,
      radicado: 'RAD-2025-001846',
      fecha: '2025-08-04',
      contribuyenteNombre: 'PEDRO ANTONIO VÁSQUEZ MORA',
      contribuyenteDocumento: '79.456.123',
      tipoDocumento: 'CC',
      tipoActo: 'Hipoteca',
      naturalezaActo: 'Gravamen',
      valorLiquidado: 1600000,
      fechaVencimiento: '2025-08-19',
      estado: 'Liquidado',
      tieneAlerta: true,
      municipio: 'Santander de Quilichao',
      notaria: 'Notaría Única de Santander'
    },
    {
      id: 3,
      radicado: 'RAD-2025-001845',
      fecha: '2025-08-04',
      contribuyenteNombre: 'INVERSIONES OSPINA LTDA',
      contribuyenteDocumento: '830.456.789-2',
      tipoDocumento: 'NIT',
      tipoActo: 'Compraventa de bien inmueble',
      naturalezaActo: 'Traslación de dominio',
      valorLiquidado: 2400000,
      fechaVencimiento: '2025-08-20',
      estado: 'Pagado',
      tieneAlerta: false,
      municipio: 'Popayán',
      notaria: 'Notaría Segunda de Popayán'
    },
    {
      id: 4,
      radicado: 'RAD-2025-001844',
      fecha: '2025-08-03',
      contribuyenteNombre: 'MARÍA FERNANDA RUIZ CASTAÑO',
      contribuyenteDocumento: '52.345.678',
      tipoDocumento: 'CC',
      tipoActo: '—',
      naturalezaActo: undefined,
      valorLiquidado: null,
      fechaVencimiento: null,
      estado: 'Borrador',
      tieneAlerta: false,
      municipio: 'Puerto Tejada',
      notaria: 'Notaría Única de Puerto Tejada'
    },
    {
      id: 5,
      radicado: 'RAD-2025-001840',
      fecha: '2025-08-02',
      contribuyenteNombre: 'ALIANZA INMOBILIARIA S.A.',
      contribuyenteDocumento: '860.987.654-1',
      tipoDocumento: 'NIT',
      tipoActo: '2 actos',
      naturalezaActo: 'Traslación de dominio',
      valorLiquidado: 16500000,
      fechaVencimiento: '2025-08-17',
      estado: 'Liquidado',
      tieneAlerta: true,
      municipio: 'Popayán',
      notaria: 'Cámara de Comercio del Cauca'
    }
  ]);

  // Dynamic KPIs / Cards calculation
  kpis = computed(() => {
    const list = this.expedientes();
    const pendientes = list.filter(e => e.estado === 'Pendiente').length;
    const liquidadas = list.filter(e => e.estado === 'Liquidado').length;
    const pagadas = list.filter(e => e.estado === 'Pagado');
    const pagosHoy = pagadas.length;
    const totalRecaudo = pagadas.reduce((sum, item) => sum + (item.valorLiquidado || 0), 0);

    return {
      pendientes,
      liquidadas,
      pagosHoy,
      totalRecaudo
    };
  });

  // Dynamic Counts for Filter Tabs
  counts = computed(() => {
    const list = this.expedientes();
    return {
      todos: list.length,
      borrador: list.filter(e => e.estado === 'Borrador').length,
      pendiente: list.filter(e => e.estado === 'Pendiente').length,
      liquidado: list.filter(e => e.estado === 'Liquidado').length,
      pagado: list.filter(e => e.estado === 'Pagado').length
    };
  });

  // Filtered list
  expedientesFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const estado = this.selectedEstadoFilter();
    let list = this.expedientes();

    if (estado !== 'Todos') {
      list = list.filter(e => e.estado === estado);
    }

    if (query) {
      list = list.filter(e => 
        e.radicado.toLowerCase().includes(query) ||
        e.contribuyenteNombre.toLowerCase().includes(query) ||
        e.contribuyenteDocumento.toLowerCase().includes(query) ||
        e.tipoActo.toLowerCase().includes(query)
      );
    }

    return list;
  });

  setEstadoFilter(filter: 'Todos' | 'Borrador' | 'Pendiente' | 'Liquidado' | 'Pagado') {
    this.selectedEstadoFilter.set(filter);
  }

  refresh() {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.toast.success('Bandeja de liquidaciones actualizada');
    }, 400);
  }

  openDetail(expediente: ExpedienteLiquidacion) {
    this.selectedExpediente.set(expediente);
    this.isDetailModalOpen.set(true);
  }

  closeDetail() {
    this.isDetailModalOpen.set(false);
    this.selectedExpediente.set(null);
  }

  nuevaSolicitud() {
    this.toast.info('Abriendo asistente de liquidación...');
  }
}
