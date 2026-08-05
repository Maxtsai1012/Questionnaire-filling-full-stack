import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { AdminQuizService } from '../../../core/services/admin-quiz.service';
import { QuizResponseDetail, QuizResponseItem } from '../../../core/models/survey.model';

@Component({
  selector: 'app-admin-feedback',
  template: `
    <div>
      <div *ngIf="!selectedResponseDetail">
        <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: #1e293b;">問卷回饋填寫紀錄列表</h3>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 80px;">編號</th>
                <th>姓名</th>
                <th style="width: 200px;">填寫時間</th>
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
                <td colspan="4" style="text-align: center; color: #94a3b8; padding: 32px;">
                  這份問卷目前尚未收到任何填答紀錄
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="totalPages > 1">
          <button (click)="changePage(currentPage - 1)" [disabled]="currentPage === 0">&laquo; 前頁</button>
          <button *ngFor="let page of pagesArray" (click)="changePage(page)" [class.active]="currentPage === page">
            {{ page + 1 }}
          </button>
          <button (click)="changePage(currentPage + 1)" [disabled]="currentPage === totalPages - 1">後頁 &raquo;</button>
        </div>
      </div>

      <!-- RESPONSE DETAIL READ-ONLY VIEW -->
      <div *ngIf="selectedResponseDetail" class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 1.2rem; color: #0f172a;">填答詳細紀錄 (唯讀明細)</h3>
          <button class="btn btn-outline" (click)="backToList()">&laquo; 返回回饋列表</button>
        </div>

        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div><strong style="color: #64748b;">姓名：</strong> {{ selectedResponseDetail.respondentName }}</div>
          <div><strong style="color: #64748b;">手機：</strong> {{ selectedResponseDetail.phone }}</div>
          <div><strong style="color: #64748b;">E-mail：</strong> {{ selectedResponseDetail.email }}</div>
          <div><strong style="color: #64748b;">年齡：</strong> {{ selectedResponseDetail.age || '未填寫' }}</div>
          <div><strong style="color: #64748b;">提交時間：</strong> {{ selectedResponseDetail.submittedAt }}</div>
        </div>

        <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 16px; color: #334155;">各題作答內容</h4>
        <div *ngFor="let item of selectedResponseDetail.answers; let i = index" style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">
            {{ i + 1 }}. {{ item.title }}
            <span *ngIf="item.isRequired" style="color: #ef4444; font-size: 0.85rem;">(必填)</span>
          </div>
          <div style="color: #3b82f6; font-weight: 600; padding-left: 12px; border-left: 3px solid #3b82f6;">
            {{ formatAnswer(item.answer) }}
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminFeedbackComponent implements OnInit, OnChanges {
  @Input() quizId!: number;
  @Input() isAdmin = true;

  responses: QuizResponseItem[] = [];
  selectedResponseDetail: QuizResponseDetail | null = null;

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  pagesArray: number[] = [];

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
    this.adminQuizService.getQuizResponses(this.quizId, this.isAdmin, this.currentPage, this.pageSize).subscribe(res => {
      if (res.success && res.data) {
        this.responses = res.data.content;
        this.totalPages = res.data.totalPages;
        this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i);
      }
    });
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadResponses();
    }
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

  formatAnswer(answer: string): string {
    if (!answer) return '未填寫';
    return answer.replace(/;/g, '、');
  }
}
