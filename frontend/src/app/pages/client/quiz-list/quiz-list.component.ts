import { Component, OnInit } from "@angular/core";
import { QuizService } from "../../../core/services/quiz.service";
import { QuizListItem } from "../../../core/models/survey.model";
import { AuthService } from "../../../core/services/auth.service";
import {
  createPaginationState,
  updatePagination,
  PaginationState,
} from "../../../core/utils/pagination.helper";

type QuizSortField = "id" | "name" | "status" | "startDate" | "endDate";
type SortDirection = "asc" | "desc";

@Component({
  selector: "app-quiz-list",
  template: `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">問卷列表</h1>
        <button class="btn btn-primary" (click)="createQuiz()">新增問卷</button>
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
            <label>開始時間：</label>
            <input
              type="date"
              class="form-control"
              [(ngModel)]="startDate"
              (change)="onSearch()"
            />
          </div>

          <div class="form-group">
            <label>結束時間：</label>
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

      <!-- Survey Table -->
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
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
              <th style="width: 120px;" [attr.aria-sort]="ariaSort('status')">
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
              <th style="width: 100px; text-align: center;">結果</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let quiz of quizzes">
              <td>#{{ quiz.id }}</td>
              <td>
                <a
                  *ngIf="quiz.canFill"
                  [routerLink]="['/quiz', quiz.id, 'form']"
                  style="font-weight: 600;"
                >
                  {{ quiz.name }}
                </a>
                <span *ngIf="!quiz.canFill" style="color: var(--text-muted);">
                  {{ quiz.name }}
                </span>
              </td>
              <td>
                <span
                  class="badge"
                  [ngClass]="{
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
                  [routerLink]="['/quiz', quiz.id, 'stats']"
                  class="btn btn-outline"
                  style="padding: 4px 10px; font-size: 0.825rem;"
                >
                  前往
                </a>
                <span
                  *ngIf="!quiz.canViewStats"
                  style="color: var(--teal-200); font-size: 0.85rem;"
                  >-</span
                >
              </td>
            </tr>
            <tr *ngIf="quizzes.length === 0">
              <td
                colspan="6"
                style="text-align: center; color: var(--text-light); padding: 32px;"
              >
                <div class="empty-state-visual">
                  <img
                    src="assets/illustrations/search-engine-1-36.png"
                    alt=""
                    aria-hidden="true"
                  />
                  <span>目前沒有符合條件的問卷資料</span>
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
})
export class QuizListComponent implements OnInit {
  quizzes: QuizListItem[] = [];
  searchName = "";
  startDate = "";
  endDate = "";
  sortBy: QuizSortField = "id";
  sortDirection: SortDirection = "desc";

  pagination: PaginationState = createPaginationState(10);

  constructor(
    private quizService: QuizService,
    private auth: AuthService,
  ) {}

  createQuiz(): void {
    this.auth.navigateToCreateOrLogin();
  }

  ngOnInit(): void {
    this.loadQuizzes();
  }

  loadQuizzes(): void {
    this.quizService
      .getFrontQuizzes(
        this.searchName.trim() || undefined,
        this.startDate || undefined,
        this.endDate || undefined,
        this.pagination.currentPage,
        this.pagination.pageSize,
        this.sortBy,
        this.sortDirection,
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.quizzes = res.data.content;
          updatePagination(this.pagination, res.data.totalPages);
        }
      });
  }

  onSearch(): void {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
      alert("問卷結束時間不能早於開始時間，請重新選擇！");
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
}
