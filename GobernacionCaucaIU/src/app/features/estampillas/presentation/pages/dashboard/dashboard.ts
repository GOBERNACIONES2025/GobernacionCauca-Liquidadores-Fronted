import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EstampillasStorageService } from '../../../infrastructure/storage/storage.service';
import { LiquidacionesFacade } from '../../../application/facades/liquidaciones.facade';
import { ReportesFacade } from '../../../application/facades/reportes.facade';
import { PagosFacade } from '../../../application/facades/pagos.facade';
import { EstampillasBadgeComponent } from '../../components/ui-badge/ui-badge.component';
import { EstampillasStatCardComponent } from '../../components/ui-stat-card/ui-stat-card.component';
import { RegistrarPagoModalComponent } from '../../components/registrar-pago-modal/registrar-pago-modal.component';
import { LiquidacionEstampilla, RegistroPagoRequest } from '../../../domain/models/estampillas.models';

@Component({
  selector: 'app-estampillas-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    EstampillasBadgeComponent,
    EstampillasStatCardComponent,
    RegistrarPagoModalComponent
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class EstampillasDashboardComponent {
  readonly storage = inject(EstampillasStorageService);
  readonly liquidacionesFacade = inject(LiquidacionesFacade);
  readonly reportesFacade = inject(ReportesFacade);
  readonly pagosFacade = inject(PagosFacade);

  readonly kpis = computed(() => this.liquidacionesFacade.kpis());
  readonly recaudoEstampillas = computed(() => this.reportesFacade.recaudoPorEstampilla());
  readonly recaudoMensual = computed(() => this.reportesFacade.recaudoMensual());
  readonly recaudoMunicipios = computed(() => this.reportesFacade.recaudoPorMunicipio().slice(0, 5));
  readonly recaudoVigencias = computed(() => this.reportesFacade.recaudoPorVigencia());

  // Últimas liquidaciones
  readonly ultimasLiquidaciones = computed(() => {
    this.storage.dataVersion();
    return this.storage.getLiquidaciones().slice(0, 5);
  });

  // Últimos pagos registrados
  readonly ultimosPagos = computed(() => {
    this.storage.dataVersion();
    return this.storage.getPagos().slice(0, 5);
  });

  // Máximo mensual para cálculo relativo de altura de barras
  readonly maxMesRecaudo = computed(() => {
    const meses = this.recaudoMensual();
    return Math.max(...meses.map(m => Math.max(m.valorLiquidado, m.valorRecaudado)), 1);
  });

  // Máximo municipio para barras
  readonly maxMunRecaudo = computed(() => {
    const muns = this.recaudoMunicipios();
    return Math.max(...muns.map(m => m.totalRecaudado), 1);
  });

  // Abrir modal de pago rápido desde el dashboard
  abrirModalPago(liq: LiquidacionEstampilla): void {
    this.pagosFacade.abrirModalRegistroPago(liq);
  }

  aplicarPago(req: RegistroPagoRequest): void {
    this.pagosFacade.registrarPago(req);
  }
}
