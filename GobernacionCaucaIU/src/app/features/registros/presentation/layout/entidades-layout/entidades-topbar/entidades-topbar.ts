import { Component, inject, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RegistrosAuthStateService } from '../../../../core/auth/registros-auth-state.service';
import { AuthOrchestratorService } from '../../../../../../core/auth/services/auth-orchestrator.service';
import { BreadcrumbComponent } from '../../../../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-entidades-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './entidades-topbar.html',
  styleUrl: './entidades-topbar.css'
})
export class EntidadesTopbarComponent {
  private authState = inject(RegistrosAuthStateService);
  private orchestrator = inject(AuthOrchestratorService);

  readonly toggleSidebar = output<void>();
  readonly isProfileMenuOpen = signal(false);

  toggleProfileMenu() {
    this.isProfileMenuOpen.update(v => !v);
  }

  currentUser = this.authState.currentUser;
  currentEntidad = this.authState.currentEntidad;
  currentMunicipio = this.authState.currentMunicipio;
  currentDepartamento = this.authState.currentDepartamento;

  userName = computed(() => {
    const u = this.currentUser();
    return u?.nombre || 'Usuario Entidad';
  });

  userRole = computed(() => {
    const u = this.currentUser();
    return u?.rol || u?.roles?.[0] || 'Entidad Registral Externa';
  });

  entidadName = computed(() => {
    return this.currentEntidad()?.nombre || 'Entidad Registral';
  });

  tipoEntidad = computed(() => {
    return this.currentEntidad()?.tipoEntidadCodigo || 'Ventanilla Externa';
  });

  municipioName = computed(() => {
    return this.currentMunicipio()?.nombre || 'Cauca';
  });

  userInitials = computed(() => {
    const name = this.userName().trim();
    if (!name) return 'NE';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  });

  logout() {
    this.orchestrator.logout('entidad');
  }
}
