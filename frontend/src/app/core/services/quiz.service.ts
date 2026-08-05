import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PageResponse, QuizDetail, QuizListItem, QuizStatistics, ResponseSubmit } from '../models/survey.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = '/api/quiz';

  constructor(private http: HttpClient) {}

  getFrontQuizzes(name?: string, startDate?: string, endDate?: string, page = 0, size = 10): Observable<ApiResponse<PageResponse<QuizListItem>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (name) params = params.set('name', name);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<ApiResponse<PageResponse<QuizListItem>>>(this.apiUrl, { params });
  }

  getFrontQuizDetail(id: number): Observable<ApiResponse<QuizDetail>> {
    return this.http.get<ApiResponse<QuizDetail>>(`${this.apiUrl}/${id}`);
  }

  checkEmailExists(quizId: number, email: string): Observable<ApiResponse<boolean>> {
    const params = new HttpParams().set('email', email);
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/${quizId}/check-email`, { params });
  }

  submitResponse(quizId: number, req: ResponseSubmit): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/${quizId}/response`, req);
  }

  getStatistics(quizId: number): Observable<ApiResponse<QuizStatistics>> {
    return this.http.get<ApiResponse<QuizStatistics>>(`${this.apiUrl}/${quizId}/statistics`);
  }

  // Session Storage Helpers for Client Filling Flow
  saveDraftToSession(quizId: number, data: ResponseSubmit): void {
    sessionStorage.setItem(`quiz_draft_${quizId}`, JSON.stringify(data));
  }

  getDraftFromSession(quizId: number): ResponseSubmit | null {
    const raw = sessionStorage.getItem(`quiz_draft_${quizId}`);
    return raw ? JSON.parse(raw) : null;
  }

  clearDraftSession(quizId: number): void {
    sessionStorage.removeItem(`quiz_draft_${quizId}`);
  }

  saveServerErrorsToSession(quizId: number, errors: Record<string, string>): void {
    sessionStorage.setItem(`quiz_errors_${quizId}`, JSON.stringify(errors));
  }

  takeServerErrorsFromSession(quizId: number): Record<string, string> {
    const key = `quiz_errors_${quizId}`;
    const raw = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return raw ? JSON.parse(raw) : {};
  }
}
