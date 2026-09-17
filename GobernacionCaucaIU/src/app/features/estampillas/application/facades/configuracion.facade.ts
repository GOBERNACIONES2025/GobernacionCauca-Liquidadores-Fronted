import { Injectable, inject, signal, computed } from '@angular/core';
import { EstampillasStorageService } from '../../infrastructure/storage/storage.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  UsuarioMock,
  RolUsuario,
  RegistroAuditoria,
  VigenciaTributaria,
  MunicipioCauca,
  ExencionEstampilla
} from '../../domain/models/estampillas.models';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionFacade {
  private storage = inject(EstampillasStorageService);
  private toast = inject(ToastService);

  readonly currentUser = signal<UsuarioMock>(this.storage.getCurrentUser());
  readonly usuarios = computed(() => {
    this.storage.dataVersion();
    return this.storage.getUsuarios();
  });

  readonly auditoria = computed(() => {
    this.storage.dataVersion();
    return this.storage.getAuditoria();
  });

  readonly municipios = computed(() => {
    this.storage.dataVersion();
    return this.storage.getMunicipios();
  });

  readonly departamentos = computed(() => {
    this.storage.dataVersion();
    return this.storage.getDepartamentos();
  });

  cambiarUsuario(usuario: UsuarioMock): void {
    this.storage.setCurrentUser(usuario);
    this.currentUser.set(usuario);
    this.toast.info(`Sesión cambiada a: ${usuario.nombre} (${usuario.rol})`);
  }

  cambiarRol(rol: RolUsuario): void {
    const usr = this.storage.getUsuarios().find(u => u.rol === rol);
    if (usr) {
      this.cambiarUsuario(usr);
    }
  }

  reiniciarDatosDemo(): void {
    this.storage.resetToInitialData();
    this.currentUser.set(this.storage.getCurrentUser());
    this.toast.success('¡Base de datos y datos DEMO reiniciados con éxito!');
  }

  guardarMunicipio(mun: MunicipioCauca): void {
    const list = this.storage.getMunicipios();
    const index = list.findIndex(m => m.id === mun.id);
    if (index >= 0) {
      list[index] = mun;
    } else {
      list.push(mun);
    }
    this.storage.saveMunicipios(list);
    this.toast.success('Municipio guardado correctamente.');
  }

  guardarExencion(ex: ExencionEstampilla): void {
    const list = this.storage.getExenciones();
    const index = list.findIndex(e => e.id === ex.id);
    if (index >= 0) {
      list[index] = ex;
    } else {
      list.push(ex);
    }
    this.storage.saveExenciones(list);
    this.toast.success('Exención guardada correctamente.');
  }
}
