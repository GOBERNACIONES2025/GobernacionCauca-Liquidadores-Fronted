import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html'
})
export class PaginationComponent implements OnChanges {
  @Input() pageNumber: number = 1;
  @Input() pageSize: number = 10;
  @Input() totalCount: number = 0;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50, 100];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  totalPages = 0;
  startIndex = 0;
  endIndex = 0;

  ngOnChanges(changes: SimpleChanges): void {
    this.calculatePagination();
  }

  private calculatePagination(): void {
    if (this.totalCount === 0) {
      this.totalPages = 0;
      this.startIndex = 0;
      this.endIndex = 0;
      return;
    }

    this.totalPages = Math.ceil(this.totalCount / this.pageSize);
    this.startIndex = (this.pageNumber - 1) * this.pageSize + 1;
    this.endIndex = Math.min(this.startIndex + this.pageSize - 1, this.totalCount);
  }

  onPrevious(): void {
    if (this.pageNumber > 1) {
      this.pageChange.emit(this.pageNumber - 1);
    }
  }

  onNext(): void {
    if (this.pageNumber < this.totalPages) {
      this.pageChange.emit(this.pageNumber + 1);
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = Number(select.value);
    this.pageSizeChange.emit(newSize);
  }
}
