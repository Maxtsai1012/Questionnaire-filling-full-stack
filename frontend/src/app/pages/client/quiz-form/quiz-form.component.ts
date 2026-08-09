import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { QuizService } from "../../../core/services/quiz.service";
import { SessionStorageService } from "../../../core/services/session-storage.service";
import {
  AnswerSubmit,
  AuthUser,
  Question,
  QuizDetail,
  ResponseSubmit,
} from "../../../core/models/survey.model";
import { AuthService } from "../../../core/services/auth.service";
import { PATTERNS, normalizePhone } from "../../../core/utils/validators";

@Component({
  selector: "app-quiz-form",
  template: `
    <div class="container" *ngIf="quiz">
      <div class="card">
        <div
          style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;"
        >
          <div>
            <h1 class="page-title" style="margin-bottom: 8px;">
              {{ quiz.name }}
            </h1>
            <p style="color: var(--text-muted);">{{ quiz.description }}</p>
          </div>
          <div
            style="background: var(--teal-50); padding: 6px 14px; border-radius: 6px; font-size: 0.85rem; color: var(--teal-800);"
          >
            開放時間：{{ quiz.startDate }} ～ {{ quiz.endDate }}
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid var(--primary); margin: 20px 0;" />

        <div
          class="existing-response-note"
          *ngIf="isUpdateMode"
          role="status"
          aria-live="polite"
        >
          <strong>您已於 {{ existingResponseSubmittedAt }} 完成填寫。</strong>
          再次送出將會覆蓋前次紀錄。
        </div>

        <!-- User Information Form -->
        <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: var(--teal-900);">
          基本填答資料
        </h3>
        <div
          style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;"
        >
          <div class="form-group">
            <label>姓名 <span style="color: var(--danger);">*</span></label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="respondentName"
              [readonly]="!!auth.user"
              (ngModelChange)="clearFieldError('respondentName')"
              placeholder="請輸入真實姓名"
            />
            <div class="field-error" *ngIf="fieldErrors['respondentName']">
              {{ fieldErrors["respondentName"] }}
            </div>
          </div>

          <div class="form-group">
            <label>手機 <span style="color: var(--danger);">*</span></label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="phone"
              [readonly]="!!auth.user"
              (ngModelChange)="clearFieldError('phone')"
              placeholder="例如：0900000000"
            />
            <div class="field-error" *ngIf="fieldErrors['phone']">
              {{ fieldErrors["phone"] }}
            </div>
          </div>

          <div class="form-group">
            <label>E-mail <span style="color: var(--danger);">*</span></label>
            <input
              type="email"
              class="form-control"
              [(ngModel)]="email"
              [readonly]="!!auth.user"
              (ngModelChange)="clearFieldError('email')"
              placeholder="example@email.com"
            />
            <div class="field-error" *ngIf="fieldErrors['email']">
              {{ fieldErrors["email"] }}
            </div>
          </div>

          <div class="form-group">
            <label>年齡 <span style="color: var(--danger);">*</span></label>
            <input
              type="number"
              min="0"
              step="1"
              class="form-control"
              [(ngModel)]="age"
              [readonly]="!!auth.user"
              (ngModelChange)="clearFieldError('age')"
              [placeholder]="auth.user ? '依會員生日自動計算' : '請輸入年齡'"
            />
            <div class="field-error" *ngIf="fieldErrors['age']">
              {{ fieldErrors["age"] }}
            </div>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid var(--primary); margin: 24px 0;" />

        <!-- Dynamic Questions Form -->
        <h3 style="font-size: 1.1rem; margin-bottom: 20px; color: var(--teal-900);">
          問卷題目
        </h3>

        <div
          *ngFor="let q of quiz.questions; let i = index"
          class="card"
          style="background: var(--teal-50); border-color: var(--primary); margin-bottom: 20px;"
        >
          <div
            style="font-weight: 700; font-size: 1.05rem; margin-bottom: 12px; color: var(--teal-950);"
          >
            {{ i + 1 }}. {{ q.questName }}
            <span *ngIf="q.need" style="color: var(--danger); font-size: 0.9rem;"
              >(必填)</span
            >
          </div>

          <!-- Single Choice (Q) -->
          <div
            *ngIf="q.type === 'Q'"
            style="display: flex; flex-direction: column; gap: 10px;"
          >
            <label
              *ngFor="let opt of q.options"
              style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500;"
            >
              <input
                type="radio"
                [name]="'question_' + q.questId"
                [checked]="singleAnswers[q.questId] === opt.code"
                (change)="
                  singleAnswers[q.questId] = opt.code;
                  clearFieldError('question_' + q.questId)
                "
              />
              {{ opt.optionName }}
            </label>
          </div>

          <!-- Multiple Choice (M) -->
          <div
            *ngIf="q.type === 'M'"
            style="display: flex; flex-direction: column; gap: 10px;"
          >
            <label
              *ngFor="let opt of q.options"
              style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500;"
            >
              <input
                type="checkbox"
                [checked]="isMultiChecked(q.questId, opt.code)"
                (change)="toggleMultiCheck(q.questId, opt.code)"
              />
              {{ opt.optionName }}
            </label>
          </div>

          <!-- Text (T) -->
          <div *ngIf="q.type === 'T'">
            <textarea
              class="form-control"
              [(ngModel)]="textAnswers[q.questId]"
              (ngModelChange)="clearFieldError('question_' + q.questId)"
              placeholder="請輸入說明與理由..."
            ></textarea>
          </div>
          <div class="field-error" *ngIf="fieldErrors['question_' + q.questId]">
            {{ fieldErrors["question_" + q.questId] }}
          </div>
        </div>

        <div
          *ngIf="errorMessage"
          style="color: var(--danger); font-weight: 600; margin-bottom: 16px; background: color-mix(in srgb, var(--danger) 10%, white); padding: 10px 16px; border-radius: 6px;"
        >
          {{ errorMessage }}
        </div>

        <!-- Buttons -->
        <div
          style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;"
        >
          <button class="btn btn-outline" (click)="onCancel()">取消</button>
          <button class="btn btn-primary" (click)="onSubmit()">
            {{ isUpdateMode ? "更新問卷" : "確認送出" }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .existing-response-note {
      margin-bottom: 20px;
      padding: 14px 18px;
      border: 1px solid color-mix(in srgb, var(--warning) 45%, white);
      border-left: 5px solid var(--warning);
      border-radius: 10px;
      background: color-mix(in srgb, var(--warning) 12%, white);
      color: var(--teal-950);
      font-size: 1rem;
      font-weight: 600;
    }

    .existing-response-note strong {
      color: var(--warning);
    }
  `],
})
export class QuizFormComponent implements OnInit, OnDestroy {
  quizId!: number;
  quiz: QuizDetail | null = null;

  respondentName = "";
  phone = "";
  email = "";
  age: number | null = null;

  // 存的是選項 code 而非顯示文字：選項改名不影響已填的草稿，選項文字含分號也不再有解析問題。
  singleAnswers: { [questId: number]: number } = {};
  multiAnswers: { [questId: number]: number[] } = {};
  textAnswers: { [questId: number]: string } = {};

  errorMessage = "";
  fieldErrors: Record<string, string> = {};
  isUpdateMode = false;
  existingResponseSubmittedAt = "";
  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private sessionStorageService: SessionStorageService,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.quizId = +this.route.snapshot.paramMap.get("id")!;
    this.auth.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) this.applyAuthenticatedIdentity(user);
      });
    this.loadQuizDetail();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadQuizDetail(): void {
    this.quizService.getFrontQuizDetail(this.quizId).subscribe((res) => {
      if (res.success) {
        this.quiz = res.data;
        this.restoreDraft();
        if (this.auth.user) {
          this.loadMyResponse(true);
        }
      }
    });
  }

  restoreDraft(): void {
    this.fieldErrors = this.sessionStorageService.takeServerErrors(this.quizId);
    const draft = this.sessionStorageService.getQuizDraft(this.quizId);
    if (draft) {
      if (!this.auth.user) {
        this.respondentName = draft.respondentName || "";
        this.phone = draft.phone || "";
        this.email = draft.email || "";
      }
      if (!this.auth.user) {
        this.age = draft.age ?? null;
      } else {
        this.applyAuthenticatedIdentity(this.auth.user);
      }

      if (draft.answers && this.quiz) {
        for (const ans of draft.answers) {
          const q = this.quiz.questions.find(
            (item) => item.questId === ans.questionId,
          );
          if (q) {
            if (q.type === "T") {
              this.textAnswers[q.questId] = ans.answer ?? "";
            } else if (q.type === "Q") {
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

  loadMyResponse(applyAnswers: boolean): void {
    this.quizService.getMyResponse(this.quizId).subscribe({
      next: (res) => {
        if (!res.success || !res.data) return;
        this.isUpdateMode = true;
        this.existingResponseSubmittedAt = this.formatSubmittedAt(res.data.submittedAt);
        if (!applyAnswers) return;
        if (this.auth.user) {
          this.applyAuthenticatedIdentity(this.auth.user);
        }
        this.singleAnswers = {};
        this.multiAnswers = {};
        this.textAnswers = {};
        for (const answer of res.data.answers) {
          const question = this.quiz?.questions.find(item => item.questId === answer.questionId);
          if (!question) continue;
          if (question.type === "T") {
            this.textAnswers[question.questId] = answer.answer ?? "";
          } else if (question.type === "Q") {
            const [code] = answer.optionCodes ?? [];
            if (code !== undefined) this.singleAnswers[question.questId] = code;
          } else {
            this.multiAnswers[question.questId] = [...(answer.optionCodes ?? [])];
          }
        }
      },
      error: (err) => {
        if (err.status !== 404) {
          this.errorMessage = err.error?.message || "既有填答載入失敗。";
        }
      },
    });
  }

  private formatSubmittedAt(value: string): string {
    const datePrefix = /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1];
    if (datePrefix) return datePrefix;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  isMultiChecked(questId: number, code: number): boolean {
    return (this.multiAnswers[questId] || []).includes(code);
  }

  toggleMultiCheck(questId: number, code: number): void {
    const list =
      this.multiAnswers[questId] ?? (this.multiAnswers[questId] = []);
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
    if (q.type === "M") {
      return this.multiAnswers[q.questId] ?? [];
    }
    if (q.type === "Q") {
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
    this.errorMessage = "";
    this.fieldErrors = {};
    if (this.auth.user) {
      this.applyAuthenticatedIdentity(this.auth.user);
    }
    const normalizedPhone = normalizePhone(this.phone);

    if (
      !this.respondentName.trim() ||
      !PATTERNS.NAME.test(this.respondentName.trim().replace(/\s+/g, " "))
    ) {
      this.fieldErrors["respondentName"] = "只允許填寫中文和英文！";
    }
    if (!PATTERNS.PHONE.test(normalizedPhone)) {
      this.fieldErrors["phone"] = "手機格式不符！";
    }
    if (!PATTERNS.EMAIL.test(this.email.trim())) {
      this.fieldErrors["email"] = "信箱格式不符！";
    }
    if (this.age === null) {
      this.fieldErrors["age"] = "請輸入年齡！";
    } else if (!Number.isInteger(this.age) || this.age < 0) {
      this.fieldErrors["age"] = "年齡必須為零以上的整數！";
    }

    // 必填檢查。注意選項 code 從 0 開始，所以要比對 undefined 而不能用真假值判斷。
    for (const q of this.quiz?.questions ?? []) {
      if (
        q.need &&
        this.selectedCodes(q).length === 0 &&
        !this.textAnswers[q.questId]?.trim()
      ) {
        this.fieldErrors[`question_${q.questId}`] = "此題為必填項目！";
      }
    }

    if (Object.keys(this.fieldErrors).length > 0) {
      this.errorMessage = "資料內容有誤，請您修改後再送出！";
      return;
    }

    const answers: AnswerSubmit[] = (this.quiz?.questions ?? []).map((q) =>
      q.type === "T"
        ? { questionId: q.questId, answer: this.textAnswers[q.questId] ?? "" }
        : { questionId: q.questId, optionCodes: this.selectedCodes(q) },
    );

    const draftData: ResponseSubmit = {
      quizId: this.quizId,
      respondentName: this.respondentName.trim(),
      phone: normalizedPhone,
      email: this.email.trim(),
      age: this.age!,
      answers: answers,
    };

    // Save to Session Storage
    this.sessionStorageService.saveQuizDraft(this.quizId, draftData);
    // Navigate to Confirm Page
    this.router.navigate(["/quiz", this.quizId, "confirm"], {
      queryParams: this.isUpdateMode ? { mode: "update" } : {},
    });
  }

  onCancel(): void {
    this.router.navigate(["/quiz"]);
  }

  private applyAuthenticatedIdentity(user: AuthUser): void {
    this.respondentName = user.name;
    this.phone = user.phone;
    this.email = user.email;
    this.age = this.calculateAge(user.birthday);
  }

  private calculateAge(birthday?: string): number | null {
    if (!birthday) return null;
    const parts = birthday.split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const [year, month, day] = parts;
    const today = new Date();
    let age = today.getFullYear() - year;
    const birthdayPassed =
      today.getMonth() + 1 > month ||
      (today.getMonth() + 1 === month && today.getDate() >= day);
    if (!birthdayPassed) age--;
    return age >= 0 ? age : null;
  }
}
