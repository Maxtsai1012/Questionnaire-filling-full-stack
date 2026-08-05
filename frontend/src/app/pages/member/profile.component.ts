import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { finalize } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { PATTERNS, normalizeName, normalizePhone } from "../../core/utils/validators";

@Component({
  selector: "app-member-profile",
  template: `
    <main class="account-page account-page--profile">
      <section
        class="account-panel account-panel--profile"
        aria-labelledby="profile-title"
      >
        <a class="account-back" routerLink="/">← 回到首頁</a>
        <div class="account-heading account-heading--left">
          <span class="ds-badge ds-badge--accent">會員中心</span>
          <h1 id="profile-title">會員資料</h1>
          <p>更新聯絡資料或設定新密碼。電子信箱與角色維持唯讀。</p>
        </div>

        <div class="profile-summary" aria-label="帳號資訊">
          <div>
            <span>登入帳號</span><strong [title]="email">{{ email }}</strong>
          </div>
          <div>
            <span>帳號角色</span><strong>{{ roleLabel }}</strong>
          </div>
        </div>

        <form class="account-form" (ngSubmit)="save()" novalidate>
          <fieldset class="account-fieldset">
            <legend>基本資料</legend>
            <div class="account-field">
              <label for="profile-name"
                >姓名 <span aria-hidden="true">*</span></label
              >
              <input
                id="profile-name"
                name="name"
                autocomplete="name"
                [(ngModel)]="name"
                (ngModelChange)="clearFieldError('name')"
                [attr.aria-invalid]="!!errors['name']"
                [attr.aria-describedby]="
                  errors['name'] ? 'profile-name-error' : null
                "
              />
              <p
                class="account-error"
                id="profile-name-error"
                *ngIf="errors['name']"
              >
                {{ errors["name"] }}
              </p>
            </div>

            <div class="account-field">
              <label for="profile-email">電子信箱</label>
              <input
                id="profile-email"
                name="email"
                type="email"
                [value]="email"
                readonly
                aria-describedby="profile-email-hint"
              />
              <p class="account-hint" id="profile-email-hint">
                電子信箱為登入帳號，不可修改。
              </p>
            </div>

            <div class="account-field">
              <label for="profile-phone"
                >手機 <span aria-hidden="true">*</span></label
              >
              <input
                id="profile-phone"
                name="phone"
                type="tel"
                inputmode="numeric"
                autocomplete="tel"
                [(ngModel)]="phone"
                (ngModelChange)="clearFieldError('phone')"
                placeholder="09XX-XXX-XXX"
                [attr.aria-invalid]="!!errors['phone']"
                [attr.aria-describedby]="
                  errors['phone'] ? 'profile-phone-error' : 'profile-phone-hint'
                "
              />
              <p
                class="account-hint"
                id="profile-phone-hint"
                *ngIf="!errors['phone']"
              >
                請輸入 09 開頭的 10 位數手機號碼。
              </p>
              <p
                class="account-error"
                id="profile-phone-error"
                *ngIf="errors['phone']"
              >
                {{ errors["phone"] }}
              </p>
            </div>
          </fieldset>

          <fieldset class="account-fieldset">
            <legend>修改密碼</legend>
            <div class="account-field">
              <label for="profile-password">新密碼</label>
              <input
                id="profile-password"
                name="newPassword"
                type="password"
                autocomplete="new-password"
                [(ngModel)]="newPassword"
                aria-describedby="profile-password-hint"
              />
              <p class="account-hint" id="profile-password-hint">
                不修改密碼時請保持空白。
              </p>
            </div>
          </fieldset>

          <div
            class="account-alert"
            [class.account-alert--success]="success"
            [class.account-alert--error]="!success"
            [attr.role]="success ? 'status' : 'alert'"
            *ngIf="message"
          >
            {{ message }}
          </div>
          <div class="profile-actions">
            <button
              class="ds-button ds-button--outline"
              type="button"
              (click)="cancel()"
              [disabled]="saving"
            >
              取消
            </button>
            <button
              class="ds-button ds-button--primary"
              type="submit"
              [disabled]="saving"
            >
              <span
                class="account-spinner"
                *ngIf="saving"
                aria-hidden="true"
              ></span>
              {{ saving ? "儲存中…" : "儲存變更" }}
            </button>
          </div>
        </form>
      </section>
    </main>
    <footer class="account-footer">
      <a routerLink="/">動態問卷系統</a><span>讓每一份意見成為更好的決定</span>
    </footer>
  `,
})
export class ProfileComponent implements OnInit {
  name = "";
  email = "";
  phone = "";
  newPassword = "";
  roleLabel = "";
  saving = false;
  success = false;
  message = "";
  errors: Record<string, string> = {};

  constructor(
    public auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const user = this.auth.user!;
    this.name = user.name;
    this.email = user.email;
    this.phone = user.phone;
    this.roleLabel = user.role === "ADMIN" ? "管理員" : "一般會員";
  }

  clearFieldError(field: string): void {
    delete this.errors[field];
    this.message = "";
    this.success = false;
  }

  save(): void {
    if (this.saving) return;
    this.errors = {};
    this.message = "";
    this.success = false;

    const cleanedPhone = normalizePhone(this.phone);
    const cleanedName = normalizeName(this.name);

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

    if (Object.keys(this.errors).length) return;

    this.saving = true;
    this.auth
      .updateProfile(cleanedName, cleanedPhone, this.newPassword)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (response) => {
          this.success = true;
          this.message = response.message || "會員資料修改成功。";
          this.name = response.data.name;
          this.phone = response.data.phone;
          this.newPassword = "";
        },
        error: (error) =>
          (this.message = error.error?.message || "修改失敗，請稍後再試一次。"),
      });
  }

  cancel(): void {
    this.router.navigate([this.auth.isAdmin ? "/admin" : "/quiz"]);
  }
}
