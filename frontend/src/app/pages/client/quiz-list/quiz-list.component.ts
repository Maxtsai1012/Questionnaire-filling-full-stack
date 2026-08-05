import { Component, OnInit } from "@angular/core";
import { QuizService } from "../../../core/services/quiz.service";
import { QuizListItem } from "../../../core/models/survey.model";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";

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
              <td>#{{ quiz.id }}</td>
              <td>
                <a
                  *ngIf="quiz.canFill"
                  [routerLink]="['/quiz', quiz.id, 'form']"
                  style="font-weight: 600;"
                >
                  {{ quiz.name }}
                </a>
                <span *ngIf="!quiz.canFill" style="color: #64748b;">
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
                  style="color: #cbd5e1; font-size: 0.85rem;"
                  >-</span
                >
              </td>
            </tr>
            <tr *ngIf="quizzes.length === 0">
              <td
                colspan="6"
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
export class QuizListComponent implements OnInit {
  quizzes: QuizListItem[] = [];
  searchName = "";
  startDate = "";
  endDate = "";

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagesArray: number[] = [];

  constructor(
    private quizService: QuizService,
    private auth: AuthService,
    private router: Router,
  ) {}

  createQuiz(): void {
    if (!this.auth.user) {
      alert("請登入建立表單!!");
      this.router.navigate(["/login"], {
        queryParams: { returnUrl: "/member/quizzes/new" },
      });
      return;
    }
    this.router.navigate([
      this.auth.isAdmin ? "/admin/new" : "/member/quizzes/new",
    ]);
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
        this.currentPage,
        this.pageSize,
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.quizzes = res.data.content;
          this.totalPages = res.data.totalPages;
          this.pagesArray = Array.from(
            { length: this.totalPages },
            (_, i) => i,
          );
        }
      });
  }

  onSearch(): void {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
      alert("問卷結束的時間不能比開始的時間還要早，請重新選擇時間!!");
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
}
