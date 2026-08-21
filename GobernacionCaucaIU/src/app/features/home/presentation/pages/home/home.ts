import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
})
export class Home {

  constructor(private router: Router) {}

  navigate(moduleId: string): void {
    const routes: Record<string, string> = {
      vehicular: '/portal-ciudadano',
      pasaportes: '/pasaportes',
    };
    const route = routes[moduleId];
    if (route) {
      this.router.navigate([route]);
    }
  }
}
