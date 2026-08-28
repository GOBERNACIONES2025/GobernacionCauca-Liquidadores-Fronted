import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-slide-over',
  imports: [],
  templateUrl: './slide-over.html',
  styleUrl: './slide-over.css'
})
export class SlideOverComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Nuevo registro';
  @Input() description?: string;
  @Input() isSaving: boolean = false;

  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<void>();

  close() {
    this.onClose.emit();
  }

  save() {
    this.onSave.emit();
  }
}
