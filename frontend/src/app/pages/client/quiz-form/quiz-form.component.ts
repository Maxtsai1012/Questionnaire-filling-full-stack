import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { SessionStorageService } from '../../../core/services/session-storage.service';
import { AnswerSubmit, Question, QuizDetail, ResponseSubmit } from '../../../core/models/survey.model';
import { AuthService } from '../../../core/services/auth.service';
import { PATTERNS, normalizePhone } from '../../../core/utils/validators';

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
            <input type="text" class="form-control" [(ngModel)]="respondentName" [readonly]="!!auth.user" (ngModelChange)="clearFieldError('respondentName')" placeholder="請輸入真實姓名" />
            <div class="field-error" *ngIf="fieldErrors['respondentName']">{{ fieldErrors['respondentName'] }}</div>
          </div>

          <div class="form-group">
            <label>手機 <span style="color: #ef4444;">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="phone" [readonly]="!!auth.user" (ngModelChange)="clearFieldError('phone')" placeholder="例如：0900000000" />
            <div class="field-error" *ngIf="fieldErrors['phone']">{{ fieldErrors['phone'] }}</div>
          </div>

          <div class="form-group">
            <label>E-mail <span style="color: #ef4444;">*</span></label>
            <input type="email" class="form-control" [(ngModel)]="email" [readonly]="!!auth.user" (ngModelChange)="clearFieldError('email')" placeholder="example@email.com" />
            <div class="field-error" *ngIf="fieldErrors['email']">{{ fieldErrors['email'] }}</div>
          </div>

          <div class="form-group">
            <label>年齡</label>
            <input type="number" min="0" class="form-control" [(ngModel)]="age" (ngModelChange)="clearFieldError('age')" placeholder="請輸入年齡" />
            <div class="field-error" *ngIf="fieldErrors['age']">{{ fieldErrors['age'] }}</div>
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
              <input type="radio" [name]="'question_' + q.questId"
                     [checked]="singleAnswers[q.questId] === opt.code"
                     (change)="singleAnswers[q.questId] = opt.code; clearFieldError('question_' + q.questId)" />
              {{ opt.optionName }}
            </label>
          </div>

          <!-- Multiple Choice (M) -->
          <div *ngIf="q.type === 'M'" style="display: flex; flex-direction: column; gap: 10px;">
            <label *ngFor="let opt of q.options" style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500;">
              <input type="checkbox"
                     [checked]="isMultiChecked(q.questId, opt.code)"
                     (change)="toggleMultiCheck(q.questId, opt.code)" />
              {{ opt.optionName }}
            </label>
          </div>

          <!-- Text (T) -->
          <div *ngIf="q.type === 'T'">
            <textarea class="form-control" [(ngModel)]="textAnswers[q.questId]" (ngModelChange)="clearFieldError('question_' + q.questId)" placeholder="請輸入說明與理由..."></textarea>
          </div>
          <div class="field-error" *ngIf="fieldErrors['question_' + q.questId]">{{ fieldErrors['question_' + q.questId] }}</div>
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

  // 存的是選項 code 而非顯示文字：選項改名不影響已填的草稿，選項文字含分號也不再有解析問題。
  singleAnswers: { [questId: number]: number } = {};
  multiAnswers: { [questId: number]: number[] } = {};
  textAnswers: { [questId: number]: string } = {};

  errorMessage = '';
  fieldErrors: Record<string, string> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private sessionStorageService: SessionStorageService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.quizId = +this.route.snapshot.paramMap.get('id')!;
    if (this.auth.user) {
      this.respondentName = this.auth.user.name;
      this.phone = this.auth.user.phone;
      this.email = this.auth.user.email;
    }
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
    this.fieldErrors = this.sessionStorageService.takeServerErrors(this.quizId);
    const draft = this.sessionStorageService.getQuizDraft(this.quizId);
    if (draft) {
      if (!this.auth.user) {
        this.respondentName = draft.respondentName || '';
        this.phone = draft.phone || '';
        this.email = draft.email || '';
      }
      this.age = draft.age || null;

      if (draft.answers && this.quiz) {
        for (const ans of draft.answers) {
          const q = this.quiz.questions.find(item => item.questId === ans.questionId);
          if (q) {
            if (q.type === 'T') {
              this.textAnswers[q.questId] = ans.answer ?? '';
            } else if (q.type === 'Q') {
              const [code] = ans.optionCodes ?? [];
              if (code !== undefined) this.singleAnswers[q.questId] = code;
            } else {
              this.multiAnswers[q.questId] = [...(ans.optionCodes ?? [])];
            }
          }
        }
      }
    }
  }

  isMultiChecked(questId: number, code: number): boolean {
    return (this.multiAnswers[questId] || []).includes(code);
  }

  toggleMultiCheck(questId: number, code: number): void {
    const list = this.multiAnswers[questId] ?? (this.multiAnswers[questId] = []);
    const idx = list.indexOf(code);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(code);
    }
    this.clearFieldError(`question_${questId}`);
  }

  /** 該題已勾選的選項 code；文字題回空陣列。 */
  private selectedCodes(q: Question): number[] {
    if (q.type === 'M') {
      return this.multiAnswers[q.questId] ?? [];
    }
    if (q.type === 'Q') {
      const code = this.singleAnswers[q.questId];
      return code === undefined ? [] : [code];
    }
    return [];
  }

  clearFieldError(field: string): void {
    if (this.fieldErrors[field]) {
      delete this.fieldErrors[field];
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.fieldErrors = {};
    const normalizedPhone = normalizePhone(this.phone);

    if (!this.respondentName.trim() || !PATTERNS.NAME.test(this.respondentName.trim().replace(/\s+/g, ' '))) {
      this.fieldErrors['respondentName'] = '只允許填寫中文和英文!!';
    }
    if (!PATTERNS.PHONE.test(normalizedPhone)) {
      this.fieldErrors['phone'] = '手機格式不符!!';
    }
    if (!PATTERNS.EMAIL.test(this.email.trim())) {
      this.fieldErrors['email'] = '信箱格式不符!!';
    }
    if (this.age !== null && this.age < 0) {
      this.fieldErrors['age'] = '年齡不得為負數!!';
    }

    // 必填檢查。注意選項 code 從 0 開始，所以要比對 undefined 而不能用真假值判斷。
    for (const q of this.quiz?.questions ?? []) {
      if (q.need && this.selectedCodes(q).length === 0 && !this.textAnswers[q.questId]?.trim()) {
        this.fieldErrors[`question_${q.questId}`] = '此題為必填項目!!';
      }
    }

    if (Object.keys(this.fieldErrors).length > 0) {
      this.errorMessage = '資料內容有誤，請您修改後再送出!!';
      return;
    }

    const answers: AnswerSubmit[] = (this.quiz?.questions ?? []).map(q => q.type === 'T'
      ? { questionId: q.questId, answer: this.textAnswers[q.questId] ?? '' }
      : { questionId: q.questId, optionCodes: this.selectedCodes(q) });

    const draftData: ResponseSubmit = {
      quizId: this.quizId,
      respondentName: this.respondentName.trim(),
      phone: normalizedPhone,
      email: this.email.trim(),
      age: this.age || undefined,
      answers: answers
    };

    // Save to Session Storage
    this.sessionStorageService.saveQuizDraft(this.quizId, draftData);
    // Navigate to Confirm Page
    this.router.navigate(['/quiz', this.quizId, 'confirm']);
  }

  onCancel(): void {
    this.router.navigate(['/quiz']);
  }
}
