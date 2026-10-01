import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { RolPermisosFacade } from '../../../../../application/facades/Seguridad/rol-permisos.facade';
import { RolesApiService } from '../../../../../infrastructure/api/Seguridad/roles-api.service';
import { Rol } from '../../../../../domain/models/Seguridad/rol.model';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { formatUserErrorMessage } from '../../../../shared/utils/error-formatter.util';

@Component({
  selector: 'app-rol-permisos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent
  ],
  templateUrl: './rol-permisos.html',
  styleUrl: './rol-permisos.css'
})
export class RolPermisosComponent implements OnInit {
  public facade = inject(RolPermisosFacade);
  private rolesApi = inject(RolesApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Seguridad', 'Permisos por Rol'];
  tags = [{ text: 'Seguridad', type: 'info' as const }, { text: 'Matriz de Autorización', type: 'neutral' as const }];

  roles = signal<Rol[]>([]);
  loadingRoles = signal<boolean>(false);
  selectedRolId = signal<number | null>(null);

  filterTerm = signal<string>('');
  expandedModulos = signal<Set<string>>(new Set());

  selectedRol = computed(() => {
    const id = this.selectedRolId();
    if (!id) return null;
    return this.roles().find(r => r.id === id) || null;
  });

  counts = computed(() => {
    return {
      total: this.roles().length
    };
  });

  filteredGrupos = computed(() => {
    const term = this.filterTerm().trim().toLowerCase();
    const grupos = this.facade.grupos();
    if (!term) return grupos;

    return grupos
      .map(g => ({
        ...g,
        permisos: g.permisos.filter(p => 
          p.nombre.toLowerCase().includes(term) ||
          p.codigo.toLowerCase().includes(term) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(term))
        )
      }))
      .filter(g => g.permisos.length > 0 || g.modulo.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.loadingRoles.set(true);
    this.rolesApi.obtenerTodos(1, 100, undefined, true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const items = response.data.items || [];
          this.roles.set(items);
          if (items.length > 0 && !this.selectedRolId()) {
            this.onSelectRol(items[0].id);
          }
        }
        this.loadingRoles.set(false);
      },
      error: () => {
        this.loadingRoles.set(false);
        this.toast.error('Error al cargar catálogo de roles');
      }
    });
  }

  onSelectRol(rolId: number): void {
    if (this.facade.isDirty()) {
      const confirmDiscard = confirm('Tiene cambios sin guardar en este rol. ¿Desea descartarlos y cambiar de rol?');
      if (!confirmDiscard) return;
    }

    this.selectedRolId.set(rolId);
    this.facade.cargarPermisosPorRol(rolId);
    setTimeout(() => {
      const allMods = new Set(this.facade.grupos().map(g => g.modulo));
      this.expandedModulos.set(allMods);
    }, 300);
  }

  toggleModuloAccordion(modulo: string): void {
    this.expandedModulos.update(set => {
      const next = new Set(set);
      if (next.has(modulo)) {
        next.delete(modulo);
      } else {
        next.add(modulo);
      }
      return next;
    });
  }

  isModuloExpanded(modulo: string): boolean {
    return this.expandedModulos().has(modulo);
  }

  expandAll(): void {
    const all = new Set(this.facade.grupos().map(g => g.modulo));
    this.expandedModulos.set(all);
  }

  collapseAll(): void {
    this.expandedModulos.set(new Set());
  }

  isPermisoChecked(permisoId: number): boolean {
    return this.facade.isAssigned(permisoId);
  }

  onTogglePermiso(permisoId: number): void {
    this.facade.togglePermiso(permisoId);
  }

  getModuloAssignedCount(modulo: string): number {
    const grupo = this.facade.grupos().find(g => g.modulo === modulo);
    if (!grupo) return 0;
    return grupo.permisos.filter(p => this.facade.isAssigned(p.permisoId)).length;
  }

  isModuloAllChecked(modulo: string): boolean {
    const grupo = this.facade.grupos().find(g => g.modulo === modulo);
    if (!grupo || grupo.permisos.length === 0) return false;
    return grupo.permisos.every(p => this.facade.isAssigned(p.permisoId));
  }

  onToggleModuloCheckboxes(modulo: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.facade.toggleModulo(modulo, target.checked);
  }

  onSelectAllPermisos(): void {
    this.facade.toggleTodos(true);
  }

  onDeselectAllPermisos(): void {
    this.facade.toggleTodos(false);
  }

  onRevertir(): void {
    this.facade.revertir();
    this.toast.info('Se han restaurado los permisos originales del rol');
  }

  onGuardar(): void {
    this.facade.guardar().subscribe({
      next: () => {
        this.toast.success('Permisos del rol sincronizados correctamente (Borrado Lógico aplicado)');
      },
      error: (err) => {
        const msg = formatUserErrorMessage(err, 'Error al guardar permisos del rol');
        this.toast.error(msg);
      }
    });
  }
}
