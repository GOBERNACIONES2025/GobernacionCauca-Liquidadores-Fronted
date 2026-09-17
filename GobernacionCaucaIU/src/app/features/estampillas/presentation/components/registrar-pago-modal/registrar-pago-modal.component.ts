import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstampillasStorageService } from '../../../infrastructure/storage/storage.service';
import { LiquidacionEstampilla, MedioPago, RegistroPagoRequest } from '../../../domain/models/estampillas.models';

@Component({
  selector: 'app-registrar-pago-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden transform transition-all animate-fadeIn">
          
          <!-- Header -->
          <div class="bg-gradient-to-r from-[#1b53ad] to-blue-800 text-white px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-white/10 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6H2.25m0 0H3m1.5 0h16.5m0 0h.75m-.75 0v11.25c0 .621-.504 1.125-1.125 1.125H5.625c-.621 0-1.125-.504-1.125-1.125V6m18 0a2.25 2.25 0 0 0-2.25-2.25H4.875A2.25 2.25 0 0 0 2.625 6m18 0H2.25" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-bold leading-tight">Registrar Pago de Estampillas</h3>
                <p class="text-xs text-blue-200 mt-0.5">Liquidación: <span class="font-mono font-bold text-white">{{ liquidacion()?.numeroLiquidacion }}</span></p>
              </div>
            </div>
            <button 
              type="button" 
              (click)="onClose()"
              class="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Resumen Liquidación -->
          @if (liquidacion(); as liq) {
            <div class="bg-slate-50 border-b border-slate-200 px-6 py-3 text-xs grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <span class="text-slate-400 block font-medium">Contribuyente:</span>
                <span class="font-semibold text-slate-800">{{ liq.contribuyenteNombre }}</span>
              </div>
              <div>
                <span class="text-slate-400 block font-medium">Documento / NIT:</span>
                <span class="font-mono font-semibold text-slate-800">{{ liq.contribuyenteDocumento }}</span>
              </div>
              <div>
                <span class="text-slate-400 block font-medium">Contrato / Acto:</span>
                <span class="font-semibold text-slate-800">{{ liq.numeroContrato }}</span>
              </div>
              <div>
                <span class="text-slate-400 block font-medium">Total Liquidado a Pagar:</span>
                <span class="text-sm font-extrabold text-emerald-700">{{ storage.formatCOP(liq.totalPagar) }}</span>
              </div>
            </div>
          }

          <!-- Formulario -->
          <form [formGroup]="pagoForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Valor Pagado -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Valor a Pagar (COP) <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    formControlName="valorPagado"
                    class="w-full pl-8 pr-3 py-2 border rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    [ngClass]="pagoForm.get('valorPagado')?.invalid && pagoForm.get('valorPagado')?.touched ? 'border-rose-400 bg-rose-50' : 'border-slate-300'"
                  />
                </div>
              </div>

              <!-- Fecha de Pago -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Fecha de Pago <span class="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  formControlName="fechaPago"
                  class="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  [ngClass]="pagoForm.get('fechaPago')?.invalid && pagoForm.get('fechaPago')?.touched ? 'border-rose-400 bg-rose-50' : 'border-slate-300'"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Medio de Pago -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Medio de Pago <span class="text-rose-500">*</span>
                </label>
                <select
                  formControlName="medioPago"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="PSE">PSE - Pagos Seguros en Línea</option>
                  <option value="BANCO_AGRARIO">Ventanilla Banco Agrario</option>
                  <option value="BANCOLOMBIA">Bancolombia S.A.</option>
                  <option value="BANCO_OCCIDENTE">Banco de Occidente</option>
                  <option value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</option>
                  <option value="VENTANILLA_TESORERIA">Caja / Ventanilla Tesorería</option>
                  <option value="CHEQUE_GERENCIA">Cheque de Gerencia</option>
                  <option value="OTRO">Otro Medio</option>
                </select>
              </div>

              <!-- N° Referencia / CUS -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  N° Referencia / CUS / Aprobación <span class="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  formControlName="numeroReferencia"
                  placeholder="Ej: CUS-8891024 ó REC-1923"
                  class="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  [ngClass]="pagoForm.get('numeroReferencia')?.invalid && pagoForm.get('numeroReferencia')?.touched ? 'border-rose-400 bg-rose-50' : 'border-slate-300'"
                />
              </div>
            </div>

            <!-- Entidad Financiera -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Entidad Financiera Recaudadora <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                formControlName="entidadFinanciera"
                placeholder="Ej: Banco Agrario de Colombia - Sucursal Popayán"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <!-- Observaciones -->
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">
                Observaciones / Notas de Recaudo (Opcional)
              </label>
              <textarea
                formControlName="observaciones"
                rows="2"
                placeholder="Información adicional del comprobante o soporte..."
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              ></textarea>
            </div>

            <!-- Footer Acciones -->
            <div class="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                (click)="onClose()"
                class="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="pagoForm.invalid || isSubmitting()"
                class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                @if (isSubmitting()) {
                  <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Procesando...</span>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span>Confirmar y Aplicar Pago</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class RegistrarPagoModalComponent {
  readonly storage = inject(EstampillasStorageService);
  private fb = inject(FormBuilder);

  readonly isOpen = input<boolean>(false);
  readonly liquidacion = input<LiquidacionEstampilla | null>(null);

  readonly close = output<void>();
  readonly pagoRegistrado = output<RegistroPagoRequest>();

  readonly isSubmitting = signal<boolean>(false);

  pagoForm: FormGroup = this.fb.group({
    valorPagado: [0, [Validators.required, Validators.min(1)]],
    fechaPago: [new Date().toISOString().substring(0, 10), [Validators.required]],
    medioPago: ['PSE' as MedioPago, [Validators.required]],
    numeroReferencia: ['', [Validators.required]],
    entidadFinanciera: ['Banco Agrario de Colombia', [Validators.required]],
    observaciones: ['']
  });

  ngOnChanges(): void {
    const liq = this.liquidacion();
    if (liq) {
      this.pagoForm.patchValue({
        valorPagado: liq.totalPagar,
        fechaPago: new Date().toISOString().substring(0, 10),
        numeroReferencia: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        entidadFinanciera: 'Banco Agrario de Colombia'
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.pagoForm.invalid || !this.liquidacion()) {
      this.pagoForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const val = this.pagoForm.value;
    const req: RegistroPagoRequest = {
      liquidacionId: this.liquidacion()!.id,
      valorPagado: Number(val.valorPagado),
      fechaPago: val.fechaPago,
      medioPago: val.medioPago,
      numeroReferencia: val.numeroReferencia,
      entidadFinanciera: val.entidadFinanciera,
      observaciones: val.observaciones
    };

    setTimeout(() => {
      this.isSubmitting.set(false);
      this.pagoRegistrado.emit(req);
    }, 400);
  }
}
