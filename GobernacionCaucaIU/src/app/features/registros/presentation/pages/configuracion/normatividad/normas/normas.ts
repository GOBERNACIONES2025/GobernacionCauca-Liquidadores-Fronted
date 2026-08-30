import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { NormasFacade } from '../../../../../application/facades/Normatividad/normas.facade';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { TiposNormaFacade } from '../../../../../application/facades/Normatividad/tipos-norma.facade';
import { EstadosNormaFacade } from '../../../../../application/facades/Normatividad/estados-norma.facade';
import { NormaListado } from '../../../../../domain/models/Normatividad/norma.model';
import { NormasApiService } from '../../../../../infrastructure/api/Normatividad/normas-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { DepartamentosApiService } from '../../../../../infrastructure/api/Territorios/departamentos-api.service';
import { TiposNormaApiService } from '../../../../../infrastructure/api/Normatividad/tipos-norma-api.service';
import { EstadosNormaApiService } from '../../../../../infrastructure/api/Normatividad/estados-norma-api.service';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';
import { map } from 'rxjs/operators';
import { DocumentViewerComponent } from '../../../../../../../shared/components/document-viewer/document-viewer';
import { DocumentItem } from '../../../../../../../shared/components/document-viewer/document-viewer.model';

@Component({
  selector: 'app-normas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, DocumentViewerComponent, PaginationComponent, SearchableSelectComponent],
  templateUrl: './normas.html',
  styleUrl: './normas.css'
})
export class Normas implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(NormasFacade);
  public apiService = inject(NormasApiService);
  public departamentosFacade = inject(DepartamentosFacade);
  public tiposNormaFacade = inject(TiposNormaFacade);
  public estadosNormaFacade = inject(EstadosNormaFacade);
  
  private departamentosApi = inject(DepartamentosApiService);
  private tiposNormaApi = inject(TiposNormaApiService);
  private estadosNormaApi = inject(EstadosNormaApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Normatividad', 'Normas'];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.pageNumber.set(1);
      this.cargarItems();
    });
  }
  searchSubject = new Subject<string>();
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;
  selectedFile: File | null = null;
  
  isViewerOpen = false;
  currentDocs: DocumentItem[] = [];

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
    descripcion: ['']
  });

  searchDepartamentosFn = (term: string) => this.departamentosApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveDepartamentoFn = (id: number) => this.departamentosApi.obtenerPorId(id).pipe(map(res => res.data));

  searchTiposNormaFn = (term: string) => this.tiposNormaApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveTipoNormaFn = (id: number) => this.tiposNormaApi.obtenerPorId(id).pipe(map(res => res.data));

  searchEstadosNormaFn = (term: string) => this.estadosNormaApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveEstadoNormaFn = (id: number) => this.estadosNormaApi.obtenerPorId(id).pipe(map(res => res.data));

  // Filtered list
  normasFiltradas = computed(() => this.facade.normas());

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalNormas()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter && this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter && this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarNormas(undefined, this.pageNumber(), this.pageSize());;
  }

  onPageChange(page: number) {
    this.pageNumber.set(page);
    this.cargarItems();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.pageNumber.set(1);
    this.cargarItems();
  }

  onSearchChange(event: any) {
    const value = event.target.value;
    this.searchText.set(value);
    this.searchSubject.next(value);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
    this.pageNumber.set(1);
    this.cargarItems();
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
      descripcion: ''
    });
    this.selectedFile = null;
    this.isSlideOverOpen = true;
  }

  edit(item: NormaListado) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data: any = res?.data || item;
        this.selectedId = data.id;
        const fExp = data.fechaExpedicion ? data.fechaExpedicion.split('T')[0] : '';

        this.normaForm.patchValue({
          departamentoId: data.departamento?.id ?? data.departamentoId ?? null,
          tipoNormaId: data.tipoNorma?.id ?? data.tipoNormaId ?? null,
          estadoNormaId: data.estadoNorma?.id ?? data.estadoNormaId ?? null,
          numero: data.numero,
          anio: data.anio,
          fechaExpedicion: fExp,
          descripcion: data.descripcion || ''
        });
        this.selectedFile = null;
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error('Error al obtener la información de la norma');
        console.error(err);
      }
    });
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
          this.cargarItems();
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
    this.selectedFile = null;
  }

  openViewer(item: NormaListado) {
    if (!item.documentoNormativos || item.documentoNormativos.length === 0) {
      this.toast.info('Esta norma no tiene documentos adjuntos.');
      return;
    }
    this.currentDocs = item.documentoNormativos.map(d => ({
      id: d.id,
      nombreArchivo: d.nombreArchivo,
      rutaArchivo: d.rutaArchivo,
      tipoArchivo: d.tipoArchivo
    }));
    this.isViewerOpen = true;
  }

  closeViewer() {
    this.isViewerOpen = false;
    this.currentDocs = [];
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
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
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar la norma`);
            console.error(err);
          }
        });
      } else {
        if (!this.selectedFile) {
          this.toast.error('Debe adjuntar un documento normativo');
          return;
        }

        this.facade.crear(this.selectedFile, {
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
            this.cargarItems();
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
