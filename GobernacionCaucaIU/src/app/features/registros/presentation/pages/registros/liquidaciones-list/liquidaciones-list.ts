import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GeneracionLiquidacionFacade } from '../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { ToastService } from '../../../../../../core/services/toast.service';
import { LiquidacionListadoDto } from '../../../../domain/models/Liquidacion/generacion-liquidacion.model';

@Component({
  selector: 'app-liquidaciones-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liquidaciones-list.html'
})
export class LiquidacionesListComponent implements OnInit {
  router = inject(Router);
  facade = inject(GeneracionLiquidacionFacade);
  toast = inject(ToastService);

  // Estado
  liquidaciones = signal<LiquidacionListadoDto[]>([]);
  filterStatus = signal<string>('Todas');
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);

  ngOnInit() {
    this.cargarLiquidaciones();
  }

  cargarLiquidaciones() {
    this.isLoading.set(true);
    this.facade.listarLiquidaciones(1, 100).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.liquidaciones.set(res.data.items);
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

  filteredLiquidaciones = computed(() => {
    let filtered = this.liquidaciones();
    const status = this.filterStatus();
    const search = this.searchText().toLowerCase();

    if (status !== 'Todas') {
      filtered = filtered.filter(l => l.estado.nombre.toUpperCase() === status.toUpperCase());
    }

    if (search) {
      filtered = filtered.filter(l => 
        l.numeroLiquidacion.toLowerCase().includes(search) || 
        l.radicacion.numeroRadicado.toLowerCase().includes(search) || 
        l.contribuyente.nombreCompleto.toLowerCase().includes(search) ||
        l.contribuyente.numeroIdentificacion.includes(search)
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

  reliquidar(solicitudId: number) {
    this.router.navigate(['/registros/solicitudes/wizard', solicitudId]);
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
