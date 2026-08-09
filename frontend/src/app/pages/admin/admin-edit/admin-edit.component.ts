import { Component, OnInit } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { ActivatedRoute, Router } from "@angular/router";
import { AdminQuizService } from "../../../core/services/admin-quiz.service";
import { MemberQuizService } from "../../../core/services/member-quiz.service";
import {
  OptionItem,
  QuestionDraft,
  QuestionType,
  QuizSaveRequest,
  getQuestionTypeLabel,
} from "../../../core/models/survey.model";
import { AuthService } from "../../../core/services/auth.service";

type QuestionSortField = "order" | "name" | "type" | "required";
type SortDirection = "asc" | "desc";
type RequiredFilter = "" | "required" | "optional";

@Component({
  selector: "app-admin-edit",
  template: `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">{{ isEditMode ? "編輯問卷" : "新增問卷" }}</h1>
        <button class="btn btn-outline" (click)="onReturnToList()">
          回列表
        </button>
      </div>

      <!-- Wizard Header Tabs -->
      <div class="tabs-header">
        <button
          class="tab-btn"
          [class.active]="currentTab === 1"
          (click)="switchTab(1)"
        >
          1. 問卷基本設定
        </button>
        <button
          class="tab-btn"
          [class.active]="currentTab === 2"
          (click)="switchTab(2)"
          [disabled]="highestUnlockedTab < 2"
          [attr.title]="
            highestUnlockedTab < 2
              ? '請先完成問卷基本設定，並按下「下一步（題目設計）」。'
              : null
          "
        >
          2. 題目設計
        </button>
        <button
          class="tab-btn"
          [class.active]="currentTab === 3"
          (click)="switchTab(3)"
          [disabled]="highestUnlockedTab < 3 || !canPreviewQuestions"
          [attr.title]="
            highestUnlockedTab < 3
              ? '請先完成題目設定，並按下「下一步（預覽確認）」。'
              : !canPreviewQuestions
                ? '請至少新增一題，並將至少一題設為必填後再預覽。'
                : null
          "
        >
          3. 題目確認與儲存
        </button>
      </div>

      <div
        *ngIf="errorMessage"
        style="color: var(--danger); font-weight: 600; margin-bottom: 16px; background: color-mix(in srgb, var(--danger) 10%, white); padding: 10px 16px; border-radius: 6px;"
      >
        {{ errorMessage }}
      </div>

      <!-- TAB 1: SURVEY INFORMATION -->
      <div *ngIf="currentTab === 1" class="card">
        <h3
          style="font-size: 1.1rem; margin-bottom: 20px; color: var(--teal-900);"
        >
          問卷內容相關設定
        </h3>

        <div
          style="display: flex; flex-direction: column; gap: 16px; max-width: 680px;"
        >
          <div class="form-group">
            <label>問卷名稱 <span style="color: var(--danger);">*</span></label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="name"
              (ngModelChange)="clearFieldError('name')"
              placeholder="請輸入問卷名稱"
            />
            <div class="field-error" *ngIf="fieldErrors['name']">
              {{ fieldErrors["name"] }}
            </div>
          </div>

          <div class="form-group">
            <label>問卷說明 <span style="color: var(--danger);">*</span></label>
            <textarea
              class="form-control"
              [(ngModel)]="description"
              (ngModelChange)="clearFieldError('description')"
              placeholder="請輸入問卷詳細說明與注意事項..."
            ></textarea>
            <div class="field-error" *ngIf="fieldErrors['description']">
              {{ fieldErrors["description"] }}
            </div>
          </div>

          <div
            style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;"
          >
            <div class="form-group">
              <label
                >開始時間 <span style="color: var(--danger);">*</span></label
              >
              <input
                type="date"
                class="form-control"
                [(ngModel)]="startDate"
                (ngModelChange)="clearFieldError('startDate')"
              />
              <div class="field-error" *ngIf="fieldErrors['startDate']">
                {{ fieldErrors["startDate"] }}
              </div>
            </div>

            <div class="form-group">
              <label
                >結束時間 <span style="color: var(--danger);">*</span></label
              >
              <input
                type="date"
                class="form-control"
                [(ngModel)]="endDate"
                (ngModelChange)="clearFieldError('endDate')"
              />
              <div class="field-error" *ngIf="fieldErrors['endDate']">
                {{ fieldErrors["endDate"] }}
              </div>
            </div>
          </div>
        </div>

        <div
          style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;"
        >
          <button class="btn btn-outline" (click)="onReturnToList()">
            取消
          </button>
          <button
            class="btn btn-primary"
            (click)="goToTab2()"
            [disabled]="!isBasicSettingsComplete"
            [attr.title]="
              !isBasicSettingsComplete
                ? '請先完整填寫問卷名稱、問卷說明與有效的開放日期。'
                : null
            "
          >
            下一步 (題目設計) &raquo;
          </button>
        </div>
      </div>

      <!-- TAB 2: QUESTION DESIGN -->
      <div *ngIf="currentTab === 2">
        <div class="card">
          <div
            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"
          >
            <h3 style="font-size: 1.1rem; color: var(--teal-900);">
              設計問題與選項
            </h3>
            <button class="btn btn-primary" (click)="openAddQuestionModal()">
              📄 新增問題
            </button>
          </div>

          <!-- Questions Table -->
          <div class="table-responsive" style="margin-bottom: 20px;">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">
                    <input
                      type="checkbox"
                      [checked]="isAllQuestionsSelected()"
                      (change)="toggleSelectAllQuestions()"
                    />
                  </th>
                  <th
                    style="width: 128px; text-align: center;"
                    [attr.aria-sort]="questionAriaSort('order')"
                  >
                    <button
                      type="button"
                      class="sortable-header-button"
                      (click)="sortQuestions('order')"
                    >
                      順序
                      <span aria-hidden="true">{{
                        questionSortIndicator("order")
                      }}</span>
                    </button>
                  </th>
                  <th [attr.aria-sort]="questionAriaSort('name')">
                    <button
                      type="button"
                      class="sortable-header-button"
                      (click)="sortQuestions('name')"
                    >
                      內容 (問題名稱)
                      <span aria-hidden="true">{{
                        questionSortIndicator("name")
                      }}</span>
                    </button>
                  </th>
                  <th
                    style="width: 100px;"
                    [attr.aria-sort]="questionAriaSort('type')"
                  >
                    <button
                      type="button"
                      class="sortable-header-button"
                      (click)="sortQuestions('type')"
                    >
                      種類
                      <span aria-hidden="true">{{
                        questionSortIndicator("type")
                      }}</span>
                    </button>
                  </th>
                  <th
                    style="width: 80px; text-align: center;"
                    [attr.aria-sort]="questionAriaSort('required')"
                  >
                    <button
                      type="button"
                      class="sortable-header-button"
                      (click)="sortQuestions('required')"
                    >
                      必填
                      <span aria-hidden="true">{{
                        questionSortIndicator("required")
                      }}</span>
                    </button>
                  </th>
                  <th style="width: 100px; text-align: center;">編輯</th>
                </tr>
              </thead>
              <tbody
                class="question-drop-list"
                cdkDropList
                [cdkDropListData]="questions"
                [cdkDropListDisabled]="!canDragQuestions"
                (cdkDropListDropped)="onQuestionDrop($event)"
              >
                <tr
                  *ngFor="
                    let row of visibleQuestionRows;
                    trackBy: trackQuestionRow
                  "
                  class="question-row"
                  cdkDrag
                  [cdkDragData]="row.question"
                  [cdkDragDisabled]="!canDragQuestions"
                >
                  <td style="text-align: center;">
                    <input
                      type="checkbox"
                      [checked]="
                        selectedQuestionIndices.includes(row.originalIndex)
                      "
                      (change)="toggleSelectQuestion(row.originalIndex)"
                    />
                  </td>
                  <td class="question-order-cell">
                    <span
                      class="question-drag-handle"
                      cdkDragHandle
                      [class.question-drag-handle--disabled]="
                        !canDragQuestions
                      "
                      role="button"
                      [attr.tabindex]="canDragQuestions ? 0 : -1"
                      [attr.aria-disabled]="!canDragQuestions"
                      [attr.aria-label]="
                        '拖曳調整第 ' +
                        (row.originalIndex + 1) +
                        ' 題順序，也可使用上下方向鍵'
                      "
                      [attr.title]="
                        canDragQuestions
                          ? '拖曳調整順序，或使用上下方向鍵'
                          : '重置篩選並切回順序升冪後可拖曳'
                      "
                      (keydown)="
                        onQuestionOrderKeydown($event, row.originalIndex)
                      "
                    >
                      <span aria-hidden="true">⠿</span>
                    </span>
                    <span class="question-order-label"
                      >第 {{ row.originalIndex + 1 }} 題</span
                    >
                  </td>
                  <td>{{ row.question.questName }}</td>
                  <td>{{ getTypeLabel(row.question.type) }}</td>
                  <td style="text-align: center;">
                    <input
                      type="checkbox"
                      [checked]="row.question.need"
                      disabled
                    />
                  </td>
                  <td style="text-align: center;">
                    <button
                      class="btn btn-outline"
                      style="padding: 2px 8px; font-size: 0.8rem;"
                      (click)="editQuestion(row.originalIndex)"
                    >
                      編輯
                    </button>
                    <ng-template cdkDragPreview [matchSize]="true">
                      <div class="question-drag-preview">
                        <span
                          class="question-drag-handle question-drag-preview-handle"
                          aria-hidden="true"
                          >⠿</span
                        >
                        <strong>第 {{ row.originalIndex + 1 }} 題</strong>
                        <span class="question-drag-preview-title">{{
                          row.question.questName
                        }}</span>
                        <span class="question-drag-preview-meta">
                          {{ getTypeLabel(row.question.type) }} ·
                          {{ row.question.need ? "必填" : "選填" }}
                        </span>
                      </div>
                    </ng-template>
                  </td>
                </tr>
                <tr *ngIf="questions.length === 0">
                  <td
                    colspan="6"
                    style="text-align: center; color: var(--text-light); padding: 32px;"
                  >
                    <div class="empty-state-visual">
                      <img
                        src="assets/illustrations/brainstorming-13.png"
                        alt=""
                        aria-hidden="true"
                      />
                      <span>尚無建立任何問題，請點擊右上角「新增問題」按鈕。</span>
                    </div>
                  </td>
                </tr>
                <tr
                  *ngIf="
                    questions.length > 0 && visibleQuestionRows.length === 0
                  "
                >
                  <td
                    colspan="6"
                    style="text-align: center; color: var(--text-light); padding: 32px;"
                  >
                    沒有符合目前篩選條件的題目。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style="display: flex; justify-content: space-between; align-items: center;"
          >
            <button
              class="btn btn-danger"
              (click)="deleteSelectedQuestions()"
              [disabled]="selectedQuestionIndices.length === 0"
            >
              🗑️ 刪除標示問題 ({{ selectedQuestionIndices.length }})
            </button>
            <div style="display: flex; gap: 12px;">
              <button class="btn btn-outline" (click)="switchTab(1)">
                &laquo; 上一步
              </button>
              <button
                class="btn btn-secondary"
                (click)="onSave(false)"
                [disabled]="
                  saving ||
                  (!isAdminArea && isPublished && !canPreviewQuestions)
                "
              >
                {{
                  !isAdminArea && isPublished ? "💾 儲存變更" : "💾 儲存草稿"
                }}
              </button>
              <button
                class="btn btn-primary"
                (click)="goToTab3()"
                [disabled]="!canPreviewQuestions"
                [attr.title]="
                  !canPreviewQuestions
                    ? '請至少新增一題，並將至少一題設為必填後再預覽。'
                    : null
                "
              >
                下一步 (預覽確認) &raquo;
              </button>
            </div>
          </div>
          <p
            *ngIf="!canPreviewQuestions"
            class="question-step-hint"
            role="status"
          >
            {{
              !isAdminArea && isPublished
                ? "已發布問卷至少需保留一題必填題目，請修正後再儲存或預覽。"
                : "請至少新增一題且為必填後再進行預覽確認；目前仍可先儲存草稿。"
            }}
          </p>
        </div>
      </div>

      <!-- TAB 3: CONFIRMATION & PUBLISH/SAVE DRAFT -->
      <div *ngIf="currentTab === 3" class="card">
        <h3
          style="font-size: 1.1rem; margin-bottom: 16px; color: var(--teal-900);"
        >
          問卷全覽預覽 (題目確認頁)
        </h3>

        <div
          style="background: var(--teal-50); padding: 16px; border-radius: 8px; border: 1px solid var(--primary); margin-bottom: 24px;"
        >
          <h2
            style="font-size: 1.3rem; font-weight: 700; color: var(--teal-950);"
          >
            {{ name }}
          </h2>
          <p style="color: var(--text-muted); margin-top: 4px;">
            {{ description }}
          </p>
          <div
            style="margin-top: 8px; font-size: 0.85rem; color: var(--teal-800);"
          >
            預定開放期間：<strong>{{ startDate }}</strong> 至
            <strong>{{ endDate }}</strong>
          </div>
        </div>

        <h4
          style="font-size: 1rem; font-weight: 700; margin-bottom: 16px; color: var(--teal-900);"
        >
          題目與選項清單 ({{ questions.length }} 題)
        </h4>

        <div
          *ngFor="let q of questions; let i = index"
          style="background: #ffffff; border: 1px solid var(--primary); border-radius: 8px; padding: 16px; margin-bottom: 16px;"
        >
          <div
            style="font-weight: 700; color: var(--teal-950); margin-bottom: 8px;"
          >
            {{ i + 1 }}. {{ q.questName }}
            <span
              *ngIf="q.need"
              style="color: var(--danger); font-size: 0.85rem;"
              >(必填)</span
            >
            <span
              style="font-weight: 400; font-size: 0.85rem; color: var(--text-muted); margin-left: 8px;"
            >
              [{{ getTypeLabel(q.type) }}]
            </span>
          </div>

          <div *ngIf="q.type !== 'T'" style="padding-left: 12px;">
            <div
              *ngFor="let opt of q.options"
              style="color: var(--teal-800); font-size: 0.9rem; margin-bottom: 4px;"
            >
              • {{ opt.optionName }}
            </div>
          </div>
          <div
            *ngIf="q.type === 'T'"
            style="padding-left: 12px; color: var(--text-light); font-style: italic; font-size: 0.9rem;"
          >
            [使用者簡答輸入框]
          </div>
        </div>

        <div
          style="display: flex; justify-content: space-between; align-items: center; margin-top: 32px;"
        >
          <button class="btn btn-outline" (click)="switchTab(2)">
            &laquo; 回上一步修改
          </button>

          <div style="display: flex; gap: 12px;">
            <button
              class="btn btn-secondary"
              (click)="onSave(false)"
              [disabled]="saving"
            >
              {{ !isAdminArea && isPublished ? "💾 儲存變更" : "💾 儲存" }}
            </button>
            <span *ngIf="!isAdminArea" class="publish-waiting-note">
              {{
                isPublished
                  ? "儲存後維持管理員已發布狀態"
                  : "按下儲存後將等待管理員發布 !!"
              }}
            </span>
            <button
              *ngIf="isAdminArea"
              class="btn btn-primary publish-button"
              (click)="onSave(true)"
              [disabled]="saving"
            >
              🚀 儲存並發布
            </button>
          </div>
        </div>
      </div>

      <!-- QUESTION EDIT/ADD MODAL DIALOG -->
      <div class="modal-backdrop" *ngIf="showQuestionModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">
              {{ editingQuestionIndex !== null ? "編輯問題" : "新增問題" }}
            </h3>
            <button class="modal-close" (click)="closeQuestionModal()">
              &times;
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div class="form-group">
              <label
                >問題名稱 <span style="color: var(--danger);">*</span></label
              >
              <input
                type="text"
                class="form-control"
                [(ngModel)]="modalQuestName"
                placeholder="請輸入問題標題..."
              />
            </div>

            <div
              style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;"
            >
              <div class="form-group">
                <label>題型種類</label>
                <select class="form-control" [(ngModel)]="modalType">
                  <option value="Q">單選題</option>
                  <option value="M">多選題</option>
                  <option value="T">文字題</option>
                </select>
              </div>

              <div class="form-group" style="justify-content: flex-end;">
                <label
                  style="display: flex; align-items: center; gap: 8px; cursor: pointer; height: 38px;"
                >
                  <input type="checkbox" [(ngModel)]="modalNeed" /> 是否必填
                </label>
              </div>
            </div>

            <!-- Options Section for Choice Questions (Q/M) -->
            <div *ngIf="modalType !== 'T'" style="margin-top: 8px;">
              <label
                style="font-weight: 600; color: var(--teal-800); font-size: 0.9rem; margin-bottom: 8px; display: block;"
              >
                選項列表 (目前 {{ modalOptions.length }} 個選項)
              </label>

              <div
                *ngFor="let opt of modalOptions; let optIdx = index"
                class="option-input-row"
              >
                <span class="option-number">{{ optIdx + 1 }}.</span>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="opt.optionName"
                  placeholder="選項內容"
                />
                <button
                  class="btn btn-outline"
                  style="padding: 4px 8px; color: var(--danger);"
                  (click)="removeModalOption(optIdx)"
                  [disabled]="modalOptions.length <= 1"
                >
                  ✕
                </button>
              </div>

              <button
                class="btn btn-outline"
                style="width: 100%; margin-top: 8px;"
                (click)="addModalOption()"
              >
                ➕ 新增選項
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeQuestionModal()">
              取消
            </button>
            <button class="btn btn-primary" (click)="saveQuestionModal()">
              確定保存
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .tab-btn:disabled {
        color: var(--text-light);
        cursor: not-allowed;
      }

      .question-row {
        transition:
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      .question-drop-list.cdk-drop-list-dragging
        .question-row:not(.cdk-drag-placeholder),
      .question-row.cdk-drag-animating {
        transition: transform 180ms cubic-bezier(0.2, 0, 0, 1);
      }

      .question-row.cdk-drag-placeholder {
        opacity: 0.28;
        background: var(--teal-50);
        box-shadow: inset 0 0 0 2px var(--teal-200);
      }

      .question-filter-grid {
        display: grid;
        grid-template-columns:
          minmax(220px, 2fr) minmax(150px, 1fr) minmax(150px, 1fr)
          auto;
        gap: 12px;
        align-items: end;
        margin-bottom: 16px;
        padding: 14px;
        border: 1px solid var(--primary);
        border-radius: 8px;
        background: var(--teal-50);
      }

      .question-filter-actions {
        justify-content: flex-end;
      }

      .question-order-cell {
        text-align: center;
        white-space: nowrap;
      }

      .question-drag-handle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        margin-right: 8px;
        border: 1px solid var(--primary);
        border-radius: 6px;
        background: var(--teal-50);
        color: var(--teal-600);
        font: inherit;
        font-size: 1.15rem;
        line-height: 1;
        cursor: grab;
        user-select: none;
      }

      .question-drag-handle:active {
        cursor: grabbing;
      }

      .question-drag-handle--disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .question-drag-handle:focus-visible {
        outline: 2px solid transparent;
        box-shadow: 0 0 0 3px rgb(31 129 150 / 24%);
      }

      .question-drag-preview {
        display: grid;
        grid-template-columns: 36px 88px minmax(0, 1fr) auto;
        gap: var(--ds-space-3);
        align-items: center;
        box-sizing: border-box;
        padding: var(--ds-space-3) var(--ds-space-4);
        overflow: hidden;
        border: 1px solid var(--primary);
        border-radius: var(--radius-md);
        background: var(--bg-card);
        color: var(--teal-950);
        box-shadow: var(--shadow-lg);
      }

      .question-drag-preview-handle {
        margin-right: 0;
        cursor: grabbing;
      }

      .question-drag-preview-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .question-drag-preview-meta {
        color: var(--text-muted);
        font-size: 0.875rem;
        white-space: nowrap;
      }

      .question-order-label {
        color: var(--ds-color-text-secondary);
        font-size: 0.85rem;
        font-weight: 600;
      }

      .question-step-hint {
        margin-top: 12px;
        color: var(--warning);
        font-size: 0.875rem;
        font-weight: 600;
        text-align: right;
      }

      .publish-waiting-note {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 6px;
        color: var(--teal-700);
        font-size: 0.875rem;
        font-weight: 600;
      }

      .publish-button {
        background: var(--teal-600);
      }

      .publish-button:hover:not(:disabled) {
        background: var(--teal-700);
      }

      @media (prefers-reduced-motion: reduce) {
        .question-row,
        .question-drop-list.cdk-drop-list-dragging
          .question-row:not(.cdk-drag-placeholder),
        .question-row.cdk-drag-animating {
          transition: none;
        }
      }
    `,
  ],
})
export class AdminEditComponent implements OnInit {
  quizId?: number;
  isEditMode = false;
  currentTab = 1;
  highestUnlockedTab = 1;

  name = "";
  description = "";
  startDate = new Date().toISOString().split("T")[0];
  endDate = new Date().toISOString().split("T")[0];
  isPublished = false;

  questions: QuestionDraft[] = [];
  selectedQuestionIndices: number[] = [];
  questionSearch = "";
  questionTypeFilter: "" | QuestionType = "";
  questionRequiredFilter: RequiredFilter = "";
  questionSortBy: QuestionSortField | null = null;
  questionSortDirection: SortDirection = "asc";

  // Modal State
  showQuestionModal = false;
  editingQuestionIndex: number | null = null;
  modalQuestName = "";
  modalType: QuestionType = "Q";
  modalNeed = false;
  modalOptions: OptionItem[] = [];

  errorMessage = "";
  fieldErrors: Record<string, string> = {};
  saving = false;
  isAdminArea = false;
  managementBase = "/member/quizzes";

  getTypeLabel = getQuestionTypeLabel;

  get canPreviewQuestions(): boolean {
    return (
      this.questions.length > 0 &&
      this.questions.some((question) => question.need)
    );
  }

  get isBasicSettingsComplete(): boolean {
    return !!(
      this.name.trim() &&
      this.description.trim() &&
      this.startDate &&
      this.endDate &&
      this.startDate <= this.endDate
    );
  }

  get visibleQuestionRows(): Array<{
    question: QuestionDraft;
    originalIndex: number;
  }> {
    const search = this.questionSearch.trim().toLocaleLowerCase("zh-TW");
    const rows = this.questions
      .map((question, originalIndex) => ({ question, originalIndex }))
      .filter(
        ({ question }) =>
          (!search ||
            question.questName.toLocaleLowerCase("zh-TW").includes(search)) &&
          (!this.questionTypeFilter ||
            question.type === this.questionTypeFilter) &&
          (!this.questionRequiredFilter ||
            (this.questionRequiredFilter === "required"
              ? question.need
              : !question.need)),
      );

    if (!this.questionSortBy) return rows;
    const direction = this.questionSortDirection === "asc" ? 1 : -1;
    return rows.sort((left, right) => {
      let compared = 0;
      switch (this.questionSortBy) {
        case "order":
          compared = left.originalIndex - right.originalIndex;
          break;
        case "name":
          compared = left.question.questName.localeCompare(
            right.question.questName,
            "zh-TW",
          );
          break;
        case "type":
          compared = this.getTypeLabel(left.question.type).localeCompare(
            this.getTypeLabel(right.question.type),
            "zh-TW",
          );
          break;
        case "required":
          compared = Number(left.question.need) - Number(right.question.need);
          break;
      }
      return (compared || left.originalIndex - right.originalIndex) * direction;
    });
  }

  get canDragQuestions(): boolean {
    const naturalSort =
      this.questionSortBy === null ||
      (this.questionSortBy === "order" && this.questionSortDirection === "asc");
    return (
      naturalSort &&
      !this.questionSearch.trim() &&
      !this.questionTypeFilter &&
      !this.questionRequiredFilter
    );
  }

  trackQuestionRow(
    _index: number,
    row: { question: QuestionDraft; originalIndex: number },
  ): QuestionDraft {
    return row.question;
  }

  clearFieldError(field: string): void {
    if (this.fieldErrors[field]) {
      delete this.fieldErrors[field];
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminQuizService: AdminQuizService,
    private memberQuizService: MemberQuizService,
    public readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.isAdminArea = this.route.snapshot.data["managementScope"] === "admin";
    this.managementBase = this.isAdminArea ? "/admin" : "/member/quizzes";
    const idParam = this.route.snapshot.paramMap.get("id");
    if (idParam && idParam !== "new") {
      this.quizId = +idParam;
      this.isEditMode = true;
      this.loadExistingQuiz();
    }
  }

  loadExistingQuiz(): void {
    if (!this.quizId) return;
    this.adminQuizService
      .getManagedQuizDetail(this.quizId, this.isAdminArea)
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const q = res.data;
            this.name = q.name;
            this.description = q.description;
            this.startDate = q.startDate;
            this.endDate = q.endDate;
            this.isPublished = q.isPublished;
            this.questions = q.questions || [];
            this.highestUnlockedTab = 3;
          }
        },
        error: (err) => {
          this.errorMessage =
            err.status === 403
              ? "您沒有權限管理此問卷。"
              : err.error?.message || "問卷載入失敗。";
        },
      });
  }

  switchTab(tab: number): void {
    this.errorMessage = "";
    if (tab > this.highestUnlockedTab) {
      return;
    }
    if ((tab === 2 || tab === 3) && !this.validateTab1()) {
      return;
    }
    if (tab === 3 && !this.hasQuestionsForPreview()) {
      return;
    }
    this.currentTab = tab;
  }

  validateTab1(): boolean {
    this.errorMessage = "";
    this.fieldErrors = {};

    if (!this.name || !this.name.trim()) {
      this.fieldErrors["name"] = "請填寫問卷名稱！";
    }
    if (!this.description || !this.description.trim()) {
      this.fieldErrors["description"] = "請填寫問卷說明！";
    }
    if (!this.startDate) {
      this.fieldErrors["startDate"] = "請選擇開始時間！";
    }
    if (!this.endDate) {
      this.fieldErrors["endDate"] = "請選擇結束時間！";
    }
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      this.fieldErrors["endDate"] =
        "問卷結束時間不能早於開始時間，請重新選擇！";
    }

    if (Object.keys(this.fieldErrors).length > 0) {
      this.errorMessage =
        "基本設定資料有誤或不完整，請檢查並修正欄位後再繼續！";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    return true;
  }

  goToTab2(): void {
    if (this.validateTab1()) {
      this.highestUnlockedTab = Math.max(this.highestUnlockedTab, 2);
      this.currentTab = 2;
    }
  }

  goToTab3(): void {
    if (this.validateTab1() && this.hasQuestionsForPreview()) {
      this.highestUnlockedTab = Math.max(this.highestUnlockedTab, 3);
      this.currentTab = 3;
    }
  }

  private hasQuestionsForPreview(): boolean {
    if (this.canPreviewQuestions) {
      return true;
    }
    this.errorMessage =
      this.questions.length === 0
        ? "請至少新增一題後再進行預覽確認。"
        : "請將至少一題設為必填後再進行預覽確認。";
    return false;
  }

  // Question Modal Management
  openAddQuestionModal(): void {
    this.editingQuestionIndex = null;
    this.modalQuestName = "";
    this.modalType = "Q";
    this.modalNeed = true;
    this.modalOptions = [
      { optionName: "", code: 0 },
      { optionName: "", code: 1 },
    ];
    this.showQuestionModal = true;
  }

  editQuestion(index: number): void {
    this.editingQuestionIndex = index;
    const q = this.questions[index];
    this.modalQuestName = q.questName;
    this.modalType = q.type;
    this.modalNeed = q.need;
    this.modalOptions = (q.options || []).map((opt) => ({ ...opt }));
    if (this.modalType !== "T" && this.modalOptions.length === 0) {
      this.modalOptions = [
        { optionName: "", code: 0 },
        { optionName: "", code: 1 },
      ];
    }
    this.showQuestionModal = true;
  }

  closeQuestionModal(): void {
    this.showQuestionModal = false;
  }

  addModalOption(): void {
    this.modalOptions.push({ optionName: "", code: this.modalOptions.length });
  }

  removeModalOption(idx: number): void {
    if (this.modalOptions.length > 1) {
      this.modalOptions.splice(idx, 1);
    }
  }

  saveQuestionModal(): void {
    if (!this.modalQuestName.trim()) {
      alert("請填寫問題名稱！");
      return;
    }

    let cleanedOptions: OptionItem[] = [];
    if (this.modalType !== "T") {
      cleanedOptions = this.modalOptions
        .filter((o) => o.optionName.trim().length > 0)
        .map((o, idx) => ({ optionName: o.optionName.trim(), code: idx }));

      if (cleanedOptions.length === 0) {
        alert("選擇題型至少需要填寫一個有效選項！");
        return;
      }
    }

    const questionItem: QuestionDraft = {
      questId:
        this.editingQuestionIndex !== null
          ? this.questions[this.editingQuestionIndex].questId
          : undefined,
      questName: this.modalQuestName.trim(),
      type: this.modalType,
      need: this.modalNeed,
      options: cleanedOptions,
    };

    if (this.editingQuestionIndex !== null) {
      this.questions[this.editingQuestionIndex] = questionItem;
    } else {
      this.questions.push(questionItem);
    }

    this.errorMessage = "";
    this.closeQuestionModal();
  }

  resetQuestionFilters(): void {
    this.questionSearch = "";
    this.questionTypeFilter = "";
    this.questionRequiredFilter = "";
  }

  sortQuestions(field: QuestionSortField): void {
    if (this.questionSortBy === field) {
      this.questionSortDirection =
        this.questionSortDirection === "asc" ? "desc" : "asc";
    } else {
      this.questionSortBy = field;
      this.questionSortDirection = "asc";
    }
  }

  questionSortIndicator(field: QuestionSortField): string {
    if (this.questionSortBy !== field) return "↕";
    return this.questionSortDirection === "asc" ? "↑" : "↓";
  }

  questionAriaSort(
    field: QuestionSortField,
  ): "ascending" | "descending" | "none" {
    if (this.questionSortBy !== field) return "none";
    return this.questionSortDirection === "asc" ? "ascending" : "descending";
  }

  onQuestionDrop(event: CdkDragDrop<QuestionDraft[]>): void {
    if (
      !this.canDragQuestions ||
      event.previousIndex === event.currentIndex
    ) {
      return;
    }
    this.moveQuestion(event.previousIndex, event.currentIndex);
  }

  onQuestionOrderKeydown(event: KeyboardEvent, sourceIndex: number): void {
    if (!this.canDragQuestions) return;
    const offset =
      event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    if (!offset) return;
    const targetIndex = sourceIndex + offset;
    if (targetIndex < 0 || targetIndex >= this.questions.length) return;
    event.preventDefault();
    this.moveQuestion(sourceIndex, targetIndex);
  }

  private moveQuestion(sourceIndex: number, targetIndex: number): void {
    const selectedQuestions = this.selectedQuestionIndices
      .map((index) => this.questions[index])
      .filter((question): question is QuestionDraft => !!question);
    moveItemInArray(this.questions, sourceIndex, targetIndex);
    this.selectedQuestionIndices = selectedQuestions
      .map((question) => this.questions.indexOf(question))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b);
  }

  // Question Selection and Deletion
  toggleSelectQuestion(index: number): void {
    const pos = this.selectedQuestionIndices.indexOf(index);
    if (pos >= 0) {
      this.selectedQuestionIndices.splice(pos, 1);
    } else {
      this.selectedQuestionIndices.push(index);
    }
  }

  isAllQuestionsSelected(): boolean {
    const visibleIndices = this.visibleQuestionRows.map(
      (row) => row.originalIndex,
    );
    return (
      visibleIndices.length > 0 &&
      visibleIndices.every((index) =>
        this.selectedQuestionIndices.includes(index),
      )
    );
  }

  toggleSelectAllQuestions(): void {
    const visibleIndices = this.visibleQuestionRows.map(
      (row) => row.originalIndex,
    );
    if (this.isAllQuestionsSelected()) {
      this.selectedQuestionIndices = this.selectedQuestionIndices.filter(
        (index) => !visibleIndices.includes(index),
      );
    } else {
      this.selectedQuestionIndices = Array.from(
        new Set([...this.selectedQuestionIndices, ...visibleIndices]),
      ).sort((left, right) => left - right);
    }
  }

  deleteSelectedQuestions(): void {
    if (this.selectedQuestionIndices.length === 0) return;
    this.questions = this.questions.filter(
      (_, idx) => !this.selectedQuestionIndices.includes(idx),
    );
    this.selectedQuestionIndices = [];
  }

  // Final Save to DB
  onSave(isPublished: boolean): void {
    if (!this.validateTab1()) return;
    if (isPublished && !this.isAdminArea) {
      this.errorMessage = "只有管理員可以發布問卷。";
      return;
    }
    if (isPublished && !this.hasQuestionsForPreview()) {
      return;
    }
    if (
      !this.isAdminArea &&
      this.isPublished &&
      !this.hasQuestionsForPreview()
    ) {
      return;
    }

    this.saving = true;
    this.errorMessage = "";

    const payload: QuizSaveRequest = {
      id: this.quizId,
      name: this.name.trim(),
      description: this.description.trim(),
      startDate: this.startDate,
      endDate: this.endDate,
      isPublished: isPublished,
      questions: this.questions,
    };

    const request$ = this.isAdminArea
      ? this.adminQuizService.saveOrUpdateQuiz(payload)
      : this.memberQuizService.createMemberQuiz(payload);

    request$.subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          alert(
            isPublished ? "問卷已成功儲存並發佈！" : "問卷草稿已成功儲存！",
          );
          this.router.navigate([this.managementBase]);
        } else {
          this.errorMessage = res.message || "儲存失敗！";
        }
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || "系統錯誤，儲存失敗！";
      },
    });
  }

  onReturnToList(): void {
    this.router.navigate([this.managementBase]);
  }
}
