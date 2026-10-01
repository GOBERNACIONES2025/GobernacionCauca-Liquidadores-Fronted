import { Component, inject, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { map, of, distinctUntilChanged } from 'rxjs';

import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SlideOverComponent } from '../../../../shared/components/slide-over/slide-over';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { TableSearchComponent } from '../../../../shared/components/table-search/table-search';
import { FormFieldErrorComponent } from '../../../../../../shared/components/form-error/form-error.component';
import { SearchableSelectComponent } from '../../../../../../../shared/components/searchable-select/searchable-select';

import { UsuariosFacade } from '../../../../../application/facades/Seguridad/usuarios.facade';
import { RolesFacade } from '../../../../../application/facades/Seguridad/roles.facade';
import { EntidadesRegistroFacade } from '../../../../../application/facades/Registro/entidades-registro.facade';
import { DepartamentosFacade } from '../../../../../application/facades/Territorios/departamentos.facade';
import { MunicipiosFacade } from '../../../../../application/facades/Territorios/municipios.facade';

import { UsuariosApiService } from '../../../../../infrastructure/api/Seguridad/usuarios-api.service';
import { EntidadesRegistroApiService } from '../../../../../infrastructure/api/Registro/entidades-registro-api.service';
import { TiposEntidadRegistroApiService } from '../../../../../infrastructure/api/Registro/tipos-entidad-registro-api.service';
import { MunicipiosApiService } from '../../../../../infrastructure/api/Territorios/municipios-api.service';

import { Usuario } from '../../../../../domain/models/Seguridad/usuario.model';
import { Rol } from '../../../../../domain/models/Seguridad/rol.model';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { formatUserErrorMessage } from '../../../../shared/utils/error-formatter.util';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    PageHeaderComponent, 
    SlideOverComponent, 
    ConfirmModalComponent, 
    PaginationComponent, 
    TableSearchComponent, 
    FormFieldErrorComponent,
    SearchableSelectComponent
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class UsuariosComponent implements OnInit {
  private fb = inject(FormBuilder);
  public facade = inject(UsuariosFacade);
  public apiService = inject(UsuariosApiService);
  public rolesFacade = inject(RolesFacade);
  public entidadesFacade = inject(EntidadesRegistroFacade);
  public departamentosFacade = inject(DepartamentosFacade);
  public municipiosFacade = inject(MunicipiosFacade);
  
  public entidadesApi = inject(EntidadesRegistroApiService);
  public tiposEntidadApi = inject(TiposEntidadRegistroApiService);
  public municipiosApi = inject(MunicipiosApiService);
  private toast = inject(ToastService);

  breadcrumbs = ['Configuración', 'Seguridad', 'Usuarios'];

  searchText = signal<string>('');
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  loadingEditId = signal<number | null>(null);
  selectedFilter = signal<'todos' | 'gobernacion' | 'entidades' | 'activos' | 'inactivos'>('todos');

  isSlideOverOpen = false;
  selectedId: number | null = null;
  isConfirmModalOpen = signal<boolean>(false);
  itemToToggle = signal<Usuario | null>(null);
  isTogglingStatus = signal<boolean>(false);

  // --- Multi-Select de Roles con Buscador y Chips ---
  selectedRolesIds = signal<number[]>([]);
  currentTipoAcceso = signal<'GOBERNACION' | 'ENTIDAD_REGISTRO'>('GOBERNACION');
  rolSearchTerm = signal<string>('');
  isRolesDropdownOpen = signal<boolean>(false);

  get isEditMode(): boolean {
    return this.selectedId !== null;
  }

  usuarioForm = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    tipoAcceso: ['GOBERNACION', Validators.required],
    tipoEntidadRegistroId: [null as number | null],
    entidadRegistroId: [null as number | null],
    departamentoId: [null as number | null],
    municipioId: [null as number | null],
    rolesIds: this.fb.control<number[]>([], [(c: AbstractControl) => (c.value && c.value.length > 0 ? null : { required: true })]),
    activo: [true]
  });

  // Filtered list according to tab
  usuariosFiltrados = computed(() => {
    const list = this.facade.usuarios();
    const filter = this.selectedFilter();
    if (filter === 'gobernacion') {
      return list.filter(u => !u.entidadRegistroId);
    }
    if (filter === 'entidades') {
      return list.filter(u => !!u.entidadRegistroId);
    }
    return list;
  });

  // Dynamic counts
  counts = computed(() => {
    return {
      total: this.facade.totalUsuarios()
    };
  });

  // Lista detallada de los roles actualmente seleccionados (para renderizar Chips/Tags)
  selectedRolesList = computed<Rol[]>(() => {
    const ids = this.selectedRolesIds();
    const allRoles = this.rolesFacade.roles();
    return ids.map(id => {
      const found = allRoles.find(r => r.id === id);
      if (found) return found;
      return {
        id,
        nombre: `Rol #${id}`,
        codigo: `ROL_${id}`,
        activo: true,
        tipoRolId: 1,
        tipoRolCodigo: 'GLOBAL',
        tipoRolNombre: 'Transversal / Global'
      } as Rol;
    });
  });

  // Roles disponibles para seleccionar según tipo de acceso y filtro de búsqueda (sin duplicados)
  availableRolesForSelection = computed<Rol[]>(() => {
    const allRoles = this.rolesFacade.roles();
    const selectedIds = this.selectedRolesIds();
    const access = this.currentTipoAcceso();
    const term = this.rolSearchTerm().trim().toLowerCase();

    const entityRoleCodes = ['NOTARIA', 'CAMARA_COMERCIO', 'ORIP'];
    const gobRoleCodes = ['GOBERNACION', 'LIQUIDADOR_GOBERNACION', 'CONSULTA_GOBERNACION'];

    return allRoles.filter(rol => {
      // 1. Debe estar activo
      if (rol.activo === false) return false;

      // 2. Excluir roles ya seleccionados (sin duplicados)
      if (selectedIds.includes(rol.id)) return false;

      // 3. Aislamiento institucional según Tipo de Acceso
      const tipoCod = (rol.tipoRolCodigo || '').toUpperCase();
      const code = (rol.codigo || '').toUpperCase();

      if (access === 'GOBERNACION') {
        // En Gobernación: mostrar roles clasificados como GOBERNACION o GLOBAL
        if (tipoCod === 'ENTIDAD_REGISTRO') return false;
        if (!tipoCod && entityRoleCodes.includes(code)) return false;
      } else {
        // En Entidades de Registro: mostrar roles clasificados como ENTIDAD_REGISTRO o GLOBAL
        if (tipoCod === 'GOBERNACION') return false;
        if (!tipoCod && gobRoleCodes.includes(code)) return false;
      }

      // 4. Filtro por término de búsqueda si existe
      if (term) {
        const matchName = (rol.nombre || '').toLowerCase().includes(term);
        const matchCode = (rol.codigo || '').toLowerCase().includes(term);
        const matchTipo = (rol.tipoRolNombre || '').toLowerCase().includes(term);
        return matchName || matchCode || matchTipo;
      }

      return true;
    });
  });

  // Cerrar el dropdown al hacer clic fuera del componente
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.roles-multiselect-container')) {
      this.isRolesDropdownOpen.set(false);
    }
  }

  // --- Funciones de Búsqueda y Resolución para SearchableSelectComponent ---
  searchMunicipiosFn = (term: string) => {
    const depId = this.getCaucaId();
    return this.municipiosApi.obtenerTodos({
      pageNumber: 1,
      pageSize: 50,
      searchTerm: term,
      departamentoId: depId ? Number(depId) : undefined,
      activo: true
    }).pipe(map(res => res?.data?.items || []));
  };

  resolveMunicipioFn = (id: number) => {
    return this.municipiosApi.obtenerPorId(id).pipe(map(res => res?.data));
  };

  searchTiposEntidadFn = (term: string) => {
    return this.tiposEntidadApi.obtenerTodos({
      pageNumber: 1,
      pageSize: 50,
      searchTerm: term,
      activo: true
    }).pipe(map(res => res?.data?.items || []));
  };

  resolveTipoEntidadFn = (id: number) => {
    return this.tiposEntidadApi.obtenerPorId(id).pipe(map(res => res?.data));
  };

  searchEntidadesFn = (term: string) => {
    const munId = this.usuarioForm.get('municipioId')?.value;
    const tipoId = this.usuarioForm.get('tipoEntidadRegistroId')?.value;
    if (!munId || !tipoId) {
      return of([]);
    }
    return this.entidadesApi.obtenerTodos({
      pageNumber: 1,
      pageSize: 50,
      searchTerm: term,
      municipioId: Number(munId),
      tipoEntidadRegistroId: Number(tipoId),
      activo: true
    }).pipe(map(res => res?.data?.items || []));
  };

  resolveEntidadFn = (id: number) => {
    return this.entidadesApi.obtenerPorId(id).pipe(map(res => res?.data));
  };

  ngOnInit() {
    this.entidadesFacade.cargarEntidadesRegistro(1, 100);
    this.departamentosFacade.cargarDepartamentos(1, 100);
    this.municipiosFacade.cargarMunicipios(1, 200);
    this.rolesFacade.cargarRoles(1, 100);
    this.cargarItems();
    this.setupFormSubscriptions();
  }

  private setupFormSubscriptions() {
    // Sincronizar el signal selectedRolesIds con el control de formulario
    this.usuarioForm.get('rolesIds')?.valueChanges.subscribe(val => {
      this.selectedRolesIds.set(val || []);
    });

    // Al cambiar municipio o tipo de entidad manualmente, limpiar la entidad seleccionada
    this.usuarioForm.get('municipioId')?.valueChanges.pipe(distinctUntilChanged()).subscribe(() => {
      const ctrl = this.usuarioForm.get('municipioId');
      if (ctrl?.dirty && this.usuarioForm.get('tipoAcceso')?.value === 'ENTIDAD_REGISTRO') {
        if (this.usuarioForm.get('entidadRegistroId')?.value !== null) {
          this.usuarioForm.patchValue({ entidadRegistroId: null }, { emitEvent: false });
        }
      }
    });

    this.usuarioForm.get('tipoEntidadRegistroId')?.valueChanges.pipe(distinctUntilChanged()).subscribe(() => {
      const ctrl = this.usuarioForm.get('tipoEntidadRegistroId');
      if (ctrl?.dirty && this.usuarioForm.get('tipoAcceso')?.value === 'ENTIDAD_REGISTRO') {
        if (this.usuarioForm.get('entidadRegistroId')?.value !== null) {
          this.usuarioForm.patchValue({ entidadRegistroId: null }, { emitEvent: false });
        }
      }
    });

    // Al seleccionar una entidad de registro, auto-configurar departamento y sugerir rol
    this.usuarioForm.get('entidadRegistroId')?.valueChanges.pipe(distinctUntilChanged()).subscribe(entId => {
      if (entId) {
        this.onEntidadChange(Number(entId));
      }
    });
  }

  getCaucaId(): number | null {
    const d = this.departamentosFacade.departamentos().find(dept => dept.nombre.toLowerCase().includes('cauca') || dept.codigoDane === '19');
    return d ? d.id : null;
  }

  setEntidadValidators(isEntidad: boolean) {
    const entidadCtrl = this.usuarioForm.get('entidadRegistroId');
    const municipioCtrl = this.usuarioForm.get('municipioId');
    const tipoCtrl = this.usuarioForm.get('tipoEntidadRegistroId');

    if (isEntidad) {
      entidadCtrl?.setValidators([Validators.required]);
      municipioCtrl?.setValidators([Validators.required]);
      tipoCtrl?.setValidators([Validators.required]);
    } else {
      entidadCtrl?.clearValidators();
      municipioCtrl?.clearValidators();
      tipoCtrl?.clearValidators();
    }
    entidadCtrl?.updateValueAndValidity();
    municipioCtrl?.updateValueAndValidity();
    tipoCtrl?.updateValueAndValidity();
  }

  onTipoAccesoChange(tipo: 'GOBERNACION' | 'ENTIDAD_REGISTRO') {
    this.currentTipoAcceso.set(tipo);
    this.usuarioForm.patchValue({ tipoAcceso: tipo });
    const allRoles = this.rolesFacade.roles();
    const current = this.usuarioForm.get('rolesIds')?.value || [];

    if (tipo === 'GOBERNACION') {
      // Para gobernación, municipio y entidad son estrictamente null (visibilidad departamental)
      this.usuarioForm.patchValue({
        tipoEntidadRegistroId: null,
        entidadRegistroId: null,
        departamentoId: null,
        municipioId: null
      });
      this.setEntidadValidators(false);

      // Filtrar roles incompatibles con Gobernación (quitar roles exclusivos de entidades)
      const entityRoleCodes = ['NOTARIA', 'CAMARA_COMERCIO', 'ORIP'];
      const compatibleRoles = current.filter(id => {
        const rol = allRoles.find(r => r.id === id);
        if (!rol) return false;
        if (rol.tipoRolCodigo) {
          return rol.tipoRolCodigo === 'GOBERNACION' || rol.tipoRolCodigo === 'GLOBAL';
        }
        return !entityRoleCodes.includes(rol.codigo.toUpperCase());
      });

      // Si no queda ningún rol o estaba vacío, sugerir rol de Gobernación por defecto
      if (compatibleRoles.length === 0) {
        const gobRole = allRoles.find(r => 
          r.codigo.toUpperCase() === 'GOBERNACION' || 
          r.codigo.toUpperCase() === 'LIQUIDADOR_GOBERNACION' || 
          r.codigo.toUpperCase() === 'ADMINISTRADOR'
        );
        if (gobRole) {
          compatibleRoles.push(gobRole.id);
        }
      }

      this.usuarioForm.patchValue({ rolesIds: compatibleRoles });
      this.selectedRolesIds.set(compatibleRoles);
    } else {
      this.setEntidadValidators(true);

      // Filtrar roles incompatibles con Entidades de Registro (quitar roles exclusivos de Gobernación)
      const gobRoleCodes = ['GOBERNACION', 'LIQUIDADOR_GOBERNACION', 'CONSULTA_GOBERNACION'];
      const compatibleRoles = current.filter(id => {
        const rol = allRoles.find(r => r.id === id);
        if (!rol) return false;
        if (rol.tipoRolCodigo) {
          return rol.tipoRolCodigo === 'ENTIDAD_REGISTRO' || rol.tipoRolCodigo === 'GLOBAL';
        }
        return !gobRoleCodes.includes(rol.codigo.toUpperCase());
      });

      this.usuarioForm.patchValue({ rolesIds: compatibleRoles });
      this.selectedRolesIds.set(compatibleRoles);
    }
  }

  onEntidadChange(entidadId: number | string | null) {
    const idNum = entidadId ? Number(entidadId) : null;
    if (!idNum) return;

    this.entidadesApi.obtenerPorId(idNum).subscribe({
      next: (res) => {
        const ent = res?.data;
        if (ent) {
          const dId = ent.departamento?.id || (ent as any).departamentoId || this.getCaucaId();
          if (dId && this.usuarioForm.get('departamentoId')?.value !== dId) {
            this.usuarioForm.patchValue({ departamentoId: dId }, { emitEvent: false });
          }

          // Auto-sugerir rol basado en tipo o nombre de entidad
          const tipoCod = (ent.tipoEntidadRegistro?.codigo || ent.codigo || '').toUpperCase();
          const tipoNom = (ent.tipoEntidadRegistro?.nombre || '').toUpperCase();
          const nom = (ent.nombre || '').toUpperCase();

          let targetRoleCode = 'NOTARIA';
          if (tipoCod.includes('CAMAR') || tipoNom.includes('CAMAR') || nom.includes('CAMAR')) {
            targetRoleCode = 'CAMARA_COMERCIO';
          } else if (tipoCod.includes('ORIP') || tipoNom.includes('ORIP') || tipoNom.includes('INSTRUMENT') || nom.includes('INSTRUMENT')) {
            targetRoleCode = 'ORIP';
          } else if (tipoCod.includes('NOTAR') || tipoNom.includes('NOTAR') || nom.includes('NOTAR')) {
            targetRoleCode = 'NOTARIA';
          }

          const roleMatch = this.rolesFacade.roles().find(r => r.codigo.toUpperCase() === targetRoleCode);
          if (roleMatch) {
            const currentRoles = this.usuarioForm.get('rolesIds')?.value || [];
            if (!currentRoles.includes(roleMatch.id)) {
              // Reemplazar roles de otra entidad si había uno previo
              const entityCodes = ['NOTARIA', 'CAMARA_COMERCIO', 'ORIP'];
              const filtered = currentRoles.filter(id => {
                const r = this.rolesFacade.roles().find(x => x.id === id);
                return !r || !entityCodes.includes(r.codigo.toUpperCase());
              });
              const updated = [...filtered, roleMatch.id];
              this.usuarioForm.patchValue({ rolesIds: updated });
              this.selectedRolesIds.set(updated);
              this.toast.info(`Rol asignado automáticamente: ${roleMatch.nombre}`);
            }
          }
        }
      },
      error: (err) => console.error('Error al resolver entidad seleccionada', err)
    });
  }

  // --- Operaciones del Multi-Select de Roles ---
  onRolSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.rolSearchTerm.set(val);
    this.isRolesDropdownOpen.set(true);
  }

  clearRolSearch() {
    this.rolSearchTerm.set('');
  }

  toggleRolesDropdown(open?: boolean) {
    if (open !== undefined) {
      this.isRolesDropdownOpen.set(open);
    } else {
      this.isRolesDropdownOpen.set(!this.isRolesDropdownOpen());
    }
  }

  addRole(roleId: number) {
    const current = this.usuarioForm.get('rolesIds')?.value || [];
    if (!current.includes(roleId)) {
      const updated = [...current, roleId];
      this.usuarioForm.patchValue({ rolesIds: updated });
      this.selectedRolesIds.set(updated);
      this.usuarioForm.get('rolesIds')?.markAsDirty();
      this.usuarioForm.get('rolesIds')?.markAsTouched();
    }
    this.rolSearchTerm.set('');
    this.isRolesDropdownOpen.set(false);
  }

  removeRole(roleId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const current = this.usuarioForm.get('rolesIds')?.value || [];
    const updated = current.filter(id => id !== roleId);
    this.usuarioForm.patchValue({ rolesIds: updated });
    this.selectedRolesIds.set(updated);
    this.usuarioForm.get('rolesIds')?.markAsDirty();
    this.usuarioForm.get('rolesIds')?.markAsTouched();
  }

  getRoleBadgeClass(tipoRolCodigo?: string): string {
    const code = (tipoRolCodigo || '').toUpperCase();
    if (code === 'GOBERNACION') return 'bg-blue-50 text-blue-700 border-blue-200/80';
    if (code === 'ENTIDAD_REGISTRO') return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    if (code === 'GLOBAL') return 'bg-purple-50 text-purple-700 border-purple-200/80';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  getRoleIcon(tipoRolCodigo?: string): string {
    const code = (tipoRolCodigo || '').toUpperCase();
    if (code === 'GOBERNACION') return 'fa-solid fa-landmark';
    if (code === 'ENTIDAD_REGISTRO') return 'fa-solid fa-building-columns';
    if (code === 'GLOBAL') return 'fa-solid fa-globe';
    return 'fa-solid fa-shield-halved';
  }

  // --- Fin Multi-Select ---

  cargarItems() {
    let activo: boolean | undefined = undefined;
    if (this.selectedFilter() === 'activos') activo = true;
    if (this.selectedFilter() === 'inactivos') activo = false;
    this.facade.cargarUsuarios({ pageNumber: this.pageNumber(), pageSize: this.pageSize(), search: this.searchText(), activo });
  }

  onPageChange(page: number) {
    this.pageNumber.set(page);
    this.cargarItems();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.pageNumber.set(1);
    this.cargarItems();
  }

  onSearch(term: string) {
    this.searchText.set(term);
    this.pageNumber.set(1);
    this.cargarItems();
  }

  onClearSearch() {
    this.searchText.set('');
    this.pageNumber.set(1);
    this.cargarItems();
  }

  setFilter(filter: 'todos' | 'gobernacion' | 'entidades' | 'activos' | 'inactivos') {
    this.selectedFilter.set(filter);
    this.pageNumber.set(1);
    this.cargarItems();
  }

  openNew() {
    this.selectedId = null;
    this.currentTipoAcceso.set('GOBERNACION');
    this.rolSearchTerm.set('');
    this.isRolesDropdownOpen.set(false);

    // Sugerir rol institucional por defecto de Gobernación
    const gobRole = this.rolesFacade.roles().find(r => 
      r.codigo.toUpperCase() === 'GOBERNACION' || 
      r.codigo.toUpperCase() === 'LIQUIDADOR_GOBERNACION' || 
      r.codigo.toUpperCase() === 'ADMINISTRADOR'
    );
    const initialRoles = gobRole ? [gobRole.id] : [];
    this.selectedRolesIds.set(initialRoles);

    this.usuarioForm.reset({
      nombre: '',
      email: '',
      password: '',
      tipoAcceso: 'GOBERNACION',
      tipoEntidadRegistroId: null,
      entidadRegistroId: null,
      departamentoId: null,
      municipioId: null,
      rolesIds: initialRoles,
      activo: true
    });
    this.usuarioForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.setEntidadValidators(false);
    this.isSlideOverOpen = true;
  }

  edit(item: Usuario) {
    this.loadingEditId.set(item.id);
    this.apiService.obtenerPorId(item.id).subscribe({
      next: (res) => {
        this.loadingEditId.set(null);
        const data = res?.data || item;
        this.selectedId = data.id;
        const roleIds = data.roles ? data.roles.map(r => r.id) : [];
        const isEntidad = !!data.entidadRegistroId;

        this.selectedRolesIds.set(roleIds);
        this.currentTipoAcceso.set(isEntidad ? 'ENTIDAD_REGISTRO' : 'GOBERNACION');
        this.rolSearchTerm.set('');
        this.isRolesDropdownOpen.set(false);

        if (isEntidad && data.entidadRegistroId) {
          // Resolver detalles de la entidad para precargar municipio y tipo de entidad en la cascada
          this.entidadesApi.obtenerPorId(data.entidadRegistroId).subscribe({
            next: (entRes) => {
              const ent = entRes?.data;
              const tipoId = ent?.tipoEntidadRegistro?.id || (ent as any)?.tipoEntidadRegistroId || null;
              const munId = ent?.municipio?.id || (ent as any)?.municipioId || data.municipioId || null;
              const depId = ent?.departamento?.id || (ent as any)?.departamentoId || data.departamentoId || null;

              this.usuarioForm.patchValue({
                nombre: data.nombre,
                email: data.email,
                password: '',
                tipoAcceso: 'ENTIDAD_REGISTRO',
                tipoEntidadRegistroId: tipoId,
                municipioId: munId,
                departamentoId: depId,
                entidadRegistroId: data.entidadRegistroId,
                rolesIds: roleIds,
                activo: data.activo ?? true
              });
              this.setEntidadValidators(true);
              this.usuarioForm.get('password')?.clearValidators();
              this.usuarioForm.get('password')?.updateValueAndValidity();
              this.isSlideOverOpen = true;
            },
            error: () => {
              this.usuarioForm.patchValue({
                nombre: data.nombre,
                email: data.email,
                password: '',
                tipoAcceso: 'ENTIDAD_REGISTRO',
                tipoEntidadRegistroId: null,
                municipioId: data.municipioId || null,
                departamentoId: data.departamentoId || null,
                entidadRegistroId: data.entidadRegistroId,
                rolesIds: roleIds,
                activo: data.activo ?? true
              });
              this.setEntidadValidators(true);
              this.usuarioForm.get('password')?.clearValidators();
              this.usuarioForm.get('password')?.updateValueAndValidity();
              this.isSlideOverOpen = true;
            }
          });
        } else {
          this.usuarioForm.patchValue({
            nombre: data.nombre,
            email: data.email,
            password: '',
            tipoAcceso: 'GOBERNACION',
            tipoEntidadRegistroId: null,
            entidadRegistroId: null,
            departamentoId: null,
            municipioId: null,
            rolesIds: roleIds,
            activo: data.activo ?? true
          });
          this.setEntidadValidators(false);
          this.usuarioForm.get('password')?.clearValidators();
          this.usuarioForm.get('password')?.updateValueAndValidity();
          this.isSlideOverOpen = true;
        }
      },
      error: (err) => {
        this.loadingEditId.set(null);
        this.toast.error(formatUserErrorMessage(err, 'Error al obtener la información del usuario'));
        console.error(err);
      }
    });
  }

  promptToggleActivo(item: Usuario) {
    this.itemToToggle.set(item);
    this.isConfirmModalOpen.set(true);
  }

  cancelToggleActivo() {
    this.isConfirmModalOpen.set(false);
    this.itemToToggle.set(null);
  }

  executeToggleActivo() {
    const item = this.itemToToggle();
    if (!item) return;

    this.isTogglingStatus.set(true);
    const nuevoEstado = !(item.activo ?? true);
    const actionName = nuevoEstado ? 'activado' : 'desactivado';
    const roleIds = item.roles ? item.roles.map(r => r.id) : [];

    this.facade.actualizar(item.id, {
      id: item.id,
      nombre: item.nombre,
      email: item.email,
      activo: nuevoEstado,
      rolesIds: roleIds
    }).subscribe({
      next: () => {
        this.isTogglingStatus.set(false);
        this.isConfirmModalOpen.set(false);
        this.itemToToggle.set(null);
        this.toast.success(`Usuario ${actionName} exitosamente`);
        this.cargarItems();
      },
      error: (err: any) => {
        this.isTogglingStatus.set(false);
        this.toast.error(formatUserErrorMessage(err, `Error al actualizar el usuario`));
        console.error(err);
      }
    });
  }

  closeSlideOver() {
    this.isSlideOverOpen = false;
    this.selectedId = null;
    this.rolSearchTerm.set('');
    this.isRolesDropdownOpen.set(false);
  }

  saveUsuario() {
    if (this.usuarioForm.valid) {
      const val = this.usuarioForm.value;
      const isEntidad = val.tipoAcceso === 'ENTIDAD_REGISTRO';
      const actionName = this.isEditMode ? 'actualizado' : 'creado';

      const payload = {
        nombre: val.nombre!,
        email: val.email!,
        activo: val.activo ?? true,
        rolesIds: (val.rolesIds ?? []) as number[],
        departamentoId: isEntidad ? (val.departamentoId ?? null) : null,
        municipioId: isEntidad ? (val.municipioId ?? null) : null,
        entidadRegistroId: isEntidad ? (val.entidadRegistroId ?? null) : null
      };

      if (this.isEditMode) {
        this.facade.actualizar(this.selectedId!, {
          id: this.selectedId!,
          ...payload,
          password: val.password || null
        }).subscribe({
          next: () => {
            this.toast.success(`Usuario ${actionName} exitosamente`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, `Error al actualizar el usuario`));
            console.error(err);
          }
        });
      } else {
        this.facade.crear({
          ...payload,
          password: val.password!
        }).subscribe({
          next: () => {
            this.toast.success(`Usuario ${actionName} exitosamente con contraseña segura (BCrypt)`);
            this.closeSlideOver();
            this.cargarItems();
          },
          error: (err: any) => {
            this.toast.error(formatUserErrorMessage(err, `Error al crear el usuario`));
            console.error(err);
          }
        });
      }
    } else {
      this.toast.warning('Por favor complete los campos obligatorios del formulario.');
      this.usuarioForm.markAllAsTouched();
    }
  }
}
