import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Contribuyente } from '../../../../../core/models/contribuyente.model';

@Component({
  selector: 'app-contribuyente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contribuyente-form.html'
})
export class ContribuyenteFormComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() contribuyenteToEdit: Contribuyente | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  form: FormGroup;

  // Catálogos estáticos temporales
  tiposDocumento = [
    { id: 1, nombre: 'Cédula de Ciudadanía' },
    { id: 2, nombre: 'NIT' },
    { id: 3, nombre: 'Cédula de Extranjería' },
    { id: 4, nombre: 'Pasaporte' }
  ];

  naturalezasJuridicas = [
    { id: 1, nombre: 'Persona Natural' },
    { id: 2, nombre: 'Persona Jurídica' }
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      tipoDocumentoId: [1, Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.maxLength(40), Validators.pattern('^[0-9]+$')]],
      naturalezaJuridicaId: [1, Validators.required],
      
      // Campo unificado según mockup
      nombreRazonSocial: ['', [Validators.required, Validators.maxLength(250)]],
      
      // Contacto
      correoElectronico: ['', [Validators.email, Validators.maxLength(180)]],
      telefono: ['', Validators.maxLength(80)],
      ciudad: ['', Validators.maxLength(100)],
      
      // Estado (Visual)
      estadoTributario: ['Al día']
    });
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
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

        this.form.patchValue({
          ...this.contribuyenteToEdit,
          tipoDocumentoId: this.contribuyenteToEdit.naturalezaJuridicaId === 2 ? 2 : 1, // Aproximación
          nombreRazonSocial: nombre,
          estadoTributario: this.contribuyenteToEdit.cantidadDeudas > 0 ? 'Moroso' : 'Al día',
          ciudad: this.contribuyenteToEdit.ciudad || ''
        });

        // Deshabilitar campos que no se pueden editar
        this.form.get('tipoDocumentoId')?.disable();
        this.form.get('numeroDocumento')?.disable();
        this.form.get('naturalezaJuridicaId')?.disable();
        this.form.get('estadoTributario')?.disable();
      } else {
        this.form.enable(); // Rehabilitar para nuevos registros
        this.form.reset({
          tipoDocumentoId: 1,
          naturalezaJuridicaId: 1,
          estadoTributario: 'Al día'
        });
      }
    }
  }

  get isNatural(): boolean {
    return this.form.get('naturalezaJuridicaId')?.value == 1;
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formVal = this.form.getRawValue(); // Usa getRawValue para incluir los campos deshabilitados
      const formData: any = {
        tipoDocumentoId: Number(formVal.tipoDocumentoId),
        numeroDocumento: formVal.numeroDocumento,
        naturalezaJuridicaId: Number(formVal.naturalezaJuridicaId),
        correoElectronico: formVal.correoElectronico,
        telefono: formVal.telefono,
        ciudad: formVal.ciudad,
        activo: this.contribuyenteToEdit ? this.contribuyenteToEdit.activo : true
      };

      // Separar nombreRazonSocial según tipo
      const nombreCompleto = (formVal.nombreRazonSocial || '').trim();
      
      if (this.isNatural) {
        const partes = nombreCompleto.split(/\s+/);
        formData.primerNombre = partes[0] || '';
        formData.primerApellido = partes[1] || '';
        
        // Si hay más partes, acomodarlas en segundoNombre y segundoApellido
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

      this.save.emit(formData);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
