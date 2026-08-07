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

          <div class="account-field account-field--full">
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
            <input
              id="register-password"
              name="password"
              type="password"
              autocomplete="new-password"
              [(ngModel)]="password"
              placeholder="至少8碼英數混合"
              (ngModelChange)="clearPasswordErrors()"
              [attr.aria-invalid]="!!errors['password']"
              [attr.aria-describedby]="
                errors['password']
                  ? 'register-password-error'
                  : 'register-password-hint'
              "
            />
            <p
              class="account-hint"
              id="register-password-hint"
              *ngIf="!errors['password']"
            ></p>
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
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              [(ngModel)]="confirmPassword"
              placeholder="請再次輸入密碼"
              (ngModelChange)="clearFieldError('confirmPassword')"
              [attr.aria-invalid]="!!errors['confirmPassword']"
              [attr.aria-describedby]="
                errors['confirmPassword'] ? 'register-confirm-error' : null
              "
            />
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
    <footer class="account-footer">
      <a routerLink="/">動態問卷系統</a><span>讓每一份意見成為更好的決定</span>
    </footer>
  `,
})
export class RegisterComponent implements OnInit {
  name = "";
  phone = "";
  email = "";
  password = "";
  confirmPassword = "";
  submitting = false;
  serverError = "";
  errors: Record<string, string> = {};

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

    if (!this.password) this.errors["password"] = "請設定密碼。";
    if (!this.confirmPassword) {
      this.errors["confirmPassword"] = "請再次輸入密碼。";
    } else if (this.password !== this.confirmPassword) {
      this.errors["confirmPassword"] = "兩次輸入的密碼不一致。";
    }

    if (Object.keys(this.errors).length) return;

    this.submitting = true;
    this.auth
      .register(cleanedName, cleanedPhone, cleanedEmail, this.password)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => this.router.navigate(["/quiz"]),
        error: (error) =>
          (this.serverError =
            error.error?.message || "註冊失敗，請稍後再試一次。"),
      });
  }
}
