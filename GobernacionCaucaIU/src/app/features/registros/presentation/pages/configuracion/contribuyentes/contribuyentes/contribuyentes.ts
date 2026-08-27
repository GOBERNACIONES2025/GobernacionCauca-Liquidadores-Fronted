import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { ContribuyentesFacade } from '../../../../../application/facades/Contribuyentes/contribuyentes.facade';
import { TiposPersonaFacade } from '../../../../../application/facades/Contribuyentes/tipos-persona.facade';
import { TiposIdentificacionFacade } from '../../../../../application/facades/Contribuyentes/tipos-identificacion.facade';
import { Contribuyente } from '../../../../../domain/models/Contribuyentes/contribuyente.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-contribuyentes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent],
  templateUrl: './contribuyentes.html',
  styleUrl: './contribuyentes.css'
})
export class Contribuyentes implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(ContribuyentesFacade);
  public tiposPersonaFacade = inject(TiposPersonaFacade);
  public tiposIdentificacionFacade = inject(TiposIdentificacionFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Contribuyentes', 'Directorio de Contribuyentes'];

  searchQuery = signal<string>('');
  private searchSubject = new Subject<string>();

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  
  selectedTipoPersonaFilter = signal<number | 'todos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  contribuyenteForm = this.fb.group({
    tipoPersonaId: [null as number | null, Validators.required],
    tipoIdentificacionId: [null as number | null, Validators.required],
    numeroIdentificacion: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', Validators.required],
    direccion: [''],
    telefono: [''],
    email: ['', [Validators.email]]
  });

  // Filtered list (client side for tipoPersona si no es backend filter, backend for search)
  contribuyentesFiltrados = computed(() => {
    const tipoPersonaFilter = this.selectedTipoPersonaFilter();
    let items = this.facade.contribuyentes();

    if (tipoPersonaFilter !== 'todos') {
      items = items.filter(c => c.tipoPersona?.id === tipoPersonaFilter);
    }
    return items;
  });

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.pageNumber.set(1);
      this.cargarDatos();
    });
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  cargarDatos() {
    this.facade.cargarContribuyentes(this.pageNumber(), this.pageSize(), this.searchQuery());
  }

  onPageChange(page: number) {
    this.pageNumber.set(page);
    this.cargarDatos();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  counts = computed(() => {
    const all = this.facade.contribuyentes();
    return {
      total: all.length
    };
  });

  ngOnInit() {
    this.cargarDatos();
    this.tiposPersonaFacade.cargarTiposPersona(1, 100);
    this.tiposIdentificacionFacade.cargarTiposIdentificacion(1, 100);
  }

  setTipoPersonaFilter(filter: number | 'todos') {
    this.selectedTipoPersonaFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    const defaultTipoPersona = this.tiposPersonaFacade.tiposPersona()[0]?.id || null;
    const defaultTipoId = this.tiposIdentificacionFacade.tiposIdentificacion()[0]?.id || null;

    this.contribuyenteForm.reset({
      tipoPersonaId: defaultTipoPersona,
      tipoIdentificacionId: defaultTipoId,
      numeroIdentificacion: '',
      nombre: '',
      direccion: '',
      telefono: '',
      email: ''
    });
    this.isSlideOverOpen = true;
  }

  edit(item: Contribuyente) {
    this.selectedId = item.id;
    this.contribuyenteForm.patchValue({
      tipoPersonaId: item.tipoPersona?.id ?? null,
      tipoIdentificacionId: item.tipoIdentificacion?.id ?? null,
      numeroIdentificacion: item.numeroIdentificacion,
      nombre: item.nombre,
      direccion: item.direccion || '',
      telefono: item.telefono || '',
      email: item.email || ''
    });
    this.isSlideOverOpen = true;
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveContribuyente() {
    if (this.contribuyenteForm.valid) {
      const val = this.contribuyenteForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          tipoPersonaId: Number(val.tipoPersonaId),
          tipoIdentificacionId: Number(val.tipoIdentificacionId),
          numeroIdentificacion: val.numeroIdentificacion!,
          nombre: val.nombre!,
          direccion: val.direccion || null,
          telefono: val.telefono || null,
          email: val.email || null
        }).subscribe({
          next: () => {
            this.toast.success(`Contribuyente ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarDatos();
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el contribuyente`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          tipoPersonaId: Number(val.tipoPersonaId),
          tipoIdentificacionId: Number(val.tipoIdentificacionId),
          numeroIdentificacion: val.numeroIdentificacion!,
          nombre: val.nombre!,
          direccion: val.direccion || null,
          telefono: val.telefono || null,
          email: val.email || null
        }).subscribe({
          next: () => {
            this.toast.success(`Contribuyente ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarDatos();
          },
          error: (err: any) => {
            this.toast.error(`Error al registrar el contribuyente`);
            console.error(err);
          }
        });
      }
    } else {
      this.contribuyenteForm.markAllAsTouched();
    }
  }
}
