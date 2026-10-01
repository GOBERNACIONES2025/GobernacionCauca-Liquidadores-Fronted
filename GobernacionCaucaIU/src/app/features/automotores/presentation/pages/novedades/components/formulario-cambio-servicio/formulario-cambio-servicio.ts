import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnexoInfo } from '../formulario-traspaso/formulario-traspaso';

export interface CambioServicioFormModel {
  servicioActual: string;
  nuevoServicio: string; // 'Particular' | 'Publico' | 'Oficial'
  fechaCambio: string;
  numeroActa: string;
  empresaTransporte?: string;
  tarjetaOperacion?: string;
  observaciones: string;
}

@Component({
  selector: 'app-formulario-cambio-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario-cambio-servicio.html',
})
export class FormularioCambioServicioComponent {
  readonly form = input.required<CambioServicioFormModel>();
  readonly anexo = input<AnexoInfo | null>(null);
  readonly anexoChange = output<AnexoInfo | null>();

  seleccionarServicio(tipo: string): void {
    this.form().nuevoServicio = tipo;
  }

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
