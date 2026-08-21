import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { NormasFacade } from '../../../../../application/facades/Normatividad/normas.facade';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { TiposNormaFacade } from '../../../../../application/facades/Normatividad/tipos-norma.facade';
import { EstadosNormaFacade } from '../../../../../application/facades/Normatividad/estados-norma.facade';
import { NormaListado } from '../../../../../domain/models/Normatividad/norma.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-normas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './normas.html',
  styleUrl: './normas.css'
})
export class Normas implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(NormasFacade);
  public departamentosFacade = inject(DepartamentosFacade);
  public tiposNormaFacade = inject(TiposNormaFacade);
  public estadosNormaFacade = inject(EstadosNormaFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Normatividad', 'Normas'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  normaForm = this.fb.group({
    departamentoId: [null as number | null, Validators.required],
    tipoNormaId: [null as number | null, Validators.required],
    estadoNormaId: [null as number | null, Validators.required],
    numero: ['', [Validators.required, Validators.maxLength(50)]],
    anio: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(2100)]],
    fechaExpedicion: [new Date().toISOString().split('T')[0], Validators.required],
    descripcion: [''],
    documentoNombreArchivo: ['norma.pdf'],
    documentoRutaArchivo: ['/documentos/norma.pdf'],
    documentoTipoArchivo: ['application/pdf']
  });

  // Filtered list
  normasFiltradas = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.normas();

    if (filter === 'activos') {
      items = items.filter(n => n.estadoNorma?.activo || n.estadoNorma?.nombre?.toLowerCase().includes('activ'));
    } else if (filter === 'inactivos') {
      items = items.filter(n => !n.estadoNorma?.activo && !n.estadoNorma?.nombre?.toLowerCase().includes('activ'));
    }

    if (query) {
      items = items.filter(n => 
        n.numero.toLowerCase().includes(query) ||
        n.anio.toString().includes(query) ||
        n.tipoNorma?.nombre?.toLowerCase().includes(query) ||
        n.departamento?.nombre?.toLowerCase().includes(query) ||
        n.estadoNorma?.nombre?.toLowerCase().includes(query)
      );
    }

    return items;
  });

  // Dynamic counts
  counts = computed(() => {
    const all = this.facade.normas();
    const active = all.filter(n => n.estadoNorma?.activo || n.estadoNorma?.nombre?.toLowerCase().includes('activ')).length;
    return {
      total: all.length,
      active: active,
      inactive: all.length - active
    };
  });

  ngOnInit() {
    this.facade.cargarNormas();
    this.departamentosFacade.cargarDepartamentos(1, 100);
    this.tiposNormaFacade.cargarTiposNorma(1, 100);
    this.estadosNormaFacade.cargarEstadosNorma(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    const defaultDep = this.departamentosFacade.departamentos()[0]?.id || null;
    const defaultTipo = this.tiposNormaFacade.tiposNorma()[0]?.id || null;
    const defaultEstado = this.estadosNormaFacade.estadosNorma()[0]?.id || null;
    const currentYear = new Date().getFullYear();

    this.normaForm.reset({
      departamentoId: defaultDep,
      tipoNormaId: defaultTipo,
      estadoNormaId: defaultEstado,
      numero: '',
      anio: currentYear,
      fechaExpedicion: new Date().toISOString().split('T')[0],
      descripcion: '',
      documentoNombreArchivo: 'norma.pdf',
      documentoRutaArchivo: '/documentos/norma.pdf',
      documentoTipoArchivo: 'application/pdf'
    });
    this.isSlideOverOpen = true;
  }

  edit(item: NormaListado) {
    this.selectedId = item.id;
    const fExp = item.fechaExpedicion ? item.fechaExpedicion.split('T')[0] : '';

    this.normaForm.patchValue({
      departamentoId: item.departamento?.id || null,
      tipoNormaId: item.tipoNorma?.id || null,
      estadoNormaId: item.estadoNorma?.id || null,
      numero: item.numero,
      anio: item.anio,
      fechaExpedicion: fExp,
      descripcion: '',
      documentoNombreArchivo: item.documentoNormativos?.[0]?.nombreArchivo || 'norma.pdf',
      documentoRutaArchivo: item.documentoNormativos?.[0]?.rutaArchivo || '/documentos/norma.pdf',
      documentoTipoArchivo: item.documentoNormativos?.[0]?.tipoArchivo || 'application/pdf'
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: NormaListado) {
    const estados = this.estadosNormaFacade.estadosNorma();
    const esActivo = item.estadoNorma?.activo || item.estadoNorma?.nombre?.toLowerCase().includes('activ');
    
    // Find counterpart state
    const nuevoEstado = estados.find(e => esActivo ? (!e.activo || e.nombre.toLowerCase().includes('inactiv') || e.nombre.toLowerCase().includes('derog')) : (e.activo || e.nombre.toLowerCase().includes('activ')));
    
    if (nuevoEstado) {
      this.facade.eliminar(item.id, nuevoEstado.id).subscribe({
        next: () => {
          this.toast.success(`Estado de la norma actualizado a ${nuevoEstado.nombre}`);
          this.facade.cargarNormas();
        },
        error: (err: any) => {
          this.toast.error(`Error al actualizar el estado de la norma`);
          console.error(err);
        }
      });
    } else {
      this.toast.info('No se encontró un estado alternativo disponible.');
    }
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveNorma() {
    if (this.normaForm.valid) {
      const val = this.normaForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          departamentoId: Number(val.departamentoId),
          tipoNormaId: Number(val.tipoNormaId),
          estadoNormaId: Number(val.estadoNormaId),
          numero: val.numero!,
          anio: Number(val.anio),
          fechaExpedicion: val.fechaExpedicion!,
          descripcion: val.descripcion || ''
        }).subscribe({
          next: () => {
            this.toast.success(`Norma ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarNormas();
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar la norma`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          departamentoId: Number(val.departamentoId),
          tipoNormaId: Number(val.tipoNormaId),
          estadoNormaId: Number(val.estadoNormaId),
          numero: val.numero!,
          anio: Number(val.anio),
          fechaExpedicion: val.fechaExpedicion!,
          descripcion: val.descripcion || '',
          documentoNombreArchivo: val.documentoNombreArchivo || 'norma.pdf',
          documentoRutaArchivo: val.documentoRutaArchivo || '/documentos/norma.pdf',
          documentoTipoArchivo: val.documentoTipoArchivo || 'application/pdf'
        }).subscribe({
          next: () => {
            this.toast.success(`Norma ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarNormas();
          },
          error: (err: any) => {
            this.toast.error(`Error al crear la norma`);
            console.error(err);
          }
        });
      }
    } else {
      this.normaForm.markAllAsTouched();
    }
  }
}
