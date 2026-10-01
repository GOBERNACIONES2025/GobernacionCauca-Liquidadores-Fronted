import { Component, input, output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoDocumentoDto } from '../../../../../domain/interfaces/catalogo.interface';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';  
import { PropietariosApiService } from '../../../../../infrastructure/api/propietarios-api.service';

export interface NuevoPropietarioTraspaso {
  personaId?: number | null;
  tipoDocumentoId: number;
  numeroDocumento: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  razonSocial?: string;
  esPersonaJuridica?: boolean;
  telefono?: string;
  correoElectronico?: string;
  direccion?: string;
  porcentajePropiedad: number;
  esResponsablePrincipal?: boolean;
}

export interface TraspasoFormModel {
  propietarioActualNombre: string;
  propietarioActualDoc: string;
  propietarioActualTipoDoc: string;
  propietarioActualTelefono: string;
  propietarioActualCorreo: string;
  propietarioActualDireccion: string;
  propietarioActualPorcentaje: number;

  propietarios: NuevoPropietarioTraspaso[];

  fechaTraspaso: string;
  numeroRadicado: string;
  observaciones: string;
}

export interface AnexoInfo {
  nombre: string;
  tamano: string;
}

export interface MensajeBusqueda {
  texto: string;
  tipo: 'exito' | 'aviso' | 'error';
}

@Component({
  selector: 'app-formulario-traspaso',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './formulario-traspaso.html',
})
export class FormularioTraspasoComponent {
  private readonly propietariosApi = inject(PropietariosApiService);

  readonly form = input.required<TraspasoFormModel>();
  readonly tiposDocumento = input<TipoDocumentoDto[]>([]);
  readonly anexo = input<AnexoInfo | null>(null);
  readonly anexoChange = output<AnexoInfo | null>();

  readonly buscandoPropietarioIndex = signal<number | null>(null);
  readonly mensajesBusqueda = signal<Record<number, MensajeBusqueda>>({});

  readonly tiposDocumentoItems = computed(() => {
    return this.tiposDocumento().map(td => ({
      id: td.id,
      nombre: td.codigo ? `${td.codigo} - ${td.nombre}` : td.nombre,
      codigo: td.codigo || ''
    }));
  });

  getPropietarios(): NuevoPropietarioTraspaso[] {
    const f = this.form();
    if (!f.propietarios || f.propietarios.length === 0) {
      f.propietarios = [this.crearNuevoPropietario(100, true)];
    }
    return f.propietarios;
  }

  crearNuevoPropietario(porcentaje: number = 100, esPrincipal: boolean = false): NuevoPropietarioTraspaso {
    return {
      personaId: null,
      tipoDocumentoId: 1,
      numeroDocumento: '',
      primerNombre: '',
      segundoNombre: '',
      primerApellido: '',
      segundoApellido: '',
      razonSocial: '',
      esPersonaJuridica: false,
      telefono: '',
      correoElectronico: '',
      direccion: '',
      porcentajePropiedad: porcentaje,
      esResponsablePrincipal: esPrincipal
    };
  }

  isPersonaJuridica(index: number): boolean {
    const p = this.getPropietarios()[index];
    if (!p) return false;
    const tdId = Number(p.tipoDocumentoId);
    const tipo = this.tiposDocumento().find(t => Number(t.id) === tdId);
    const esJuridica = tipo 
      ? (tipo.codigo?.toUpperCase() === 'NIT' || tipo.nombre?.toUpperCase().includes('NIT') || tdId === 2)
      : (tdId === 2);
    
    if (p.esPersonaJuridica !== esJuridica) {
      p.esPersonaJuridica = esJuridica;
    }
    return esJuridica;
  }

  onTipoDocumentoChange(index: number, tipoId: any): void {
    const p = this.getPropietarios()[index];
    if (!p) return;
    const id = Number(tipoId);
    p.tipoDocumentoId = id;
    const tipo = this.tiposDocumento().find(t => Number(t.id) === id);
    const esJuridica = tipo 
      ? (tipo.codigo?.toUpperCase() === 'NIT' || tipo.nombre?.toUpperCase().includes('NIT') || id === 2) 
      : (id === 2);
    p.esPersonaJuridica = esJuridica;
    this.limpiarMensajeBusqueda(index);
  }

  agregarPropietario(): void {
    const restante = this.calcularPorcentajeRestante();
    const nuevo = this.crearNuevoPropietario(restante > 0 ? restante : 0, false);
    this.getPropietarios().push(nuevo);
  }

  eliminarPropietario(index: number): void {
    const props = this.getPropietarios();
    if (props.length <= 1) return;

    const fuePrincipal = props[index]?.esResponsablePrincipal;
    props.splice(index, 1);

    if (fuePrincipal && props.length > 0) {
      this.setResponsablePrincipal(0);
    }

    const msgs = { ...this.mensajesBusqueda() };
    delete msgs[index];
    this.mensajesBusqueda.set(msgs);
  }

  setResponsablePrincipal(index: number): void {
    this.getPropietarios().forEach((p, i) => {
      p.esResponsablePrincipal = (i === index);
    });
  }

  calcularPorcentajeTotal(): number {
    const props = this.form()?.propietarios;
    if (!props || props.length === 0) return 0;
    const total = props.reduce((acc, p) => acc + (Number(p.porcentajePropiedad) || 0), 0);
    return Math.round(total * 100) / 100;
  }

  calcularPorcentajeRestante(): number {
    const total = this.calcularPorcentajeTotal();
    return Math.max(0, Math.round((100 - total) * 100) / 100);
  }

  asignarRestante(index: number): void {
    const props = this.getPropietarios();
    const p = props[index];
    if (!p) return;

    const actual = Number(p.porcentajePropiedad) || 0;
    const otrosTotal = this.calcularPorcentajeTotal() - actual;
    const nuevoVal = Math.max(0, Math.round((100 - otrosTotal) * 100) / 100);
    p.porcentajePropiedad = nuevoVal;
  }

  buscarPropietario(index: number): void {
    const p = this.getPropietarios()[index];
    if (!p) return;

    const tipoDocId = Number(p.tipoDocumentoId);
    const numDoc = (p.numeroDocumento || '').trim();

    if (!tipoDocId || isNaN(tipoDocId)) {
      this.setMensaje(index, 'Seleccione primero el tipo de documento para realizar la búsqueda.', 'aviso');
      return;
    }

    if (!numDoc) {
      this.setMensaje(index, 'Ingrese un número de documento para realizar la búsqueda.', 'aviso');
      return;
    }

    this.buscandoPropietarioIndex.set(index);
    this.limpiarMensajeBusqueda(index);

    this.propietariosApi.getPropietarioByDocumento(tipoDocId, numDoc).subscribe({
      next: (res) => {
        this.buscandoPropietarioIndex.set(null);
        const prop: any = res?.data || res;

        if (prop && (prop.id || prop.numeroDocumento || prop.primerNombre || prop.razonSocial)) {
          p.personaId = prop.id || prop.personaId || null;
          const tipo = this.tiposDocumento().find(t => Number(t.id) === tipoDocId);
          const esJuridica = Boolean(
            prop.razonSocial || 
            prop.naturalezaJuridicaId === 2 || 
            tipoDocId === 2 || 
            tipo?.codigo?.toUpperCase() === 'NIT'
          );
          
          p.esPersonaJuridica = esJuridica;

          if (esJuridica) {
            p.razonSocial = prop.razonSocial || prop.nombreCompleto || '';
          } else {
            p.primerNombre = prop.primerNombre || '';
            p.segundoNombre = prop.segundoNombre || '';
            p.primerApellido = prop.primerApellido || '';
            p.segundoApellido = prop.segundoApellido || '';
          }

          if (prop.telefono) p.telefono = prop.telefono;
          if (prop.correoElectronico || prop.email) p.correoElectronico = prop.correoElectronico || prop.email || '';
          if (prop.direccion || prop.direccionResidencia) p.direccion = prop.direccion || prop.direccionResidencia || '';

          const nombreMostrado = prop.razonSocial || prop.nombreCompleto || `${prop.primerNombre || ''} ${prop.primerApellido || ''}`.trim();
          this.setMensaje(index, `Persona encontrada en base de datos: ${nombreMostrado}`, 'exito');
        } else {
          p.personaId = null;
          this.setMensaje(index, 'Documento no registrado previamente. Ingrese los datos manualmente para registrar al contribuyente.', 'aviso');
        }
      },
      error: () => {
        this.buscandoPropietarioIndex.set(null);
        p.personaId = null;
        this.setMensaje(index, 'Documento no encontrado en el sistema. Puede ingresar los datos del nuevo propietario.', 'aviso');
      }
    });
  }

  setMensaje(index: number, texto: string, tipo: 'exito' | 'aviso' | 'error'): void {
    const msgs = { ...this.mensajesBusqueda() };
    msgs[index] = { texto, tipo };
    this.mensajesBusqueda.set(msgs);
  }

  getMensaje(index: number): MensajeBusqueda | null {
    return this.mensajesBusqueda()[index] || null;
  }

  limpiarMensajeBusqueda(index: number): void {
    const msgs = { ...this.mensajesBusqueda() };
    delete msgs[index];
    this.mensajesBusqueda.set(msgs);
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
