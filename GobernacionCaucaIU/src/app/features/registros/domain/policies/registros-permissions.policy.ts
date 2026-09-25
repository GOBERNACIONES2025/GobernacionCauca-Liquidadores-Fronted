import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthStateService } from '../../../../core/auth/auth-state.service';

/**
 * Política de Permisos Desacoplada para el Módulo de Registros (Gobernación).
 * Arquitectura "Role-Ready":
 * Por defecto opera en modo permisivo (isStrictRoleChecking = false) permitiendo acceso
 * total a todas las operaciones fiscales en esta etapa. Cuando se activen los roles,
 * basta con alternar el modo a estricto sin modificar las vistas ni los componentes.
 */
@Injectable({
  providedIn: 'root'
})
export class RegistrosPermissionsPolicy {
  private authState = inject(AuthStateService);

  // Bandera de modo estricto: false = permisivo actual; true = validación rigurosa por roles
  readonly isStrictRoleChecking = signal<boolean>(false);

  readonly currentUser = this.authState.currentUser;

  readonly userRoles = computed<string[]>(() => {
    const user = this.currentUser();
    return user?.roles?.map(r => r.toUpperCase()) || [];
  });

  readonly isLiquidador = computed(() => this.hasAnyRole(['LIQUIDADOR', 'FUNCIONARIO']));
  readonly isSupervisor = computed(() => this.hasAnyRole(['SUPERVISOR_RENTAS', 'COORDINADOR']));
  readonly isAdmin = computed(() => this.hasAnyRole(['ADMIN', 'ADMIN_SISTEMA']));

  // --- Capacidades Operativas ---
  readonly canReviewSolicitudes = computed(() => {
    if (!this.isStrictRoleChecking()) return true;
    return this.hasAnyRole(['LIQUIDADOR', 'SUPERVISOR_RENTAS', 'ADMIN', 'FUNCIONARIO']);
  });

  readonly canPreliquidar = computed(() => {
    if (!this.isStrictRoleChecking()) return true;
    return this.hasAnyRole(['LIQUIDADOR', 'SUPERVISOR_RENTAS', 'ADMIN', 'FUNCIONARIO']);
  });

  readonly canGenerarLiquidacion = computed(() => {
    if (!this.isStrictRoleChecking()) return true;
    return this.hasAnyRole(['LIQUIDADOR', 'SUPERVISOR_RENTAS', 'ADMIN', 'FUNCIONARIO']);
  });

  readonly canDevolverSolicitud = computed(() => {
    if (!this.isStrictRoleChecking()) return true;
    return this.hasAnyRole(['LIQUIDADOR', 'SUPERVISOR_RENTAS', 'ADMIN', 'FUNCIONARIO']);
  });

  readonly canResolverReliquidacion = computed(() => {
    if (!this.isStrictRoleChecking()) return true;
    return this.hasAnyRole(['SUPERVISOR_RENTAS', 'ADMIN']);
  });

  readonly canResolverAnulacion = computed(() => {
    if (!this.isStrictRoleChecking()) return true;
    return this.hasAnyRole(['SUPERVISOR_RENTAS', 'ADMIN']);
  });

  readonly canAnularOficio = computed(() => {
    if (!this.isStrictRoleChecking()) return true;
    return this.hasAnyRole(['SUPERVISOR_RENTAS', 'ADMIN']);
  });

  readonly canConfigurarNormativa = computed(() => {
    if (!this.isStrictRoleChecking()) return true;
    return this.hasAnyRole(['ADMIN', 'SUPERVISOR_RENTAS']);
  });

  /**
   * Verifica si el usuario actual posee alguno de los roles solicitados
   */
  hasAnyRole(roles: string[]): boolean {
    const current = this.userRoles();
    if (current.length === 0) return true; // Si no hay roles configurados, permite
    const normalized = roles.map(r => r.toUpperCase());
    return current.some(r => normalized.includes(r));
  }

  /**
   * Entrega un mensaje educativo de restricción (Criterio 15: Seguridad sin perjudicar la UX)
   */
  getRestrictedReason(action: string): string {
    switch (action) {
      case 'RELIQUIDACION':
        return 'Esta acción de resolución tributaria requiere firma y autorización de un Supervisor Fiscal de Rentas.';
      case 'ANULACION':
        return 'La anulación formal de títulos oficiales requiere nivel de autorización de Coordinador o Supervisor Fiscal.';
      case 'ANULACION_OFICIO':
        return 'La anulación administrativa de oficio es potestad exclusiva del Supervisor de Rentas o Administrador.';
      case 'CONFIGURACION':
        return 'La parametrización normativa y tarifaria está reservada para el Administrador del Sistema.';
      default:
        return 'Operación reservada para roles con mayor nivel de autorización fiscal.';
    }
  }
}
