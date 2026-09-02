import { Component, Input, Output, EventEmitter, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  LIQUIDADORES_CONSULTA_CONFIG, 
  LiquidadorConsultaConfig, 
  LiquidadorConsultaExample 
} from '../../config/liquidadores-consulta.config';

export interface ConsultaSubmitPayload {
  config: LiquidadorConsultaConfig;
  tipoDocumento: string;
  numeroDocumento: string;
  secondaryValue: string;
}

@Component({
  selector: 'app-consulta-ciudadana-shared',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consulta-ciudadana-shared.html',
})
export class ConsultaCiudadanaSharedComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** Si se pasa directamente por propiedad Input */
  @Input() liquidadorKey?: string;

  /** Evento emitido cuando el ciudadano envía la consulta */
  @Output() onConsultar = new EventEmitter<ConsultaSubmitPayload>();

  readonly tipoDocumento = signal<string>('CC');
  readonly numeroDocumento = signal<string>('');
  readonly secondaryValue = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  /** Configuración reactiva activa según la ruta o la propiedad Input */
  readonly activeKey = signal<string>('automotores');

  readonly config = computed<LiquidadorConsultaConfig>(() => {
    const key = this.activeKey().toLowerCase();
    return LIQUIDADORES_CONSULTA_CONFIG[key] || LIQUIDADORES_CONSULTA_CONFIG['automotores'];
  });

  ngOnInit(): void {
    this.detectarLiquidadorActivo();
  }

  private detectarLiquidadorActivo(): void {
    if (this.liquidadorKey) {
      this.activeKey.set(this.liquidadorKey);
      return;
    }

    const url = this.router.url.toLowerCase();
    if (url.includes('pasaportes')) {
      this.activeKey.set('pasaportes');
    } else if (url.includes('registros')) {
      this.activeKey.set('registros');
    } else if (url.includes('deguello')) {
      this.activeKey.set('deguello');
    } else {
      this.activeKey.set('automotores');
    }
  }

  cargarEjemplo(ejemplo: LiquidadorConsultaExample): void {
    this.tipoDocumento.set('CC');
    this.numeroDocumento.set(ejemplo.doc);
    this.secondaryValue.set(ejemplo.secondary);
    this.submitForm();
  }

  formatearSecondaryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.toUpperCase();
    if (this.activeKey() === 'automotores') {
      val = val.replace(/[^A-Z0-9]/g, '');
      if (val.length > 3) {
        val = `${val.substring(0, 3)}-${val.substring(3, 6)}`;
      }
    }
    this.secondaryValue.set(val);
  }

  irASolicitudPasaporte(): void {
    this.router.navigate(['/pasaportes']);
  }

  submitForm(): void {
    if (this.activeKey() === 'pasaportes') {
      this.irASolicitudPasaporte();
      return;
    }

    const doc = this.numeroDocumento().trim();
    const sec = this.secondaryValue().trim();
    const cfg = this.config();

    if (!doc || !sec) {
      this.errorMessage.set(`Por favor ingrese su número de identificación y ${cfg.secondaryFieldLabel.toLowerCase().replace(':', '')}.`);
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.onConsultar.emit({
      config: cfg,
      tipoDocumento: this.tipoDocumento(),
      numeroDocumento: doc,
      secondaryValue: sec,
    });
  }

  setLoading(val: boolean): void {
    this.isLoading.set(val);
  }

  setErrorMessage(msg: string | null): void {
    this.errorMessage.set(msg);
  }

  salir(): void {
    this.router.navigate(['/']);
  }
}
