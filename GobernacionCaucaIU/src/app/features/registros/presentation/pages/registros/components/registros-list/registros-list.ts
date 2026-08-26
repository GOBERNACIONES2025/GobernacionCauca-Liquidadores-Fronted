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
  expedientes = signal<ExpedienteLiquidacion[]>([]);

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
