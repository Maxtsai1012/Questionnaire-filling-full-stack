import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { QuestionStat, QuizStatistics, canUsePieChart } from '../../../core/models/survey.model';

@Component({
  selector: 'app-quiz-stats',
  template: `
    <div class="container" *ngIf="stats">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ stats.quizName }} - 統計分析結果</h1>
          <p style="color: #64748b; margin-top: 4px;">{{ stats.description }}</p>
        </div>
        <div style="background: #eff6ff; color: #1d4ed8; padding: 8px 16px; border-radius: 8px; font-weight: 700;">
          總填答人數：{{ stats.totalResponses }} 人
        </div>
      </div>

      <div *ngFor="let q of stats.questions; let i = index" class="stats-question-card">
        <div class="stats-question-title">{{ i + 1 }}. {{ q.title }}</div>
        <div class="stats-answer-count">本題已有 {{ q.totalAnswers }} 人作答</div>

        <!-- Choice Question (Q / M) -->
        <div *ngIf="q.type === 'Q' || q.type === 'M'">
          <!-- Text Stats List -->
          <div style="margin-bottom: 20px; background: #f8fafc; border-radius: 8px; padding: 12px;">
            <div *ngFor="let opt of q.options" class="stat-text-row">
              <span class="opt-name">{{ opt.label }}</span>
              <span class="opt-count">{{ opt.count }} 票</span>
              <span class="opt-percent">({{ opt.percentage }}%)</span>
            </div>
          </div>

          <!-- Chart View -->
          <app-chart-view [options]="q.options || []" [chartType]="q.chartType || 'bar'"></app-chart-view>

          <!-- 多選題各項加總超過 100%，圓餅圖無意義，因此只有單選題提供切換 -->
          <button class="btn btn-outline toggle-chart-btn" *ngIf="canUsePie(q.type)" (click)="toggleChartType(q)">
            {{ q.chartType === 'pie' ? '切換為長條圖 📊' : '切換為圓餅圖 🥧' }}
          </button>
        </div>

        <!-- Text Question (T) -->
        <div *ngIf="q.type === 'T'">
          <div *ngIf="q.textAnswers && q.textAnswers.length > 0" style="max-height: 280px; overflow-y: auto; background: #f8fafc; border-radius: 8px; padding: 8px;">
            <div *ngFor="let ta of q.textAnswers" style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #334155; font-style: italic;">「 {{ ta.answer }} 」</span>
              <span *ngIf="ta.count > 1" style="background: #ef4444; color: #ffffff; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 700;">
                x{{ ta.count }}
              </span>
            </div>
          </div>
          <div *ngIf="!q.textAnswers || q.textAnswers.length === 0" style="color: #94a3b8; padding: 16px; text-align: center;">
            暫無文字回答紀錄
          </div>
        </div>
      </div>
    </div>
  `
})
export class QuizStatsComponent implements OnInit {
  quizId!: number;
  stats: QuizStatistics | null = null;

  canUsePie = canUsePieChart;

  constructor(
    private route: ActivatedRoute,
    private quizService: QuizService
  ) {}

  ngOnInit(): void {
    this.quizId = +this.route.snapshot.paramMap.get('id')!;
    this.loadStats();
  }

  loadStats(): void {
    this.quizService.getStatistics(this.quizId).subscribe(res => {
      if (res.success && res.data) {
        this.stats = res.data;
        this.stats.questions?.forEach(q => q.chartType = canUsePieChart(q.type) ? 'pie' : 'bar');
      }
    });
  }

  toggleChartType(q: QuestionStat): void {
    q.chartType = q.chartType === 'pie' ? 'bar' : 'pie';
  }
}
