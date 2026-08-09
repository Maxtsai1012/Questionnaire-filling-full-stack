import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { BehaviorSubject, catchError, Observable, tap, throwError } from "rxjs";
import { ApiResponse, AuthUser } from "../models/survey.model";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly storageKey = "survey_auth";
  private logoutInProgress = false;
  private subject = new BehaviorSubject<AuthUser | null>(
    this.readSessionStorage(),
  );

  user$ = this.subject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  get user(): AuthUser | null {
    return this.subject.value;
  }

  get token(): string | null {
    return this.user?.token || null;
  }

  get isAdmin(): boolean {
    return this.user?.role === "ADMIN";
  }

  get isAuthenticated(): boolean {
    return !!this.user;
  }

  /**
   * Route prefix for the "manage my questionnaires" area. Admin and member share the
   * same components, only the URL segment differs — so build links from this instead of
   * repeating `isAdmin ? '/admin' : '/member/quizzes'` in every template.
   */
  get managementBase(): string {
    return this.isAdmin ? "/admin" : "/member/quizzes";
  }

  login(email: string, password: string): Observable<ApiResponse<AuthUser>> {
    return this.http
      .post<ApiResponse<AuthUser>>("/api/auth/login", { email, password })
      .pipe(tap((res) => res.success && this.saveSession(res.data)));
  }

  register(
    name: string,
    phone: string,
    email: string,
    birthday: string,
    password: string,
  ): Observable<ApiResponse<AuthUser>> {
    return this.http
      .post<
        ApiResponse<AuthUser>
      >("/api/auth/register", { name, phone, email, birthday, password })
      .pipe(tap((res) => res.success && this.saveSession(res.data)));
  }

  updateProfile(
    name: string,
    phone: string,
    birthday: string,
  ): Observable<ApiResponse<AuthUser>> {
    return this.http
      .put<ApiResponse<AuthUser>>("/api/auth/me", { name, phone, birthday })
      .pipe(tap((res) => res.success && this.saveSession(res.data)));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>("/api/auth/me/password", {
      currentPassword,
      newPassword,
    });
  }

  me(): Observable<ApiResponse<AuthUser>> {
    return this.http.get<ApiResponse<AuthUser>>("/api/auth/me");
  }

  validateStoredSession(): void {
    const validatingToken = this.token;
    if (!validatingToken) return;

    this.me()
      .pipe(
        tap((res) => {
          if (res.success && this.token === validatingToken) {
            this.saveSession({ ...res.data, token: validatingToken });
          }
        }),
        catchError((error) => {
          if (this.token !== validatingToken) {
            return throwError(() => error);
          }
          this.clearSession();
          const currentUrl = this.router.url;
          if (
            currentUrl.startsWith("/member/") ||
            currentUrl.startsWith("/admin")
          ) {
            this.router.navigate(["/login"], {
              queryParams: { returnUrl: currentUrl },
            });
          }
          return throwError(() => error);
        }),
      )
      .subscribe({ error: () => undefined });
  }

  clearSession(): void {
    localStorage.removeItem(this.storageKey);
    this.clearQuestionnaireDrafts();
    this.subject.next(null);
  }

  logout(): void {
    if (this.logoutInProgress) return;
    if (!this.token) {
      this.finishLogout(true);
      return;
    }
    this.logoutInProgress = true;
    this.http.post<ApiResponse<null>>("/api/auth/logout", {}).subscribe({
      next: () => this.finishLogout(true),
      error: () => this.finishLogout(false),
    });
  }

  /**
   * Shared navigation logic for creating a new questionnaire or prompting login.
   */
  navigateToCreateOrLogin(): void {
    if (!this.user) {
      alert("請您先登入，再建立表單 ！");
      this.router.navigate(["/login"], {
        queryParams: { returnUrl: "/member/quizzes/new" },
      });
      return;
    }
    this.router.navigate([this.managementBase, "new"]);
  }

  private finishLogout(serverConfirmed: boolean): void {
    this.logoutInProgress = false;
    this.clearSession();
    this.router.navigate(
      ["/quiz"],
      serverConfirmed ? {} : { queryParams: { logout: "local-only" } },
    );
  }

  private saveSession(user: AuthUser): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    this.subject.next(user);
  }

  private clearQuestionnaireDrafts(): void {
    const keys: string[] = [];
    for (let index = 0; index < sessionStorage.length; index++) {
      const key = sessionStorage.key(index);
      if (key?.startsWith("quiz_draft_") || key?.startsWith("quiz_errors_")) {
        keys.push(key);
      }
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
  }

  private readSessionStorage(): AuthUser | null {
    try {
      const value = JSON.parse(localStorage.getItem(this.storageKey) || "null");
      if (
        !value ||
        typeof value.token !== "string" ||
        value.token.split(".").length !== 3 ||
        typeof value.birthday !== "string" ||
        (value.role !== "MEMBER" && value.role !== "ADMIN")
      ) {
        localStorage.removeItem(this.storageKey);
        return null;
      }
      return value;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
