import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { GeneracionLiquidacionFacade } from '../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { ToastService } from '../../../../../../core/services/toast.service';
import { LiquidacionListadoDto } from '../../../../domain/models/Liquidacion/generacion-liquidacion.model';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-liquidaciones-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './liquidaciones-list.html'
})
export class LiquidacionesListComponent implements OnInit {
  router = inject(Router);
  facade = inject(GeneracionLiquidacionFacade);
  toast = inject(ToastService);

  // Estado
  liquidaciones = signal<LiquidacionListadoDto[]>([]);
  totalCount = signal<number>(0);

  filterStatus = signal<string>('Todas');
  
  searchText = signal<string>('');
  private searchSubject = new Subject<string>();

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.pageNumber.set(1);
      this.cargarLiquidaciones();
    });
  }

  ngOnInit() {
    this.cargarLiquidaciones();
  }

  cargarLiquidaciones() {
    this.isLoading.set(true);
    // Asumiendo que el facade/API soporta search, si no, fallará silenciosamente el filtrado o habría que ajustarlo,
    // pero como el patrón de api es igual, lo añadimos:
    this.facade.listarLiquidaciones(this.pageNumber(), this.pageSize(), this.searchText()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.liquidaciones.set(res.data.items);
          this.totalCount.set(res.data.totalCount);
        } else {
          this.toast.error(res.message || 'Error al cargar liquidaciones');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error de red al cargar liquidaciones');
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.pageNumber.set(page);
    this.cargarLiquidaciones();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.pageNumber.set(1);
    this.cargarLiquidaciones();
  }

  filteredLiquidaciones = computed(() => {
    let filtered = this.liquidaciones();
    const status = this.filterStatus();

    if (status !== 'Todas') {
      filtered = filtered.filter(l => l.estado.nombre.toUpperCase() === status.toUpperCase());
    }

    return filtered;
  });

  onSearchChange(event: any) {
    const value = event.target.value;
    this.searchText.set(value);
    this.searchSubject.next(value);
  }

  setFilter(status: string) {
    this.filterStatus.set(status);
  }

  // Modal de Reliquidar
  showReliquidarModal = signal<boolean>(false);
  liquidacionIdTemp = signal<number | null>(null);
  motivoReliquidacion = signal<string>('Modificación en los actos informados por el contribuyente');

  reliquidar(id: number) {
    this.liquidacionIdTemp.set(id);
    this.motivoReliquidacion.set('Modificación en los actos informados por el contribuyente');
    this.showReliquidarModal.set(true);
  }

  cerrarModalReliquidar() {
    this.showReliquidarModal.set(false);
    this.liquidacionIdTemp.set(null);
  }

  confirmarReliquidar() {
    const id = this.liquidacionIdTemp();
    const motivo = this.motivoReliquidacion();

    if (!id) return;
    
    if (!motivo || motivo.trim().length < 5) {
      this.toast.warning('El motivo de reliquidación debe tener al menos 5 caracteres.');
      return;
    }

    this.isLoading.set(true);
    this.facade.reliquidarLiquidacion(id, motivo).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.toast.success('La liquidación ha sido anulada. Redirigiendo al formulario para ajustar los datos...');
          this.cerrarModalReliquidar();
          this.router.navigate(['/registros/solicitudes/wizard', res.data]);
        } else {
          this.toast.error(res.message || 'Error al intentar reliquidar.');
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.toast.error('Error de red al intentar reliquidar.');
        this.isLoading.set(false);
      }
    });
  }

  anular(id: number) {
    const motivo = prompt('Por favor, ingrese el motivo de anulación para esta liquidación:');
    
    if (motivo !== null) {
      if (motivo.trim().length < 5) {
        this.toast.warning('El motivo de anulación debe tener al menos 5 caracteres.');
        return;
      }

      this.isLoading.set(true);
      this.facade.anularLiquidacion(id, motivo).subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.success('Liquidación anulada exitosamente.');
            this.cargarLiquidaciones(); // Recargamos la grilla
          } else {
            this.toast.error(res.message || 'Error al anular la liquidación.');
            this.isLoading.set(false);
          }
        },
        error: () => {
          this.toast.error('Error de red al intentar anular.');
          this.isLoading.set(false);
        }
      });
    }
  }

  descargar(id: number) {
    this.isLoading.set(true);
    this.facade.descargarPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Liquidacion_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.toast.success('Descarga iniciada');
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error al descargar el PDF');
        this.isLoading.set(false);
      }
    });
  }
}
