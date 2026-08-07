import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, Plugin, registerables } from 'chart.js';
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
      max-width: 520px;
      margin: 16px auto;
      height: 380px;
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

  private readonly pieColors = [
    '#1F8196', '#214A58', '#3FC0D1', '#7BDBE5', '#EFFCFC'
  ];

  private readonly barColors = [
    '#4f6edb', '#b6dc22', '#555978', '#ff9749',
    '#18a5d1', '#ec4899', '#8b5cf6', '#10b981',
    '#64748b', '#d97706'
  ];

  private readonly centerHoverLabelPlugin: Plugin<'doughnut'> = {
    id: 'centerHoverLabel',
    afterDraw: (chart) => {
      const activeElements = chart.getActiveElements();
      if (!activeElements.length) return;

      const { ctx, chartArea } = chart;
      const active = activeElements[0];
      const label = String(chart.data.labels?.[active.index] || '');
      const value = Number(chart.data.datasets[0].data[active.index] || 0);
      const total = this.options.reduce((sum, option) => sum + option.count, 0);
      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#17232c';
      ctx.font = "700 28px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(`${percentage}%`, centerX, centerY - 10);
      ctx.fillStyle = '#52616b';
      ctx.font = "600 12px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(label, centerX, centerY + 18);
      ctx.restore();
    }
  };

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
            backgroundColor: labels.map((_, index) => this.pieColors[index % this.pieColors.length]),
            borderWidth: 2,
            borderColor: '#ffffff',
            borderRadius: 10,
            spacing: 4,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          radius: '70%',
          cutout: '40%',
          layout: {
            padding: {
              top: 8,
              right: 16,
              bottom: 8,
              left: 16
            }
          },
          plugins: {
            legend: {
              position: 'top',
              align: 'center',
              labels: {
                color: '#52616b',
                boxWidth: 28,
                boxHeight: 14,
                borderRadius: 3,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                padding: 16,
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
        },
        plugins: [this.centerHoverLabelPlugin]
      });
    } else {
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: '票數',
            data: data,
            backgroundColor: this.barColors[0],
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
