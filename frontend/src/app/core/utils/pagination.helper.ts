/**
 * Helper interface and functions for managing table pagination state across components.
 */

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  pagesArray: number[];
}

export function createPaginationState(pageSize = 10): PaginationState {
  return {
    currentPage: 0,
    pageSize,
    totalPages: 0,
    pagesArray: []
  };
}

export function updatePagination(state: PaginationState, totalPages: number): void {
  state.totalPages = totalPages;
  state.pagesArray = Array.from({ length: totalPages }, (_, i) => i);
}

export function canChangePage(state: PaginationState, page: number): boolean {
  return page >= 0 && page < state.totalPages;
}
