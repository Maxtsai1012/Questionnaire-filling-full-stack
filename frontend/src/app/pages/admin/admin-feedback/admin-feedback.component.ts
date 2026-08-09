import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { AdminQuizService } from '../../../core/services/admin-quiz.service';
import { QuizResponseDetail, QuizResponseItem } from '../../../core/models/survey.model';
import { createPaginationState, updatePagination, PaginationState } from '../../../core/utils/pagination.helper';

type ResponseSortField = 'id' | 'respondentName' | 'submittedAt';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-admin-feedback',
  template: `
    <div>
      <div *ngIf="!selectedResponseDetail">
        <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: var(--teal-900);">問卷回饋填寫紀錄列表</h3>

        <div class="search-card feedback-search-card">
          <div class="search-grid">
            <div class="form-group">
              <label for="feedback-name-filter">填答者姓名：</label>
              <input
                id="feedback-name-filter"
                type="text"
                class="form-control"
                [(ngModel)]="searchName"
                placeholder="搜尋填答者姓名..."
                (keyup.enter)="onSearch()"
              />
            </div>
            <div class="form-group filter-action-group">
              <button class="btn btn-primary" type="button" (click)="onSearch()">篩選</button>
              <button class="btn btn-outline" type="button" (click)="onReset()">重置</button>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 80px;" [attr.aria-sort]="ariaSort('id')">
                  <button type="button" class="sortable-header-button" (click)="sortByColumn('id')">
                    編號 <span aria-hidden="true">{{ sortIndicator('id') }}</span>
                  </button>
                </th>
                <th [attr.aria-sort]="ariaSort('respondentName')">
                  <button type="button" class="sortable-header-button" (click)="sortByColumn('respondentName')">
                    姓名 <span aria-hidden="true">{{ sortIndicator('respondentName') }}</span>
                  </button>
                </th>
                <th style="width: 200px;" [attr.aria-sort]="ariaSort('submittedAt')">
                  <button type="button" class="sortable-header-button" (click)="sortByColumn('submittedAt')">
                    填寫時間 <span aria-hidden="true">{{ sortIndicator('submittedAt') }}</span>
                  </button>
                </th>
                <th style="width: 100px; text-align: center;">觀看回覆</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let res of responses">
                <td>#{{ res.id }}</td>
                <td>{{ res.respondentName }}</td>
                <td>{{ res.submittedAt }}</td>
                <td style="text-align: center;">
                  <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.825rem;" (click)="viewDetail(res.id)">
                    前往
                  </button>
                </td>
              </tr>
              <tr *ngIf="responses.length === 0">
                <td colspan="4" style="text-align: center; color: var(--text-light); padding: 32px;">
                  <div class="empty-state-visual">
                    <img src="assets/illustrations/chatting-42.png" alt="" aria-hidden="true" />
                    <span>這份問卷目前尚未收到任何填答紀錄</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <app-pagination [state]="pagination" (pageChange)="changePage($event)"></app-pagination>
      </div>

      <!-- RESPONSE DETAIL READ-ONLY VIEW -->
      <div *ngIf="selectedResponseDetail" class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 1.2rem; color: var(--teal-950);">填答詳細紀錄 (唯讀明細)</h3>
          <button class="btn btn-outline" (click)="backToList()">&laquo; 返回回饋列表</button>
        </div>

        <div style="background: var(--teal-50); padding: 16px; border-radius: 8px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div><strong style="color: var(--text-muted);">姓名：</strong> {{ selectedResponseDetail.respondentName }}</div>
          <div><strong style="color: var(--text-muted);">手機：</strong> {{ selectedResponseDetail.phone }}</div>
          <div><strong style="color: var(--text-muted);">E-mail：</strong> {{ selectedResponseDetail.email }}</div>
          <div><strong style="color: var(--text-muted);">年齡：</strong> {{ selectedResponseDetail.age || '未填寫' }}</div>
          <div><strong style="color: var(--text-muted);">提交時間：</strong> {{ selectedResponseDetail.submittedAt }}</div>
        </div>

        <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px; color: var(--teal-900);">各題作答內容</h4>
        <div *ngFor="let item of selectedResponseDetail.answers; let i = index" style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--primary);">
          <div style="font-weight: 700; color: var(--teal-950); margin-bottom: 6px;">
            {{ i + 1 }}. {{ item.title }}
            <span *ngIf="item.isRequired" style="color: var(--danger); font-size: 0.85rem;">(必填)</span>
          </div>
          <div style="color: var(--teal-700); font-weight: 600; padding-left: 12px; border-left: 3px solid var(--teal-600);">
            {{ item.answer }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .feedback-search-card { margin-bottom: 16px; }
    .filter-action-group { flex-direction: row; align-items: flex-end; gap: 8px; }
  `]
})
export class AdminFeedbackComponent implements OnInit, OnChanges {
  @Input() quizId!: number;
  @Input() isAdmin = true;

  responses: QuizResponseItem[] = [];
  selectedResponseDetail: QuizResponseDetail | null = null;
  pagination: PaginationState = createPaginationState(10);
  searchName = '';
  sortBy: ResponseSortField = 'id';
  sortDirection: SortDirection = 'desc';

  constructor(private adminQuizService: AdminQuizService) {}

  ngOnInit(): void {
    if (this.quizId) {
      this.loadResponses();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quizId'] && this.quizId) {
      this.loadResponses();
    }
  }

  loadResponses(): void {
    this.adminQuizService.getQuizResponses(
      this.quizId,
      this.isAdmin,
      this.pagination.currentPage,
      this.pagination.pageSize,
      this.searchName.trim() || undefined,
      this.sortBy,
      this.sortDirection,
    ).subscribe(res => {
      if (res.success && res.data) {
        this.responses = res.data.content;
        updatePagination(this.pagination, res.data.totalPages);
      }
    });
  }

  changePage(page: number): void {
    this.pagination.currentPage = page;
    this.loadResponses();
  }

  onSearch(): void {
    this.pagination.currentPage = 0;
    this.loadResponses();
  }

  onReset(): void {
    this.searchName = '';
    this.pagination.currentPage = 0;
    this.loadResponses();
  }

  sortByColumn(field: ResponseSortField): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.pagination.currentPage = 0;
    this.loadResponses();
  }

  sortIndicator(field: ResponseSortField): string {
    if (this.sortBy !== field) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  ariaSort(field: ResponseSortField): 'ascending' | 'descending' | 'none' {
    if (this.sortBy !== field) return 'none';
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  viewDetail(responseId: number): void {
    this.adminQuizService.getResponseDetail(responseId, this.isAdmin).subscribe(res => {
      if (res.success) {
        this.selectedResponseDetail = res.data;
      }
    });
  }

  backToList(): void {
    this.selectedResponseDetail = null;
  }
}
