import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { ApiResponse } from '../models/survey.model';

export interface AuthUser {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'MEMBER' | 'ADMIN';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly key = 'survey_auth';
  private logoutInProgress = false;
  private subject = new BehaviorSubject<AuthUser | null>(this.read());
  user$ = this.subject.asObservable();
  constructor(private http: HttpClient, private router: Router) {}
  get user(): AuthUser | null { return this.subject.value; }
  get token(): string | null { return this.user?.token || null; }
  get isAdmin(): boolean { return this.user?.role === 'ADMIN'; }
  get isAuthenticated(): boolean { return !!this.user; }
  login(email: string, password: string): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>('/api/auth/login', { email, password }).pipe(tap(r => r.success && this.store(r.data)));
  }
  register(name: string, phone: string, email: string, password: string): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>('/api/auth/register', { name, phone, email, password }).pipe(tap(r => r.success && this.store(r.data)));
  }
  updateProfile(name: string, phone: string, newPassword: string): Observable<ApiResponse<AuthUser>> {
    return this.http.put<ApiResponse<AuthUser>>('/api/auth/me', { name, phone, newPassword }).pipe(
      tap(r => r.success && this.store(r.data))
    );
  }
  me(): Observable<ApiResponse<AuthUser>> {
    return this.http.get<ApiResponse<AuthUser>>('/api/auth/me');
  }
  validateStoredSession(): void {
    const validatingToken = this.token;
    if (!validatingToken) return;
    this.me().pipe(
      tap(r => {
        if (r.success && this.token === validatingToken) this.store({ ...r.data, token: validatingToken });
      }),
      catchError(error => {
      if (this.token !== validatingToken) return throwError(() => error);
      this.clearSession();
      const currentUrl = this.router.url;
      if (currentUrl.startsWith('/member/') || currentUrl.startsWith('/admin')) {
        this.router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
      }
      return throwError(() => error);
    })).subscribe({ error: () => undefined });
  }
  clearSession(): void { localStorage.removeItem(this.key); this.subject.next(null); }
  logout(): void {
    if (this.logoutInProgress) return;
    if (!this.token) {
      this.finishLogout(true);
      return;
    }
    this.logoutInProgress = true;
    this.http.post<ApiResponse<null>>('/api/auth/logout', {}).subscribe({
      next: () => this.finishLogout(true),
      error: () => this.finishLogout(false)
    });
  }
  private finishLogout(serverConfirmed: boolean): void {
    this.logoutInProgress = false;
    this.clearSession();
    this.router.navigate(['/quiz'], serverConfirmed ? {} : { queryParams: { logout: 'local-only' } });
  }
  private store(user: AuthUser): void { localStorage.setItem(this.key, JSON.stringify(user)); this.subject.next(user); }
  private read(): AuthUser | null {
    try {
      const value = JSON.parse(localStorage.getItem(this.key) || 'null');
      if (!value || typeof value.token !== 'string' || value.token.split('.').length !== 3 ||
          (value.role !== 'MEMBER' && value.role !== 'ADMIN')) {
        localStorage.removeItem(this.key);
        return null;
      }
      return value;
    } catch {
      localStorage.removeItem(this.key);
      return null;
    }
  }
}
