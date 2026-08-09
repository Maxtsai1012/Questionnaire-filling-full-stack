import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { finalize } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import {
  PATTERNS,
  normalizeName,
  normalizePhone,
} from "../../core/utils/validators";

@Component({
  selector: "app-register",
  template: `
    <main class="account-page">
      <section
        class="account-panel account-panel--wide"
        aria-labelledby="register-title"
      >
        <a class="account-back" routerLink="/">← 回到首頁</a>
        <div class="account-heading">
          <span class="ds-badge ds-badge--accent">建立帳號</span>
          <h1 id="register-title">開始使用動態問卷系統</h1>
          <p>建立會員帳號，開始設計問卷並整理每一份重要回覆。</p>
        </div>

        <form
          class="account-form account-form--grid"
          (ngSubmit)="submit()"
          novalidate
        >
          <div class="account-field">
            <label for="register-name"
              >姓名 <span aria-hidden="true">*</span></label
            >
            <input
              id="register-name"
              name="name"
              autocomplete="name"
              [(ngModel)]="name"
              (ngModelChange)="clearFieldError('name')"
              placeholder="請輸入姓名"
              [attr.aria-invalid]="!!errors['name']"
              [attr.aria-describedby]="
                errors['name'] ? 'register-name-error' : null
              "
            />
            <p
              class="account-error"
              id="register-name-error"
              *ngIf="errors['name']"
            >
              {{ errors["name"] }}
            </p>
          </div>

          <div class="account-field">
            <label for="register-phone"
              >手機 <span aria-hidden="true">*</span></label
            >
            <input
              id="register-phone"
              name="phone"
              type="tel"
              inputmode="numeric"
              autocomplete="tel"
              [(ngModel)]="phone"
              (ngModelChange)="clearFieldError('phone')"
              placeholder="09XX-XXX-XXX"
              [attr.aria-invalid]="!!errors['phone']"
              [attr.aria-describedby]="
                errors['phone'] ? 'register-phone-error' : 'register-phone-hint'
              "
            />
            <p
              class="account-hint"
              id="register-phone-hint"
              *ngIf="!errors['phone']"
            >
              請輸入 09 開頭的 10 位數手機號碼。
            </p>
            <p
              class="account-error"
              id="register-phone-error"
              *ngIf="errors['phone']"
            >
              {{ errors["phone"] }}
            </p>
          </div>

          <div class="account-field">
            <label for="register-birthday"
              >生日 <span aria-hidden="true">*</span></label
            >
            <input
              id="register-birthday"
              name="birthday"
              type="date"
              autocomplete="bday"
              [(ngModel)]="birthday"
              [max]="maxBirthday"
              (ngModelChange)="clearFieldError('birthday')"
              [attr.aria-invalid]="!!errors['birthday']"
              [attr.aria-describedby]="
                errors['birthday'] ? 'register-birthday-error' : null
              "
            />
            <p
              class="account-error"
              id="register-birthday-error"
              *ngIf="errors['birthday']"
            >
              {{ errors["birthday"] }}
            </p>
          </div>

          <div class="account-field">
            <label for="register-email"
              >電子信箱 <span aria-hidden="true">*</span></label
            >
            <input
              id="register-email"
              name="email"
              type="email"
              autocomplete="email"
              [(ngModel)]="email"
              (ngModelChange)="clearFieldError('email')"
              placeholder="user@example.com"
              [attr.aria-invalid]="!!errors['email']"
              [attr.aria-describedby]="
                errors['email'] ? 'register-email-error' : null
              "
            />
            <!-- 1. 沒有錯誤時顯示的提示字 -->
            <p
              class="account-hint"
              id="register-email-hint"
              *ngIf="!errors['email']"
            >
              請輸入有效的電子信箱格式，作為您的登入帳號。
            </p>

            <!-- 2. 出現錯誤時顯示的紅字 -->
            <p
              class="account-error"
              id="register-email-error"
              *ngIf="errors['email']"
            >
              {{ errors["email"] }}
            </p>
          </div>

          <div class="account-field">
            <label for="register-password"
              >密碼 <span aria-hidden="true">*</span></label
            >
            <div class="password-control">
              <input
                id="register-password"
                name="password"
                [type]="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                [(ngModel)]="password"
                placeholder="至少8碼英數混合"
                (ngModelChange)="clearPasswordErrors()"
                [attr.aria-invalid]="!!errors['password']"
                [attr.aria-describedby]="errors['password'] ? 'register-password-error' : 'register-password-hint'"
              />
              <button class="password-toggle" type="button" (click)="showPassword = !showPassword"
                [attr.aria-label]="showPassword ? '隱藏密碼' : '顯示密碼'" [attr.aria-pressed]="showPassword">
                <svg *ngIf="showPassword" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <svg *ngIf="!showPassword" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18"></path><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a16 16 0 0 1-2.1 3.2"></path><path d="M6.6 6.6C3.5 8.5 2 12 2 12s3.5 8 10 8a10.7 10.7 0 0 0 4.1-.8"></path></svg>
              </button>
            </div>
            <p
              class="account-hint"
              id="register-password-hint"
              *ngIf="!errors['password']"
            >至少 8 個字元，並包含至少 1 個英文字母與 1 個數字。</p>
            <p
              class="account-error"
              id="register-password-error"
              *ngIf="errors['password']"
            >
              {{ errors["password"] }}
            </p>
          </div>

          <div class="account-field">
            <label for="register-confirm-password"
              >確認密碼 <span aria-hidden="true">*</span></label
            >
            <div class="password-control">
              <input
                id="register-confirm-password"
                name="confirmPassword"
                [type]="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                [(ngModel)]="confirmPassword"
                placeholder="請再次輸入密碼"
                (ngModelChange)="clearFieldError('confirmPassword')"
                [attr.aria-invalid]="!!errors['confirmPassword']"
                [attr.aria-describedby]="errors['confirmPassword'] ? 'register-confirm-error' : null"
              />
              <button class="password-toggle" type="button" (click)="showConfirmPassword = !showConfirmPassword"
                [attr.aria-label]="showConfirmPassword ? '隱藏確認密碼' : '顯示確認密碼'" [attr.aria-pressed]="showConfirmPassword">
                <svg *ngIf="showConfirmPassword" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <svg *ngIf="!showConfirmPassword" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18"></path><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a16 16 0 0 1-2.1 3.2"></path><path d="M6.6 6.6C3.5 8.5 2 12 2 12s3.5 8 10 8a10.7 10.7 0 0 0 4.1-.8"></path></svg>
              </button>
            </div>
            <p
              class="account-error"
              id="register-confirm-error"
              *ngIf="errors['confirmPassword']"
            >
              {{ errors["confirmPassword"] }}
            </p>
          </div>

          <div
            class="account-alert account-alert--error account-field--full"
            role="alert"
            *ngIf="serverError"
          >
            {{ serverError }}
          </div>
          <button
            class="ds-button ds-button--primary account-submit account-field--full"
            type="submit"
            [disabled]="submitting"
          >
            <span
              class="account-spinner"
              *ngIf="submitting"
              aria-hidden="true"
            ></span>
            {{ submitting ? "註冊中…" : "建立帳號" }}
          </button>
        </form>

        <p class="account-switch">
          已經有帳號了嗎？ <a routerLink="/login">前往登入</a>
        </p>
      </section>
    </main>
    <div class="modal-backdrop" *ngIf="registrationComplete">
      <section class="modal-content registration-success" role="dialog" aria-modal="true" aria-labelledby="registration-success-title">
        <div class="success-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"></path></svg>
        </div>
        <h2 id="registration-success-title">註冊成功</h2>
        <p>帳號已建立並完成登入，現在可以開始瀏覽與填寫問卷。</p>
        <button class="ds-button ds-button--primary" type="button" (click)="goToQuestionnaires()">前往瀏覽問卷</button>
      </section>
    </div>
    <footer class="account-footer">
      <a routerLink="/">動態問卷系統</a><span>讓每一份意見成為更好的決定</span>
    </footer>
  `,
})
export class RegisterComponent implements OnInit {
  name = "";
  phone = "";
  email = "";
  birthday = "";
  password = "";
  confirmPassword = "";
  submitting = false;
  serverError = "";
  errors: Record<string, string> = {};
  showPassword = false;
  showConfirmPassword = false;
  registrationComplete = false;
  readonly maxBirthday = this.localDateValue(new Date());

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.auth.user) {
      this.router.navigate([this.auth.isAdmin ? "/admin" : "/quiz"]);
    }
  }

  clearFieldError(field: string): void {
    delete this.errors[field];
    this.serverError = "";
  }

  clearPasswordErrors(): void {
    this.clearFieldError("password");
    if (this.password === this.confirmPassword) {
      delete this.errors["confirmPassword"];
    }
  }

  submit(): void {
    if (this.submitting) return;
    this.errors = {};
    this.serverError = "";
    const cleanedName = normalizeName(this.name);
    const cleanedPhone = normalizePhone(this.phone);
    const cleanedEmail = this.email.trim().toLowerCase();

    if (!cleanedName) {
      this.errors["name"] = "請輸入姓名。";
    } else if (!PATTERNS.NAME.test(cleanedName)) {
      this.errors["name"] = "姓名只能包含中文、英文與字詞間空格。";
    }

    if (!cleanedPhone) {
      this.errors["phone"] = "請輸入手機號碼。";
    } else if (!PATTERNS.PHONE.test(cleanedPhone)) {
      this.errors["phone"] = "請輸入 09 開頭的 10 位數手機號碼。";
    }

    if (!cleanedEmail) {
      this.errors["email"] = "請輸入電子信箱。";
    } else if (!PATTERNS.EMAIL.test(cleanedEmail)) {
      this.errors["email"] = "請輸入有效的電子信箱格式。";
    }

    if (!this.birthday) {
      this.errors["birthday"] = "請選擇生日。";
    } else if (this.birthday > this.maxBirthday) {
      this.errors["birthday"] = "生日不能晚於今天。";
    }

    if (!this.password) {
      this.errors["password"] = "請設定密碼。";
    } else if (!PATTERNS.PASSWORD.test(this.password)) {
      this.errors["password"] = "密碼至少需要 8 個字元，並包含英文字母與數字。";
    }
    if (!this.confirmPassword) {
      this.errors["confirmPassword"] = "請再次輸入密碼。";
    } else if (this.password !== this.confirmPassword) {
      this.errors["confirmPassword"] = "兩次輸入的密碼不一致。";
    }

    if (Object.keys(this.errors).length) return;

    this.submitting = true;
    this.auth
      .register(
        cleanedName,
        cleanedPhone,
        cleanedEmail,
        this.birthday,
        this.password,
      )
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => (this.registrationComplete = true),
        error: (error) =>
          (this.serverError =
            error.error?.message || "註冊失敗，請稍後再試一次。"),
      });
  }

  goToQuestionnaires(): void {
    this.router.navigate(["/quiz"]);
  }

  private localDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
