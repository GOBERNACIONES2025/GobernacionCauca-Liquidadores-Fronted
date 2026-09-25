import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-slide-over',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slide-over.html',
  styleUrl: './slide-over.css'
})
export class SlideOverComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Nuevo registro';
  @Input() description?: string;
  @Input() isSaving: boolean = false;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'lg';

  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<void>();

  close() {
    this.onClose.emit();
  }

  save() {
    this.onSave.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen && !this.isSaving) {
      this.close();
    }
  }
}
