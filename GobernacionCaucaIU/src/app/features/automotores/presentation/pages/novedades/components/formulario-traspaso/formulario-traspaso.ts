import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoDocumentoDto } from '../../../../../domain/interfaces/catalogo.interface';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';  

export interface TraspasoFormModel {
  propietarioActualNombre: string;
  propietarioActualDoc: string;
  propietarioActualTipoDoc: string;
  propietarioActualTelefono: string;
  propietarioActualCorreo: string;
  propietarioActualDireccion: string;
  propietarioActualPorcentaje: number;

  tipoDocumentoId: number;
  numeroDocumento: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  razonSocial: string;
  esPersonaJuridica: boolean;
  telefono: string;
  correoElectronico: string;
  direccion: string;
  porcentajePropiedad: number;
  fechaTraspaso: string;
  numeroRadicado: string;
  esResponsablePrincipal: boolean;
  observaciones: string;
}

export interface AnexoInfo {
  nombre: string;
  tamano: string;
}

@Component({
  selector: 'app-formulario-traspaso',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './formulario-traspaso.html',
})
export class FormularioTraspasoComponent {
  readonly form = input.required<TraspasoFormModel>();
  readonly tiposDocumento = input<TipoDocumentoDto[]>([]);
  readonly anexo = input<AnexoInfo | null>(null);
  readonly anexoChange = output<AnexoInfo | null>();

  readonly tiposDocumentoItems = computed(() => {
    return this.tiposDocumento().map(td => ({
      id: td.id,
      nombre: td.codigo ? `${td.codigo} - ${td.nombre}` : td.nombre,
      codigo: td.codigo || ''
    }));
  });

  get isPersonaJuridica(): boolean {
    const tdId = Number(this.form()?.tipoDocumentoId);
    const tipo = this.tiposDocumento().find(t => Number(t.id) === tdId);
    const esJuridica = tipo 
      ? (tipo.codigo?.toUpperCase() === 'NIT' || tipo.nombre?.toUpperCase().includes('NIT') || tdId === 2)
      : (tdId === 2);
    
    if (this.form() && this.form().esPersonaJuridica !== esJuridica) {
      this.form().esPersonaJuridica = esJuridica;
    }
    return esJuridica;
  }

  onTipoDocumentoChange(tipoId: any): void {
    const id = Number(tipoId);
    this.form().tipoDocumentoId = id;
    const tipo = this.tiposDocumento().find(t => Number(t.id) === id);
    const esJuridica = tipo 
      ? (tipo.codigo?.toUpperCase() === 'NIT' || tipo.nombre?.toUpperCase().includes('NIT') || id === 2) 
      : (id === 2);
    this.form().esPersonaJuridica = esJuridica;
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
