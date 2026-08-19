import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Contribuyente } from '../../../domain/models/contribuyente.model';
import { ContribuyentesFacade } from '../../../application/facades/contribuyentes.facade';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-contribuyente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contribuyente-form.html'
})
export class ContribuyenteFormComponent implements OnInit, OnChanges, OnDestroy {
  public facade = inject(ContribuyentesFacade);
  private fb = inject(FormBuilder);

  @Input() isOpen: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() contribuyenteToEdit: Contribuyente | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  form: FormGroup;
  private deptSub?: Subscription;

  constructor() {
    this.form = this.fb.group({
      tipoDocumentoId: [1, Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.maxLength(40)]],
      digitoVerificacion: [null],
      naturalezaJuridicaId: [1, Validators.required],
      
      // Campo unificado según mockup
      nombreRazonSocial: ['', [Validators.required, Validators.maxLength(250)]],
      
      // Contacto y Ubicación
      correoElectronico: ['', [Validators.email, Validators.maxLength(180)]],
      telefono: ['', Validators.maxLength(80)],
      direccion: ['', Validators.maxLength(250)],
      
      // Selectores en cascada (Opcionales si la BD no los exige de inmediato)
      departamentoId: [null],
      ciudadId: [{ value: null, disabled: true }],
      
      // Estado (Visual)
      estadoTributario: ['Al día']
    });
  }

  ngOnInit(): void {
    this.facade.cargarCatalogos();

    // Lógica en cascada: Departamento -> Municipios
    this.deptSub = this.form.get('departamentoId')?.valueChanges.subscribe(deptId => {
      const ciudadControl = this.form.get('ciudadId');
      if (deptId !== null && deptId !== undefined && deptId !== '') {
        const idNum = Number(deptId);
        ciudadControl?.enable();
        this.facade.cargarCiudades(idNum);
      } else {
        ciudadControl?.setValue(null);
        ciudadControl?.disable();
        this.facade.limpiarCiudades();
      }
    });
  }

  ngOnDestroy(): void {
    this.deptSub?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.facade.cargarCatalogos();

      if (this.contribuyenteToEdit) {
        // Unificar nombres para edición
        let nombre = this.contribuyenteToEdit.razonSocial;
        if (!nombre) {
          const partes = [
            this.contribuyenteToEdit.primerNombre,
            this.contribuyenteToEdit.segundoNombre,
            this.contribuyenteToEdit.primerApellido,
            this.contribuyenteToEdit.segundoApellido
          ].filter(p => !!p);
          nombre = partes.join(' ');
        }

        const deptId = this.contribuyenteToEdit.departamentoId || null;
        const ciudadId = this.contribuyenteToEdit.ciudadId || null;

        if (deptId) {
          this.form.get('ciudadId')?.enable();
          this.facade.cargarCiudades(deptId);
        } else {
          this.form.get('ciudadId')?.disable();
          this.facade.limpiarCiudades();
        }

        this.form.patchValue({
          ...this.contribuyenteToEdit,
          tipoDocumentoId: this.contribuyenteToEdit.tipoDocumentoId || (this.contribuyenteToEdit.naturalezaJuridicaId === 2 ? 2 : 1),
          nombreRazonSocial: nombre,
          estadoTributario: this.contribuyenteToEdit.cantidadDeudas > 0 ? 'Moroso' : 'Al día',
          departamentoId: deptId,
          ciudadId: ciudadId,
          direccion: this.contribuyenteToEdit.direccion || ''
        });

        // Deshabilitar campos protegidos en edición
        this.form.get('tipoDocumentoId')?.disable();
        this.form.get('numeroDocumento')?.disable();
        this.form.get('naturalezaJuridicaId')?.disable();
        this.form.get('estadoTributario')?.disable();
      } else {
        this.form.enable();
        this.form.get('ciudadId')?.disable();
        this.facade.limpiarCiudades();
        this.form.reset({
          tipoDocumentoId: 1,
          naturalezaJuridicaId: 1,
          departamentoId: null,
          ciudadId: null,
          estadoTributario: 'Al día'
        });
      }
    }
  }

  get isNatural(): boolean {
    return this.form.get('naturalezaJuridicaId')?.value == 1;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      const invalidFields = Object.keys(this.form.controls).filter(k => this.form.get(k)?.invalid);
      console.warn('Formulario inválido. Campos con error:', invalidFields, this.form.value);
      this.form.markAllAsTouched();
      return;
    }

    const formVal = this.form.getRawValue();
    const selectedCiudadObj = this.facade.ciudades().find(c => c.id == formVal.ciudadId);

    const formData: any = {
      id: this.contribuyenteToEdit ? this.contribuyenteToEdit.id : undefined,
      tipoDocumentoId: Number(formVal.tipoDocumentoId),
      numeroDocumento: String(formVal.numeroDocumento).trim(),
      digitoVerificacion: formVal.digitoVerificacion || null,
      naturalezaJuridicaId: Number(formVal.naturalezaJuridicaId),
      correoElectronico: formVal.correoElectronico || null,
      telefono: formVal.telefono || null,
      direccion: formVal.direccion || null,
      departamentoId: formVal.departamentoId ? Number(formVal.departamentoId) : null,
      ciudadId: formVal.ciudadId ? Number(formVal.ciudadId) : null,
      municipioId: formVal.ciudadId ? Number(formVal.ciudadId) : null, // Compatibilidad con backend si usa MunicipioId
      ciudad: selectedCiudadObj ? selectedCiudadObj.nombre : (this.contribuyenteToEdit?.ciudad || null),
      activo: this.contribuyenteToEdit ? this.contribuyenteToEdit.activo : true
    };

    // Separar nombreRazonSocial según tipo de persona
    const nombreCompleto = (formVal.nombreRazonSocial || '').trim();
    
    if (this.isNatural) {
      const partes = nombreCompleto.split(/\s+/);
      formData.primerNombre = partes[0] || '';
      formData.primerApellido = partes[1] || '';
      
      if (partes.length === 3) {
         formData.segundoApellido = partes[2];
      } else if (partes.length >= 4) {
         formData.segundoNombre = partes[1];
         formData.primerApellido = partes[2];
         formData.segundoApellido = partes.slice(3).join(' ');
      }
    } else {
      formData.razonSocial = nombreCompleto;
    }

    console.log('Enviando formData al backend:', formData);
    this.save.emit(formData);
  }

  onClose(): void {
    this.close.emit();
  }
}
