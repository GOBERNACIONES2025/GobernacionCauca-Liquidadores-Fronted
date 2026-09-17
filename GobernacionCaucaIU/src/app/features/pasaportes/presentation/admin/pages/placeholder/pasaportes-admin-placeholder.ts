import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pasaportes-admin-placeholder',
  standalone: true,
  templateUrl: './pasaportes-admin-placeholder.html',
})
export class PasaportesAdminPlaceholder {
  private readonly route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] as string;
  readonly description = this.route.snapshot.data['description'] as string;
  readonly icon = this.route.snapshot.data['icon'] as string;
}
