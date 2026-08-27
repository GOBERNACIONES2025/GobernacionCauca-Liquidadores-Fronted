import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { EchartsChartComponent } from '../../../components/echarts-chart/echarts-chart';
import { TaxModuleKey } from '../../models/dashboard.model';

@Component({
  selector: 'app-tax-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EchartsChartComponent],
  templateUrl: './tax-dashboard.html',
  styleUrl: './tax-dashboard.css',
})
export class TaxDashboardComponent implements OnInit {
  public dashboardService = inject(DashboardService);

  @Input() set forcedTaxKey(key: TaxModuleKey | undefined) {
    if (key) {
      this.dashboardService.loadDashboardData(key);
    }
  }

  readonly vigenciasDisponibles = [2026, 2025, 2024, 2023];

  ngOnInit(): void {
    // Si no se cargaron datos aún, cargar con la ruta actual
    if (!this.dashboardService.charts()) {
      this.dashboardService.loadDashboardData();
    }
  }

  onVigenciaChange(vigencia: number): void {
    this.dashboardService.setVigencia(Number(vigencia));
  }

  onRefresh(): void {
    this.dashboardService.loadDashboardData();
  }
}
