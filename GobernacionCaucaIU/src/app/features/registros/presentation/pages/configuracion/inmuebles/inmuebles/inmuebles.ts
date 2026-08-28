import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { InmueblesFacade } from '../../../../../application/facades/Inmuebles/inmuebles.facade';
import { MunicipiosFacade } from '../../../../../application/facades/Territorios/municipios.facade';
import { VigenciasFacade } from '../../../../../application/facades/Normatividad/vigencias.facade';
import { Inmueble, AvaluoCatastralCommandDto } from '../../../../../domain/models/Inmuebles/inmueble.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-inmuebles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './inmuebles.html',
  styleUrl: './inmuebles.css'
})
export class InmueblesComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(InmueblesFacade);
  public municipiosFacade = inject(MunicipiosFacade);
  public vigenciasFacade = inject(VigenciasFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Inmuebles', 'Inmuebles y Avalúos'];

  searchQuery = signal<string>('');
  selectedMunicipioFilter = signal<number | 'todos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  inmuebleForm = this.fb.group({
    municipioId: [null as number | null, Validators.required],
    matriculaInmobiliaria: ['', [Validators.required, Validators.maxLength(50)]],
    direccion: [''],
    avaluos: this.fb.array([])
  });

  get avaluosFormArray(): FormArray {
    return this.inmuebleForm.get('avaluos') as FormArray;
  }

  // Filtered list
  inmueblesFiltrados = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const municipioFilter = this.selectedMunicipioFilter();
    let items = this.facade.inmuebles();

    if (municipioFilter !== 'todos') {
      items = items.filter(i => i.municipioId === municipioFilter);
    }

    if (query) {
      items = items.filter(i => 
        i.matriculaInmobiliaria.toLowerCase().includes(query) || 
        (i.municipioNombre && i.municipioNombre.toLowerCase().includes(query)) ||
        (i.direccion && i.direccion.toLowerCase().includes(query))
      );
    }

    return items;
  });

  counts = computed(() => {
    const all = this.facade.inmuebles();
    return {
      total: all.length
    };
  });

  ngOnInit() {
    this.facade.cargarInmuebles();
    this.municipiosFacade.cargarMunicipios(1, 100);
    this.vigenciasFacade.cargarVigencias(1, 100);
  }

  setMunicipioFilter(filter: number | 'todos') {
    this.selectedMunicipioFilter.set(filter);
  }

  createAvaluoGroup(avaluo?: AvaluoCatastralCommandDto) {
    const defaultVigencia = this.vigenciasFacade.vigencias()[0]?.id || null;
    return this.fb.group({
      id: [avaluo?.id ?? null],
      vigenciaId: [avaluo?.vigenciaId ?? defaultVigencia, Validators.required],
      valor: [avaluo?.valor ?? 0, [Validators.required, Validators.min(0)]],
      fuente: [avaluo?.fuente ?? '']
    });
  }

  addAvaluo() {
    this.avaluosFormArray.push(this.createAvaluoGroup());
  }

  removeAvaluo(index: number) {
    this.avaluosFormArray.removeAt(index);
  }

  getVigenciaAnio(vigenciaId: number): number | string {
    const v = this.vigenciasFacade.vigencias().find(x => x.id === vigenciaId);
    return v ? v.anio : vigenciaId;
  }

  openNew() {
    this.selectedId = null;
    const defaultMunicipio = this.municipiosFacade.municipios()[0]?.id || null;

    this.inmuebleForm.reset({
      municipioId: defaultMunicipio,
      matriculaInmobiliaria: '',
      direccion: ''
    });
    this.avaluosFormArray.clear();
    this.isSlideOverOpen = true;
  }

  edit(item: Inmueble) {
    this.selectedId = item.id;
    this.inmuebleForm.patchValue({
      municipioId: item.municipioId,
      matriculaInmobiliaria: item.matriculaInmobiliaria,
      direccion: item.direccion || ''
    });

    this.avaluosFormArray.clear();
    if (item.avaluos && item.avaluos.length > 0) {
      item.avaluos.forEach(a => {
        this.avaluosFormArray.push(this.createAvaluoGroup({
          id: a.id,
          vigenciaId: a.vigenciaId,
          valor: a.valor,
          fuente: a.fuente
        }));
      });
    }

    this.isSlideOverOpen = true;
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
    this.avaluosFormArray.clear();
  }

  saveInmueble() {
    if (this.inmuebleForm.valid) {
      const val = this.inmuebleForm.value;
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      const avaluosPayload: AvaluoCatastralCommandDto[] = this.avaluosFormArray.value.map((a: any) => ({
        id: a.id || null,
        vigenciaId: Number(a.vigenciaId),
        valor: Number(a.valor),
        fuente: a.fuente || null
      }));

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          municipioId: Number(val.municipioId),
          matriculaInmobiliaria: val.matriculaInmobiliaria!,
          direccion: val.direccion || null,
          avaluos: avaluosPayload
        }).subscribe({
          next: () => {
            this.toast.success(`Inmueble ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarInmuebles();
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar el inmueble`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          municipioId: Number(val.municipioId),
          matriculaInmobiliaria: val.matriculaInmobiliaria!,
          direccion: val.direccion || null,
          avaluos: avaluosPayload
        }).subscribe({
          next: () => {
            this.toast.success(`Inmueble ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarInmuebles();
          },
          error: (err: any) => {
            this.toast.error(`Error al registrar el inmueble`);
            console.error(err);
          }
        });
      }
    } else {
      this.inmuebleForm.markAllAsTouched();
    }
  }
}
