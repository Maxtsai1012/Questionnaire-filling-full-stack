import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { finalize } from "rxjs";
import { AdminQuizService } from "../../../core/services/admin-quiz.service";
import { MemberQuizService } from "../../../core/services/member-quiz.service";
import {
  QuizListItem,
  QuizStatusType,
} from "../../../core/models/survey.model";
import { AuthService } from "../../../core/services/auth.service";
import {
  createPaginationState,
  updatePagination,
  PaginationState,
} from "../../../core/utils/pagination.helper";

type QuizSortField = "id" | "name" | "status" | "startDate" | "endDate";
type SortDirection = "asc" | "desc";

@Component({
  selector: "app-admin-list",
  template: `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">
          {{ isAdminArea ? "後台問卷管理列表" : "我的問卷" }}
        </h1>
      </div>
      <div class="admin-status-note">
        {{
          isAdminArea
            ? "可由狀態下拉選單手動管理問卷開放狀態。"
            : "顯示您自己建立的草稿與已發布問卷。"
        }}
      </div>
      <div class="field-error admin-load-error" *ngIf="loadError">
        {{ loadError }}
      </div>

      <!-- Search Section -->
      <div class="search-card">
        <div class="search-grid">
          <div class="form-group">
            <label>問卷名稱：</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="searchName"
              placeholder="搜尋問卷標題..."
              (keyup.enter)="onSearch()"
            />
          </div>

          <div class="form-group">
            <label>統計時間 (開始)：</label>
            <input
              type="date"
              class="form-control"
              [(ngModel)]="startDate"
              (change)="onSearch()"
            />
          </div>

          <div class="form-group">
            <label>統計時間 (結束)：</label>
            <input
              type="date"
              class="form-control"
              [(ngModel)]="endDate"
              (change)="onSearch()"
            />
          </div>

          <div class="form-group" style="flex-direction: row; gap: 8px;">
            <button class="btn btn-primary" (click)="onSearch()">搜尋</button>
            <button class="btn btn-outline" (click)="onReset()">重置</button>
          </div>
        </div>
      </div>

      <!-- Action Bar (Delete & Add) -->
      <div
        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;"
      >
        <div style="display: flex; gap: 12px; align-items: center;">
          <button
            class="btn btn-danger"
            (click)="askDeleteSelected()"
            [disabled]="selectedIds.length === 0 || deleting"
          >
            🗑️ 刪除勾選項 ({{ selectedIds.length }})
          </button>
          <span
            *ngIf="actionMessage"
            [style.color]="actionFailed ? 'var(--danger)' : 'var(--success)'"
            style="font-weight: 600;"
          >
            {{ actionMessage }}
          </span>
        </div>

        <button class="btn btn-primary" (click)="onCreateNew()">
          📄 新增問卷
        </button>
      </div>

      <!-- 刪除確認：用頁內元件而非 window.confirm，瀏覽器封鎖對話框時才不會整個按鈕沒反應 -->
      <div
        *ngIf="pendingDeleteCount > 0"
        style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;
                  background: color-mix(in srgb, var(--danger) 8%, white); border: 1px solid color-mix(in srgb, var(--danger) 28%, white); border-radius: 8px; padding: 12px 16px;"
      >
        <span style="color: var(--danger); font-weight: 600;">
          確定要刪除選取的
          {{ pendingDeleteCount }}
          筆問卷嗎？連同題目與填答紀錄一併移除，且無法復原。
        </span>
        <button
          class="btn btn-danger"
          (click)="confirmDelete()"
          [disabled]="deleting"
        >
          {{ deleting ? "刪除中…" : "確定刪除" }}
        </button>
        <button
          class="btn btn-outline"
          (click)="cancelDelete()"
          [disabled]="deleting"
        >
          取消
        </button>
      </div>

      <!-- Admin Survey Table -->
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">
                <input
                  type="checkbox"
                  [checked]="isAllSelected()"
                  (change)="toggleSelectAll()"
                />
              </th>
              <th style="width: 80px;" [attr.aria-sort]="ariaSort('id')">
                <button
                  type="button"
                  class="sortable-header-button"
                  (click)="sortByColumn('id')"
                >
                  編號 <span aria-hidden="true">{{ sortIndicator("id") }}</span>
                </button>
              </th>
              <th [attr.aria-sort]="ariaSort('name')">
                <button
                  type="button"
                  class="sortable-header-button"
                  (click)="sortByColumn('name')"
                >
                  名稱
                  <span aria-hidden="true">{{ sortIndicator("name") }}</span>
                </button>
              </th>
              <th style="width: 140px;" [attr.aria-sort]="ariaSort('status')">
                <button
                  type="button"
                  class="sortable-header-button"
                  (click)="sortByColumn('status')"
                >
                  狀態
                  <span aria-hidden="true">{{ sortIndicator("status") }}</span>
                </button>
              </th>
              <th
                style="width: 140px;"
                [attr.aria-sort]="ariaSort('startDate')"
              >
                <button
                  type="button"
                  class="sortable-header-button"
                  (click)="sortByColumn('startDate')"
                >
                  開始時間
                  <span aria-hidden="true">{{
                    sortIndicator("startDate")
                  }}</span>
                </button>
              </th>
              <th style="width: 140px;" [attr.aria-sort]="ariaSort('endDate')">
                <button
                  type="button"
                  class="sortable-header-button"
                  (click)="sortByColumn('endDate')"
                >
                  結束時間
                  <span aria-hidden="true">{{ sortIndicator("endDate") }}</span>
                </button>
              </th>
              <th style="width: 130px; text-align: center;">發布管理</th>
              <th style="width: 100px; text-align: center;">結果</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let quiz of quizzes">
              <td style="text-align: center;">
                <input
                  type="checkbox"
                  [checked]="selectedIds.includes(quiz.id)"
                  (change)="toggleSelect(quiz.id)"
                />
              </td>
              <td>#{{ quiz.id }}</td>
              <td>
                <!-- Editable link if UNPUBLISHED or NOT_STARTED -->
                <a
                  *ngIf="quiz.canEdit"
                  [routerLink]="[managementBase, quiz.id, 'edit']"
                  style="font-weight: 600;"
                >
                  ✏️ {{ quiz.name }}
                </a>
                <!-- Read-only link if IN_PROGRESS or ENDED -->
                <a
                  *ngIf="!quiz.canEdit"
                  [routerLink]="[managementBase, quiz.id, 'detail']"
                  style="font-weight: 600; color: var(--teal-800);"
                >
                  📊 {{ quiz.name }}
                </a>
              </td>
              <td>
                <select
                  *ngIf="isAdminArea"
                  class="status-select"
                  [ngClass]="'status-select--' + quiz.status.toLowerCase()"
                  [ngModel]="quiz.status"
                  (ngModelChange)="onStatusChange(quiz, $event)"
                  [disabled]="statusUpdating[quiz.id]"
                  [attr.aria-label]="'設定「' + quiz.name + '」狀態'"
                >
                  <option
                    *ngFor="let option of statusOptions"
                    [ngValue]="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <span
                  *ngIf="!isAdminArea"
                  class="badge"
                  [ngClass]="{
                    'badge-unpublished': quiz.status === 'UNPUBLISHED',
                    'badge-notstarted': quiz.status === 'NOT_STARTED',
                    'badge-inprogress': quiz.status === 'IN_PROGRESS',
                    'badge-ended': quiz.status === 'ENDED',
                  }"
                >
                  {{ quiz.statusLabel }}
                </span>
              </td>
              <td>{{ quiz.startDate }}</td>
              <td>{{ quiz.endDate }}</td>
              <td style="text-align: center;">
                <a
                  *ngIf="isAdminArea && quiz.status === 'UNPUBLISHED'"
                  [routerLink]="[managementBase, quiz.id, 'edit']"
                  class="publish-entry"
                >
                  審核／發布
                </a>
                <span
                  *ngIf="!isAdminArea && quiz.status === 'UNPUBLISHED'"
                  class="publish-waiting"
                >
                  等待管理員
                </span>
                <span
                  *ngIf="quiz.status !== 'UNPUBLISHED'"
                  class="publish-complete"
                >
                  已發布
                </span>
              </td>
              <td style="text-align: center;">
                <a
                  *ngIf="quiz.responseCount > 0"
                  [routerLink]="[managementBase, quiz.id, 'detail']"
                  [queryParams]="{ tab: 'stats' }"
                  class="btn btn-outline"
                  style="padding: 4px 10px; font-size: 0.825rem;"
                >
                  前往
                </a>
                <span
                  *ngIf="quiz.responseCount === 0"
                  style="color: var(--teal-200); font-size: 0.85rem;"
                  >-</span
                >
              </td>
            </tr>
            <tr *ngIf="quizzes.length === 0">
              <td
                colspan="8"
                style="text-align: center; color: var(--text-light); padding: 32px;"
              >
                <div class="empty-state-visual">
                  <img
                    [src]="
                      isAdminArea || searchName || startDate || endDate
                        ? 'assets/illustrations/search-engine-1-36.png'
                        : 'assets/illustrations/step-one-60.png'
                    "
                    alt=""
                    aria-hidden="true"
                  />
                  <span>
                {{
                  isAdminArea
                    ? "目前沒有符合條件的問卷資料"
                    : "您目前還沒有建立任何問卷，快來建立第一份問卷吧！"
                }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <app-pagination
        [state]="pagination"
        (pageChange)="changePage($event)"
      ></app-pagination>
    </div>
  `,
  styles: [
    `
      .publish-entry {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 34px;
        padding: 7px 12px;
        border-radius: 6px;
        background: var(--teal-600);
        color: #ffffff;
        font-size: 0.825rem;
        font-weight: 600;
        transition:
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      .publish-entry:hover {
        background: var(--teal-700);
        color: #ffffff;
      }

      .publish-entry:focus-visible {
        outline: 2px solid transparent;
        box-shadow: 0 0 0 3px rgb(31 129 150 / 24%);
      }

      .publish-waiting,
      .publish-complete {
        font-size: 0.825rem;
        font-weight: 600;
      }

      .publish-waiting {
        color: var(--warning);
      }

      .publish-complete {
        color: var(--success);
      }

      .status-select {
        width: 100%;
        min-height: 38px;
        padding: 7px 30px 7px 10px;
        border: 1px solid var(--primary);
        border-radius: 6px;
        background: #ffffff;
        color: var(--teal-950);
        font: inherit;
        font-size: 0.825rem;
        font-weight: 700;
      }

      .status-select:focus-visible {
        outline: 2px solid transparent;
        border-color: var(--teal-600);
        box-shadow: 0 0 0 3px rgb(31 129 150 / 18%);
      }

      .status-select--unpublished {
        color: var(--text-muted);
      }
      .status-select--not_started {
        color: var(--warning);
      }
      .status-select--in_progress {
        color: var(--success);
      }
      .status-select--ended {
        color: var(--danger);
      }

      @media (prefers-reduced-motion: reduce) {
        .publish-entry {
          transition: none;
        }
      }
    `,
  ],
})
export class AdminListComponent implements OnInit {
  quizzes: QuizListItem[] = [];
  selectedIds: number[] = [];

  searchName = "";
  startDate = "";
  endDate = "";
  sortBy: QuizSortField = "id";
  sortDirection: SortDirection = "desc";

  pagination: PaginationState = createPaginationState(10);
  loadError = "";

  // 刪除流程狀態。刻意不用 window.confirm/alert：瀏覽器在連續彈窗後會提供
  // 「封鎖此頁對話框」，一旦勾選，confirm() 直接回傳 false 且 alert() 無聲失效，
  // 使用者看到的就是「按了沒反應」。
  pendingDeleteCount = 0;
  deleting = false;
  actionMessage = "";
  actionFailed = false;
  isAdminArea = false;
  managementBase = "/member/quizzes";
  statusUpdating: Record<number, boolean> = {};
  readonly statusOptions: { value: QuizStatusType; label: string }[] = [
    { value: "UNPUBLISHED", label: "未發佈" },
    { value: "NOT_STARTED", label: "尚未開始" },
    { value: "IN_PROGRESS", label: "進行中" },
    { value: "ENDED", label: "已結束" },
  ];

  constructor(
    private adminQuizService: AdminQuizService,
    private memberQuizService: MemberQuizService,
    private router: Router,
    private route: ActivatedRoute,
    public readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.isAdminArea = this.route.snapshot.data["managementScope"] === "admin";
    this.managementBase = this.isAdminArea ? "/admin" : "/member/quizzes";
    this.loadQuizzes();
  }

  loadQuizzes(): void {
    this.loadError = "";
    const name = this.searchName.trim() || undefined;
    const sDate = this.startDate || undefined;
    const eDate = this.endDate || undefined;

    const request$ = this.isAdminArea
      ? this.adminQuizService.getAdminQuizzes(
          name,
          sDate,
          eDate,
          this.pagination.currentPage,
          this.pagination.pageSize,
          this.sortBy,
          this.sortDirection,
        )
      : this.memberQuizService.getMemberQuizzes(
          name,
          sDate,
          eDate,
          this.pagination.currentPage,
          this.pagination.pageSize,
          this.sortBy,
          this.sortDirection,
        );

    request$.subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.quizzes = res.data.content;
          updatePagination(this.pagination, res.data.totalPages);
          this.selectedIds = [];
        } else {
          this.loadError = res.message || "後台問卷載入失敗！";
        }
      },
      // 401 由 AuthInterceptor 統一清 session 並導向登入頁，這裡只負責顯示訊息。
      error: (err) => {
        this.quizzes = [];
        this.loadError =
          err.status === 401
            ? "登入狀態已失效，請重新登入。"
            : err.error?.message ||
              "後台問卷載入失敗，請確認後端與資料庫連線。";
      },
    });
  }

  onSearch(): void {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
      this.loadError = "問卷結束時間不能早於開始時間，請重新選擇！";
      return;
    }
    this.pagination.currentPage = 0;
    this.loadQuizzes();
  }

  onReset(): void {
    this.searchName = "";
    this.startDate = "";
    this.endDate = "";
    this.pagination.currentPage = 0;
    this.loadQuizzes();
  }

  changePage(page: number): void {
    this.pagination.currentPage = page;
    this.loadQuizzes();
  }

  sortByColumn(field: QuizSortField): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortBy = field;
      this.sortDirection = "asc";
    }
    this.pagination.currentPage = 0;
    this.loadQuizzes();
  }

  sortIndicator(field: QuizSortField): string {
    if (this.sortBy !== field) return "↕";
    return this.sortDirection === "asc" ? "↑" : "↓";
  }

  ariaSort(field: QuizSortField): "ascending" | "descending" | "none" {
    if (this.sortBy !== field) return "none";
    return this.sortDirection === "asc" ? "ascending" : "descending";
  }

  toggleSelect(id: number): void {
    const idx = this.selectedIds.indexOf(id);
    if (idx >= 0) {
      this.selectedIds.splice(idx, 1);
    } else {
      this.selectedIds.push(id);
    }
  }

  isAllSelected(): boolean {
    return (
      this.quizzes.length > 0 &&
      this.quizzes.every((q) => this.selectedIds.includes(q.id))
    );
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedIds = [];
    } else {
      this.selectedIds = this.quizzes.map((q) => q.id);
    }
  }

  onCreateNew(): void {
    this.router.navigate([this.managementBase, "new"]);
  }

  askDeleteSelected(): void {
    if (this.selectedIds.length === 0) return;
    this.actionMessage = "";
    this.pendingDeleteCount = this.selectedIds.length;
  }

  cancelDelete(): void {
    this.pendingDeleteCount = 0;
  }

  onStatusChange(quiz: QuizListItem, status: QuizStatusType): void {
    if (
      !this.isAdminArea ||
      status === quiz.status ||
      this.statusUpdating[quiz.id]
    )
      return;
    this.statusUpdating[quiz.id] = true;
    this.actionMessage = "";
    this.adminQuizService
      .updateStatus(quiz.id, status)
      .pipe(finalize(() => (this.statusUpdating[quiz.id] = false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            Object.assign(quiz, res.data);
            this.actionFailed = false;
            this.actionMessage = `「${quiz.name}」狀態已更新為${quiz.statusLabel}。`;
          }
        },
        error: (err) => {
          this.actionFailed = true;
          this.actionMessage = err.error?.message || "狀態更新失敗。";
          this.loadQuizzes();
        },
      });
  }

  confirmDelete(): void {
    if (this.deleting || this.selectedIds.length === 0) return;
    this.deleting = true;

    const request$ = this.isAdminArea
      ? this.adminQuizService.deleteQuizzes(this.selectedIds)
      : this.memberQuizService.deleteMemberQuizzes(this.selectedIds);

    request$
      .pipe(
        finalize(() => {
          this.deleting = false;
          this.pendingDeleteCount = 0;
        }),
      )
      .subscribe({
        next: (res) => {
          this.actionFailed = !res.success;
          this.actionMessage = res.success
            ? "問卷已刪除。"
            : res.message || "刪除失敗！";
          if (res.success) {
            this.loadQuizzes();
          }
        },
        error: (err) => {
          this.actionFailed = true;
          this.actionMessage = err.error?.message || "刪除失敗，請稍後再試。";
        },
      });
  }
}
