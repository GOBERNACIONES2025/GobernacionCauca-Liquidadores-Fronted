import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { VehiculosApiService } from '../../../infrastructure/api/vehiculos-api.service';
import { PropietariosApiService } from '../../../infrastructure/api/propietarios-api.service';
import { 
  ApiResponse, 
  VehiculoItem, 
  RegistrarVehiculoDto 
} from '../../../domain/models/vehiculo.model';

@Injectable({
  providedIn: 'root',
})
export class VehiculosOperacionesFacade {
  private vehiculosApi = inject(VehiculosApiService);
  private propietariosApi = inject(PropietariosApiService);

  readonly registroLoading = signal<boolean>(false);

  // Modal / Drawer de Registro / Expediente Multi-Paso
  readonly isDrawerOpen = signal<boolean>(false);
  readonly isNuevoRegistro = signal<boolean>(true);
  readonly currentStep = signal<number>(1);
  readonly activeTab = signal<string>('Datos del Vehículo');

  readonly tabs = computed(() => {
    return this.isNuevoRegistro()
      ? ['Datos del Vehículo', 'Propietarios', 'Observaciones']
      : ['Datos del Vehículo', 'Propietarios', 'Historial', 'Observaciones'];
  });

  // Modal de Consulta RUNT
  readonly isRuntModalOpen = signal<boolean>(false);
  readonly placaRunt = signal<string>('');
  readonly runtLoading = signal<boolean>(false);

  // Modal de Confirmación de Inactivación
  readonly isInactivarModalOpen = signal<boolean>(false);
  readonly vehiculoAInactivar = signal<VehiculoItem | null>(null);
  readonly inactivandoLoading = signal<boolean>(false);

  // Búsqueda de propietario
  readonly buscandoPropietario = signal<boolean>(false);
  readonly propietarioEncontrado = signal<any | null>(null);
  readonly busquedaRealizada = signal<boolean>(false);

  // --------------------------------------------------------------------------
  // OPERACIONES CRUD
  // --------------------------------------------------------------------------
  crearVehiculo(payload: RegistrarVehiculoDto): Observable<ApiResponse<any>> {
    this.registroLoading.set(true);
    return this.vehiculosApi.crearVehiculo(payload as any).pipe(
      map(res => {
        this.registroLoading.set(false);
        return res;
      }),
      catchError(err => {
        this.registroLoading.set(false);
        throw err;
      })
    );
  }

  actualizarVehiculo(id: number, payload: any): Observable<ApiResponse<any>> {
    this.registroLoading.set(true);
    return this.vehiculosApi.actualizarVehiculo(id, payload).pipe(
      map(res => {
        this.registroLoading.set(false);
        return res;
      }),
      catchError(err => {
        this.registroLoading.set(false);
        throw err;
      })
    );
  }

  verificarPlacaExistente(placa: string): Observable<boolean> {
    if (!placa || !placa.trim()) return of(false);
    return this.vehiculosApi.getVehiculoByPlaca(placa.trim()).pipe(
      map(res => !!(res && res.success && res.data)),
      catchError(() => of(false))
    );
  }

  inactivarVehiculo(id: number): Observable<any> {
    return this.vehiculosApi.inactivarVehiculo(id);
  }

  // --------------------------------------------------------------------------
  // BÚSQUEDA DE PROPIETARIOS POR DOCUMENTO
  // --------------------------------------------------------------------------
  buscarPropietario(tipo: string | number, numero: string): Observable<any> {
    const numLimpio = (numero || '').replace(/[^0-9a-zA-Z]/g, '').trim();
    if (!numLimpio) {
      this.propietarioEncontrado.set(null);
      this.busquedaRealizada.set(false);
      return of(null);
    }

    this.buscandoPropietario.set(true);
    this.busquedaRealizada.set(true);

    return this.propietariosApi.getPropietarioByDocumento(tipo, numLimpio).pipe(
      map(res => {
        this.buscandoPropietario.set(false);
        const data = res.data || res;
        this.propietarioEncontrado.set(data);
        return data;
      }),
      catchError(() => {
        this.buscandoPropietario.set(false);
        this.propietarioEncontrado.set(null);
        return of(null);
      })
    );
  }

  limpiarBusquedaPropietario(): void {
    this.propietarioEncontrado.set(null);
    this.busquedaRealizada.set(false);
  }

  // --------------------------------------------------------------------------
  // CONTROLES DE DRAWER / WIZARD
  // --------------------------------------------------------------------------
  abrirRegistro(): void {
    this.isNuevoRegistro.set(true);
    this.currentStep.set(1);
    this.activeTab.set(this.tabs()[0]);
    this.isDrawerOpen.set(true);
  }

  abrirExpediente(): void {
    this.isNuevoRegistro.set(false);
    this.currentStep.set(1);
    this.activeTab.set(this.tabs()[0]);
    this.isDrawerOpen.set(true);
  }

  cerrarRegistro(): void {
    this.isDrawerOpen.set(false);
  }

  setStep(stepNumber: number): void {
    const list = this.tabs();
    if (stepNumber >= 1 && stepNumber <= list.length) {
      this.currentStep.set(stepNumber);
      this.activeTab.set(list[stepNumber - 1]);
    }
  }

  setTab(tabName: string): void {
    const list = this.tabs();
    const idx = list.indexOf(tabName);
    if (idx !== -1) {
      this.currentStep.set(idx + 1);
      this.activeTab.set(tabName);
    }
  }

  siguientePaso(): void {
    if (this.currentStep() < this.tabs().length) {
      this.setStep(this.currentStep() + 1);
    }
  }

  anteriorPaso(): void {
    if (this.currentStep() > 1) {
      this.setStep(this.currentStep() - 1);
    }
  }

  // --------------------------------------------------------------------------
  // CONTROLES DE MODAL INACTIVAR
  // --------------------------------------------------------------------------
  abrirInactivar(v: VehiculoItem): void {
    this.vehiculoAInactivar.set(v);
    this.isInactivarModalOpen.set(true);
  }

  cerrarInactivar(): void {
    this.isInactivarModalOpen.set(false);
    this.vehiculoAInactivar.set(null);
  }

  confirmarInactivacion(onSuccess: () => void): void {
    const v = this.vehiculoAInactivar();
    if (!v || !v.id) return;

    this.inactivandoLoading.set(true);
    this.vehiculosApi.inactivarVehiculo(v.id).subscribe({
      next: () => {
        this.inactivandoLoading.set(false);
        this.cerrarInactivar();
        onSuccess();
      },
      error: (err: any) => {
        console.error('Error al inactivar vehículo:', err);
        this.inactivandoLoading.set(false);
      }
    });
  }

  // --------------------------------------------------------------------------
  // CONTROLES DE MODAL RUNT
  // --------------------------------------------------------------------------
  abrirRunt(placa?: string): void {
    if (placa) {
      this.placaRunt.set(placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
    } else {
      this.placaRunt.set('');
    }
    this.isRuntModalOpen.set(true);
  }

  cerrarRunt(): void {
    this.isRuntModalOpen.set(false);
  }

  consultarRunt(onFound: (placa: string) => void): void {
    const placa = this.placaRunt().trim();
    if (!placa) return;

    this.runtLoading.set(true);
    setTimeout(() => {
      this.runtLoading.set(false);
      this.cerrarRunt();
      onFound(placa);
    }, 600);
  }
}
