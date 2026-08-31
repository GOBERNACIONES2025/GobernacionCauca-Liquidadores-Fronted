import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  SimpleChanges,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts';

export type EChartsOption = echarts.EChartsOption;
export type ECharts = echarts.ECharts;

@Component({
  selector: 'app-echarts-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full h-full min-h-[260px] flex items-center justify-center">
      @if (loading) {
        <div class="absolute inset-0 bg-white/75 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2 transition-all">
          <span class="loading loading-spinner loading-md text-primary"></span>
          <span class="text-xs text-slate-500 font-medium tracking-wide">Cargando métricas...</span>
        </div>
      }
      <div #chartContainer class="w-full h-full min-h-[260px]"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 260px;
    }
  `]
})
export class EchartsChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef<HTMLDivElement>;

  @Input() options: EChartsOption | null = null;
  @Input() loading: boolean = false;
  @Input() theme: string | object = '';

  private chartInstance: ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      if (!this.chartInstance) {
        this.initChart();
      } else if (this.options) {
        this.chartInstance.setOption(this.options, true);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener('resize', this.onWindowResize);
    if (this.chartInstance) {
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
  }

  private initChart(): void {
    if (!this.chartContainer?.nativeElement) return;

    if (this.chartInstance) {
      if (this.options) {
        this.chartInstance.setOption(this.options, true);
      }
      return;
    }

    const el = this.chartContainer.nativeElement;
    this.chartInstance = echarts.init(el, this.theme || undefined, {
      renderer: 'canvas',
    });

    if (this.options) {
      this.chartInstance.setOption(this.options, true);
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chartInstance) {
          this.chartInstance.resize();
        }
      });
      this.resizeObserver.observe(el);
    } else {
      window.addEventListener('resize', this.onWindowResize);
    }
  }

  private onWindowResize = (): void => {
    if (this.chartInstance) {
      this.chartInstance.resize();
    }
  };
}
