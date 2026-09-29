import { Component, forwardRef, Input, OnInit, OnChanges, SimpleChanges, signal, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './searchable-select.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true
    }
  ]
})
export class SearchableSelectComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() items?: any[] | null;
  @Input() searchFn?: (term: string) => Observable<any[]>;
  @Input() resolveIdFn?: (id: any) => Observable<any>;
  @Input() labelKey: string = 'nombre';
  @Input() valueKey: string = 'id';
  @Input() placeholder: string = 'Seleccione...';
  @Input() disabled: boolean = false;
  @Input() isInvalid: boolean | undefined | null = false;
  @Input() pageSize: number = 8;
  @Input() enablePagination: boolean = true;
  @Input() dependency?: any;
  @Input() icon?: string;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('optionsList') optionsListRef!: ElementRef<HTMLUListElement>;

  options = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  isOpen = signal<boolean>(false);
  highlightedIndex = signal<number>(-1);
  
  searchTerm = '';

  value: any = null;
  displayValue: string = '';

  onChange: any = () => {};
  onTouch: any = () => {};

  paginatedOptions = computed(() => {
    if (!this.enablePagination || this.pageSize <= 0) {
      return this.options();
    }
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.options().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => {
    if (!this.enablePagination || this.pageSize <= 0 || this.options().length === 0) {
      return 1;
    }
    return Math.ceil(this.options().length / this.pageSize);
  });

  constructor(private eRef: ElementRef) {}

  ngOnInit(): void {
    if (this.items) {
      this.options.set(this.items);
      this.resolveDisplayValueFromOptions();
    } else if (this.searchFn) {
      this.loadOptions('');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      const current = this.items || [];
      this.filterLocal(this.searchTerm);
      this.resolveDisplayValueFromOptions();
    }
  }

  private normalizeText(str: string): string {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private filterLocal(term: string) {
    const rawItems = this.items || [];
    const normalizedTerm = this.normalizeText(term.trim());

    if (!normalizedTerm) {
      this.options.set(rawItems);
    } else {
      const filtered = rawItems.filter(item => {
        const label = this.normalizeText(String(item[this.labelKey] ?? ''));
        const val = this.normalizeText(String(item[this.valueKey] ?? ''));
        const code = item.codigo ? this.normalizeText(String(item.codigo)) : '';
        return label.includes(normalizedTerm) || val.includes(normalizedTerm) || code.includes(normalizedTerm);
      });
      this.options.set(filtered);
    }
    this.highlightedIndex.set(this.options().length > 0 ? 0 : -1);
  }

  loadOptions(term: string) {
    if (this.items) {
      this.filterLocal(term);
      return;
    }

    if (!this.searchFn) return;

    this.isLoading.set(true);
    this.searchFn(term).pipe(
      catchError(() => of([]))
    ).subscribe(results => {
      this.options.set(results || []);
      this.isLoading.set(false);
      this.highlightedIndex.set(this.options().length > 0 ? 0 : -1);
      this.resolveDisplayValueFromOptions();
    });
  }

  // Value Accessor methods
  writeValue(obj: any): void {
    this.value = obj;
    if (obj !== null && obj !== undefined) {
      this.resolveInitialValue(obj);
    } else {
      this.displayValue = '';
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Component logic
  toggleDropdown() {
    if (this.disabled) return;
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      if (this.items) {
        this.filterLocal(this.searchTerm);
      } else if (this.options().length === 0) {
        this.loadOptions('');
      }
      this.highlightedIndex.set(this.options().findIndex(o => o[this.valueKey] === this.value));
      setTimeout(() => {
        if (this.searchInput) {
          this.searchInput.nativeElement.focus();
        }
      });
    } else {
      this.onTouch();
    }
  }

  onTriggerKeyDown(event: KeyboardEvent) {
    if (this.disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.toggleDropdown();
      }
    }
  }

  onSearchKeyDown(event: KeyboardEvent) {
    const opts = this.options();
    const len = opts.length;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (len > 0) {
        const next = (this.highlightedIndex() + 1) % len;
        this.highlightedIndex.set(next);
        this.scrollToHighlighted();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (len > 0) {
        const prev = this.highlightedIndex() <= 0 ? len - 1 : this.highlightedIndex() - 1;
        this.highlightedIndex.set(prev);
        this.scrollToHighlighted();
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.highlightedIndex();
      if (idx >= 0 && idx < len) {
        this.selectOption(opts[idx]);
      } else if (this.searchFn && !this.items) {
        this.onSearchSubmit();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.isOpen.set(false);
      this.onTouch();
    }
  }

  private scrollToHighlighted() {
    setTimeout(() => {
      const el = this.optionsListRef?.nativeElement?.querySelector?.('.is-highlighted') as HTMLElement;
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  onSearchInput(event: any) {
    // Solo captura el término escrito sin ejecutar búsqueda por coincidencia automática
    this.searchTerm = event?.target ? event.target.value : (event || '');
    if (this.items) {
      this.filterLocal(this.searchTerm);
    } else if (this.searchFn) {
      this.loadOptions(this.searchTerm);
    }
  }

  onSearchSubmit(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    // Solo aquí se ejecuta la búsqueda al pulsar el botón Buscar o presionar Enter
    this.loadOptions(this.searchTerm.trim());
  }

  clearSearch(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.searchTerm = '';
    this.loadOptions('');
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    });
  }

  selectOption(option: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.value = option[this.valueKey];
    this.displayValue = option[this.labelKey];
    this.isOpen.set(false);
    this.searchTerm = '';
    this.loadOptions('');
    this.onChange(this.value);
    this.onTouch();
  }

  clearSelection(event: Event) {
    event.stopPropagation();
    this.value = null;
    this.displayValue = '';
    this.onChange(this.value);
    this.onTouch();
  }

  resolveInitialValue(id: any) {
    // Try to find in current options or items
    if (this.resolveDisplayValueFromOptions()) {
      return;
    }

    if (this.items) {
      const found = this.items.find(o => String(o[this.valueKey]) === String(id));
      if (found) {
        this.displayValue = found[this.labelKey];
        return;
      }
    }

    // Try API resolve if provided
    if (this.resolveIdFn) {
      this.isLoading.set(true);
      this.resolveIdFn(id).pipe(
        catchError(() => of(null))
      ).subscribe(res => {
        if (res) {
          this.displayValue = res[this.labelKey];
          const currentOpts = this.options();
          if (!currentOpts.find(o => String(o[this.valueKey]) === String(id))) {
            this.options.set([res, ...currentOpts]);
          }
        }
        this.isLoading.set(false);
      });
    }
  }

  resolveDisplayValueFromOptions(): boolean {
    if (this.value !== null && this.value !== undefined) {
      const opts = this.items || this.options();
      const option = opts.find(o => String(o[this.valueKey]) === String(this.value));
      if (option) {
        this.displayValue = option[this.labelKey];
        return true;
      }
    }
    return false;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      if (this.isOpen()) {
        this.isOpen.set(false);
        this.onTouch();
      }
    }
  }
}
