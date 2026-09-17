import { Component, output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BreadcrumbComponent } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { ConfiguracionFacade } from '../../../application/facades/configuracion.facade';
import { EstampillasStorageService } from '../../../infrastructure/storage/storage.service';
import { UsuarioMock } from '../../../domain/models/estampillas.models';

@Component({
  selector: 'app-estampillas-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './estampillas-topbar.html',
  styleUrls: ['./estampillas-topbar.css']
})
export class EstampillasTopbarComponent {
  private router = inject(Router);
  readonly configFacade = inject(ConfiguracionFacade);
  readonly storage = inject(EstampillasStorageService);

  readonly toggleSidebar = output<void>();

  readonly isProfileMenuOpen = signal<boolean>(false);
  readonly isRoleModalOpen = signal<boolean>(false);

  readonly currentUser = computed(() => this.configFacade.currentUser());

  readonly userInitials = computed(() => {
    const name = this.currentUser()?.nombre || 'AD';
    return name
      .split(' ')
      .slice(0, 2)
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  });

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update(v => !v);
  }

  seleccionarUsuarioDemo(usuario: UsuarioMock): void {
    this.configFacade.cambiarUsuario(usuario);
    this.isProfileMenuOpen.set(false);
  }

  reiniciarDemo(): void {
    if (confirm('¿Está seguro de restaurar la base de datos DEMO inicial de Estampillas? Se perderán las liquidaciones no guardadas en la semilla.')) {
      this.configFacade.reiniciarDatosDemo();
      this.isProfileMenuOpen.set(false);
    }
  }

  logout(): void {
    this.router.navigate(['/estampillas/login']);
  }
}
