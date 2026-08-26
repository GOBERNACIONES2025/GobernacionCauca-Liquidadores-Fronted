import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SolicitudesLiquidacionFacade } from '../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ToastService } from '../../../../../../core/services/toast.service';
import { SolicitudListadoDto } from '../../../../domain/models/Radicacion/solicitud-wizard.model';

@Component({
  selector: 'app-solicitudes-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitudes-list.html'
})
export class SolicitudesListComponent implements OnInit {
  router = inject(Router);
  facade = inject(SolicitudesLiquidacionFacade);
  toast = inject(ToastService);

  // Estado
  solicitudes = signal<SolicitudListadoDto[]>([]);
  filterStatus = signal<string>('Todas');
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);

  ngOnInit() {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.isLoading.set(true);
    this.facade.listarSolicitudes(1, 100).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.solicitudes.set(res.data.items);
        } else {
          this.toast.error(res.message || 'Error al cargar solicitudes');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Error de red al cargar solicitudes');
        this.isLoading.set(false);
      }
    });
  }

  filteredSolicitudes = computed(() => {
    let filtered = this.solicitudes();
    const status = this.filterStatus();
    const search = this.searchText().toLowerCase();

    if (status !== 'Todas') {
      // Comparación ignorando mayúsculas por si el backend manda 'Radicada' o 'RADICADA'
      filtered = filtered.filter(s => s.nombreEstado.toUpperCase() === status.toUpperCase());
    }

    if (search) {
      filtered = filtered.filter(s => 
        s.numeroRadicado.toLowerCase().includes(search) || 
        (s.nombreContribuyente && s.nombreContribuyente.toLowerCase().includes(search)) ||
        (s.numeroIdentificacionContribuyente && s.numeroIdentificacionContribuyente.includes(search))
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

  onNewSolicitud() {
    this.router.navigate(['/registros/solicitudes/wizard']);
  }

  continuarSolicitud(id: number) {
    this.router.navigate(['/registros/solicitudes/wizard', id]);
  }
}
