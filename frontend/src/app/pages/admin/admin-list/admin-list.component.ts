import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminQuizService } from '../../../core/services/admin-quiz.service';
import { MemberQuizService } from '../../../core/services/member-quiz.service';
import { QuizListItem } from '../../../core/models/survey.model';
import { AuthService } from '../../../core/services/auth.service';
import { createPaginationState, updatePagination, PaginationState } from '../../../core/utils/pagination.helper';

@Component({
  selector: 'app-admin-list',
  template: `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">{{ auth.isAdmin ? '問卷管理列表 (後台)' : '我的問卷' }}</h1>
      </div>
      <div class="admin-status-note">目前顯示全部狀態：未發佈、尚未開始、進行中、已結束</div>
      <div class="field-error admin-load-error" *ngIf="loadError">{{ loadError }}</div>

      <!-- Search Section -->
      <div class="search-card">
        <div class="search-grid">
          <div class="form-group">
            <label>問卷名稱：</label>
            <input type="text" class="form-control" [(ngModel)]="searchName" placeholder="搜尋問卷標題..." (keyup.enter)="onSearch()" />
          </div>

          <div class="form-group">
            <label>統計時間 (開始)：</label>
            <input type="date" class="form-control" [(ngModel)]="startDate" (change)="onSearch()" />
          </div>

          <div class="form-group">
            <label>統計時間 (結束)：</label>
            <input type="date" class="form-control" [(ngModel)]="endDate" (change)="onSearch()" />
          </div>

          <div class="form-group" style="flex-direction: row; gap: 8px;">
            <button class="btn btn-primary" (click)="onSearch()">搜尋</button>
            <button class="btn btn-outline" (click)="onReset()">重置</button>
          </div>
        </div>
      </div>

      <!-- Action Bar (Delete & Add) -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <button class="btn btn-danger" (click)="askDeleteSelected()" [disabled]="selectedIds.length === 0 || deleting">
            🗑️ 刪除勾選項 ({{ selectedIds.length }})
          </button>
          <span *ngIf="actionMessage" [style.color]="actionFailed ? '#b91c1c' : '#15803d'" style="font-weight: 600;">
            {{ actionMessage }}
          </span>
        </div>

        <button class="btn btn-primary" (click)="onCreateNew()">
          ➕ 新增問卷
        </button>
      </div>

      <!-- 刪除確認：用頁內元件而非 window.confirm，瀏覽器封鎖對話框時才不會整個按鈕沒反應 -->
      <div *ngIf="pendingDeleteCount > 0"
           style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;
                  background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px;">
        <span style="color: #991b1b; font-weight: 600;">
          確定要刪除選取的 {{ pendingDeleteCount }} 筆問卷嗎？連同題目與填答紀錄一併移除，且無法復原。
        </span>
        <button class="btn btn-danger" (click)="confirmDelete()" [disabled]="deleting">
          {{ deleting ? '刪除中…' : '確定刪除' }}
        </button>
        <button class="btn btn-outline" (click)="cancelDelete()" [disabled]="deleting">取消</button>
      </div>

      <!-- Admin Survey Table -->
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">
                <input type="checkbox" [checked]="isAllSelected()" (change)="toggleSelectAll()" />
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
                <input type="checkbox" [checked]="selectedIds.includes(quiz.id)" (change)="toggleSelect(quiz.id)" />
              </td>
              <td>#{{ quiz.id }}</td>
              <td>
                <!-- Editable link if UNPUBLISHED or NOT_STARTED -->
                <a *ngIf="quiz.canEdit" [routerLink]="[auth.managementBase, quiz.id, 'edit']" style="font-weight: 600;">
                  ✏️ {{ quiz.name }}
                </a>
                <!-- Read-only link if IN_PROGRESS or ENDED -->
                <a *ngIf="!quiz.canEdit" [routerLink]="[auth.managementBase, quiz.id, 'detail']" style="font-weight: 600; color: #475569;">
                  📊 {{ quiz.name }} <span style="font-size: 0.8rem; color: #64748b; font-weight: 400;">(查看明細與統計)</span>
                </a>
              </td>
              <td>
                <span class="badge" [ngClass]="{
                  'badge-unpublished': quiz.status === 'UNPUBLISHED',
                  'badge-notstarted': quiz.status === 'NOT_STARTED',
                  'badge-inprogress': quiz.status === 'IN_PROGRESS',
                  'badge-ended': quiz.status === 'ENDED'
                }">
                  {{ quiz.statusLabel }}
                </span>
              </td>
              <td>{{ quiz.startDate }}</td>
              <td>{{ quiz.endDate }}</td>
              <td style="text-align: center;">
                <a *ngIf="quiz.canViewStats" [routerLink]="[auth.managementBase, quiz.id, 'detail']" [queryParams]="{tab: 'stats'}" class="btn btn-outline" style="padding: 4px 10px; font-size: 0.825rem;">
                  前往
                </a>
                <span *ngIf="!quiz.canViewStats" style="color: #cbd5e1; font-size: 0.85rem;">-</span>
              </td>
            </tr>
            <tr *ngIf="quizzes.length === 0">
              <td colspan="7" style="text-align: center; color: #94a3b8; padding: 32px;">
                目前沒有符合條件的問卷資料
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <app-pagination [state]="pagination" (pageChange)="changePage($event)"></app-pagination>
    </div>
  `
})
export class AdminListComponent implements OnInit {
  quizzes: QuizListItem[] = [];
  selectedIds: number[] = [];

  searchName = '';
  startDate = '';
  endDate = '';

  pagination: PaginationState = createPaginationState(10);
  loadError = '';

  // 刪除流程狀態。刻意不用 window.confirm/alert：瀏覽器在連續彈窗後會提供
  // 「封鎖此頁對話框」，一旦勾選，confirm() 直接回傳 false 且 alert() 無聲失效，
  // 使用者看到的就是「按了沒反應」。
  pendingDeleteCount = 0;
  deleting = false;
  actionMessage = '';
  actionFailed = false;

  constructor(
    private adminQuizService: AdminQuizService,
    private memberQuizService: MemberQuizService,
    private router: Router,
    public readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadQuizzes();
  }

  loadQuizzes(): void {
    this.loadError = '';
    const name = this.searchName.trim() || undefined;
    const sDate = this.startDate || undefined;
    const eDate = this.endDate || undefined;

    const request$ = this.auth.isAdmin
      ? this.adminQuizService.getAdminQuizzes(name, sDate, eDate, this.pagination.currentPage, this.pagination.pageSize)
      : this.memberQuizService.getMemberQuizzes(name, sDate, eDate, this.pagination.currentPage, this.pagination.pageSize);

    request$.subscribe({
      next: res => {
        if (res.success && res.data) {
          this.quizzes = res.data.content;
          updatePagination(this.pagination, res.data.totalPages);
          this.selectedIds = [];
        } else {
          this.loadError = res.message || '後台問卷載入失敗！';
        }
      },
      // 401 由 AuthInterceptor 統一清 session 並導向登入頁，這裡只負責顯示訊息。
      error: err => {
        this.quizzes = [];
        this.loadError = err.status === 401
          ? '登入狀態已失效，請重新登入。'
          : (err.error?.message || '後台問卷載入失敗，請確認後端與資料庫連線。');
      }
    });
  }

  onSearch(): void {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
      this.loadError = '問卷結束的時間不能比開始的時間還要早，請重新選擇時間!!';
      return;
    }
    this.pagination.currentPage = 0;
    this.loadQuizzes();
  }

  onReset(): void {
    this.searchName = '';
    this.startDate = '';
    this.endDate = '';
    this.pagination.currentPage = 0;
    this.loadQuizzes();
  }

  changePage(page: number): void {
    this.pagination.currentPage = page;
    this.loadQuizzes();
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
    return this.quizzes.length > 0 && this.quizzes.every(q => this.selectedIds.includes(q.id));
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedIds = [];
    } else {
      this.selectedIds = this.quizzes.map(q => q.id);
    }
  }

  onCreateNew(): void {
    this.router.navigate([this.auth.managementBase, 'new']);
  }

  askDeleteSelected(): void {
    if (this.selectedIds.length === 0) return;
    this.actionMessage = '';
    this.pendingDeleteCount = this.selectedIds.length;
  }

  cancelDelete(): void {
    this.pendingDeleteCount = 0;
  }

  confirmDelete(): void {
    if (this.deleting || this.selectedIds.length === 0) return;
    this.deleting = true;

    const request$ = this.auth.isAdmin
      ? this.adminQuizService.deleteQuizzes(this.selectedIds)
      : this.memberQuizService.deleteMemberQuizzes(this.selectedIds);

    request$.pipe(finalize(() => {
      this.deleting = false;
      this.pendingDeleteCount = 0;
    })).subscribe({
      next: res => {
        this.actionFailed = !res.success;
        this.actionMessage = res.success ? '問卷已刪除。' : (res.message || '刪除失敗！');
        if (res.success) {
          this.loadQuizzes();
        }
      },
      error: err => {
        this.actionFailed = true;
        this.actionMessage = err.error?.message || '刪除失敗，請稍後再試。';
      }
    });
  }
}
