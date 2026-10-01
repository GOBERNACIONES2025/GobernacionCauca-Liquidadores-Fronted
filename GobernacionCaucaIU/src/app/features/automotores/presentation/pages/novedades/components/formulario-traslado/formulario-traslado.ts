import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoItemDto } from '../../../../../domain/interfaces/catalogo.interface';
import { AnexoInfo } from '../formulario-traspaso/formulario-traspaso';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select'; 

export interface TrasladoFormModel {
  organismoOrigenId: string | number;
  organismoOrigen: string;
  municipioOrigen: string;
  organismoDestinoId: string | number;
  organismoDestinoNombre: string;
  departamentoDestino: string;
  municipioDestino: string;
  numeroResolucion: string;
  fechaSolicitud: string;
  motivo: string;
  pazYSalvoVerificado: boolean;
  observaciones: string;
}

@Component({
  selector: 'app-formulario-traslado',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './formulario-traslado.html',
})
export class FormularioTrasladoComponent {
  readonly form = input.required<TrasladoFormModel>();
  readonly organismosTransito = input<CatalogoItemDto[]>([]);
  readonly anexo = input<AnexoInfo | null>(null);
  readonly anexoChange = output<AnexoInfo | null>();

  readonly motivosTraslado = [
    { id: 'Cambio de Domicilio del Propietario', nombre: 'Cambio de Domicilio del Propietario' },
    { id: 'Venta / Enajenación a otra jurisdicción', nombre: 'Venta / Enajenación a otra jurisdicción' },
    { id: 'Disposición Judicial o Administrativa', nombre: 'Disposición Judicial o Administrativa' },
    { id: 'Otro Motivo', nombre: 'Otro Motivo' },
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
