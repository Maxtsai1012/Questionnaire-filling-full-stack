import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { QuizStatistics, canUsePieChart } from '../../../core/models/survey.model';

@Component({
  selector: 'app-quiz-stats',
  template: `
    <div class="container" *ngIf="stats">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ stats.quizName }} - 統計分析結果</h1>
          <p style="color: var(--text-muted); margin-top: 4px;">{{ stats.description }}</p>
        </div>
        <div style="background: var(--teal-50); color: var(--teal-700); padding: 8px 16px; border-radius: 8px; font-weight: 700;">
          總填答人數：{{ stats.totalResponses }} 人
        </div>
      </div>

      <div *ngFor="let q of stats.questions; let i = index" class="stats-question-card">
        <div class="stats-question-title">{{ i + 1 }}. {{ q.title }}</div>
        <div class="stats-answer-count">本題已有 {{ q.totalAnswers }} 人作答</div>

        <!-- Choice Question (Q / M) -->
        <div *ngIf="q.type === 'Q' || q.type === 'M'">
          <!-- Text Stats List -->
          <div style="margin-bottom: 20px; background: var(--teal-50); border-radius: 8px; padding: 12px;">
            <div *ngFor="let opt of q.options" class="stat-text-row">
              <span class="opt-name">{{ opt.label }}</span>
              <span class="opt-count">{{ opt.count }} 票</span>
              <span class="opt-percent">({{ opt.percentage }}%)</span>
            </div>
          </div>

          <!-- 多選題的各選項可能同時被勾選，不適合用圓餅圖呈現。 -->
          <app-chart-view
            *ngIf="canUsePie(q.type)"
            [options]="q.options || []"
          ></app-chart-view>
        </div>

        <!-- Text Question (T) -->
        <div *ngIf="q.type === 'T'">
          <div *ngIf="q.textAnswers && q.textAnswers.length > 0" style="max-height: 280px; overflow-y: auto; background: var(--teal-50); border-radius: 8px; padding: 8px;">
            <div *ngFor="let ta of q.textAnswers" style="padding: 10px 14px; border-bottom: 1px solid var(--teal-100); display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--teal-900); font-style: italic;">「 {{ ta.answer }} 」</span>
              <span *ngIf="ta.count > 1" style="background: var(--teal-600); color: #ffffff; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 700;">
                x{{ ta.count }}
              </span>
            </div>
          </div>
          <div *ngIf="!q.textAnswers || q.textAnswers.length === 0" style="color: var(--text-light); padding: 16px; text-align: center;">
            <div class="empty-state-visual empty-state-visual--compact">
              <img src="assets/illustrations/chart-1-67.png" alt="" aria-hidden="true" />
              <span>暫無文字回答紀錄</span>
            </div>
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
      }
    });
  }
}
