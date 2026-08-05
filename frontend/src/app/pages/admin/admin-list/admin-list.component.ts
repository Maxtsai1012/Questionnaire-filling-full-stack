import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AdminQuizService } from "../../../core/services/admin-quiz.service";
import { QuizListItem } from "../../../core/models/survey.model";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-admin-list",
  template: `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">
          {{ auth.isAdmin ? "後台問卷管理列表" : "我的問卷" }}
        </h1>
      </div>
      <div class="admin-status-note">
        目前顯示全部狀態：未發佈、尚未開始、進行中、已結束
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
        <div style="display: flex; gap: 8px; align-items: center;">
          <button
            class="btn btn-danger"
            (click)="onDeleteSelected()"
            [disabled]="selectedIds.length === 0"
          >
            🗑️ 刪除勾選項 ({{ selectedIds.length }})
          </button>
        </div>

        <button class="btn btn-primary" (click)="onCreateNew()">
          ➕ 新增問卷
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
              <th style="width: 80px;">編號</th>
              <th>名稱</th>
              <th style="width: 120px;">狀態</th>
              <th style="width: 130px;">開始時間</th>
              <th style="width: 130px;">結束時間</th>
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
                  [routerLink]="
                    auth.isAdmin
                      ? ['/admin', quiz.id, 'edit']
                      : ['/member/quizzes', quiz.id, 'edit']
                  "
                  style="font-weight: 600;"
                >
                  {{ quiz.name }}
                </a>
                <!-- Read-only link if IN_PROGRESS or ENDED -->
                <a
                  *ngIf="!quiz.canEdit"
                  [routerLink]="
                    auth.isAdmin
                      ? ['/admin', quiz.id, 'detail']
                      : ['/member/quizzes', quiz.id, 'detail']
                  "
                  style="font-weight: 600; color: #475569;"
                >
                  {{ quiz.name }} (唯讀)
                </a>
              </td>
              <td>
                <span
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
                  *ngIf="quiz.canViewStats"
                  [routerLink]="
                    auth.isAdmin
                      ? ['/admin', quiz.id, 'detail']
                      : ['/member/quizzes', quiz.id, 'detail']
                  "
                  [queryParams]="{ tab: 'stats' }"
                  class="btn btn-outline"
                  style="padding: 4px 10px; font-size: 0.825rem;"
                >
                  前往
                </a>
                <span
                  *ngIf="!quiz.canViewStats"
                  style="color: #cbd5e1; font-size: 0.85rem;"
                  >-</span
                >
              </td>
            </tr>
            <tr *ngIf="quizzes.length === 0">
              <td
                colspan="7"
                style="text-align: center; color: #94a3b8; padding: 32px;"
              >
                目前沒有符合條件的問卷資料
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button
          (click)="changePage(currentPage - 1)"
          [disabled]="currentPage === 0"
        >
          &laquo; 前頁
        </button>
        <button
          *ngFor="let page of pagesArray"
          (click)="changePage(page)"
          [class.active]="currentPage === page"
        >
          {{ page + 1 }}
        </button>
        <button
          (click)="changePage(currentPage + 1)"
          [disabled]="currentPage === totalPages - 1"
        >
          後頁 &raquo;
        </button>
      </div>
    </div>
  `,
})
export class AdminListComponent implements OnInit {
  quizzes: QuizListItem[] = [];
  selectedIds: number[] = [];

  searchName = "";
  startDate = "";
  endDate = "";

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagesArray: number[] = [];
  loadError = "";

  constructor(
    private adminQuizService: AdminQuizService,
    private router: Router,
    public readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadQuizzes();
  }

  loadQuizzes(): void {
    this.loadError = "";
    const request$ = this.auth.isAdmin
      ? this.adminQuizService.getAdminQuizzes(
          this.searchName.trim() || undefined,
          this.startDate || undefined,
          this.endDate || undefined,
          this.currentPage,
          this.pageSize,
        )
      : this.adminQuizService.getMemberQuizzes(
          this.searchName.trim() || undefined,
          this.startDate || undefined,
          this.endDate || undefined,
          this.currentPage,
          this.pageSize,
        );
    request$.subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.quizzes = res.data.content;
          this.totalPages = res.data.totalPages;
          this.pagesArray = Array.from(
            { length: this.totalPages },
            (_, i) => i,
          );
          this.selectedIds = [];
        } else {
          this.loadError = res.message || "後台問卷載入失敗！";
        }
      },
      error: (err) => {
        this.quizzes = [];
        this.loadError =
          err.status === 401
            ? "登入狀態已失效，請重新登入。"
            : err.error?.message ||
              "後台問卷載入失敗，請確認後端與資料庫連線。";
        if (err.status === 401) {
          this.auth.clearSession();
          this.router.navigate(["/login"], {
            queryParams: {
              returnUrl: this.auth.isAdmin ? "/admin" : "/member/quizzes",
            },
          });
        }
      },
    });
  }

  onSearch(): void {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
      this.loadError = "問卷結束的時間不能比開始的時間還要早，請重新選擇時間!!";
      return;
    }
    this.currentPage = 0;
    this.loadQuizzes();
  }

  onReset(): void {
    this.searchName = "";
    this.startDate = "";
    this.endDate = "";
    this.currentPage = 0;
    this.loadQuizzes();
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadQuizzes();
    }
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
    this.router.navigate([
      this.auth.isAdmin ? "/admin/new" : "/member/quizzes/new",
    ]);
  }

  onDeleteSelected(): void {
    if (this.selectedIds.length === 0) return;
    if (!confirm(`確定要刪除選取的 ${this.selectedIds.length} 筆問卷嗎？`))
      return;

    const request$ = this.auth.isAdmin
      ? this.adminQuizService.deleteQuizzes(this.selectedIds)
      : this.adminQuizService.deleteMemberQuizzes(this.selectedIds);
    request$.subscribe({
      next: (res) => {
        if (res.success) {
          alert("問卷刪除成功！");
          this.loadQuizzes();
        } else {
          alert(res.message || "刪除失敗！");
        }
      },
      error: (err) => {
        alert(
          err.error?.message ||
            "刪除失敗！部分問卷可能處於開放或已結束狀態無法刪除。",
        );
      },
    });
  }
}
