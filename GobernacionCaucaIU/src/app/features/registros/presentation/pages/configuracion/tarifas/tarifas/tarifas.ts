import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { TarifasFacade } from '../../../../../application/facades/Tarifas/tarifas.facade';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { TiposActoRegistroFacade } from '../../../../../application/facades/Registro/tipos-acto-registro.facade';
import { VigenciasFacade } from '../../../../../application/facades/Normatividad/vigencias.facade';
import { NormasFacade } from '../../../../../application/facades/Normatividad/normas.facade';
import { TiposCalculoTarifaFacade } from '../../../../../application/facades/Tarifas/tipos-calculo-tarifa.facade';
import { Tarifa } from '../../../../../domain/models/Tarifas/tarifa.model';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PageHeaderComponent, SlideOverComponent],
  templateUrl: './tarifas.html',
  styleUrl: './tarifas.css'
})
export class Tarifas implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(TarifasFacade);
  public departamentosFacade = inject(DepartamentosFacade);
  public tiposActoFacade = inject(TiposActoRegistroFacade);
  public vigenciasFacade = inject(VigenciasFacade);
  public normasFacade = inject(NormasFacade);
  public tiposCalculoFacade = inject(TiposCalculoTarifaFacade);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Tarifas', 'Tarifa'];

  searchQuery = signal<string>('');
  selectedFilter = signal<'todos' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  tarifaForm = this.fb.group({
    departamentoId: [null as number | null, Validators.required],
    tipoActoRegistroId: [null as number | null, Validators.required],
    vigenciaId: [null as number | null, Validators.required],
    normaId: [null as number | null, Validators.required],
    tipoCalculoTarifaId: [null as number | null, Validators.required],
    porcentaje: [null as number | null],
    valorFijo: [null as number | null],
    baseMinima: [null as number | null],
    baseMaxima: [null as number | null],
    valorMinimo: [null as number | null],
    valorMaximo: [null as number | null],
    activo: [true]
  });

  // Filtered list for table
  tarifasFiltradas = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.selectedFilter();
    let items = this.facade.tarifas();

    if (filter === 'activos') {
      items = items.filter(t => t.activo);
    } else if (filter === 'inactivos') {
      items = items.filter(t => !t.activo);
    }

    if (query) {
      items = items.filter(t => 
        (t.tipoActoRegistro?.nombre && t.tipoActoRegistro.nombre.toLowerCase().includes(query)) ||
        (t.departamento?.nombre && t.departamento.nombre.toLowerCase().includes(query)) ||
        (t.norma?.numero && t.norma.numero.toLowerCase().includes(query)) ||
        (t.tipoCalculoTarifa?.nombre && t.tipoCalculoTarifa.nombre.toLowerCase().includes(query)) ||
        (t.vigencia?.anio && t.vigencia.anio.toString().includes(query))
      );
    }

    return items;
  });

  // Dynamic counts
  counts = computed(() => {
    const all = this.facade.tarifas();
    return {
      total: all.length,
      active: all.filter(t => t.activo).length,
      inactive: all.filter(t => !t.activo).length
    };
  });

  ngOnInit() {
    this.facade.cargarTarifas();
    this.departamentosFacade.cargarDepartamentos(1, 100);
    this.tiposActoFacade.cargarTiposActoRegistro(1, 100);
    this.vigenciasFacade.cargarVigencias(1, 100);
    this.normasFacade.cargarNormas();
    this.tiposCalculoFacade.cargarTiposCalculoTarifa(1, 100);
  }

  setFilter(filter: 'todos' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
  }

  openNew() {
    this.selectedId = null;
    const primerDep = this.departamentosFacade.departamentos()[0]?.id || null;
    const primerActo = this.tiposActoFacade.tiposActoRegistro()[0]?.id || null;
    const primerVig = this.vigenciasFacade.vigencias()[0]?.id || null;
    const primeraNorma = this.normasFacade.normas()[0]?.id || null;
    const primerCalculo = this.tiposCalculoFacade.tiposCalculoTarifa()[0]?.id || null;

    this.tarifaForm.reset({
      departamentoId: primerDep,
      tipoActoRegistroId: primerActo,
      vigenciaId: primerVig,
      normaId: primeraNorma,
      tipoCalculoTarifaId: primerCalculo,
      porcentaje: 1.0,
      valorFijo: null,
      baseMinima: null,
      baseMaxima: null,
      valorMinimo: null,
      valorMaximo: null,
      activo: true
    });
    this.isSlideOverOpen = true;
  }

  edit(item: Tarifa) {
    this.selectedId = item.id;
    this.tarifaForm.patchValue({
      departamentoId: item.departamento?.id || null,
      tipoActoRegistroId: item.tipoActoRegistro?.id || null,
      vigenciaId: item.vigencia?.id || null,
      normaId: item.norma?.id || null,
      tipoCalculoTarifaId: item.tipoCalculoTarifa?.id || null,
      porcentaje: item.porcentaje,
      valorFijo: item.valorFijo,
      baseMinima: item.baseMinima,
      baseMaxima: item.baseMaxima,
      valorMinimo: item.valorMinimo,
      valorMaximo: item.valorMaximo,
      activo: item.activo
    });
    this.isSlideOverOpen = true;
  }

  toggleActivo(item: Tarifa) {
    const nuevoEstado = !item.activo;
    const actionName = nuevoEstado ? 'activada' : 'desactivada';

    this.facade.actualizar(item.id, {
      id: item.id,
      departamentoId: item.departamento?.id || 1,
      tipoActoRegistroId: item.tipoActoRegistro?.id || 1,
      vigenciaId: item.vigencia?.id || 1,
      normaId: item.norma?.id || 1,
      tipoCalculoTarifaId: item.tipoCalculoTarifa?.id || 1,
      porcentaje: item.porcentaje,
      valorFijo: item.valorFijo,
      baseMinima: item.baseMinima,
      baseMaxima: item.baseMaxima,
      valorMinimo: item.valorMinimo,
      valorMaximo: item.valorMaximo,
      activo: nuevoEstado
    }).subscribe({
      next: () => {
        this.toast.success(`Tarifa ${actionName} exitosamente`);
        this.facade.cargarTarifas();
      },
      error: (err: any) => {
        this.toast.error(`Error al actualizar la tarifa`);
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
  }

  saveTarifa() {
    if (this.tarifaForm.valid) {
      const val = this.tarifaForm.value;
      const actionName = this.isEditMode ? 'actualizada' : 'creada';

      const payload = {
        departamentoId: Number(val.departamentoId),
        tipoActoRegistroId: Number(val.tipoActoRegistroId),
        vigenciaId: Number(val.vigenciaId),
        normaId: Number(val.normaId),
        tipoCalculoTarifaId: Number(val.tipoCalculoTarifaId),
        porcentaje: val.porcentaje ? Number(val.porcentaje) : null,
        valorFijo: val.valorFijo ? Number(val.valorFijo) : null,
        baseMinima: val.baseMinima ? Number(val.baseMinima) : null,
        baseMaxima: val.baseMaxima ? Number(val.baseMaxima) : null,
        valorMinimo: val.valorMinimo ? Number(val.valorMinimo) : null,
        valorMaximo: val.valorMaximo ? Number(val.valorMaximo) : null
      };

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          ...payload,
          activo: val.activo ?? true
        }).subscribe({
          next: () => {
            this.toast.success(`Tarifa ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarTarifas();
          },
          error: (err: any) => {
            this.toast.error(`Error al actualizar la tarifa`);
            console.error(err);
          }
        });
      } else {
        this.facade.crear(payload).subscribe({
          next: () => {
            this.toast.success(`Tarifa ${actionName} exitosamente`);
            this.closeSlideOver();
            this.facade.cargarTarifas();
          },
          error: (err: any) => {
            this.toast.error(`Error al crear la tarifa`);
            console.error(err);
          }
        });
      }
    } else {
      this.tarifaForm.markAllAsTouched();
    }
  }
}
