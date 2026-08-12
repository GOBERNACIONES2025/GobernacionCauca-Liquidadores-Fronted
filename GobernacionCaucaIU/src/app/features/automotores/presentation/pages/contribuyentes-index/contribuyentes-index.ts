import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContribuyentesService } from '../../../../../core/services/contribuyentes.service';
import { Contribuyente, Expediente, ApiResponse, PagedResult } from '../../../../../core/models/contribuyente.model';
import { ContribuyenteFormComponent } from '../../components/contribuyente-form/contribuyente-form.component';

/**
 * Componente principal para la Gestión de Contribuyentes.
 * Visualiza la grilla de contribuyentes, los KPIs y permite abrir un panel lateral (Expediente).
 */
@Component({
  selector: 'app-contribuyentes-index',
  standalone: true,
  imports: [CommonModule, ContribuyenteFormComponent],
  templateUrl: './contribuyentes-index.html',
  styleUrls: ['./styles-contribuyentes.css']
})
export class ContribuyentesIndex implements OnInit {
  isDrawerOpen: boolean = false;
  activeTab: string = 'Información';
  
  contribuyentes: Contribuyente[] = [];
  selectedExpediente: Expediente | null = null;
  
  loading: boolean = false;
  drawerLoading: boolean = false;

  // Form State
  isFormOpen: boolean = false;
  formLoading: boolean = false;
  contribuyenteToEdit: Contribuyente | null = null;

  // KPIs
  totalContribuyentes: number = 0;
  totalAlDia: number = 0;
  totalMorosos: number = 0;
  totalDeudores: number = 0;

  constructor(
    private contribuyentesService: ContribuyentesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadContribuyentes();
  }

  loadContribuyentes(): void {
    this.loading = true;
    this.contribuyentesService.getContribuyentes(1, 20)
      .subscribe({
        next: (response: ApiResponse<PagedResult<Contribuyente>>) => {
          if (response.success) {
            this.contribuyentes = response.data.items;
            this.totalContribuyentes = response.data.totalCount;
            // Cálculo dinámico para la página actual (hasta que el backend exponga un endpoint de estadísticas generales)
            this.totalAlDia = this.contribuyentes.filter(c => c.cantidadDeudas === 0).length;
            this.totalMorosos = this.contribuyentes.filter(c => c.cantidadDeudas > 0).length;
            this.totalDeudores = this.contribuyentes.filter(c => c.cantidadDeudas > 0).length;
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error cargando contribuyentes:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  openDrawer(contribuyente: Contribuyente): void {
    this.isDrawerOpen = true;
    this.activeTab = 'Información';
    this.drawerLoading = true;
    this.selectedExpediente = null;
    this.cdr.detectChanges();

    this.contribuyentesService.getExpediente(contribuyente.id)
      .subscribe({
        next: (response: ApiResponse<Expediente>) => {
          if (response.success) {
            this.selectedExpediente = response.data;
          }
          this.drawerLoading = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error cargando expediente:', err);
          this.drawerLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    // Opcional: limpiar la selección después de la animación
    setTimeout(() => {
      if (!this.isDrawerOpen) {
        this.selectedExpediente = null;
      }
    }, 300);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Helper para clases CSS según tipo de persona
  getBgColor(tipoPersonaId: number): string {
    return tipoPersonaId === 1 ? 'bg-[#70b238]' : 'bg-[#1e3a7b]'; 
    // Suponiendo 1 = Natural, 2 = Jurídica (Ajustar según BD)
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

    if (this.contribuyenteToEdit) {
      this.contribuyentesService.updateContribuyente(this.contribuyenteToEdit.id, data)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.closeForm();
              this.loadContribuyentes();
              // Si el drawer está abierto para el mismo contribuyente, actualizar el drawer
              if (this.isDrawerOpen && this.selectedExpediente?.propietario.id === this.contribuyenteToEdit?.id) {
                this.openDrawer(response.data);
              }
            }
            this.formLoading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error actualizando contribuyente', err);
            this.formLoading = false;
            this.cdr.detectChanges();
          }
        });
    } else {
      this.contribuyentesService.createContribuyente(data)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.closeForm();
              this.loadContribuyentes();
            }
            this.formLoading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error creando contribuyente', err);
            this.formLoading = false;
            this.cdr.detectChanges();
          }
        });
    }
  }
}
