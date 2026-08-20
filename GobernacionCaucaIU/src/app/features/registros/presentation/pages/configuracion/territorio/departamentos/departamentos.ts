import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { Departamento } from '../../../../../domain/models/Territorios/departamento.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-departamentos',
  imports: [PageHeaderComponent, SlideOverComponent, ReactiveFormsModule],
  templateUrl: './departamentos.html',
  styleUrl: './departamentos.css'
})
export class Departamentos implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(DepartamentosFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Territorio', 'Departamento'];

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  departamentoForm = this.fb.group({
    codigoDane: ['', [Validators.required, Validators.maxLength(2)]],
    nombre: ['', Validators.required],
    activo: [true]
  });

  ngOnInit() {
    this.facade.cargarDepartamentos(1, 100);
  }

  openNew() {
    this.selectedId = null;
    this.departamentoForm.reset({ activo: true });
    this.isSlideOverOpen = true;
  }

  edit(item: Departamento) {
    this.selectedId = item.id;
    this.departamentoForm.patchValue({
      codigoDane: item.codigoDane,
      nombre: item.nombre,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveDepartamento() {
    if (this.departamentoForm.valid) {
      const data = this.departamentoForm.value as Partial<Departamento>;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';
      
      const observer = {
        next: () => {
          this.toast.success(`Departamento ${actionName} exitosamente`);
          this.closeSlideOver();
          this.facade.cargarDepartamentos(); // Recargar después de guardar
        },
        error: (err: any) => {
          this.toast.error(`Error al intentar guardar el departamento`);
          console.error('Error al guardar el departamento', err);
        }
      };

      if (this.isEditMode) {
        this.facade.actualizarDepartamento(this.selectedId!, data).subscribe(observer);
      } else {
        this.facade.crearDepartamento(data).subscribe(observer);
      }
    } else {
      this.departamentoForm.markAllAsTouched();
    }
  }
}
