import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  MedioPago, 
  CrearMedioPagoDto, 
  ActualizarMedioPagoDto 
} from '../../../domain/models/Pagos/medio-pago.model';
import { MediosPagoApiService } from '../../../infrastructure/api/Pagos/medios-pago-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';

@Injectable({
  providedIn: 'root'
})
export class MediosPagoFacade {
  private apiService = inject(MediosPagoApiService);

  // Signals
  readonly mediosPago = signal<MedioPago[]>([]);
  readonly totalMediosPago = signal<number>(0);

  // Medios de pago manuales que exigen comprobante físico o digital (Banco Santander, Consignación, etc.)
  readonly mediosPagoManuales = computed(() =>
    this.mediosPago().filter(m => m.activo && m.requiereComprobante)
  );
  
  // UI State
  readonly loading = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedMedioPago = signal<MedioPago | null>(null);

  cargarMediosPago(pageNumber: number = 1, pageSize: number = 10, search?: string, activo?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerTodos(pageNumber, pageSize, search, activo).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.mediosPago.set(response.data.items || []);
          this.totalMediosPago.set(response.data.totalCount);
        } else {
          this.error.set(response.message || 'Error al cargar medios de pago');
        }
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error de conexión');
        this.loading.set(false);
      }
    });
  }

  seleccionarPorId(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedMedioPago.set(null);

    this.apiService.obtenerPorId(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedMedioPago.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar medio de pago');
        }
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error al obtener medio de pago');
        this.loading.set(false);
      }
    });
  }

  crear(dto: CrearMedioPagoDto): Observable<ApiResponse<number>> {
    this.actionLoading.set(true);
    this.error.set(null);

    return this.apiService.crear(dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: (err: HttpErrorResponse) => {
          this.actionLoading.set(false);
          this.error.set(err.message || 'Error al crear medio de pago');
        }
      })
    );
  }

  actualizar(id: number, dto: ActualizarMedioPagoDto): Observable<ApiResponse<void>> {
    this.actionLoading.set(true);
    this.error.set(null);

    return this.apiService.actualizar(id, dto).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: (err: HttpErrorResponse) => {
          this.actionLoading.set(false);
          this.error.set(err.message || 'Error al actualizar medio de pago');
        }
      })
    );
  }

  eliminar(id: number): Observable<ApiResponse<void>> {
    this.actionLoading.set(true);
    this.error.set(null);

    return this.apiService.eliminar(id).pipe(
      tap({
        next: () => this.actionLoading.set(false),
        error: (err: HttpErrorResponse) => {
          this.actionLoading.set(false);
          this.error.set(err.message || 'Error al eliminar medio de pago');
        }
      })
    );
  }
}
