import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contribuyente, Expediente } from '../../../domain/models/contribuyente.model';
import { ContribuyenteFormComponent } from '../../components/contribuyente-form/contribuyente-form.component';
import { ContribuyentesFacade } from '../../../application/facades/contribuyentes.facade';

/**
 * Componente principal para la Gestión de Contribuyentes.
 * Visualiza la tabla de contribuyentes, filtros reactivos y drawer de Expediente.
 */
@Component({
  selector: 'app-contribuyentes-index',
  standalone: true,
  imports: [CommonModule, FormsModule, ContribuyenteFormComponent],
  templateUrl: './contribuyentes-index.html',
  styleUrls: ['./styles-contribuyentes.css']
})
export class ContribuyentesIndex implements OnInit {
  public facade = inject(ContribuyentesFacade);
  
  isDrawerOpen: boolean = false;
  activeTab: string = 'Información';

  // Form State
  isFormOpen: boolean = false;
  formLoading: boolean = false;
  contribuyenteToEdit: Contribuyente | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.facade.cargarContribuyentes(1, 10);
  }

  openDrawer(contribuyente: Contribuyente): void {
    this.isDrawerOpen = true;
    this.activeTab = 'Información';
    this.facade.cargarExpediente(contribuyente.id);
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    setTimeout(() => {
      if (!this.isDrawerOpen) {
        this.facade.limpiarExpediente();
      }
    }, 300);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  cambiarPagina(page: number): void {
    if (page < 1 || page > this.facade.totalPaginas() || this.facade.loading()) return;
    this.facade.cargarContribuyentes(page, this.facade.pageSize());
  }

  refrescar(): void {
    this.facade.refrescar();
  }

  // Helper para clases CSS según tipo de persona
  getBgColor(tipoPersonaId: number): string {
    return tipoPersonaId === 1 ? 'bg-[#70b238]' : 'bg-[#1e3a7b]'; 
  }

  getTipoPersonaLabel(tipoPersonaId: number): string {
    return tipoPersonaId === 1 ? 'Persona Natural' : 'Persona Jurídica';
  }

  getIniciales(c: Contribuyente): string {
    if (c.razonSocial) return c.razonSocial.substring(0, 2).toUpperCase();
    return `${c.primerNombre?.charAt(0) ?? ''}${c.primerApellido?.charAt(0) ?? ''}`.toUpperCase();
  }

  getNombreCompleto(c: Contribuyente): string {
    if (c.razonSocial) return c.razonSocial;
    return `${c.primerNombre ?? ''} ${c.segundoNombre ?? ''} ${c.primerApellido ?? ''} ${c.segundoApellido ?? ''}`.replace(/\s+/g, ' ').trim();
  }

  // ---- FORMULARIO ----

  openForm(contribuyente?: Contribuyente): void {
    this.contribuyenteToEdit = contribuyente || null;
    this.isFormOpen = true;
    this.cdr.detectChanges();
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      if (!this.isFormOpen) {
        this.contribuyenteToEdit = null;
      }
    }, 300);
  }

  saveContribuyente(data: any): void {
    this.formLoading = true;
    this.cdr.detectChanges();

    console.log('Enviando datos al API:', data);

    const request = this.contribuyenteToEdit 
      ? this.facade.actualizarContribuyente(this.contribuyenteToEdit.id, data)
      : this.facade.crearContribuyente(data);

    request.subscribe({
      next: (response: any) => {
        console.log('Respuesta del servidor al guardar:', response);
        const isSuccess = response?.success ?? response?.succeeded ?? (response && !response?.errors);
        
        if (isSuccess || (response && response !== false)) {
          this.closeForm();
          this.facade.cargarContribuyentes(1, 20);
          
          // Si el drawer está abierto para el mismo contribuyente, actualizar el drawer
          const selectedId = this.facade.selectedExpediente()?.propietario.id;
          if (this.isDrawerOpen && this.contribuyenteToEdit && selectedId === this.contribuyenteToEdit.id) {
            this.facade.cargarExpediente(this.contribuyenteToEdit.id);
          }
        } else {
          console.error('API Error al guardar:', response?.message || response?.messages || response?.errors);
          alert('Error al guardar: ' + (response?.message || 'Verifica los datos e intenta nuevamente.'));
        }
        this.formLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error de red/servidor guardando contribuyente:', err);
        const errMsg = err?.error?.message || err?.message || 'Error de conexión con el servidor.';
        alert('Error al guardar: ' + errMsg);
        this.formLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
