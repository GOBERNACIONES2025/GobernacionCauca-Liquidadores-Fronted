import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeguelloService } from '../../../infrastructure/services/deguello.service';
import { PlantaBeneficio } from '../../../domain/models/deguello.model';

@Component({
  selector: 'app-deguello-empresas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deguello-empresas.html',
})
export class DeguelloEmpresasComponent implements OnInit {
  private deguelloService = inject(DeguelloService);

  readonly plantas = signal<PlantaBeneficio[]>([]);
  readonly cargando = signal<boolean>(false);
  readonly guardando = signal<boolean>(false);

  // Filtros y Búsqueda
  readonly busqueda = signal<string>('');
  readonly filtroEstado = signal<'TODAS' | 'ACTIVAS' | 'INACTIVAS'>('TODAS');
  readonly filtroTipo = signal<'TODAS' | 'FRIGORIFICOS' | 'LOCALES'>('TODAS');

  // Modales
  readonly modalAbierto = signal<boolean>(false);
  readonly modalClaveAbierto = signal<boolean>(false);
  readonly plantaSeleccionada = signal<PlantaBeneficio | null>(null);

  // Notificaciones
  readonly mensajeNotificacion = signal<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Formulario de Empresa / Planta
  formEmpresa = {
    idPlanta: null as number | null,
    nombre: '',
    nit: '',
    dv: '9',
    municipio: 'POPAYÁN',
    direccion: '',
    telefono: '',
    emailOficial: '',
    claveAcceso: '123456',
    representanteLegal: '',
    docRepresentante: '',
    codigoInvima: '',
    capacidadDiariaCabezas: 60,
    esFrigorificoRegional: false,
    esActiva: true,
  };

  readonly municipiosCauca = [
    'POPAYÁN',
    'PATÍA - EL BORDO',
    'SANTANDER DE QUILICHAO',
    'BOLÍVAR',
    'EL TAMBO',
    'PUERTO TEJADA',
    'PIENDAMÓ',
    'TIMBÍO',
    'SILVIA',
    'CALOTO',
    'MERCADERES',
    'LA SIERRA',
    'SUCRE',
    'ALMAGUER',
    'BALBOA',
    'BUENOS AIRES',
    'CAJIBÍO',
    'CORINTO',
    'MORALES',
    'PADILLA',
    'ROSAS',
    'SOTARÁ',
    'TORIBÍO',
  ];

  // Métricas reactivas
  readonly totalEmpresas = computed(() => this.plantas().length);

  readonly totalActivas = computed(() => {
    return this.plantas().filter((p) => p.esActiva).length;
  });

  readonly totalFrigorificos = computed(() => {
    return this.plantas().filter((p) => p.esFrigorificoRegional).length;
  });

  readonly totalCapacidadDiaria = computed(() => {
    return this.plantas().reduce((acc, curr) => acc + (curr.capacidadDiariaCabezas || 0), 0);
  });

  // Lista filtrada
  readonly plantasFiltradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const estado = this.filtroEstado();
    const tipo = this.filtroTipo();

    return this.plantas().filter((p) => {
      // Filtro texto
      const matchText =
        !q ||
        (p.nombre && p.nombre.toLowerCase().includes(q)) ||
        (p.nit && p.nit.toLowerCase().includes(q)) ||
        (p.municipio && p.municipio.toLowerCase().includes(q)) ||
        (p.codigoInvima && p.codigoInvima.toLowerCase().includes(q)) ||
        (p.representanteLegal && p.representanteLegal.toLowerCase().includes(q));

      if (!matchText) return false;

      // Filtro estado
      if (estado === 'ACTIVAS' && !p.esActiva) return false;
      if (estado === 'INACTIVAS' && p.esActiva) return false;

      // Filtro tipo
      if (tipo === 'FRIGORIFICOS' && !p.esFrigorificoRegional) return false;
      if (tipo === 'LOCALES' && p.esFrigorificoRegional) return false;

      return true;
    });
  });

  ngOnInit(): void {
    this.cargarPlantas();
  }

  cargarPlantas(): void {
    this.cargando.set(true);
    this.deguelloService.listarPlantasBeneficio().subscribe({
      next: (data) => {
        this.plantas.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.mostrarMensaje('error', 'Error al consultar las plantas de beneficio registradas.');
      },
    });
  }

  abrirModalNueva(): void {
    const randomInv = Math.floor(100 + Math.random() * 900);
    this.formEmpresa = {
      idPlanta: null,
      nombre: '',
      nit: '',
      dv: '9',
      municipio: 'POPAYÁN',
      direccion: '',
      telefono: '',
      emailOficial: '',
      claveAcceso: '123456',
      representanteLegal: '',
      docRepresentante: '',
      codigoInvima: `INV-PBA-CAUCA-${randomInv}`,
      capacidadDiariaCabezas: 60,
      esFrigorificoRegional: false,
      esActiva: true,
    };
    this.modalAbierto.set(true);
  }

  abrirModalEditar(p: PlantaBeneficio): void {
    this.formEmpresa = {
      idPlanta: p.idPlanta || Number(p.id?.replace(/\D/g, '')) || null,
      nombre: p.nombre,
      nit: p.nit || '',
      dv: '9',
      municipio: p.municipio || 'POPAYÁN',
      direccion: p.direccion || '',
      telefono: p.telefono || '',
      emailOficial: p.emailOficial || '',
      claveAcceso: p.claveAcceso || '123456',
      representanteLegal: p.representanteLegal || '',
      docRepresentante: p.docRepresentante || '',
      codigoInvima: p.codigoInvima || '',
      capacidadDiariaCabezas: p.capacidadDiariaCabezas || 50,
      esFrigorificoRegional: !!p.esFrigorificoRegional,
      esActiva: p.esActiva !== false,
    };
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  guardarEmpresa(): void {
    if (!this.formEmpresa.nombre.trim()) {
      this.mostrarMensaje('error', 'La Razón Social o Nombre de la empresa es obligatorio.');
      return;
    }
    if (!this.formEmpresa.nit.trim()) {
      this.mostrarMensaje('error', 'El NIT de la empresa es obligatorio para su identificación fiscal.');
      return;
    }

    this.guardando.set(true);

    const dataAGuardar: Partial<PlantaBeneficio> = {
      idPlanta: this.formEmpresa.idPlanta || undefined,
      nombre: this.formEmpresa.nombre.trim().toUpperCase(),
      nit: this.formEmpresa.nit.trim(),
      codigoInvima: this.formEmpresa.codigoInvima.trim().toUpperCase() || 'INV-PBA-GEN',
      municipio: this.formEmpresa.municipio,
      direccion: this.formEmpresa.direccion.trim().toUpperCase() || 'DIRECCIÓN REGISTRADA',
      telefono: this.formEmpresa.telefono.trim(),
      emailOficial: this.formEmpresa.emailOficial.trim(),
      claveAcceso: this.formEmpresa.claveAcceso.trim() || '123456',
      representanteLegal: this.formEmpresa.representanteLegal.trim().toUpperCase(),
      docRepresentante: this.formEmpresa.docRepresentante.trim(),
      capacidadDiariaCabezas: Number(this.formEmpresa.capacidadDiariaCabezas) || 50,
      esFrigorificoRegional: this.formEmpresa.esFrigorificoRegional,
      esActiva: this.formEmpresa.esActiva,
    };

    this.deguelloService.guardarPlantaBeneficio(dataAGuardar).subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.success) {
          this.mostrarMensaje('success', `Empresa "${dataAGuardar.nombre}" registrada correctamente en el censo tributario.`);
          this.modalAbierto.set(false);
          this.cargarPlantas();
        } else {
          this.mostrarMensaje('error', res.message || 'No se pudo guardar la información en base de datos.');
        }
      },
      error: () => {
        this.guardando.set(false);
        this.mostrarMensaje('error', 'Error en la comunicación con el servidor de base de datos.');
      },
    });
  }

  toggleEstado(p: PlantaBeneficio): void {
    const nuevoEstado = !p.esActiva;
    const dataActualizada: Partial<PlantaBeneficio> = {
      ...p,
      esActiva: nuevoEstado,
    };

    this.deguelloService.guardarPlantaBeneficio(dataActualizada).subscribe({
      next: (res) => {
        if (res.success) {
          this.mostrarMensaje(
            'success',
            `Estado de ${p.nombre} cambiado a ${nuevoEstado ? 'ACTIVA' : 'INACTIVA'}.`
          );
          this.cargarPlantas();
        } else {
          this.mostrarMensaje('error', 'No se pudo actualizar el estado de la planta.');
        }
      },
      error: () => {
        this.mostrarMensaje('error', 'Error al cambiar estado.');
      },
    });
  }

  abrirModalClave(p: PlantaBeneficio): void {
    this.plantaSeleccionada.set(p);
    this.modalClaveAbierto.set(true);
  }

  cerrarModalClave(): void {
    this.modalClaveAbierto.set(false);
    this.plantaSeleccionada.set(null);
  }

  copiarCredenciales(p: PlantaBeneficio): void {
    const texto = `NIT: ${p.nit}\nClave: ${p.claveAcceso || '123456'}\nPortal: ${window.location.origin}/deguello/portal-ciudadano`;
    navigator.clipboard.writeText(texto).then(() => {
      this.mostrarMensaje('success', 'Credenciales copiadas al portapapeles.');
    });
  }

  mostrarMensaje(tipo: 'success' | 'error', texto: string): void {
    this.mensajeNotificacion.set({ tipo, texto });
    setTimeout(() => {
      this.mensajeNotificacion.set(null);
    }, 4500);
  }
}
