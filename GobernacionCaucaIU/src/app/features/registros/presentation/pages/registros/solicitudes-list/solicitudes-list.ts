import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SolicitudesLiquidacionFacade } from '../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { ToastService } from '../../../../../../core/services/toast.service';
import { SolicitudListadoDto } from '../../../../domain/models/Radicacion/solicitud-wizard.model';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-solicitudes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './solicitudes-list.html'
})
export class SolicitudesListComponent implements OnInit {
  router = inject(Router);
  facade = inject(SolicitudesLiquidacionFacade);
  toast = inject(ToastService);

  // Estado
  solicitudes = signal<SolicitudListadoDto[]>([]);
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
      this.cargarSolicitudes();
    });
  }

  ngOnInit() {
    this.cargarSolicitudes();
  }

  onSearchChange(event: any) {
    const value = event.target.value;
    this.searchText.set(value);
    this.searchSubject.next(value);
  }

  cargarSolicitudes() {
    this.isLoading.set(true);
    this.facade.listarSolicitudes(this.pageNumber(), this.pageSize(), this.searchText()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.solicitudes.set(res.data.items);
          this.totalCount.set(res.data.totalCount);
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

  onPageChange(page: number) {
    this.pageNumber.set(page);
    this.cargarSolicitudes();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.pageNumber.set(1);
    this.cargarSolicitudes();
  }

  filteredSolicitudes = computed(() => {
    let filtered = this.solicitudes();
    const status = this.filterStatus();

    if (status !== 'Todas') {
      filtered = filtered.filter(s => s.nombreEstado.toUpperCase() === status.toUpperCase());
    }

    return filtered;
  });


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
