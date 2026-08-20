import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';

@Component({
  selector: 'app-departamentos',
  imports: [PageHeaderComponent, SlideOverComponent, ReactiveFormsModule],
  templateUrl: './departamentos.html',
  styleUrl: './departamentos.css'
})
export class Departamentos {
  private fb = inject(FormBuilder);
  
  breadcrumbs = ['Configuración', 'Territorio', 'Departamento'];
  
  departamentos = [
    { codigo: '25', nombre: 'Cundinamarca', estado: true },
    { codigo: '05', nombre: 'Antioquia', estado: true },
    { codigo: '76', nombre: 'Valle del Cauca', estado: true },
    { codigo: '08', nombre: 'Atlántico', estado: true },
    { codigo: '68', nombre: 'Santander', estado: false },
  ];

  isSlideOverOpen = false;
  isSaving = false;

  departamentoForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(2)]],
    nombre: ['', Validators.required],
    estado: [true]
  });

  openNew() {
    this.departamentoForm.reset({ estado: true });
    this.isSlideOverOpen = true;
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
  }

  saveDepartamento() {
    if (this.departamentoForm.valid) {
      this.isSaving = true;
      // Simulamos guardado
      setTimeout(() => {
        this.departamentos.unshift({
          codigo: this.departamentoForm.value.codigo!,
          nombre: this.departamentoForm.value.nombre!,
          estado: this.departamentoForm.value.estado!
        });
        this.isSaving = false;
        this.closeSlideOver();
      }, 1000);
    } else {
      this.departamentoForm.markAllAsTouched();
    }
  }
}
