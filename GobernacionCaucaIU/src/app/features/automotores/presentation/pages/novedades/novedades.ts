import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { SearchableSelectComponent } from '../../../../../shared/components/searchable-select/searchable-select';
import { FormularioTraspasoComponent, TraspasoFormModel } from './components/formulario-traspaso/formulario-traspaso';
import { FormularioTrasladoComponent, TrasladoFormModel } from './components/formulario-traslado/formulario-traslado';
import { FormularioRematriculaComponent, RematriculaFormModel } from './components/formulario-rematricula/formulario-rematricula';
import { 
  NovedadesFacade, 
  NovedadHistoricoItem, 
  TipoNovedadVehiculo 
} from '../../../application/facades/novedades.facade';
import { EstadoNovedad } from '../../../domain/interfaces/novedades.interface';

export type { NovedadHistoricoItem, TipoNovedadVehiculo } from '../../../application/facades/novedades.facade';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbComponent,
    SearchableSelectComponent,
    FormularioTraspasoComponent,
    FormularioTrasladoComponent,
    FormularioRematriculaComponent
  ],
  templateUrl: './novedades.html',
})
export class NovedadesPage implements OnInit {
  readonly facade = inject(NovedadesFacade);
  readonly toastMessage = signal<{ title: string; desc: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Delegaciones reactivas hacia el Facade para enlace con la vista
  readonly placa = this.facade.placa;
  readonly vehiculo = this.facade.vehiculo;
  readonly loading = this.facade.loading;
  readonly submitting = this.facade.submitting;
  readonly error = this.facade.error;
  readonly kpis = this.facade.kpis;
  readonly detalleModal = this.facade.detalleModal;
  readonly accionLoading = this.facade.accionLoading;
  readonly historialNovedades = this.facade.historialNovedades;
  readonly vehiculoDisplay = this.facade.vehiculoDisplay;
  readonly tiposDocumento = this.facade.tiposDocumento;
  readonly organismosTransito = this.facade.organismosTransito;
  readonly tiposNovedadOpciones = this.facade.tiposNovedadOpciones;
  readonly tipoNovedad = this.facade.tipoNovedad;
  readonly anexoTraspaso = this.facade.anexoTraspaso;
  readonly anexoTraslado = this.facade.anexoTraslado;
  readonly anexoRematricula = this.facade.anexoRematricula;

  get traspasoForm(): TraspasoFormModel {
    return this.facade.traspasoForm;
  }
  set traspasoForm(value: TraspasoFormModel) {
    this.facade.traspasoForm = value;
  }

  get trasladoForm(): TrasladoFormModel {
    return this.facade.trasladoForm;
  }
  set trasladoForm(value: TrasladoFormModel) {
    this.facade.trasladoForm = value;
  }

  get rematriculaForm(): RematriculaFormModel {
    return this.facade.rematriculaForm;
  }
  set rematriculaForm(value: RematriculaFormModel) {
    this.facade.rematriculaForm = value;
  }

  ngOnInit(): void {
    this.facade.init();
  }

  onPlacaInput(value: string): void {
    this.facade.onPlacaInput(value);
  }

  onTipoNovedadChange(tipo: string): void {
    this.facade.onTipoNovedadChange(tipo);
  }

  buscarPlaca(): void {
    this.facade.busqueda.buscarPlaca().subscribe(encontrado => {
      if (encontrado) {
        this.facade.operaciones.autocompletarFormularios(encontrado);
        this.mostrarToast('Vehículo Encontrado', `Datos del vehículo ${encontrado.placa} cargados correctamente.`, 'success');
      }
    });
  }

  limpiarBusqueda(): void {
    this.facade.limpiarBusqueda();
  }

  verDetalle(novedad: NovedadHistoricoItem): void {
    this.facade.verDetalle(novedad);
  }

  cerrarModalDetalle(): void {
    this.facade.cerrarModalDetalle();
  }

  esPendiente(estado: string | undefined | null): boolean {
    return this.facade.esPendiente(estado);
  }

  cambiarEstado(idOrItem: any, nuevoEstado: EstadoNovedad, observaciones?: string): void {
    this.facade.cambiarEstado(idOrItem, nuevoEstado, observaciones).subscribe(res => {
      if (res.success) {
        const titulo = nuevoEstado === 'APROBADO' ? 'Novedad Aprobada y Aplicada' : 'Estado Actualizado';
        const desc = nuevoEstado === 'APROBADO' 
          ? 'La novedad fue aprobada y los cambios del automotor se actualizaron automáticamente.' 
          : `La novedad ha sido marcada como ${nuevoEstado}.`;
        this.mostrarToast(titulo, desc, 'success');
      } else {
        this.mostrarToast('Error', res.message || 'Error al actualizar el estado.', 'error');
      }
    });
  }

  procesarNovedad(): void {
    this.facade.radicarNovedad().subscribe(res => {
      if (res.success) {
        this.mostrarToast('Novedad Radicada con Éxito', res.mensaje || 'Novedad registrada correctamente.', 'success');
        if (this.vehiculo()) {
          this.facade.busqueda.cargarHistorialVehiculo(this.vehiculo()!.placa);
        }
      } else {
        const titulo = res.error?.includes('Incompletos') || res.error?.includes('Inválido') || res.error?.includes('100%')
          ? 'Validación de Datos' 
          : 'Atención';
        this.mostrarToast(titulo, res.error || 'Error al radicar novedad.', 'error');
      }
    });
  }

  mostrarToast(title: string, desc: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastMessage.set({ title, desc, type });
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4500);
  }
}
