import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PageResponse, QuizListItem, QuizSaveRequest } from '../models/survey.model';

@Injectable({
  providedIn: 'root'
})
export class MemberQuizService {
  private readonly baseUrl = '/api/member/quiz';

  constructor(private http: HttpClient) {}

  getMemberQuizzes(name?: string, startDate?: string, endDate?: string, page = 0, size = 10): Observable<ApiResponse<PageResponse<QuizListItem>>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (name) params = params.set('name', name);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ApiResponse<PageResponse<QuizListItem>>>(this.baseUrl, { params });
  }

  createMemberQuiz(req: QuizSaveRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.baseUrl, req);
  }

  deleteMemberQuizzes(ids: number[]): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/delete`, ids);
  }
}
