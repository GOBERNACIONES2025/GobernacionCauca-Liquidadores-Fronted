import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estampillas-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">{{ title() }}</p>
          <h3 class="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{{ value() }}</h3>
          @if (subtitle()) {
            <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
              {{ subtitle() }}
            </p>
          }
        </div>
        <div [class]="iconBgClass() + ' p-3 rounded-xl text-white shadow-xs shrink-0'">
          <ng-content></ng-content>
        </div>
      </div>
      @if (badgeText()) {
        <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span class="text-slate-500">{{ badgeLabel() }}</span>
          <span [class]="badgeClass() + ' font-semibold px-2 py-0.5 rounded-full text-[11px]'">{{ badgeText() }}</span>
        </div>
      }
      <div [class]="'absolute bottom-0 left-0 right-0 h-1 ' + iconBgClass()"></div>
    </div>
  `
})
export class EstampillasStatCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string>();
  readonly subtitle = input<string>('');
  readonly badgeLabel = input<string>('');
  readonly badgeText = input<string>('');
  readonly badgeClass = input<string>('text-emerald-700 bg-emerald-50');
  readonly iconBgClass = input<string>('bg-blue-600');
  readonly gradientBarClass = input<string>('');
}
