import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminQuizService } from '../../../core/services/admin-quiz.service';
import { QuizService } from '../../../core/services/quiz.service';
import { QuizDetail, QuizStatistics } from '../../../core/models/survey.model';

@Component({
  selector: 'app-admin-detail',
  template: `
    <div class="container" *ngIf="quiz">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ quiz.name }} (後台內頁 - 唯讀)</h1>
          <p style="color: #64748b; margin-top: 4px;">此問卷狀態為「{{ quiz.statusLabel }}」，不可修改或刪除。</p>
        </div>
        <button class="btn btn-outline" (click)="onReturnToList()">回列表</button>
      </div>

      <!-- Header Tabs -->
      <div class="tabs-header">
        <button class="tab-btn" [class.active]="currentTab === 'info'" (click)="currentTab = 'info'">問卷</button>
        <button class="tab-btn" [class.active]="currentTab === 'questions'" (click)="currentTab = 'questions'">題目</button>
        <button class="tab-btn" [class.active]="currentTab === 'feedback'" (click)="currentTab = 'feedback'">問卷回饋</button>
        <button class="tab-btn" [class.active]="currentTab === 'stats'" (click)="currentTab = 'stats'">統計</button>
      </div>

      <!-- TAB: INFO -->
      <div *ngIf="currentTab === 'info'" class="card">
        <h3 style="font-size: 1.1rem; margin-bottom: 20px; color: #1e293b;">問卷基本資料</h3>
        <div style="display: flex; flex-direction: column; gap: 16px; max-width: 600px;">
          <div><strong style="color: #64748b;">問卷名稱：</strong> {{ quiz.name }}</div>
          <div><strong style="color: #64748b;">問卷說明：</strong> {{ quiz.description }}</div>
          <div><strong style="color: #64748b;">開始時間：</strong> {{ quiz.startDate }}</div>
          <div><strong style="color: #64748b;">結束時間：</strong> {{ quiz.endDate }}</div>
          <div><strong style="color: #64748b;">發佈狀態：</strong> {{ quiz.isPublished ? '已發佈' : '未發佈' }}</div>
        </div>
      </div>

      <!-- TAB: QUESTIONS -->
      <div *ngIf="currentTab === 'questions'" class="card">
        <h3 style="font-size: 1.1rem; margin-bottom: 20px; color: #1e293b;">問卷題目與選項清單</h3>
        <div *ngFor="let q of quiz.questions; let i = index" style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">
            {{ i + 1 }}. {{ q.questName }}
            <span *ngIf="q.need" style="color: #ef4444; font-size: 0.85rem;">(必填)</span>
            <span style="font-weight: 400; font-size: 0.85rem; color: #64748b; margin-left: 8px;">
              [{{ q.type === 'Q' ? '單選' : (q.type === 'M' ? '多選' : '文字') }}]
            </span>
          </div>

          <div *ngIf="q.type !== 'T'" style="padding-left: 12px;">
            <div *ngFor="let opt of q.options" style="color: #475569; font-size: 0.9rem; margin-bottom: 4px;">
              • {{ opt.optionName }}
            </div>
          </div>
          <div *ngIf="q.type === 'T'" style="padding-left: 12px; color: #94a3b8; font-style: italic; font-size: 0.9rem;">
            [使用者簡答輸入框]
          </div>
        </div>
      </div>

      <!-- TAB: FEEDBACK -->
      <div *ngIf="currentTab === 'feedback'" class="card">
        <app-admin-feedback [quizId]="quizId"></app-admin-feedback>
      </div>

      <!-- TAB: STATS -->
      <div *ngIf="currentTab === 'stats'" class="card">
        <div *ngIf="stats">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="font-size: 1.1rem; color: #1e293b;">選項數據統計分析 (唯讀圖表)</h3>
            <span style="background: #eff6ff; color: #1d4ed8; padding: 4px 12px; border-radius: 6px; font-weight: 700;">
              累積填答人數：{{ stats.totalResponses }} 人
            </span>
          </div>

          <div *ngFor="let q of stats.questions; let i = index" class="stats-question-card">
            <div class="stats-question-title">{{ i + 1 }}. {{ q.title }}</div>
            <div class="stats-answer-count">本題已有 {{ q.totalAnswers }} 人作答</div>

            <!-- Choice Question (Q / M) -->
            <div *ngIf="q.type === 'Q' || q.type === 'M'">
              <div style="margin-bottom: 20px; background: #f8fafc; border-radius: 8px; padding: 12px;">
                <div *ngFor="let opt of q.options" class="stat-text-row">
                  <span class="opt-name">{{ opt.label }}</span>
                  <span class="opt-count">{{ opt.count }} 票</span>
                  <span class="opt-percent">({{ opt.percentage }}%)</span>
                </div>
              </div>

              <!-- Chart View (Default Pie, Toggleable to Bar) -->
              <app-chart-view [options]="q.options || []" [chartType]="q.chartType || 'pie'"></app-chart-view>
              <button class="btn btn-outline toggle-chart-btn" (click)="toggleChartType(q)">
                {{ (q.chartType || 'pie') === 'pie' ? '切換為長條圖 📊' : '切換為圓餅圖 🥧' }}
              </button>
            </div>

            <!-- Text Question (T) -->
            <div *ngIf="q.type === 'T'">
              <div *ngIf="q.textAnswers && q.textAnswers.length > 0" style="max-height: 280px; overflow-y: auto; background: #f8fafc; border-radius: 8px; padding: 8px;">
                <div *ngFor="let ta of q.textAnswers" style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
                  <span style="color: #334155;">「 {{ ta.answer }} 」</span>
                  <span *ngIf="ta.count > 1" style="background: #ef4444; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">
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
      </div>
    </div>
  `
})
export class AdminDetailComponent implements OnInit {
  quizId!: number;
  quiz: QuizDetail | null = null;
  stats: QuizStatistics | null = null;

  currentTab = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private adminQuizService: AdminQuizService
  ) {}

  ngOnInit(): void {
    this.quizId = +this.route.snapshot.paramMap.get('id')!;

    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam) {
      this.currentTab = tabParam;
    }

    this.loadQuiz();
    this.loadStats();
  }

  loadQuiz(): void {
    this.quizService.getFrontQuizDetail(this.quizId).subscribe(res => {
      if (res.success) {
        this.quiz = res.data;
      }
    });
  }

  loadStats(): void {
    this.adminQuizService.getAdminStatistics(this.quizId).subscribe(res => {
      if (res.success && res.data) {
        this.stats = res.data;
        if (this.stats.questions) {
          this.stats.questions.forEach(q => q.chartType = 'pie');
        }
      }
    });
  }

  toggleChartType(q: any): void {
    q.chartType = q.chartType === 'pie' ? 'bar' : 'pie';
  }

  onReturnToList(): void {
    this.router.navigate(['/admin']);
  }
}
