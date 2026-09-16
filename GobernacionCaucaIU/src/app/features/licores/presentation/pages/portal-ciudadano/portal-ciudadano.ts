import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LicoresService } from '../../../application/licores.service';
import { InformacionTransporte, LiquidacionLicores, ProductoLicor } from '../../../domain/models/licores.models';
import { formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';
import { DeclaracionWizardComponent } from '../../components/declaracion-wizard/declaracion-wizard.component';
import { TornaguiaViewerComponent } from '../../components/tornaguia-viewer/tornaguia-viewer.component';
import { PseModalComponent } from '../../components/pse-modal/pse-modal.component';
import { AsobancarioModalComponent } from '../../components/asobancario-modal/asobancario-modal.component';
import { SubsanarModalComponent } from '../../components/subsanar-modal/subsanar-modal.component';
import { AuditoriaModalComponent } from '../../components/auditoria-modal/auditoria-modal.component';
import { LiquidacionPdfModalComponent } from '../../components/liquidacion-pdf-modal/liquidacion-pdf-modal.component';

@Component({
  selector: 'app-portal-ciudadano-licores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DeclaracionWizardComponent,
    TornaguiaViewerComponent,
    PseModalComponent,
    AsobancarioModalComponent,
    SubsanarModalComponent,
    AuditoriaModalComponent,
    LiquidacionPdfModalComponent,
  ],
  templateUrl: './portal-ciudadano.html',
})
export class PortalCiudadanoLicoresComponent {
  readonly licoresService = inject(LicoresService);
  private router = inject(Router);

  // Tabs: 'inicio' | 'mis-declaraciones' | 'solicitud' | 'tornaguias'
  activeTab = signal<'inicio' | 'mis-declaraciones' | 'solicitud' | 'tornaguias'>('inicio');

  // Input de consulta rápida en la card
  numeroConsultaInput = '';
  resultadoConsulta = signal<LiquidacionLicores | null | undefined>(undefined);
  haConsultado = signal<boolean>(false);

  // Modales
  mostrarWizard = signal<boolean>(false);
  liquidacionSeleccionada = signal<LiquidacionLicores | null>(null);
  modalActivo = signal<'NINGUNO' | 'TORNAGUIA' | 'PSE' | 'ASOBANCARIO' | 'SUBSANAR' | 'DETALLE' | 'LIQUIDACION_PDF'>('NINGUNO');

  mensajeExito = signal<string | null>(null);

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  cambiarTab(tab: 'inicio' | 'mis-declaraciones' | 'solicitud' | 'tornaguias'): void {
    this.activeTab.set(tab);
    if (tab === 'solicitud') {
      this.abrirWizard();
    } else if (tab === 'tornaguias') {
      this.licoresService.setFiltroEstado('PAGADO_EMITIDO');
    } else {
      this.licoresService.setFiltroEstado('TODOS');
    }
  }

  consultarRadicadoOtornaguia(valor?: string): void {
    const query = (valor || this.numeroConsultaInput).trim().toUpperCase();
    if (!query) return;

    this.haConsultado.set(true);
    let res = this.licoresService.buscarPorRadicado(query);
    if (!res) {
      res = this.licoresService.buscarPorTornaguia(query);
    }
    this.resultadoConsulta.set(res || null);
  }

  cargarEjemplo(radicado: string): void {
    this.numeroConsultaInput = radicado;
    this.consultarRadicadoOtornaguia(radicado);
  }

  abrirWizard(): void {
    this.mostrarWizard.set(true);
  }

  cerrarWizard(): void {
    this.mostrarWizard.set(false);
    if (this.activeTab() === 'solicitud') {
      this.activeTab.set('inicio');
    }
  }

  abrirTornaguia(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('TORNAGUIA');
  }

  abrirLiquidacionPdf(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('LIQUIDACION_PDF');
  }

  abrirPse(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('PSE');
  }

  abrirAsobancario(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('ASOBANCARIO');
  }

  abrirSubsanar(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('SUBSANAR');
  }

  abrirDetalle(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('DETALLE');
  }

  cerrarModales(): void {
    this.modalActivo.set('NINGUNO');
    this.liquidacionSeleccionada.set(null);
  }

  onRadicadoCreado(evento: {
    transporte: InformacionTransporte;
    items: { producto: ProductoLicor; cantidad: number }[];
  }): void {
    const liq = this.licoresService.radicarNuevaDeclaracion(evento);
    this.cerrarWizard();
    this.numeroConsultaInput = liq.numeroRadicado;
    this.consultarRadicadoOtornaguia(liq.numeroRadicado);
    this.lanzarMensaje(`¡Declaración radicada exitosamente! Se generó el radicado oficial ${liq.numeroRadicado}.`);
    // Abrir automáticamente el documento PDF de preliquidación
    this.abrirLiquidacionPdf(liq);
  }

  onPagoPseExitoso(pagoData: {
    metodo: 'PSE';
    banco: string;
    referencia: string;
    codigoTransaccionPse: string;
  }): void {
    const liq = this.liquidacionSeleccionada();
    if (!liq) return;

    const actualizada = this.licoresService.procesarPago(liq.id, pagoData);
    this.cerrarModales();

    if (actualizada) {
      this.resultadoConsulta.set(actualizada);
      this.lanzarMensaje(`¡Pago PSE aprobado! Se emitió la Tornaguía Oficial ${actualizada.tornaguiaNumero}.`);
      this.abrirTornaguia(actualizada);
    }
  }

  onPagoAsobancario(pagoData: {
    metodo: 'ASOBANCARIO_VENTANILLA';
    banco: string;
    referencia: string;
  }): void {
    const liq = this.liquidacionSeleccionada();
    if (!liq) return;

    const actualizada = this.licoresService.procesarPago(liq.id, pagoData);
    this.cerrarModales();

    if (actualizada) {
      this.resultadoConsulta.set(actualizada);
      this.lanzarMensaje(`¡Pago relacionado con éxito! Tornaguía ${actualizada.tornaguiaNumero} emitida.`);
      this.abrirTornaguia(actualizada);
    }
  }

  onSubsanarGuardado(evento: {
    id: string;
    motivo: string;
    items: { producto: ProductoLicor; cantidad: number }[];
    transporte: InformacionTransporte;
  }): void {
    this.licoresService.subsanarDeclaracion(evento.id, evento.motivo, evento.items, evento.transporte);
    this.cerrarModales();
    const updated = this.licoresService.buscarPorRadicado(evento.id) || this.licoresService.liquidaciones().find(l => l.id === evento.id);
    if (updated) {
      this.resultadoConsulta.set(updated);
    }
    this.lanzarMensaje('El requerimiento ha sido subsanado y reenviado a la bandeja fiscal de Rentas.');
  }

  salir(): void {
    this.router.navigate(['/']);
  }

  private lanzarMensaje(msg: string): void {
    this.mensajeExito.set(msg);
    setTimeout(() => {
      this.mensajeExito.set(null);
    }, 6000);
  }
}
