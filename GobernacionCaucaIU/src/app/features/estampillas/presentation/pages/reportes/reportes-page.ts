import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportesFacade } from '../../../application/facades/reportes.facade';
import { ConfiguracionFacade } from '../../../application/facades/configuracion.facade';
import { LiquidacionesFacade } from '../../../application/facades/liquidaciones.facade';
import { EstampillasStorageService } from '../../../infrastructure/storage/storage.service';
import { LiquidacionEstampilla } from '../../../domain/models/estampillas.models';

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reportes-page.html'
})
export class ReportesPageComponent {
  readonly facade = inject(ReportesFacade);
  readonly configFacade = inject(ConfiguracionFacade);
  readonly liquidacionesFacade = inject(LiquidacionesFacade);
  readonly storage = inject(EstampillasStorageService);

  readonly activeTab = signal<'RECAUDO_ESTAMPILLAS' | 'MENSUAL' | 'TOP_CONTRIBUYENTES' | 'ANULADAS'>('RECAUDO_ESTAMPILLAS');

  vigenciaFiltro = 2026;
  municipioFiltro = 'TODOS';

  onCambiarVigencia(): void {
    this.facade.setFiltroVigencia(Number(this.vigenciaFiltro));
  }

  onCambiarMunicipio(): void {
    this.facade.setFiltroMunicipio(this.municipioFiltro);
  }

  setTab(tab: 'RECAUDO_ESTAMPILLAS' | 'MENSUAL' | 'TOP_CONTRIBUYENTES' | 'ANULADAS'): void {
    this.activeTab.set(tab);
  }

  get liquidacionesAnuladas(): LiquidacionEstampilla[] {
    this.storage.dataVersion();
    return this.storage.getLiquidaciones().filter((l: LiquidacionEstampilla) => l.estado === 'ANULADA');
  }

  exportarInforme(): void {
    window.print();
  }
}
