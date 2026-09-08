import { Component, forwardRef, Input, OnInit, signal, effect, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';

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
export class SearchableSelectComponent implements ControlValueAccessor, OnInit {
  @Input() searchFn!: (term: string) => Observable<any[]>;
  @Input() resolveIdFn?: (id: any) => Observable<any>;
  @Input() labelKey: string = 'nombre';
  @Input() valueKey: string = 'id';
  @Input() placeholder: string = 'Seleccione...';
  @Input() disabled: boolean = false;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  options = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  isOpen = signal<boolean>(false);
  
  searchTerm = '';
  searchSubject = new Subject<string>();

  value: any = null;
  displayValue: string = '';

  onChange: any = () => {};
  onTouch: any = () => {};

  constructor(private eRef: ElementRef) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.isLoading.set(true)),
      switchMap(term => this.searchFn(term).pipe(
        catchError(() => of([]))
      )),
      tap(() => this.isLoading.set(false))
    ).subscribe(results => {
      this.options.set(results);
    });
  }

  ngOnInit(): void {
    // Initial load
    this.loadOptions('');
  }

  loadOptions(term: string) {
    this.isLoading.set(true);
    this.searchFn(term).pipe(
      catchError(() => of([]))
    ).subscribe(results => {
      this.options.set(results);
      this.isLoading.set(false);
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
      this.searchTerm = '';
      this.loadOptions('');
      setTimeout(() => {
        if (this.searchInput) {
          this.searchInput.nativeElement.focus();
        }
      });
    } else {
      this.onTouch();
    }
  }

  onSearch(event: any) {
    const val = event.target.value;
    this.searchTerm = val;
    this.searchSubject.next(val);
  }

  selectOption(option: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.value = option[this.valueKey];
    this.displayValue = option[this.labelKey];
    this.isOpen.set(false);
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
    // Try to find in current options
    if (this.resolveDisplayValueFromOptions()) {
      return;
    }

    // Try API resolve if provided
    if (this.resolveIdFn) {
      this.isLoading.set(true);
      this.resolveIdFn(id).pipe(
        catchError(() => of(null))
      ).subscribe(res => {
        if (res) {
          this.displayValue = res[this.labelKey];
          // Add to options so it's in the list
          const currentOpts = this.options();
          if (!currentOpts.find(o => o[this.valueKey] === id)) {
            this.options.set([res, ...currentOpts]);
          }
        }
        this.isLoading.set(false);
      });
    }
  }

  resolveDisplayValueFromOptions(): boolean {
    if (this.value !== null && this.value !== undefined) {
      const option = this.options().find(o => o[this.valueKey] === this.value);
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
