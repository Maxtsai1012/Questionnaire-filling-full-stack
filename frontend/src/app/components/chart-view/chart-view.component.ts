import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { OptionStat } from '../../core/models/survey.model';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-view',
  template: `
    <div class="chart-container">
      <div class="chart-empty" *ngIf="!hasData">目前尚無統計資料</div>
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
      max-width: 480px;
      margin: 16px auto;
      height: 360px;
    }
    .chart-empty {
      height: 100%;
      display: grid;
      place-items: center;
      color: #94a3b8;
      font-weight: 600;
    }
  `]
})
export class ChartViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() options: OptionStat[] = [];
  @Input() chartType: 'pie' | 'bar' = 'pie';

  private chart: Chart | null = null;

  private colors = [
    '#4f6edb', '#b6dc22', '#555978', '#ff9749',
    '#18a5d1', '#ec4899', '#8b5cf6', '#10b981',
    '#64748b', '#d97706'
  ];

  get hasData(): boolean {
    return this.options.some(option => option.count > 0);
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['options'] || changes['chartType']) && this.chartCanvas) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private renderChart(): void {
    if (!this.chartCanvas) return;
    if (this.chart) {
      this.chart.destroy();
    }
    if (!this.hasData) return;

    const labels = this.options.map(o => o.label);
    const data = this.options.map(o => o.count);

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chartType === 'pie') {
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: this.colors.slice(0, labels.length),
            borderWidth: 8,
            borderColor: '#ffffff',
            borderRadius: 10,
            spacing: 4,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
          plugins: {
            legend: {
              position: 'top',
              labels: {
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                padding: 14,
                usePointStyle: true,
                pointStyle: 'rectRounded'
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const val = context.raw as number;
                  const opt = this.options[context.dataIndex];
                  return ` ${context.label}: ${val} 票 (${opt ? opt.percentage : 0}%)`;
                }
              }
            }
          }
        }
      });
    } else {
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: '票數',
            data: data,
            backgroundColor: '#3b82f6',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }
}
