import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  ModuloPermisosGroup, 
  RolPermisoItem 
} from '../../../domain/models/Seguridad/rol-permiso.model';
import { RolPermisosApiService } from '../../../infrastructure/api/Seguridad/rol-permisos-api.service';

@Injectable({
  providedIn: 'root'
})
export class RolPermisosFacade {
  private apiService = inject(RolPermisosApiService);

  readonly selectedRolId = signal<number | null>(null);
  readonly grupos = signal<ModuloPermisosGroup[]>([]);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly assignedIds = signal<Set<number>>(new Set());
  readonly originalAssignedIds = signal<Set<number>>(new Set());

  readonly isDirty = computed(() => {
    const current = this.assignedIds();
    const original = this.originalAssignedIds();
    if (current.size !== original.size) return true;
    for (const id of current) {
      if (!original.has(id)) return true;
    }
    return false;
  });

  readonly totalPermisos = computed(() => {
    return this.grupos().reduce((sum, g) => sum + g.permisos.length, 0);
  });

  readonly totalAsignados = computed(() => {
    return this.assignedIds().size;
  });

  cargarPermisosPorRol(rolId: number): void {
    this.selectedRolId.set(rolId);
    this.loading.set(true);
    this.error.set(null);

    this.apiService.obtenerPorRol(rolId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.grupos.set(response.data);
          const initialSet = new Set<number>();
          for (const g of response.data) {
            for (const p of g.permisos) {
              if (p.asignado) {
                initialSet.add(p.permisoId);
              }
            }
          }
          this.assignedIds.set(new Set(initialSet));
          this.originalAssignedIds.set(new Set(initialSet));
        } else {
          this.error.set(response.message || 'Error al cargar permisos del rol');
        }
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error de conexión');
        this.loading.set(false);
      }
    });
  }

  isAssigned(permisoId: number): boolean {
    return this.assignedIds().has(permisoId);
  }

  togglePermiso(permisoId: number): void {
    this.assignedIds.update(current => {
      const next = new Set(current);
      if (next.has(permisoId)) {
        next.delete(permisoId);
      } else {
        next.add(permisoId);
      }
      return next;
    });
  }

  toggleModulo(modulo: string, assign: boolean): void {
    const grupo = this.grupos().find(g => g.modulo === modulo);
    if (!grupo) return;

    this.assignedIds.update(current => {
      const next = new Set(current);
      for (const p of grupo.permisos) {
        if (assign) {
          next.add(p.permisoId);
        } else {
          next.delete(p.permisoId);
        }
      }
      return next;
    });
  }

  toggleTodos(assign: boolean): void {
    this.assignedIds.update(current => {
      const next = new Set<number>();
      if (assign) {
        for (const g of this.grupos()) {
          for (const p of g.permisos) {
            next.add(p.permisoId);
          }
        }
      }
      return next;
    });
  }

  revertir(): void {
    this.assignedIds.set(new Set(this.originalAssignedIds()));
  }

  guardar(): Observable<void> {
    const rolId = this.selectedRolId();
    if (!rolId) throw new Error('No hay rol seleccionado');

    const permisosIds = Array.from(this.assignedIds());
    this.saving.set(true);

    return this.apiService.sincronizar({ rolId, permisosIds }).pipe(
      tap({
        next: () => {
          this.originalAssignedIds.set(new Set(this.assignedIds()));
          this.saving.set(false);
        },
        error: () => {
          this.saving.set(false);
        }
      })
    );
  }
}
