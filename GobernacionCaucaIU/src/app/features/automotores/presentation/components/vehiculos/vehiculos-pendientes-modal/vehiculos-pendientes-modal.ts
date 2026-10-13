import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiculosFacade } from '../../../../application/facades/vehiculos.facade';
import { VehiculoItem } from '../../../../domain/models/vehiculo.model';

@Component({
  selector: 'app-vehiculos-pendientes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos-pendientes-modal.html'
})
export class VehiculosPendientesModalComponent {
  readonly facade = inject(VehiculosFacade);

  @Output() cerrar = new EventEmitter<void>();
  @Output() verDetalle = new EventEmitter<VehiculoItem>();
  @Output() cambiarEstado = new EventEmitter<{ id: number; estado: string }>();

  onCambiarEstado(id: number, estado: string): void {
    this.cambiarEstado.emit({ id, estado });
  }

  getPropietarioInfo(item: VehiculoItem): { nombre: string; copropietariosText: string } {
    const nombre = item.propietarioNombre || item.propietario?.nombre || 'Sin Propietario';
    const total = item.propietarios?.length || 1;
    const copropietariosText = total > 1 ? ` (+${total - 1} copropietario${total - 1 > 1 ? 's' : ''})` : '';
    return { nombre, copropietariosText };
  }

  getDocInfo(item: VehiculoItem): string {
    if (item.propietario?.tipoDocumento && item.propietario?.numeroDocumento) {
      return `${item.propietario.tipoDocumento} ${item.propietario.numeroDocumento}`;
    }
    return item.propietarioDocumento || item.propietario?.numeroDocumento || 'Sin Documento';
  }

  getPorcentajeInfo(item: VehiculoItem): string {
    const total = item.propietarios?.length || 1;
    const principal = item.propietarios?.find(p => p.esResponsablePrincipal) || item.propietarios?.[0];
    const pct = principal?.porcentajePropiedad ?? 100;
    return `${pct}% (${total} propietario${total > 1 ? 's' : ''})`;
  }
}
