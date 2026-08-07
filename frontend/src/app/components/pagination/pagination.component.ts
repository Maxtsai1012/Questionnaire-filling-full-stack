import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PaginationState, canChangePage } from '../../core/utils/pagination.helper';

/**
 * Shared pager for every paged table (admin list, front list, feedback list).
 * Owns the range guard so callers only handle "load this page".
 */
@Component({
  selector: 'app-pagination',
  template: `
    <div class="pagination" *ngIf="state.totalPages > 1">
      <button (click)="go(state.currentPage - 1)" [disabled]="state.currentPage === 0">&laquo; 前頁</button>
      <button *ngFor="let page of state.pagesArray" (click)="go(page)" [class.active]="state.currentPage === page">
        {{ page + 1 }}
      </button>
      <button (click)="go(state.currentPage + 1)" [disabled]="state.currentPage === state.totalPages - 1">後頁 &raquo;</button>
    </div>
  `
})
export class PaginationComponent {
  @Input({ required: true }) state!: PaginationState;
  @Output() pageChange = new EventEmitter<number>();

  go(page: number): void {
    if (canChangePage(this.state, page)) {
      this.pageChange.emit(page);
    }
  }
}
