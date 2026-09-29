import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html'
})
export class ConfirmModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = '¿Confirmar cambio de estado?';
  @Input() message: string = '';
  @Input() impactMessage?: string;
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() confirmType: 'danger' | 'warning' | 'primary' | 'success' = 'warning';
  @Input() set type(val: 'danger' | 'warning' | 'primary' | 'success') {
    if (val) this.confirmType = val;
  }
  get type(): 'danger' | 'warning' | 'primary' | 'success' {
    return this.confirmType;
  }
  @Input() set confirmColor(val: 'danger' | 'warning' | 'primary' | 'success') {
    if (val) this.confirmType = val;
  }
  get confirmColor(): 'danger' | 'warning' | 'primary' | 'success' {
    return this.confirmType;
  }
  @Input() isProcessing: boolean = false;

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  handleConfirm() {
    if (!this.isProcessing) {
      this.onConfirm.emit();
      this.confirm.emit();
    }
  }

  handleCancel() {
    if (!this.isProcessing) {
      this.onCancel.emit();
      this.cancel.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen && !this.isProcessing) {
      this.handleCancel();
    }
  }
}
