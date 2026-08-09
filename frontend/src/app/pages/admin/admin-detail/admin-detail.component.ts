import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminQuizService } from '../../../core/services/admin-quiz.service';
import { QuizDetail, QuizStatistics, canUsePieChart, getQuestionTypeLabel } from '../../../core/models/survey.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-detail',
  template: `
    <div class="container" *ngIf="quiz">
      <div class="page-header">
        <div>
          <h1 class="page-title">📊 {{ quiz.name }} (明細與統計)</h1>
          <p style="color: var(--text-muted); margin-top: 4px;">本問卷題目結構已鎖定以保護填答資料，您可在下方查看完整題目、回覆與統計。</p>
        </div>
        <button class="btn btn-outline" (click)="onReturnToList()">回列表</button>
      </div>

      <div style="background: var(--teal-50); border-left: 4px solid var(--teal-600); padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; color: var(--teal-800); font-weight: 500; font-size: 0.9rem;">
        ℹ️ 提示：問卷在開放中或已結束狀態下，題目與選項結構將進行鎖定以保障數據真實性。欲建立新問卷或編輯草稿請點擊右上角「回列表」。
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
        <h3 style="font-size: 1.1rem; margin-bottom: 20px; color: var(--teal-900);">問卷基本資料</h3>
        <div style="display: flex; flex-direction: column; gap: 16px; max-width: 600px;">
          <div><strong style="color: var(--text-muted);">問卷名稱：</strong> {{ quiz.name }}</div>
          <div><strong style="color: var(--text-muted);">問卷說明：</strong> {{ quiz.description }}</div>
          <div><strong style="color: var(--text-muted);">開始時間：</strong> {{ quiz.startDate }}</div>
          <div><strong style="color: var(--text-muted);">結束時間：</strong> {{ quiz.endDate }}</div>
          <div><strong style="color: var(--text-muted);">發佈狀態：</strong> {{ quiz.isPublished ? '已發佈' : '未發佈' }}</div>
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 32px;">
          <button class="btn btn-primary" (click)="currentTab = 'questions'">下一頁籤 (查看題目) &raquo;</button>
        </div>
      </div>

      <!-- TAB: QUESTIONS -->
      <div *ngIf="currentTab === 'questions'" class="card">
        <h3 style="font-size: 1.1rem; margin-bottom: 20px; color: var(--teal-900);">問卷題目與選項清單</h3>
        <div *ngFor="let q of quiz.questions; let i = index" style="background: var(--teal-50); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <div style="font-weight: 700; color: var(--teal-950); margin-bottom: 8px;">
            {{ i + 1 }}. {{ q.questName }}
            <span *ngIf="q.need" style="color: var(--danger); font-size: 0.85rem;">(必填)</span>
            <span style="font-weight: 400; font-size: 0.85rem; color: var(--text-muted); margin-left: 8px;">
              [{{ getTypeLabel(q.type) }}]
            </span>
          </div>

          <div *ngIf="q.type !== 'T'" style="padding-left: 12px;">
            <div *ngFor="let opt of q.options" style="color: var(--teal-800); font-size: 0.9rem; margin-bottom: 4px;">
              • {{ opt.optionName }}
            </div>
          </div>
          <div *ngIf="q.type === 'T'" style="padding-left: 12px; color: var(--text-light); font-style: italic; font-size: 0.9rem;">
            [使用者簡答輸入框]
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 32px;">
          <button class="btn btn-outline" (click)="currentTab = 'info'">&laquo; 上一頁籤 (基本資料)</button>
          <button class="btn btn-primary" (click)="currentTab = 'feedback'">下一頁籤 (問卷回饋) &raquo;</button>
        </div>
      </div>

      <!-- TAB: FEEDBACK -->
      <div *ngIf="currentTab === 'feedback'" class="card">
        <app-admin-feedback [quizId]="quizId" [isAdmin]="isAdminArea"></app-admin-feedback>
      </div>

      <!-- TAB: STATS -->
      <div *ngIf="currentTab === 'stats'" class="card">
        <div *ngIf="stats">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="font-size: 1.1rem; color: var(--teal-900);">選項數據統計分析 (唯讀圖表)</h3>
            <span style="background: var(--teal-50); color: var(--teal-700); padding: 4px 12px; border-radius: 6px; font-weight: 700;">
              累積填答人數：{{ stats.totalResponses }} 人
            </span>
          </div>

          <div *ngFor="let q of stats.questions; let i = index" class="stats-question-card">
            <div class="stats-question-title">{{ i + 1 }}. {{ q.title }}</div>
            <div class="stats-answer-count">本題已有 {{ q.totalAnswers }} 人作答</div>

            <!-- Choice Question (Q / M) -->
            <div *ngIf="q.type === 'Q' || q.type === 'M'">
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
                <div *ngFor="let ta of q.textAnswers" style="padding: 10px 14px; border-bottom: 1px solid var(--primary); display: flex; justify-content: space-between;">
                  <span style="color: var(--teal-900);">「 {{ ta.answer }} 」</span>
                  <span *ngIf="ta.count > 1" style="background: var(--teal-600); color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">
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
      </div>
    </div>
  `
})
export class AdminDetailComponent implements OnInit {
  quizId!: number;
  quiz: QuizDetail | null = null;
  stats: QuizStatistics | null = null;

  currentTab = 'info';
  getTypeLabel = getQuestionTypeLabel;
  canUsePie = canUsePieChart;
  isAdminArea = false;
  managementBase = '/member/quizzes';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminQuizService: AdminQuizService,
    public readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdminArea = this.route.snapshot.data['managementScope'] === 'admin';
    this.managementBase = this.isAdminArea ? '/admin' : '/member/quizzes';
    this.quizId = +this.route.snapshot.paramMap.get('id')!;

    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam) {
      this.currentTab = tabParam;
    }

    this.loadQuiz();
    this.loadStats();
  }

  loadQuiz(): void {
    this.adminQuizService.getManagedQuizDetail(this.quizId, this.isAdminArea).subscribe(res => {
      if (res.success) {
        this.quiz = res.data;
      }
    });
  }

  loadStats(): void {
    this.adminQuizService.getManagedStatistics(this.quizId, this.isAdminArea).subscribe(res => {
      if (res.success && res.data) {
        this.stats = res.data;
      }
    });
  }

  onReturnToList(): void {
    this.router.navigate([this.managementBase]);
  }
}
