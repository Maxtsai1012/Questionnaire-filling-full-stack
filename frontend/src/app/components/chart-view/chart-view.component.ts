import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as echarts from 'echarts';
import { ECharts, EChartsOption } from 'echarts';
import { OptionStat } from '../../core/models/survey.model';

@Component({
  selector: 'app-chart-view',
  template: `
    <div class="chart-container">
      <div class="chart-empty" *ngIf="!hasData">目前尚無統計資料</div>
      <div #chartHost class="chart-host" [hidden]="!hasData" role="img"
        aria-label="選項票數圓餅圖"></div>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
      max-width: 720px;
      min-height: 400px;
      margin: 16px auto;
    }
    .chart-host { width: 100%; height: 400px; }
    .chart-empty {
      height: 400px;
      display: grid;
      place-items: center;
      color: var(--text-light);
      font-weight: 600;
    }
  `],
})
export class ChartViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartHost') chartHost!: ElementRef<HTMLDivElement>;
  @Input() options: OptionStat[] = [];

  private chart: ECharts | null = null;
  private readonly palette = ['#1F8196', '#214A58', '#3FC0D1', '#7BDBE5', '#B1EBF0'];
  private readonly resizeHandler = () => this.chart?.resize();

  get hasData(): boolean {
    return this.options.some(option => option.count > 0);
  }

  ngAfterViewInit(): void {
    window.addEventListener('resize', this.resizeHandler);
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && this.chartHost) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    this.chart?.dispose();
  }

  private renderChart(): void {
    if (!this.chartHost) return;
    if (!this.hasData) {
      this.chart?.clear();
      return;
    }
    this.chart ??= echarts.init(this.chartHost.nativeElement);
    this.chart.setOption(this.donutOption(), true);
  }

  private donutOption(): EChartsOption {
    return {
      color: this.palette,
      tooltip: {
        trigger: 'item',
        formatter: params => {
          const item = params as { name: string; value: number; dataIndex: number };
          const stat = this.options[item.dataIndex];
          return `${item.name}<br/>${item.value} 票（${stat?.percentage ?? 0}%）`;
        },
      },
      legend: { top: '5%', left: 'center', type: 'scroll' },
      series: [{
        name: '選項票數',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '58%'],
        padAngle: 5,
        itemStyle: { borderRadius: 10 },
        emphasis: { scaleSize: 8 },
        data: this.options.map(option => ({ value: option.count, name: option.label })),
      }],
      textStyle: { fontFamily: 'Plus Jakarta Sans, Microsoft JhengHei, sans-serif' },
    };
  }

}
