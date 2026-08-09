import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { QuizService } from "../../../core/services/quiz.service";
import { SessionStorageService } from "../../../core/services/session-storage.service";
import {
  Question,
  QuizDetail,
  ResponseSubmit,
} from "../../../core/models/survey.model";

@Component({
  selector: "app-quiz-confirm",
  template: `
    <div class="container" *ngIf="draftData && quiz">
      <div class="card">
        <div
          style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;"
        >
          <div>
            <h1 class="page-title" style="margin-bottom: 8px;">
              {{ quiz.name }} (資料確認)
            </h1>
            <p style="color: var(--text-muted);">{{ quiz.description }}</p>
          </div>
          <div
            style="background: color-mix(in srgb, var(--warning) 12%, white); color: var(--warning); padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem;"
          >
            唯讀預覽模式
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid var(--primary); margin: 20px 0;" />

        <!-- User Information Review -->
        <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: var(--teal-900);">
          填答基本資料
        </h3>
        <div
          style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; background: var(--teal-50); padding: 16px; border-radius: 8px;"
        >
          <div>
            <strong style="color: var(--text-muted);">姓名：</strong>
            {{ draftData.respondentName }}
          </div>
          <div>
            <strong style="color: var(--text-muted);">手機：</strong>
            {{ draftData.phone }}
          </div>
          <div>
            <strong style="color: var(--text-muted);">E-mail：</strong>
            {{ draftData.email }}
          </div>
          <div>
            <strong style="color: var(--text-muted);">年齡：</strong>
            {{ draftData.age }}
          </div>
        </div>

        <!-- Answers Review -->
        <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: var(--teal-900);">
          填答內容確認
        </h3>
        <div
          *ngFor="let q of quiz.questions; let i = index"
          style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--primary);"
        >
          <div style="font-weight: 700; color: var(--teal-950); margin-bottom: 6px;">
            {{ i + 1 }}. {{ q.questName }}
          </div>
          <div
            style="color: var(--teal-700); font-weight: 600; padding-left: 12px; border-left: 3px solid var(--teal-600);"
          >
            {{ getAnswerDisplay(q) }}
          </div>
        </div>

        <div
          *ngIf="errorMessage"
          style="color: var(--danger); font-weight: 600; margin-bottom: 16px; background: color-mix(in srgb, var(--danger) 10%, white); padding: 10px 16px; border-radius: 6px;"
        >
          {{ errorMessage }}
        </div>

        <!-- Action Buttons -->
        <div
          style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;"
        >
          <button class="btn btn-secondary" (click)="onModify()">修改</button>
          <button
            class="btn btn-primary"
            (click)="onConfirmSubmit()"
            [disabled]="submitting"
          >
            {{ submitting ? "處理中..." : (isUpdateMode ? "儲存修改" : "確認送出") }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class QuizConfirmComponent implements OnInit {
  quizId!: number;
  quiz: QuizDetail | null = null;
  draftData: ResponseSubmit | null = null;

  submitting = false;
  errorMessage = "";
  isUpdateMode = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private sessionStorageService: SessionStorageService,
  ) {}

  ngOnInit(): void {
    this.quizId = +this.route.snapshot.paramMap.get("id")!;
    this.isUpdateMode = this.route.snapshot.queryParamMap.get("mode") === "update";
    this.draftData = this.sessionStorageService.getQuizDraft(this.quizId);

    if (!this.draftData) {
      this.router.navigate(["/quiz", this.quizId, "form"]);
      return;
    }

    this.quizService.getFrontQuizDetail(this.quizId).subscribe((res) => {
      if (res.success) {
        this.quiz = res.data;
      }
    });
  }

  /** 草稿存的是選項 code，顯示時才對照題目的選項還原成文字。 */
  getAnswerDisplay(question: Question): string {
    const item = this.draftData?.answers?.find(
      (a) => a.questionId === question.questId,
    );
    if (!item) return "未填寫";

    if (question.type === "T") {
      return item.answer?.trim() || "未填寫";
    }
    const labels = (item.optionCodes ?? [])
      .map((code) => question.options?.find((o) => o.code === code)?.optionName)
      .filter((label): label is string => !!label);
    return labels.length > 0 ? labels.join("、") : "未填寫";
  }

  onModify(): void {
    this.router.navigate(["/quiz", this.quizId, "form"]);
  }

  onConfirmSubmit(): void {
    if (!this.draftData) return;
    this.submitting = true;
    this.errorMessage = "";

    this.quizService.submitResponse(this.quizId, this.draftData).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          alert(this.isUpdateMode ? "問卷修改已儲存。" : "問卷送出成功！謝謝您的填寫。");
          this.sessionStorageService.clearQuizDraft(this.quizId);
          this.router.navigate(["/quiz"]);
        } else {
          this.errorMessage = res.message || "提交失敗，請再試一次！";
        }
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || "提交失敗，系統發生錯誤！";
        if (err.error?.fieldErrors) {
          this.sessionStorageService.saveServerErrors(
            this.quizId,
            err.error.fieldErrors,
          );
          this.router.navigate(["/quiz", this.quizId, "form"]);
        }
      },
    });
  }
}
