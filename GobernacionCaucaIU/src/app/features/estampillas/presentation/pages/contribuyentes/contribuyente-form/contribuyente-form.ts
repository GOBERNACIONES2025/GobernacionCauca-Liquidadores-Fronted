import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ContribuyentesFacade } from '../../../../application/facades/contribuyentes.facade';
import { ConfiguracionFacade } from '../../../../application/facades/configuracion.facade';
import { EstampillasStorageService } from '../../../../infrastructure/storage/storage.service';
import { TipoPersona, TipoDocumento, TipoContribuyente, EstadoContribuyente } from '../../../../domain/models/estampillas.models';

@Component({
  selector: 'app-contribuyente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './contribuyente-form.html'
})
export class ContribuyenteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly facade = inject(ContribuyentesFacade);
  readonly configFacade = inject(ConfiguracionFacade);
  readonly storage = inject(EstampillasStorageService);

  readonly isEditing = signal<boolean>(false);
  readonly contribuyenteId = signal<string | null>(null);
  readonly digitoVerificacionCalculado = signal<string>('');

  contribuyenteForm: FormGroup = this.fb.group({
    tipoPersona: ['JURIDICA' as TipoPersona, [Validators.required]],
    tipoDocumento: ['NIT' as TipoDocumento, [Validators.required]],
    numeroDocumento: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.minLength(5)]],
    digitoVerificacion: [''],
    
    // Nombres Persona Natural
    primerNombre: [''],
    segundoNombre: [''],
    primerApellido: [''],
    segundoApellido: [''],

    // Persona Jurídica / Razón Social
    razonSocial: [''],

    // Contacto
    direccion: ['', [Validators.required]],
    municipioId: ['19001', [Validators.required]],
    departamentoId: ['19', [Validators.required]],
    telefono: ['', [Validators.required]],
    correoElectronico: ['', [Validators.required, Validators.email]],

    // Tributaria
    tipoContribuyente: ['REGIMEN_ORDINARIO' as TipoContribuyente, [Validators.required]],
    esResponsableIVA: [true],
    estado: ['ACTIVO' as EstadoContribuyente, [Validators.required]],
    observaciones: ['']
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.contribuyenteId.set(id);
      const c = this.facade.obtenerPorId(id);
      if (c) {
        this.contribuyenteForm.patchValue(c);
        this.digitoVerificacionCalculado.set(c.digitoVerificacion || '');
      }
    }

    // Escuchar cambios en número de documento para auto-calcular DV si es NIT
    this.contribuyenteForm.get('numeroDocumento')?.valueChanges.subscribe(num => {
      const tipoDoc = this.contribuyenteForm.get('tipoDocumento')?.value;
      if (tipoDoc === 'NIT' && num) {
        const dv = this.storage.calcularDigitoVerificacion(num);
        this.digitoVerificacionCalculado.set(dv);
        this.contribuyenteForm.get('digitoVerificacion')?.setValue(dv, { emitEvent: false });
      } else {
        this.digitoVerificacionCalculado.set('');
      }
    });

    // Escuchar cambios en tipo persona
    this.contribuyenteForm.get('tipoPersona')?.valueChanges.subscribe(tp => {
      if (tp === 'NATURAL') {
        this.contribuyenteForm.get('tipoDocumento')?.setValue('CC');
        this.contribuyenteForm.get('esResponsableIVA')?.setValue(false);
      } else {
        this.contribuyenteForm.get('tipoDocumento')?.setValue('NIT');
        this.contribuyenteForm.get('esResponsableIVA')?.setValue(true);
      }
    });
  }

  isNatural(): boolean {
    return this.contribuyenteForm.get('tipoPersona')?.value === 'NATURAL';
  }

  onSubmit(): void {
    if (this.contribuyenteForm.invalid) {
      this.contribuyenteForm.markAllAsTouched();
      return;
    }

    const val = this.contribuyenteForm.value;
    const municipio = this.configFacade.municipios().find(m => m.id === val.municipioId);
    const depto = this.configFacade.departamentos().find(d => d.id === val.departamentoId);

    const saved = this.facade.guardarContribuyente({
      id: this.contribuyenteId() || undefined,
      ...val,
      digitoVerificacion: this.digitoVerificacionCalculado() || val.digitoVerificacion,
      municipioNombre: municipio?.nombre || 'Popayán',
      departamentoNombre: depto?.nombre || 'Cauca'
    });

    this.router.navigate(['/estampillas/contribuyentes', saved.id]);
  }
}
