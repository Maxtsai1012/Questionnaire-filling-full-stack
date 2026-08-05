import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <main class="account-page">
      <section class="account-panel" aria-labelledby="login-title">
        <a class="account-back" routerLink="/">← 回到首頁</a>
        <div class="account-heading">
          <span class="ds-badge ds-badge--accent">會員登入</span>
          <h1 id="login-title">歡迎回來</h1>
          <p>登入後即可建立問卷、管理資料並查看回覆結果。</p>
        </div>

        <form class="account-form" (ngSubmit)="submit()" novalidate>
          <div class="account-field">
            <label for="login-email">電子信箱 <span aria-hidden="true">*</span></label>
            <input id="login-email" name="email" type="email" autocomplete="email"
              [(ngModel)]="email" (ngModelChange)="clearFieldError('email')"
              placeholder="you@example.com" [attr.aria-invalid]="!!errors['email']"
              [attr.aria-describedby]="errors['email'] ? 'login-email-error' : null">
            <p class="account-error" id="login-email-error" *ngIf="errors['email']">{{ errors['email'] }}</p>
          </div>

          <div class="account-field">
            <label for="login-password">密碼 <span aria-hidden="true">*</span></label>
            <input id="login-password" name="password" type="password" autocomplete="current-password"
              [(ngModel)]="password" (ngModelChange)="clearFieldError('password')"
              [attr.aria-invalid]="!!errors['password']"
              [attr.aria-describedby]="errors['password'] ? 'login-password-error' : null">
            <p class="account-error" id="login-password-error" *ngIf="errors['password']">{{ errors['password'] }}</p>
          </div>

          <div class="account-alert account-alert--error" role="alert" *ngIf="serverError">{{ serverError }}</div>
          <button class="ds-button ds-button--primary account-submit" type="submit" [disabled]="submitting">
            <span class="account-spinner" *ngIf="submitting" aria-hidden="true"></span>
            {{ submitting ? '登入中…' : '登入' }}
          </button>
        </form>

        <p class="account-switch">還沒有帳號嗎？ <a routerLink="/register">立即註冊</a></p>
      </section>
    </main>
    <footer class="account-footer"><a routerLink="/">動態問卷系統</a><span>讓每一份意見成為更好的決定</span></footer>
  `
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  submitting = false;
  serverError = '';
  errors: Record<string, string> = {};

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    if (this.auth.user) {
      this.router.navigate([this.auth.isAdmin ? '/admin' : '/quiz']);
    }
  }

  clearFieldError(field: string): void {
    delete this.errors[field];
    this.serverError = '';
  }

  submit(): void {
    if (this.submitting) return;
    this.errors = {};
    this.serverError = '';
    const email = this.email.trim();
    if (!email) this.errors['email'] = '請輸入電子信箱。';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) this.errors['email'] = '請輸入有效的電子信箱格式。';
    if (!this.password) this.errors['password'] = '請輸入密碼。';
    if (Object.keys(this.errors).length) return;

    this.submitting = true;
    this.auth.login(email, this.password).pipe(finalize(() => this.submitting = false)).subscribe({
      next: response => {
        const requested = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(requested || (response.data.role === 'ADMIN' ? '/admin' : '/quiz'));
      },
      error: error => this.serverError = error.error?.message || '登入失敗，請確認帳號與密碼後再試一次。'
    });
  }
}
