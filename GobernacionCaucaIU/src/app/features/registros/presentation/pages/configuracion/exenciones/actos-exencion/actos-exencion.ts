import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { ActosExencionFacade } from '../../../../../application/facades/Exenciones/actos-exencion.facade';
import { ExencionesFacade } from '../../../../../application/facades/Exenciones/exenciones.facade';
import { TiposActoRegistroFacade } from '../../../../../application/facades/Registro/tipos-acto-registro.facade';
import { ActoExencion } from '../../../../../domain/models/Exenciones/acto-exencion.model';
import { ActosExencionApiService } from '../../../../../infrastructure/api/Exenciones/actos-exencion-api.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { ExencionesApiService } from '../../../../../infrastructure/api/Exenciones/exenciones-api.service';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-actos-exencion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent, PaginationComponent, SearchableSelectComponent],
  templateUrl: './actos-exencion.html',
  styleUrl: './actos-exencion.css'
})
export class ActosExencionComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(ActosExencionFacade);
  public apiService = inject(ActosExencionApiService);
  public exencionesFacade = inject(ExencionesFacade);
  public tiposActoFacade = inject(TiposActoRegistroFacade);
  
  private exencionesApi = inject(ExencionesApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Exenciones', 'Actos con Exención'];

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
  selectedExencionFilter = signal<number | 'todas'>('todas');

  isSlideOverOpen = false;
  selectedExencionId: number | null = null;
  selectedTiposActoIds = signal<number[]>([]);

  vinculacionForm = this.fb.group({
    exencionId: [null as number | null, Validators.required]
  });

  searchExencionesFn = (term: string) => this.exencionesApi.obtenerTodos(1, 50, term).pipe(map(res => res.data.items));
  resolveExencionFn = (id: number) => this.exencionesApi.obtenerPorId(id).pipe(map(res => res.data));

  // Filtered list
  actosExencionFiltrados = computed(() => this.facade.actosExencion());

  counts = computed(() => {
    return {
      total: this.facade.totalActosExencion()
    };
  });

  ngOnInit() {
    this.cargarItems();
  }

  cargarItems() {
    let activo: boolean | undefined = undefined;
    
    
    this.facade.cargarActosExencion(this.selectedExencionId || 0, this.pageNumber(), this.pageSize());
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

  setExencionFilter(filter: number | 'todas') {
    this.selectedExencionFilter.set(filter);
  }

  openNew() {
    this.selectedExencionId = null;
    const defaultExencion = this.exencionesFacade.exenciones()[0]?.id || null;
    this.vinculacionForm.reset({ exencionId: defaultExencion });
    this.selectedTiposActoIds.set([]);
    this.isSlideOverOpen = true;
  }

  edit(item: ActoExencion) {
    const exencionId = item.exencion?.id;
    if (!exencionId) return;
    this.loadingEditId.set(item.id);
    this.apiService.obtenerTodos({ exencionId, pageSize: 1000 }).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        this.selectedExencionId = exencionId;
        this.vinculacionForm.patchValue({
          exencionId: this.selectedExencionId
        });
        const items = res?.data?.items || [];
        const linkedActoIds = items.map((a: any) => a.tipoActoRegistro?.id || a.tipoActoRegistroId);
        this.selectedTiposActoIds.set(linkedActoIds);
        this.isSlideOverOpen = true;
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error('Error al obtener las vinculaciones del acto');
        console.error(err);
      }
    });
  }

  toggleActoSelection(actoId: number) {
    const current = this.selectedTiposActoIds();
    if (current.includes(actoId)) {
      this.selectedTiposActoIds.set(current.filter(id => id !== actoId));
    } else {
      this.selectedTiposActoIds.set([...current, actoId]);
    }
  }

  selectAllActos() {
    const allIds = this.tiposActoFacade.tiposActoRegistro().map(a => a.id);
    this.selectedTiposActoIds.set(allIds);
  }

  deselectAllActos() {
    this.selectedTiposActoIds.set([]);
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedExencionId = null;
    this.selectedTiposActoIds.set([]);
  }

  saveVinculacion() {
    if (this.vinculacionForm.valid) {
      const exencionId = Number(this.vinculacionForm.value.exencionId);
      const tiposActoIds = this.selectedTiposActoIds();

      if (tiposActoIds.length === 0) {
        this.toast.warning('Por favor selecciona al menos un tipo de acto registral');
        return;
      }

      this.facade.vincularTiposActo({
        exencionId: exencionId,
        tiposActoRegistroIds: tiposActoIds
      }).subscribe({
        next: () => {
          this.toast.success('Actos registrales vinculados exitosamente a la exención');
          this.closeSlideOver();
          this.cargarItems();
        },
        error: (err: any) => {
          this.toast.error('Error al vincular los tipos de acto');
          console.error(err);
        }
      });
    } else {
      this.vinculacionForm.markAllAsTouched();
    }
  }
}
