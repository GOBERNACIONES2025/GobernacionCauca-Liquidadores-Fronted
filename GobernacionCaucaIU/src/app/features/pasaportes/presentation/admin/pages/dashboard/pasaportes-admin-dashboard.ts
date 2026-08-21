import { Component, inject } from '@angular/core';
import { PasaportesAdminDemoService } from '../../../../application/demo/pasaportes-admin-demo.service';

@Component({
  selector: 'app-pasaportes-admin-dashboard',
  standalone: true,
  templateUrl: './pasaportes-admin-dashboard.html',
})
export class PasaportesAdminDashboard {
  private readonly demo = inject(PasaportesAdminDemoService);

  readonly metrics = this.demo.getMetrics();
  readonly appointments = this.demo.getLatestAppointments();
  readonly formalizers = this.demo.getFormalizers();
}
