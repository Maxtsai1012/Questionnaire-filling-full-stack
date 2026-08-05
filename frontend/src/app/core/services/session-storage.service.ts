import { Injectable } from '@angular/core';
import { QuizSaveRequest, ResponseSubmit } from '../models/survey.model';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {
  // Admin / Member Quiz Editor Drafts
  saveAdminDraft(data: QuizSaveRequest): void {
    const key = data.id ? `admin_quiz_${data.id}` : 'admin_quiz_new';
    sessionStorage.setItem(key, JSON.stringify(data));
  }

  getAdminDraft(id?: number): QuizSaveRequest | null {
    const key = id ? `admin_quiz_${id}` : 'admin_quiz_new';
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }

  clearAdminDraft(id?: number): void {
    const key = id ? `admin_quiz_${id}` : 'admin_quiz_new';
    sessionStorage.removeItem(key);
  }

  // Client Questionnaire Filling Drafts
  saveQuizDraft(quizId: number, data: ResponseSubmit): void {
    sessionStorage.setItem(`quiz_draft_${quizId}`, JSON.stringify(data));
  }

  getQuizDraft(quizId: number): ResponseSubmit | null {
    const raw = sessionStorage.getItem(`quiz_draft_${quizId}`);
    return raw ? JSON.parse(raw) : null;
  }

  clearQuizDraft(quizId: number): void {
    sessionStorage.removeItem(`quiz_draft_${quizId}`);
  }

  // Client Questionnaire Server Field Errors
  saveServerErrors(quizId: number, errors: Record<string, string>): void {
    sessionStorage.setItem(`quiz_errors_${quizId}`, JSON.stringify(errors));
  }

  takeServerErrors(quizId: number): Record<string, string> {
    const key = `quiz_errors_${quizId}`;
    const raw = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return raw ? JSON.parse(raw) : {};
  }
}
