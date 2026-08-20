import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { Departamento } from '../../../../../domain/models/Territorios/departamento.model';

@Component({
  selector: 'app-departamentos',
  imports: [PageHeaderComponent, SlideOverComponent, ReactiveFormsModule],
  templateUrl: './departamentos.html',
  styleUrl: './departamentos.css'
})
export class Departamentos implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(DepartamentosFacade);

  breadcrumbs = ['Configuración', 'Territorio', 'Departamento'];

  isSlideOverOpen = false;

  departamentoForm = this.fb.group({
    codigoDane: ['', [Validators.required, Validators.maxLength(2)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  ngOnInit() {
    this.facade.cargarDepartamentos(1, 100);
  }

  openNew() {
    this.departamentoForm.reset({ activo: true });
    this.isSlideOverOpen = true;
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
  }

  saveDepartamento() {
    if (this.departamentoForm.valid) {
      const data = this.departamentoForm.value as Partial<Departamento>;
      
      this.facade.crearDepartamento(data).subscribe({
        next: () => {
          this.closeSlideOver();
          this.facade.cargarDepartamentos(); // Recargar después de guardar
        },
        error: (err) => {
          console.error('Error al guardar el departamento', err);
        }
      });
    } else {
      this.departamentoForm.markAllAsTouched();
    }
  }
}
