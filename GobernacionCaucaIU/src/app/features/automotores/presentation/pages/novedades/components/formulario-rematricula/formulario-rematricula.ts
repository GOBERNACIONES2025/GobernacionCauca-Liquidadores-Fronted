import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnexoInfo } from '../formulario-traspaso/formulario-traspaso';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';

export interface RematriculaFormModel {
  motivo: string;
  placaActual: string;
  nuevaPlaca: string;
  fechaRematricula: string;
  organismoTransito: string;
  numeroActa: string;
  numeroMotorConfirmado: string;
  numeroChasisConfirmado: string;
  cilindrajeConfirmado: string;
  marcaLineaModelo: string;
  observaciones: string;
}

@Component({
  selector: 'app-formulario-rematricula',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './formulario-rematricula.html',
})
export class FormularioRematriculaComponent {
  readonly form = input.required<RematriculaFormModel>();
  readonly anexo = input<AnexoInfo | null>(null);
  readonly anexoChange = output<AnexoInfo | null>();

  readonly motivosRematricula = [
    { id: 'Pérdida definitiva de placas', nombre: 'Pérdida definitiva de placas' },
    { id: 'Vehículo Hurtado Recuperado', nombre: 'Vehículo Hurtado Recuperado' },
    { id: 'Deterioro severo o destrucción parcial', nombre: 'Deterioro severo o destrucción parcial' },
    { id: 'Cambio de Servicio Público a Particular', nombre: 'Cambio de Servicio Público a Particular' },
    { id: 'Reasignación por Orden Judicial', nombre: 'Reasignación por Orden Judicial' },
  ];

  onFileChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.files && inputEl.files.length > 0) {
      const file = inputEl.files[0];
      const tamanoKb = (file.size / 1024).toFixed(1);
      const tamanoStr = file.size > 1048576 
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${tamanoKb} KB`;

      this.anexoChange.emit({ nombre: file.name, tamano: tamanoStr });
    }
  }

  removerAnexo(): void {
    this.anexoChange.emit(null);
  }
}
