import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';
import { AuthStateService } from '../../../../../core/auth/auth-state.service';
import { AuthService } from '../../../../../core/auth/auth.service';

export interface TramiteItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  routeAdmin?: string;
  routeCitizen?: string;
  isNew?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
})
export class Home {
  private router = inject(Router);
  private toastService = inject(ToastService);
  readonly authState = inject(AuthStateService);
  private authService = inject(AuthService);

  tramites = signal<TramiteItem[]>([
    {
      id: 'vehicular',
      title: 'Vehicular',
      description: 'Declaración, liquidación oficial, pago en línea y paz y salvo.',
      icon: '/vehicular.svg',
      routeAdmin: '/automotores',
      routeCitizen: '/portal-ciudadano',
    },
    {
      id: 'pasaporte',
      title: 'Pasaporte',
      description: 'Cita previa, requisitos, agendamiento y seguimiento departamental.',
      icon: '/pasaporte.svg',
      routeAdmin: '/pasaportes/admin',
      routeCitizen: '/pasaportes',
    },
    {
      id: 'registros',
      title: 'Registros',
      description: 'Liquidación y registro de actos, contratos y documentos notariales.',
      icon: '/registros.svg',
      routeAdmin: '/registros',
      routeCitizen: '/registros',
    },
    {
      id: 'deguello',
      title: 'Degüello',
      description: 'Declaración y pago por sacrificio de ganado vacuno y menor.',
      icon: '/deguello.svg',
    },
    {
      id: 'sobretasa',
      title: 'Sobretasa gasolina',
      description: 'Declaraciones mensuales para distribuidores mayoristas.',
      icon: '/sobretasa.svg',
    },
    {
      id: 'estampillas',
      title: 'Estampillas',
      description: 'Adquisición y pago de estampillas prodesarrollo departamental.',
      icon: '/estampillas.svg',
    },
    {
      id: 'licores',
      title: 'Licores',
      description: 'Gestión de estampillas, tornaguías y señalización de licores.',
      icon: '/licores.svg',
      isNew: true,
    },
  ]);

  navigate(tramite: TramiteItem): void {
    const isAuth = this.authState.isAuthenticated();
    const destination = isAuth ? tramite.routeAdmin : tramite.routeCitizen;

    if (destination) {
      this.router.navigate([destination]);
    } else {
      this.toastService.info(
        `El módulo de ${tramite.title} estará disponible próximamente.`
      );
    }
  }

  logout(): void {
    this.authService.logout();
    this.toastService.info('Sesión cerrada correctamente.');
  }
}



