import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { AnswerSubmit, QuestionSave, QuizDetail, ResponseSubmit } from '../../../core/models/survey.model';

@Component({
  selector: 'app-quiz-form',
  template: `
    <div class="container" *ngIf="quiz">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <h1 class="page-title" style="margin-bottom: 8px;">{{ quiz.name }}</h1>
            <p style="color: #64748b;">{{ quiz.description }}</p>
          </div>
          <div style="background: #f1f5f9; padding: 6px 14px; border-radius: 6px; font-size: 0.85rem; color: #475569;">
            開放時間：{{ quiz.startDate }} ～ {{ quiz.endDate }}
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

        <!-- User Information Form -->
        <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: #1e293b;">基本填答資料</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div class="form-group">
            <label>姓名 <span style="color: #ef4444;">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="respondentName" placeholder="請輸入真實姓名" />
          </div>

          <div class="form-group">
            <label>手機 <span style="color: #ef4444;">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="phone" placeholder="例如：0900000000" />
          </div>

          <div class="form-group">
            <label>E-mail <span style="color: #ef4444;">*</span></label>
            <input type="email" class="form-control" [(ngModel)]="email" placeholder="example@email.com" />
          </div>

          <div class="form-group">
            <label>年齡</label>
            <input type="number" class="form-control" [(ngModel)]="age" placeholder="請輸入年齡" />
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

        <!-- Dynamic Questions Form -->
        <h3 style="font-size: 1.1rem; margin-bottom: 20px; color: #1e293b;">問卷題目</h3>

        <div *ngFor="let q of quiz.questions; let i = index" class="card" style="background: #f8fafc; border-color: #cbd5e1; margin-bottom: 20px;">
          <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 12px; color: #0f172a;">
            {{ i + 1 }}. {{ q.questName }}
            <span *ngIf="q.need" style="color: #ef4444; font-size: 0.9rem;">(必填)</span>
          </div>

          <!-- Single Choice (Q) -->
          <div *ngIf="q.type === 'Q'" style="display: flex; flex-direction: column; gap: 10px;">
            <label *ngFor="let opt of q.options" style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500;">
              <input type="radio" [name]="'question_' + q.questId" [value]="opt.optionName"
                     [checked]="singleAnswers[q.questId!] === opt.optionName"
                     (change)="singleAnswers[q.questId!] = opt.optionName" />
              {{ opt.optionName }}
            </label>
          </div>

          <!-- Multiple Choice (M) -->
          <div *ngIf="q.type === 'M'" style="display: flex; flex-direction: column; gap: 10px;">
            <label *ngFor="let opt of q.options" style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500;">
              <input type="checkbox"
                     [checked]="isMultiChecked(q.questId!, opt.optionName)"
                     (change)="toggleMultiCheck(q.questId!, opt.optionName)" />
              {{ opt.optionName }}
            </label>
          </div>

          <!-- Text (T) -->
          <div *ngIf="q.type === 'T'">
            <textarea class="form-control" [(ngModel)]="textAnswers[q.questId!]" placeholder="請輸入說明與理由..."></textarea>
          </div>
        </div>

        <div *ngIf="errorMessage" style="color: #ef4444; font-weight: 600; margin-bottom: 16px; background: #fee2e2; padding: 10px 16px; border-radius: 6px;">
          {{ errorMessage }}
        </div>

        <!-- Buttons -->
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <button class="btn btn-outline" (click)="onCancel()">取消</button>
          <button class="btn btn-primary" (click)="onSubmit()">送出 (前往確認)</button>
        </div>
      </div>
    </div>
  `
})
export class QuizFormComponent implements OnInit {
  quizId!: number;
  quiz: QuizDetail | null = null;

  respondentName = '';
  phone = '';
  email = '';
  age: number | null = null;

  singleAnswers: { [questId: number]: string } = {};
  multiAnswers: { [questId: number]: string[] } = {};
  textAnswers: { [questId: number]: string } = {};

  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService
  ) {}

  ngOnInit(): void {
    this.quizId = +this.route.snapshot.paramMap.get('id')!;
    this.loadQuizDetail();
  }

  loadQuizDetail(): void {
    this.quizService.getFrontQuizDetail(this.quizId).subscribe(res => {
      if (res.success) {
        this.quiz = res.data;
        this.restoreDraft();
      }
    });
  }

  restoreDraft(): void {
    const draft = this.quizService.getDraftFromSession(this.quizId);
    if (draft) {
      this.respondentName = draft.respondentName || '';
      this.phone = draft.phone || '';
      this.email = draft.email || '';
      this.age = draft.age || null;

      if (draft.answers && this.quiz) {
        for (const ans of draft.answers) {
          const q = this.quiz.questions.find(item => item.questId === ans.questionId);
          if (q) {
            if (q.type === 'Q') {
              this.singleAnswers[q.questId!] = ans.answer;
            } else if (q.type === 'M') {
              this.multiAnswers[q.questId!] = ans.answer ? ans.answer.split(';') : [];
            } else if (q.type === 'T') {
              this.textAnswers[q.questId!] = ans.answer;
            }
          }
        }
      }
    }
  }

  isMultiChecked(questId: number, optionName: string): boolean {
    const list = this.multiAnswers[questId] || [];
    return list.includes(optionName);
  }

  toggleMultiCheck(questId: number, optionName: string): void {
    if (!this.multiAnswers[questId]) {
      this.multiAnswers[questId] = [];
    }
    const list = this.multiAnswers[questId];
    const idx = list.indexOf(optionName);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(optionName);
    }
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.respondentName.trim()) {
      this.errorMessage = '請填寫姓名！';
      return;
    }
    if (!this.phone.trim()) {
      this.errorMessage = '請填寫手機號碼！';
      return;
    }
    if (!this.email.trim()) {
      this.errorMessage = '請填寫 Email！';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage = 'Email 格式不正確！';
      return;
    }

    // Check required questions
    if (this.quiz) {
      for (const q of this.quiz.questions) {
        if (q.need) {
          if (q.type === 'Q' && !this.singleAnswers[q.questId!]) {
            this.errorMessage = `問題「${q.questName}」為必填項目！`;
            return;
          }
          if (q.type === 'M' && (!this.multiAnswers[q.questId!] || this.multiAnswers[q.questId!].length === 0)) {
            this.errorMessage = `問題「${q.questName}」為必填項目！`;
            return;
          }
          if (q.type === 'T' && (!this.textAnswers[q.questId!] || !this.textAnswers[q.questId!].trim())) {
            this.errorMessage = `問題「${q.questName}」為必填項目！`;
            return;
          }
        }
      }
    }

    // Check email duplication
    this.quizService.checkEmailExists(this.quizId, this.email.trim()).subscribe(res => {
      if (res.success && res.data) {
        this.errorMessage = `Email 「${this.email.trim()}」 已經填寫過此問卷，無法重複填寫！`;
      } else {
        // Collect answers
        const answers: AnswerSubmit[] = [];
        if (this.quiz) {
          for (const q of this.quiz.questions) {
            let ansVal = '';
            if (q.type === 'Q') {
              ansVal = this.singleAnswers[q.questId!] || '';
            } else if (q.type === 'M') {
              ansVal = (this.multiAnswers[q.questId!] || []).join(';');
            } else if (q.type === 'T') {
              ansVal = this.textAnswers[q.questId!] || '';
            }
            answers.push({ questionId: q.questId!, answer: ansVal });
          }
        }

        const draftData: ResponseSubmit = {
          quizId: this.quizId,
          respondentName: this.respondentName.trim(),
          phone: this.phone.trim(),
          email: this.email.trim(),
          age: this.age || undefined,
          answers: answers
        };

        // Save to Session Storage
        this.quizService.saveDraftToSession(this.quizId, draftData);
        // Navigate to Confirm Page
        this.router.navigate(['/quiz', this.quizId, 'confirm']);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/quiz']);
  }
}
