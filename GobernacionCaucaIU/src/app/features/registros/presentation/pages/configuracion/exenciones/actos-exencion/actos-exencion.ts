import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { ActosExencionFacade } from '../../../../../application/facades/Exenciones/actos-exencion.facade';
import { ExencionesFacade } from '../../../../../application/facades/Exenciones/exenciones.facade';
import { TiposActoRegistroFacade } from '../../../../../application/facades/Registro/tipos-acto-registro.facade';
import { ActoExencion } from '../../../../../domain/models/Exenciones/acto-exencion.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-actos-exencion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './actos-exencion.html',
  styleUrl: './actos-exencion.css'
})
export class ActosExencionComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(ActosExencionFacade);
  public exencionesFacade = inject(ExencionesFacade);
  public tiposActoFacade = inject(TiposActoRegistroFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Exenciones', 'Actos con Exención'];

  searchQuery = signal<string>('');
  selectedExencionFilter = signal<number | 'todas'>('todas');

  isSlideOverOpen = false;
  selectedExencionId: number | null = null;
  selectedTiposActoIds = signal<number[]>([]);

  vinculacionForm = this.fb.group({
    exencionId: [null as number | null, Validators.required]
  });

  // Filtered list
  actosExencionFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const exencionFilter = this.selectedExencionFilter();
    let items = this.facade.actosExencion();

    if (exencionFilter !== 'todas') {
      items = items.filter(a => a.exencion?.id === exencionFilter);
    }

    if (query) {
      items = items.filter(a => 
        a.exencion?.nombre?.toLowerCase().includes(query) || 
        a.exencion?.codigo?.toLowerCase().includes(query) ||
        a.tipoActoRegistro?.nombre?.toLowerCase().includes(query) ||
        a.tipoActoRegistro?.codigo?.toLowerCase().includes(query)
      );
    }

    return items;
  });

  counts = computed(() => {
    const all = this.facade.actosExencion();
    return {
      total: all.length
    };
  });

  ngOnInit() {
    this.facade.cargarActosExencion(1, 100);
    this.exencionesFacade.cargarExenciones(1, 100);
    this.tiposActoFacade.cargarTiposActoRegistro(1, 100);
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
    this.selectedExencionId = item.exencion?.id ?? null;
    this.vinculacionForm.patchValue({
      exencionId: this.selectedExencionId
    });

    // Find all actos currently linked to this exencion
    const linkedActoIds = this.facade.actosExencion()
      .filter(a => a.exencion?.id === this.selectedExencionId)
      .map(a => a.tipoActoRegistro.id);

    this.selectedTiposActoIds.set(linkedActoIds);
    this.isSlideOverOpen = true;
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
          this.facade.cargarActosExencion(1, 100);
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
