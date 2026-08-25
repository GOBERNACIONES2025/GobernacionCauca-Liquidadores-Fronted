import { Component, computed, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ExpedienteLiquidacion {
  id: number;
  radicado: string;
  fecha: string;
  contribuyenteNombre: string;
  contribuyenteDocumento: string;
  tipoDocumento: string;
  tipoActo: string;
  naturalezaActo?: string;
  valorLiquidado: number;
  fechaVencimiento: string;
  estado: 'Borrador' | 'Liquidado' | 'Pagado' | 'Vencido' | 'Anulado';
  tieneAlerta?: boolean;
  municipio?: string;
  notaria?: string;
}

@Component({
  selector: 'app-registros-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registros-list.html'
})
export class RegistrosListComponent {
  @Output() newSolicitud = new EventEmitter<void>();

  // Estado
  expedientes = signal<ExpedienteLiquidacion[]>([
    {
      id: 1,
      radicado: 'RAD-2024-001234',
      fecha: '2024-05-10',
      contribuyenteNombre: 'INMOBILIARIA DEL CAUCA S.A.S.',
      contribuyenteDocumento: '900123456',
      tipoDocumento: 'NIT',
      tipoActo: 'Compraventa',
      naturalezaActo: 'Con Cuantía',
      valorLiquidado: 1250000,
      fechaVencimiento: '2024-06-10',
      estado: 'Liquidado',
      tieneAlerta: false,
      municipio: 'Popayán',
      notaria: 'Notaría Primera'
    },
    {
      id: 2,
      radicado: 'RAD-2024-001235',
      fecha: '2024-05-11',
      contribuyenteNombre: 'JUAN PEREZ GOMEZ',
      contribuyenteDocumento: '1061123456',
      tipoDocumento: 'CC',
      tipoActo: 'Hipoteca',
      naturalezaActo: 'Con Cuantía',
      valorLiquidado: 450000,
      fechaVencimiento: '2024-06-11',
      estado: 'Pagado',
      tieneAlerta: false
    },
    {
      id: 3,
      radicado: 'RAD-2024-001236',
      fecha: '2024-05-12',
      contribuyenteNombre: 'MARIA RODRIGUEZ',
      contribuyenteDocumento: '25456789',
      tipoDocumento: 'CC',
      tipoActo: 'Cancelación Hipoteca',
      naturalezaActo: 'Sin Cuantía',
      valorLiquidado: 85000,
      fechaVencimiento: '2024-05-27',
      estado: 'Borrador',
      tieneAlerta: true
    }
  ]);

  filterStatus = signal<string>('Todos');
  searchText = signal<string>('');
  
  showDetailModal = signal<boolean>(false);
  selectedExpediente = signal<ExpedienteLiquidacion | null>(null);

  // Computados para KPIs
  totalRecaudoDia = computed(() => {
    return this.expedientes()
      .filter(e => e.estado === 'Pagado')
      .reduce((sum, current) => sum + current.valorLiquidado, 0);
  });
  
  tramitesPendientes = computed(() => {
    return this.expedientes().filter(e => e.estado === 'Borrador').length;
  });

  tramitesLiquidados = computed(() => {
    return this.expedientes().filter(e => e.estado === 'Liquidado').length;
  });

  filteredExpedientes = computed(() => {
    let filtered = this.expedientes();
    const status = this.filterStatus();
    const search = this.searchText().toLowerCase();

    if (status !== 'Todos') {
      filtered = filtered.filter(e => e.estado === status);
    }

    if (search) {
      filtered = filtered.filter(e => 
        e.radicado.toLowerCase().includes(search) || 
        e.contribuyenteNombre.toLowerCase().includes(search) ||
        e.contribuyenteDocumento.includes(search)
      );
    }

    return filtered;
  });

  onSearchChange(event: any) {
    this.searchText.set(event.target.value);
  }

  setFilter(status: string) {
    this.filterStatus.set(status);
  }

  openDetail(exp: ExpedienteLiquidacion) {
    this.selectedExpediente.set(exp);
    this.showDetailModal.set(true);
  }

  closeDetail() {
    this.showDetailModal.set(false);
    setTimeout(() => this.selectedExpediente.set(null), 300);
  }

  onNewSolicitud() {
    this.newSolicitud.emit();
  }
}
