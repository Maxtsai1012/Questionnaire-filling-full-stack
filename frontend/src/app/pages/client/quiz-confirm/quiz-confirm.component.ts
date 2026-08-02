import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { QuizDetail, ResponseSubmit } from '../../../core/models/survey.model';

@Component({
  selector: 'app-quiz-confirm',
  template: `
    <div class="container" *ngIf="draftData && quiz">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <h1 class="page-title" style="margin-bottom: 8px;">{{ quiz.name }} (資料確認)</h1>
            <p style="color: #64748b;">{{ quiz.description }}</p>
          </div>
          <div style="background: #fef3c7; color: #d97706; padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem;">
            唯讀預覽模式
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

        <!-- User Information Review -->
        <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: #1e293b;">填答基本資料</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px;">
          <div><strong style="color: #64748b;">姓名：</strong> {{ draftData.respondentName }}</div>
          <div><strong style="color: #64748b;">手機：</strong> {{ draftData.phone }}</div>
          <div><strong style="color: #64748b;">E-mail：</strong> {{ draftData.email }}</div>
          <div><strong style="color: #64748b;">年齡：</strong> {{ draftData.age || '未填寫' }}</div>
        </div>

        <!-- Answers Review -->
        <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: #1e293b;">填答內容確認</h3>
        <div *ngFor="let q of quiz.questions; let i = index" style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">
            {{ i + 1 }}. {{ q.questName }}
          </div>
          <div style="color: #3b82f6; font-weight: 600; padding-left: 12px; border-left: 3px solid #3b82f6;">
            {{ getAnswerDisplay(q.questId!) }}
          </div>
        </div>

        <div *ngIf="errorMessage" style="color: #ef4444; font-weight: 600; margin-bottom: 16px; background: #fee2e2; padding: 10px 16px; border-radius: 6px;">
          {{ errorMessage }}
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
          <button class="btn btn-secondary" (click)="onModify()">修改</button>
          <button class="btn btn-primary" (click)="onConfirmSubmit()" [disabled]="submitting">
            {{ submitting ? '提交中...' : '確認送出 (寫入DB)' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class QuizConfirmComponent implements OnInit {
  quizId!: number;
  quiz: QuizDetail | null = null;
  draftData: ResponseSubmit | null = null;

  submitting = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService
  ) {}

  ngOnInit(): void {
    this.quizId = +this.route.snapshot.paramMap.get('id')!;
    this.draftData = this.quizService.getDraftFromSession(this.quizId);

    if (!this.draftData) {
      this.router.navigate(['/quiz', this.quizId, 'form']);
      return;
    }

    this.quizService.getFrontQuizDetail(this.quizId).subscribe(res => {
      if (res.success) {
        this.quiz = res.data;
      }
    });
  }

  getAnswerDisplay(questionId: number): string {
    if (!this.draftData || !this.draftData.answers) return '未填寫';
    const item = this.draftData.answers.find(a => a.questionId === questionId);
    if (!item || !item.answer) return '未填寫';
    return item.answer.replace(/;/g, '、');
  }

  onModify(): void {
    this.router.navigate(['/quiz', this.quizId, 'form']);
  }

  onConfirmSubmit(): void {
    if (!this.draftData) return;
    this.submitting = true;
    this.errorMessage = '';

    this.quizService.submitResponse(this.quizId, this.draftData).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          alert('問卷送出成功！謝謝您的填寫。');
          this.quizService.clearDraftSession(this.quizId);
          this.router.navigate(['/quiz']);
        } else {
          this.errorMessage = res.message || '提交失敗，請再試一次！';
        }
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || '提交失敗，系統發生錯誤！';
      }
    });
  }
}
