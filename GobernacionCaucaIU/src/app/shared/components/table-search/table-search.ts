import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-table-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table-search.html',
  styleUrl: './table-search.css'
})
export class TableSearchComponent implements OnChanges {
  @Input() placeholder: string = 'Buscar en tabla...';
  @Input() value: string = '';
  @Input() loading: boolean = false;
  @Input() buttonText: string = 'Buscar';

  @Output() search = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();

  searchTerm: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && changes['value'].currentValue !== undefined) {
      this.searchTerm = changes['value'].currentValue || '';
    }
  }

  onSearch(): void {
    this.search.emit(this.searchTerm.trim());
  }

  onClear(): void {
    this.searchTerm = '';
    this.clear.emit();
  }

  onKeyDownEnter(event: Event): void {
    event.preventDefault();
    this.onSearch();
  }
}
