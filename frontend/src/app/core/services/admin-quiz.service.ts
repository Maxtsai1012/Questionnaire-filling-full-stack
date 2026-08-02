import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  PageResponse,
  QuizListItem,
  QuizResponseDetail,
  QuizResponseItem,
  QuizSaveRequest,
  QuizStatistics
} from '../models/survey.model';

@Injectable({
  providedIn: 'root'
})
export class AdminQuizService {
  private apiUrl = '/api/admin/quiz';

  constructor(private http: HttpClient) {}

  getAdminQuizzes(name?: string, startDate?: string, endDate?: string, page = 0, size = 10): Observable<ApiResponse<PageResponse<QuizListItem>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (name) params = params.set('name', name);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<ApiResponse<PageResponse<QuizListItem>>>(this.apiUrl, { params });
  }

  saveOrUpdateQuiz(req: QuizSaveRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.apiUrl, req);
  }

  deleteQuizzes(ids: number[]): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/delete`, ids);
  }

  getQuizResponses(quizId: number, page = 0, size = 10): Observable<ApiResponse<PageResponse<QuizResponseItem>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<PageResponse<QuizResponseItem>>>(`${this.apiUrl}/${quizId}/responses`, { params });
  }

  getResponseDetail(responseId: number): Observable<ApiResponse<QuizResponseDetail>> {
    return this.http.get<ApiResponse<QuizResponseDetail>>(`${this.apiUrl}/response/${responseId}`);
  }

  getAdminStatistics(quizId: number): Observable<ApiResponse<QuizStatistics>> {
    return this.http.get<ApiResponse<QuizStatistics>>(`${this.apiUrl}/${quizId}/statistics`);
  }

  // Session Storage Helpers for Admin Editor Wizard Tabs
  saveAdminDraftToSession(data: QuizSaveRequest): void {
    const key = data.id ? `admin_quiz_${data.id}` : 'admin_quiz_new';
    sessionStorage.setItem(key, JSON.stringify(data));
  }

  getAdminDraftFromSession(id?: number): QuizSaveRequest | null {
    const key = id ? `admin_quiz_${id}` : 'admin_quiz_new';
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }

  clearAdminDraftSession(id?: number): void {
    const key = id ? `admin_quiz_${id}` : 'admin_quiz_new';
    sessionStorage.removeItem(key);
  }
}
