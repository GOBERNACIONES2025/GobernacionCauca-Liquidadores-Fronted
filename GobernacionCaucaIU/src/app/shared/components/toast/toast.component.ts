import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast toast-top toast-end z-[9999]">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="alert shadow-lg" [class]="getAlertClass(toast.type)">
          <span>{{ toast.message }}</span>
          <button (click)="toastService.remove(toast.id)" class="btn btn-ghost btn-xs btn-circle ml-2">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast {
      pointer-events: none;
    }
    .alert {
      pointer-events: auto;
      animation: slideIn 0.3s ease-out forwards;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  public toastService = inject(ToastService);

  getAlertClass(type: string): string {
    switch (type) {
      case 'success': return 'alert-success text-white font-bold';
      case 'error': return 'alert-error text-white font-bold';
      case 'warning': return 'alert-warning font-bold';
      default: return 'alert-info text-white font-bold';
    }
  }
}
