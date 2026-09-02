import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ValoresEstatalesFacade } from '../../../application/facades/valores-estatales.facade';
import {
  ValoresEstatalesTab,
  UvtHistoricoDto,
  TasasInteresDto,
  SalarioMinimoDto,
} from '../../../domain/interfaces/valores-estatales.interface';

@Component({
  selector: 'app-valores-estatales',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './valores-estatales.html',
})
export class ValoresEstatalesPage implements OnInit {
  public facade = inject(ValoresEstatalesFacade);
  private fb = inject(FormBuilder);

  // Formularios Reactivos para cada entidad
  uvtForm!: FormGroup;
  tasaForm!: FormGroup;
  salarioForm!: FormGroup;

  // Estado de modales
  readonly modalMode = signal<'CREATE' | 'EDIT' | null>(null);
  readonly itemParaEliminar = signal<{ tipo: 'UVT' | 'TASA' | 'SALARIO'; id: number; titulo: string } | null>(null);

  ngOnInit(): void {
    this.initForms();
  }

  private initForms(): void {
    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString().split('T')[0];

    // Formulario UVT
    this.uvtForm = this.fb.group({
      id: [0],
      anio: [currentYear, [Validators.required, Validators.min(1990), Validators.max(2100)]],
      valor: [null, [Validators.required, Validators.min(1)]],
      fuenteLegal: [''],
    });

    // Formulario Tasas de Interés
    this.tasaForm = this.fb.group({
      id: [0],
      tipoTasaInteres: ['Mora Tributaria', [Validators.required]],
      periodicidad: ['Efectiva Anual', [Validators.required]],
      valor: [null, [Validators.required, Validators.min(0)]],
      vigenciaDesde: [today, [Validators.required]],
      vigenciaHasta: [''],
      fuenteLegal: [''],
    });

    // Formulario Salario Mínimo
    this.salarioForm = this.fb.group({
      id: [0],
      anio: [currentYear, [Validators.required, Validators.min(1990), Validators.max(2100)]],
      valor: [null, [Validators.required, Validators.min(1)]],
      auxilioTransporte: [null, [Validators.required, Validators.min(0)]],
    });
  }

  // =========================================================================
  // CONTROL DE MODALES (CREAR / EDITAR)
  // =========================================================================
  abrirCrearModal(): void {
    const tab = this.facade.tabActiva();
    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString().split('T')[0];

    if (tab === 'UVT') {
      this.uvtForm.reset({ id: 0, anio: currentYear, valor: null, fuenteLegal: '' });
    } else if (tab === 'TASAS') {
      this.tasaForm.reset({
        id: 0,
        tipoTasaInteres: 'Mora Tributaria',
        periodicidad: 'Efectiva Anual',
        valor: null,
        vigenciaDesde: today,
        vigenciaHasta: '',
        fuenteLegal: '',
      });
    } else if (tab === 'SALARIOS') {
      this.salarioForm.reset({ id: 0, anio: currentYear, valor: null, auxilioTransporte: null });
    }

    this.modalMode.set('CREATE');
  }

  abrirEditarUvt(item: UvtHistoricoDto): void {
    this.uvtForm.patchValue({
      id: item.idUvt,
      anio: item.anio,
      valor: item.valor,
      fuenteLegal: item.fuenteLegal || '',
    });
    this.facade.tabActiva.set('UVT');
    this.modalMode.set('EDIT');
  }

  abrirEditarTasa(item: TasasInteresDto): void {
    this.tasaForm.patchValue({
      id: item.idTasaInteres,
      tipoTasaInteres: item.tipoTasaInteres,
      periodicidad: item.periodicidad,
      valor: item.valor,
      vigenciaDesde: item.vigenciaDesde,
      vigenciaHasta: item.vigenciaHasta || '',
      fuenteLegal: item.fuenteLegal || '',
    });
    this.facade.tabActiva.set('TASAS');
    this.modalMode.set('EDIT');
  }

  abrirEditarSalario(item: SalarioMinimoDto): void {
    this.salarioForm.patchValue({
      id: item.idSalario,
      anio: item.anio,
      valor: item.valor,
      auxilioTransporte: item.auxilioTransporte,
    });
    this.facade.tabActiva.set('SALARIOS');
    this.modalMode.set('EDIT');
  }

  cerrarModal(): void {
    this.modalMode.set(null);
  }

  // =========================================================================
  // GUARDAR REGISTROS (SUBMIT REACCIONANDO SEGÚN LA TAB ACTIVA)
  // =========================================================================
  guardarRegistro(): void {
    const tab = this.facade.tabActiva();

    if (tab === 'UVT') {
      if (this.uvtForm.invalid) {
        this.uvtForm.markAllAsTouched();
        return;
      }
      const val = this.uvtForm.value;
      if (val.id && val.id > 0) {
        this.facade.actualizarUvt(val.id, { idUvt: val.id, anio: Number(val.anio), valor: Number(val.valor), fuenteLegal: val.fuenteLegal }).subscribe((ok) => {
          if (ok) this.cerrarModal();
        });
      } else {
        this.facade.crearUvt({ anio: Number(val.anio), valor: Number(val.valor), fuenteLegal: val.fuenteLegal }).subscribe((ok) => {
          if (ok) this.cerrarModal();
        });
      }
    } else if (tab === 'TASAS') {
      if (this.tasaForm.invalid) {
        this.tasaForm.markAllAsTouched();
        return;
      }
      const val = this.tasaForm.value;
      if (val.id && val.id > 0) {
        this.facade.actualizarTasa(val.id, { idTasaInteres: val.id, tipoTasaInteres: val.tipoTasaInteres, periodicidad: val.periodicidad, valor: Number(val.valor), vigenciaDesde: val.vigenciaDesde, vigenciaHasta: val.vigenciaHasta || undefined, fuenteLegal: val.fuenteLegal }).subscribe((ok) => {
          if (ok) this.cerrarModal();
        });
      } else {
        this.facade.crearTasa({ tipoTasaInteres: val.tipoTasaInteres, periodicidad: val.periodicidad, valor: Number(val.valor), vigenciaDesde: val.vigenciaDesde, vigenciaHasta: val.vigenciaHasta || undefined, fuenteLegal: val.fuenteLegal }).subscribe((ok) => {
          if (ok) this.cerrarModal();
        });
      }
    } else if (tab === 'SALARIOS') {
      if (this.salarioForm.invalid) {
        this.salarioForm.markAllAsTouched();
        return;
      }
      const val = this.salarioForm.value;
      if (val.id && val.id > 0) {
        this.facade.actualizarSalario(val.id, { idSalario: val.id, anio: Number(val.anio), valor: Number(val.valor), auxilioTransporte: Number(val.auxilioTransporte) }).subscribe((ok) => {
          if (ok) this.cerrarModal();
        });
      } else {
        this.facade.crearSalario({ anio: Number(val.anio), valor: Number(val.valor), auxilioTransporte: Number(val.auxilioTransporte) }).subscribe((ok) => {
          if (ok) this.cerrarModal();
        });
      }
    }
  }

  // =========================================================================
  // ELIMINACIÓN
  // =========================================================================
  abrirEliminar(tipo: 'UVT' | 'TASA' | 'SALARIO', id: number, titulo: string): void {
    this.itemParaEliminar.set({ tipo, id, titulo });
  }

  cerrarEliminar(): void {
    this.itemParaEliminar.set(null);
  }

  confirmarEliminacion(): void {
    const item = this.itemParaEliminar();
    if (!item) return;

    if (item.tipo === 'UVT') {
      this.facade.eliminarUvt(item.id).subscribe(() => this.cerrarEliminar());
    } else if (item.tipo === 'TASA') {
      this.facade.eliminarTasa(item.id).subscribe(() => this.cerrarEliminar());
    } else if (item.tipo === 'SALARIO') {
      this.facade.eliminarSalario(item.id).subscribe(() => this.cerrarEliminar());
    }
  }
}
