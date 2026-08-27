import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';

export interface TramiteItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route?: string;
  isNew?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
})
export class Home {
  private router = inject(Router);
  private toastService = inject(ToastService);

  tramites = signal<TramiteItem[]>([
    {
      id: 'vehicular',
      title: 'Vehicular',
      description: 'Declaración, liquidación oficial, pago en línea y paz y salvo.',
      icon: 'vehicular.svg',
      route: '/portal-ciudadano',
    },
    {
      id: 'pasaporte',
      title: 'Pasaporte',
      description: 'Cita previa, requisitos, agendamiento y seguimiento departamental.',
      icon: 'pasaporte.svg',
    },
    {
      id: 'registros',
      title: 'Registros',
      description: 'Liquidación y registro de actos, contratos y documentos notariales.',
      icon: 'registros.svg',
      route: '/registros',
    },
    {
      id: 'deguello',
      title: 'Degüello',
      description: 'Declaración y pago por sacrificio de ganado vacuno y menor.',
      icon: 'deguello.svg',
    },
    {
      id: 'sobretasa',
      title: 'Sobretasa gasolina',
      description: 'Declaraciones mensuales para distribuidores mayoristas.',
      icon: 'sobretasa.svg',
    },
    {
      id: 'estampillas',
      title: 'Estampillas',
      description: 'Adquisición y pago de estampillas prodesarrollo departamental.',
      icon: 'estampillas.svg',
    },
    {
      id: 'licores',
      title: 'Licores',
      description: 'Gestión de estampillas, tornaguías y señalización de licores.',
      icon: 'licores.svg',
      isNew: true,
    },
  ]);

  navigate(tramite: TramiteItem): void {
    if (tramite.route) {
      this.router.navigate([tramite.route]);
    } else {
      this.toastService.info(
        `El módulo de ${tramite.title} estará disponible próximamente.`
      );
    }
  }
}


