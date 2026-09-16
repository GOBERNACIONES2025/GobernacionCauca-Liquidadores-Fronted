import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SobretasaService } from '../../../application/sobretasa.service';
import {
  formatGalones,
  formatMoneyCop,
  TARIFAS_SOBRETASA_2026,
} from '../../../domain/calculator/sobretasa-tax-calculator';

@Component({
  selector: 'app-sobretasa-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sobretasa-dashboard.html',
})
export class SobretasaDashboardComponent {
  readonly sobretasaService = inject(SobretasaService);

  tarifas = TARIFAS_SOBRETASA_2026;

  kpis = this.sobretasaService.kpis;

  // Porcentajes de volumen para barras visuales
  porcentajeGMC = computed(() => {
    const total = this.kpis().totalGalonesJurisdiccion || 1;
    return Math.round((this.kpis().totalGalonesGMC / total) * 100);
  });

  porcentajeGME = computed(() => {
    const total = this.kpis().totalGalonesJurisdiccion || 1;
    return Math.round((this.kpis().totalGalonesGME / total) * 100);
  });

  porcentajeACPM = computed(() => {
    const total = this.kpis().totalGalonesJurisdiccion || 1;
    return Math.round((this.kpis().totalGalonesACPM / total) * 100);
  });

  // Declaraciones recientes
  declaracionesRecientes = computed(() => {
    return this.sobretasaService.declaraciones().slice(0, 5);
  });

  formatCop(val: number): string {
    return formatMoneyCop(val);
  }

  formatGal(val: number): string {
    return formatGalones(val);
  }
}
