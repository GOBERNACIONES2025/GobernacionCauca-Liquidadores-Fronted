import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LicoresService } from '../../../application/licores.service';
import { InformacionTransporte, LiquidacionLicores, ProductoLicor } from '../../../domain/models/licores.models';
import { formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';
import { DeclaracionWizardComponent } from '../../components/declaracion-wizard/declaracion-wizard.component';
import { TornaguiaViewerComponent } from '../../components/tornaguia-viewer/tornaguia-viewer.component';
import { PseModalComponent } from '../../components/pse-modal/pse-modal.component';
import { AsobancarioModalComponent } from '../../components/asobancario-modal/asobancario-modal.component';
import { SubsanarModalComponent } from '../../components/subsanar-modal/subsanar-modal.component';
import { AuditoriaModalComponent } from '../../components/auditoria-modal/auditoria-modal.component';
import { ConsultaRadicadoModalComponent } from '../../components/consulta-radicado-modal/consulta-radicado-modal.component';

@Component({
  selector: 'app-portal-contribuyente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DeclaracionWizardComponent,
    TornaguiaViewerComponent,
    PseModalComponent,
    AsobancarioModalComponent,
    SubsanarModalComponent,
    AuditoriaModalComponent,
    ConsultaRadicadoModalComponent,
  ],
  templateUrl: './portal-contribuyente.component.html',
})
export class PortalContribuyenteComponent {
  readonly licoresService = inject(LicoresService);

  // Modales
  mostrarWizard = signal<boolean>(false);
  mostrarConsultaModal = signal<boolean>(false);
  liquidacionSeleccionada = signal<LiquidacionLicores | null>(null);
  modalActivo = signal<'NINGUNO' | 'TORNAGUIA' | 'PSE' | 'ASOBANCARIO' | 'SUBSANAR' | 'DETALLE'>('NINGUNO');

  // Notificación tipo toast local
  mensajeExito = signal<string | null>(null);

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  setFiltro(estado: string): void {
    this.licoresService.setFiltroEstado(estado);
  }

  setBusqueda(texto: string): void {
    this.licoresService.setTerminoBusqueda(texto);
  }

  seleccionarEntidad(entidadId: string): void {
    this.licoresService.seleccionarEntidad(entidadId);
  }

  abrirWizard(): void {
    this.mostrarWizard.set(true);
  }

  cerrarWizard(): void {
    this.mostrarWizard.set(false);
  }

  abrirTornaguia(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('TORNAGUIA');
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

  // --- Handlers de eventos ---

  onRadicadoCreado(evento: {
    transporte: InformacionTransporte;
    items: { producto: ProductoLicor; cantidad: number }[];
  }): void {
    const liq = this.licoresService.radicarNuevaDeclaracion(evento);
    this.mostrarWizard.set(false);
    this.lanzarMensaje(`¡Declaración radicada exitosamente! Se generó el radicado oficial ${liq.numeroRadicado}. El expediente se encuentra en revisión.`);
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
      this.lanzarMensaje(`¡Pago PSE aprobado! Se emitió la Tornaguía Oficial ${actualizada.tornaguiaNumero} con estampillas del ${actualizada.rangoEstampillas?.desde} al ${actualizada.rangoEstampillas?.hasta}.`);
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
      this.lanzarMensaje(`¡Pago Asobancario relacionado con éxito! Tornaguía ${actualizada.tornaguiaNumero} emitida.`);
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
    this.lanzarMensaje('El requerimiento ha sido subsanado y reenviado a la bandeja de Rentas Departamentales.');
  }

  private lanzarMensaje(msg: string): void {
    this.mensajeExito.set(msg);
    setTimeout(() => {
      this.mensajeExito.set(null);
    }, 6000);
  }
}
