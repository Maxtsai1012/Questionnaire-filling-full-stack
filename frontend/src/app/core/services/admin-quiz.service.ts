import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  PageResponse,
  QuizDetail,
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
  private readonly adminUrl = '/api/admin/quiz';

  constructor(private http: HttpClient) {}

  getAdminQuizzes(name?: string, startDate?: string, endDate?: string, page = 0, size = 10): Observable<ApiResponse<PageResponse<QuizListItem>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (name) params = params.set('name', name);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<ApiResponse<PageResponse<QuizListItem>>>(this.adminUrl, { params });
  }

  saveOrUpdateQuiz(req: QuizSaveRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.adminUrl, req);
  }

  deleteQuizzes(ids: number[]): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.adminUrl}/delete`, ids);
  }

  getManagedQuizDetail(id: number, isAdmin: boolean): Observable<ApiResponse<QuizDetail>> {
    const base = this.resolveBaseUrl(isAdmin);
    return this.http.get<ApiResponse<QuizDetail>>(`${base}/${id}`);
  }

  getQuizResponses(quizId: number, isAdmin: boolean, page = 0, size = 10): Observable<ApiResponse<PageResponse<QuizResponseItem>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    const base = this.resolveBaseUrl(isAdmin);
    return this.http.get<ApiResponse<PageResponse<QuizResponseItem>>>(`${base}/${quizId}/responses`, { params });
  }

  getResponseDetail(responseId: number, isAdmin: boolean): Observable<ApiResponse<QuizResponseDetail>> {
    const base = this.resolveBaseUrl(isAdmin);
    return this.http.get<ApiResponse<QuizResponseDetail>>(`${base}/response/${responseId}`);
  }

  getManagedStatistics(quizId: number, isAdmin: boolean): Observable<ApiResponse<QuizStatistics>> {
    const base = this.resolveBaseUrl(isAdmin);
    return this.http.get<ApiResponse<QuizStatistics>>(`${base}/${quizId}/statistics`);
  }

  private resolveBaseUrl(isAdmin: boolean): string {
    return isAdmin ? this.adminUrl : '/api/member/quiz';
  }
}
