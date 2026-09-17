import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstampillasStorageService } from '../../../infrastructure/storage/storage.service';
import { LiquidacionEstampilla } from '../../../domain/models/estampillas.models';

@Component({
  selector: 'app-documento-imprimible',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (liquidacion(); as liq) {
      <div id="seccion-imprimible-oficial" class="bg-white text-slate-900 font-sans p-6 sm:p-10 max-w-4xl mx-auto border border-slate-300 rounded-xl shadow-lg print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        
        <!-- ENCABEZADO INSTITUCIONAL -->
        <header class="border-b-2 border-slate-800 pb-4 mb-6">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="h-16 w-16 bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-center p-1 shrink-0">
                <img src="/Logo_gov_cauca.png" alt="Escudo Gobernación del Cauca" class="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <h1 class="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900">República de Colombia</h1>
                <h2 class="text-base sm:text-lg font-black uppercase text-[#1b53ad]">Gobernación del Departamento del Cauca</h2>
                <p class="text-xs font-semibold text-slate-600">Secretaría de Hacienda Departamental — Dirección de Rentas y Fiscalización</p>
                <p class="text-[11px] text-slate-500 italic">NIT: 891.500.286-9 — Calle 4 Carrera 7 Esquina, Popayán, Cauca</p>
              </div>
            </div>

            <!-- CUADRO NÚMERO Y ESTADO -->
            <div class="text-right border-2 border-[#1b53ad] bg-blue-50/50 rounded-lg p-3 min-w-[180px]">
              <span class="block text-[10px] font-extrabold text-[#1b53ad] uppercase tracking-widest">Liquidación Oficial</span>
              <span class="block text-sm sm:text-base font-black font-mono text-slate-900">{{ liq.numeroLiquidacion }}</span>
              <span class="block text-xs font-bold text-slate-700 mt-0.5">Vigencia Fiscal {{ liq.vigencia }}</span>
              <div class="mt-1 pt-1 border-t border-blue-200">
                <span class="inline-block px-2 py-0.5 text-[10px] font-black rounded-full uppercase"
                  [ngClass]="{
                    'bg-emerald-100 text-emerald-800 border border-emerald-300': liq.estado === 'PAGADA',
                    'bg-amber-100 text-amber-800 border border-amber-300': liq.estado === 'PENDIENTE_PAGO',
                    'bg-rose-100 text-rose-800 border border-rose-300': liq.estado === 'ANULADA',
                    'bg-slate-100 text-slate-800': liq.estado === 'BORRADOR' || liq.estado === 'GENERADA'
                  }">
                  {{ liq.estado }}
                </span>
              </div>
            </div>
          </div>

          <div class="mt-3 bg-slate-900 text-white text-center py-1 text-xs font-extrabold uppercase tracking-wider rounded-sm">
            Comprobante de Liquidación del Impuesto de Estampillas Departamentales
          </div>
        </header>

        <!-- SECCIÓN 1: DATOS DEL CONTRIBUYENTE Y SUJETO PASIVO -->
        <section class="mb-5">
          <div class="bg-slate-100 border-l-4 border-[#1b53ad] px-3 py-1 mb-2">
            <h3 class="text-xs font-black uppercase tracking-wide text-slate-800">1. Identificación del Sujeto Pasivo / Contribuyente</h3>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-slate-200 p-3 rounded-md bg-white">
            <div class="col-span-2">
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Nombre / Razón Social:</span>
              <span class="font-bold text-slate-900">{{ liq.contribuyenteNombre }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Identificación / NIT:</span>
              <span class="font-mono font-bold text-slate-900">{{ liq.contribuyenteTipoDoc }} {{ liq.contribuyenteDocumento }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Municipio / Depto:</span>
              <span class="font-semibold text-slate-800">{{ liq.contribuyenteMunicipio }} (Cauca)</span>
            </div>
            <div class="col-span-2">
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Dirección de Notificación:</span>
              <span class="text-slate-800">{{ liq.contribuyenteDireccion }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Teléfono de Contacto:</span>
              <span class="text-slate-800">{{ liq.contribuyenteTelefono }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Correo Electrónico:</span>
              <span class="text-slate-800 truncate block">{{ liq.contribuyenteEmail }}</span>
            </div>
          </div>
        </section>

        <!-- SECCIÓN 2: DATOS DEL ACTO / CONTRATO / HECHO GENERADOR -->
        <section class="mb-5">
          <div class="bg-slate-100 border-l-4 border-emerald-600 px-3 py-1 mb-2">
            <h3 class="text-xs font-black uppercase tracking-wide text-slate-800">2. Hecho Generador — Información del Contrato / Acto</h3>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-slate-200 p-3 rounded-md bg-white">
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Número de Contrato:</span>
              <span class="font-mono font-extrabold text-blue-900">{{ liq.numeroContrato }}</span>
            </div>
            <div class="col-span-2">
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Entidad Contratante:</span>
              <span class="font-semibold text-slate-800">{{ liq.entidadContratante }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Valor del Contrato:</span>
              <span class="font-extrabold text-slate-900">{{ storage.formatCOP(liq.valorContrato) }}</span>
            </div>
            <div class="col-span-3">
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Objeto Contractual:</span>
              <span class="text-slate-800 text-[11px] leading-snug">{{ liq.objetoContrato }}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Municipio Ejecución:</span>
              <span class="font-semibold text-slate-800">{{ liq.municipioEjecucion }}</span>
            </div>
          </div>
        </section>

        <!-- SECCIÓN 3: DESGLOSE TRIBUTARIO POR ESTAMPILLA -->
        <section class="mb-5">
          <div class="bg-slate-100 border-l-4 border-indigo-600 px-3 py-1 mb-2 flex items-center justify-between">
            <h3 class="text-xs font-black uppercase tracking-wide text-slate-800">3. Liquidación Detallada de Estampillas Departamentales</h3>
            <span class="text-[10px] font-bold text-slate-500 uppercase">Ordenanzas de la Asamblea Departamental</span>
          </div>
          
          <div class="border border-slate-300 rounded-md overflow-hidden">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-800 text-white font-bold text-[11px] uppercase">
                <tr>
                  <th class="py-2 px-3">Concepto / Estampilla</th>
                  <th class="py-2 px-2 text-right">Base Bruta</th>
                  <th class="py-2 px-2 text-right">Deducciones</th>
                  <th class="py-2 px-2 text-right">% Exención</th>
                  <th class="py-2 px-2 text-right">Base Gravable</th>
                  <th class="py-2 px-2 text-center">Tarifa</th>
                  <th class="py-2 px-3 text-right">Impuesto Liquidado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 bg-white">
                @for (c of liq.conceptos; track c.estampillaId) {
                  <tr class="hover:bg-slate-50">
                    <td class="py-2.5 px-3">
                      <span class="font-bold text-slate-900 block">{{ c.estampillaNombre }}</span>
                      <span class="text-[10px] text-slate-500 block italic">{{ c.fundamentoLegal }}</span>
                    </td>
                    <td class="py-2.5 px-2 text-right font-mono">{{ storage.formatCOP(c.valorBaseContrato) }}</td>
                    <td class="py-2.5 px-2 text-right font-mono text-slate-600">{{ storage.formatCOP(c.descuentosDeducciones) }}</td>
                    <td class="py-2.5 px-2 text-right font-mono font-semibold" [ngClass]="c.porcentajeExencion > 0 ? 'text-amber-700' : 'text-slate-400'">
                      {{ c.porcentajeExencion }}%
                    </td>
                    <td class="py-2.5 px-2 text-right font-mono font-bold text-slate-800">{{ storage.formatCOP(c.baseGravableFinal) }}</td>
                    <td class="py-2.5 px-2 text-center font-mono font-bold text-blue-900">{{ c.tarifaPorcentaje }}%</td>
                    <td class="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-800">{{ storage.formatCOP(c.valorImpuesto) }}</td>
                  </tr>
                }
              </tbody>
              <tfoot class="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                @if (liq.aplicaExencion && liq.totalExencionesAhorro > 0) {
                  <tr class="text-amber-800 text-[11px] bg-amber-50">
                    <td colspan="6" class="py-1 px-3 text-right">
                      Beneficio por Exención Aplicada ({{ liq.tipoExencion || 'Normativa Departamental' }}):
                    </td>
                    <td class="py-1 px-3 text-right font-mono font-extrabold">
                      - {{ storage.formatCOP(liq.totalExencionesAhorro) }}
                    </td>
                  </tr>
                }
                <tr class="text-sm bg-slate-100">
                  <td colspan="6" class="py-3 px-3 text-right font-black uppercase">
                    Total a Pagar Impuesto de Estampillas:
                  </td>
                  <td class="py-3 px-3 text-right font-black font-mono text-base text-emerald-900">
                    {{ storage.formatCOP(liq.totalPagar) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Total en Letras -->
          <div class="mt-2 p-2 bg-slate-50 border border-slate-200 rounded text-xs">
            <span class="font-bold text-slate-700 uppercase text-[10px] block">Son:</span>
            <span class="font-extrabold font-mono text-slate-900">{{ liq.totalPagarLetras }}</span>
          </div>
        </section>

        <!-- SECCIÓN 4: FECHAS, AUDITORÍA Y CÓDIGOS -->
        <section class="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          
          <!-- Fechas Clave -->
          <div class="border border-slate-200 rounded-md p-3 bg-white space-y-1.5">
            <span class="font-bold text-[10px] uppercase text-slate-500 block border-b pb-1">Fechas del Proceso</span>
            <div class="flex justify-between">
              <span class="text-slate-600">Fecha de Expedición:</span>
              <span class="font-bold font-mono">{{ liq.fechaGeneracion }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-rose-700 font-bold">Fecha Límite Oportuna:</span>
              <span class="font-bold font-mono text-rose-700">{{ liq.fechaLimitePago }}</span>
            </div>
            @if (liq.fechaPago) {
              <div class="flex justify-between text-emerald-700 font-bold pt-1 border-t">
                <span>Fecha de Pago Registrado:</span>
                <span class="font-mono">{{ liq.fechaPago }}</span>
              </div>
            }
          </div>

          <!-- Auditoría e Inspector -->
          <div class="border border-slate-200 rounded-md p-3 bg-white space-y-1">
            <span class="font-bold text-[10px] uppercase text-slate-500 block border-b pb-1">Auditoría y Control</span>
            <div class="text-[11px]">
              <span class="text-slate-500 block">Liquidado por:</span>
              <span class="font-bold text-slate-800">{{ liq.creadoPor }}</span>
              <span class="text-slate-500 block text-[10px]">Rol: {{ liq.usuarioRol }}</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-1 pt-1 border-t">
              Fecha de Registro: {{ liq.fechaCreacion }}
            </div>
          </div>

          <!-- Código QR de Verificación -->
          <div class="border border-slate-200 rounded-md p-3 bg-white flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 bg-slate-900 rounded p-1 flex items-center justify-center text-white text-[8px] font-mono leading-tight">
              [QR VERIFICACIÓN TRIBUTARIA]
            </div>
            <span class="text-[9px] font-mono text-slate-500 mt-1 truncate max-w-full">{{ liq.codigoSeguridadQR }}</span>
          </div>
        </section>

        <!-- SECCIÓN 5: CÓDIGO DE BARRAS DE RECAUDO BANCARIO (GS1-128) -->
        <section class="border-t-2 border-dashed border-slate-400 pt-4 mt-6">
          <div class="bg-slate-50 border border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-center">
            <span class="text-[10px] font-extrabold uppercase text-slate-700 tracking-wider mb-1">
              Código de Barras para Recaudo en Ventanilla Bancaria (Estandar ASOBANCARIA / GS1-128)
            </span>
            
            <!-- Simulación Visual Código de Barras -->
            <div class="h-12 w-full max-w-md bg-white border border-slate-400 flex items-center justify-center px-4 py-1">
              <div class="w-full flex items-stretch justify-between h-full">
                @for (bar of [2,1,3,1,2,4,1,3,2,1,4,2,1,3,1,2,3,1,4,1,2,3,1,2,4,2,1,3,1,2,4,1,3,2,1,4,2,1,3,1]; track $index) {
                  <div class="bg-black" [style.width.px]="bar"></div>
                  <div class="bg-white" [style.width.px]="bar === 1 ? 2 : 1"></div>
                }
              </div>
            </div>
            
            <span class="text-[11px] font-mono font-bold text-slate-800 mt-1.5 tracking-wider">
              {{ liq.codigoBarrasRecaudo }}
            </span>
            <span class="text-[10px] text-slate-500 mt-0.5">
              Entidades autorizadas: Banco Agrario de Colombia, Bancolombia, Banco de Occidente y Red PSE.
            </span>
          </div>
        </section>

        <!-- FIRMAS AUTORIZADAS -->
        <footer class="mt-8 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div class="border-b border-slate-700 w-48 mx-auto mb-1"></div>
            <span class="font-extrabold uppercase block text-slate-900">Dr. Fernando Salazar Paz</span>
            <span class="text-[10px] text-slate-500 block">Secretario de Hacienda Departamental</span>
            <span class="text-[10px] text-slate-400 block">Gobernación del Cauca</span>
          </div>
          <div>
            <div class="border-b border-slate-700 w-48 mx-auto mb-1"></div>
            <span class="font-extrabold uppercase block text-slate-900">{{ liq.contribuyenteNombre }}</span>
            <span class="text-[10px] text-slate-500 block">Firma y Sello del Contribuyente / Sujeto Pasivo</span>
            <span class="text-[10px] text-slate-400 block">{{ liq.contribuyenteTipoDoc }}: {{ liq.contribuyenteDocumento }}</span>
          </div>
        </footer>

      </div>
    }
  `
})
export class DocumentoImprimibleComponent {
  readonly storage = inject(EstampillasStorageService);
  readonly liquidacion = input<LiquidacionEstampilla | null>(null);
}
