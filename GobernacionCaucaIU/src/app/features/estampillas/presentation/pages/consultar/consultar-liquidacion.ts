import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EstampillasStorageService } from '../../../infrastructure/storage/storage.service';
import { EstampillasBadgeComponent } from '../../components/ui-badge/ui-badge.component';
import { LiquidacionEstampilla } from '../../../domain/models/estampillas.models';

@Component({
  selector: 'app-consultar-liquidacion',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EstampillasBadgeComponent],
  templateUrl: './consultar-liquidacion.html'
})
export class ConsultarLiquidacionComponent {
  readonly storage = inject(EstampillasStorageService);

  criterioBusqueda = '';
  tipoFiltro = 'NUMERO_LIQUIDACION'; // 'NUMERO_LIQUIDACION' | 'NIT' | 'CONTRATO'
  haBuscado = signal<boolean>(false);
  resultados = signal<LiquidacionEstampilla[]>([]);

  buscar(): void {
    const q = this.criterioBusqueda.trim().toLowerCase();
    this.haBuscado.set(true);

    if (!q) {
      this.resultados.set([]);
      return;
    }

    const all = this.storage.getLiquidaciones();
    const matches = all.filter(l => {
      if (this.tipoFiltro === 'NUMERO_LIQUIDACION') {
        return l.numeroLiquidacion.toLowerCase().includes(q);
      } else if (this.tipoFiltro === 'NIT') {
        return l.contribuyenteDocumento.includes(q) || l.contribuyenteNombre.toLowerCase().includes(q);
      } else {
        return l.numeroContrato.toLowerCase().includes(q);
      }
    });

    this.resultados.set(matches);
  }

  limpiar(): void {
    this.criterioBusqueda = '';
    this.haBuscado.set(false);
    this.resultados.set([]);
  }
}
