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
          <p>更新您的資料或設定新密碼。電子信箱與角色為唯讀，不可修改。</p>
        </div>

        <div class="profile-avatar">
          <img
            src="assets/avatars/avatars_cropped.png"
            alt="會員大頭貼"
            width="184"
            height="184"
          />
          <span class="profile-avatar__camera" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M4 7h3l1.4-2h7.2L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
              ></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </span>
        </div>

        <div class="profile-summary" aria-label="帳號資訊">
          <div>
            <span>登入帳號</span><strong [title]="email">{{ email }}</strong>
          </div>
          <div>
            <span>帳號角色</span><strong>{{ roleLabel }}</strong>
          </div>
        </div>

        <form
          class="account-form"
          (ngSubmit)="save()"
          autocomplete="off"
          novalidate
        >
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

            <div class="account-field">
              <label for="profile-birthday"
                >生日 <span aria-hidden="true">*</span></label
              >
              <input
                id="profile-birthday"
                name="birthday"
                type="date"
                autocomplete="bday"
                [(ngModel)]="birthday"
                [max]="maxBirthday"
                (ngModelChange)="clearFieldError('birthday')"
                [attr.aria-invalid]="!!errors['birthday']"
                [attr.aria-describedby]="
                  errors['birthday']
                    ? 'profile-birthday-error'
                    : 'profile-birthday-hint'
                "
              />
              <p
                class="account-hint"
                id="profile-birthday-hint"
                *ngIf="!errors['birthday']"
              >
                填寫問卷時，系統會依生日自動計算完整週歲。
              </p>
              <p
                class="account-error"
                id="profile-birthday-error"
                *ngIf="errors['birthday']"
              >
                {{ errors["birthday"] }}
              </p>
            </div>
          </fieldset>

          <fieldset class="account-fieldset">
            <legend>修改密碼</legend>
            <div class="account-field">
              <label for="profile-current-password"
                >目前密碼 <span aria-hidden="true">*</span></label
              >
              <div class="password-control">
                <input
                  id="profile-current-password"
                  name="currentPassword"
                  [type]="showCurrentPassword ? 'text' : 'password'"
                  autocomplete="off"
                  [(ngModel)]="currentPassword"
                  (ngModelChange)="clearFieldError('currentPassword')"
                  [attr.aria-invalid]="!!errors['currentPassword']"
                />
                <button
                  class="password-toggle"
                  type="button"
                  (click)="showCurrentPassword = !showCurrentPassword"
                  [attr.aria-label]="
                    showCurrentPassword ? '隱藏目前密碼' : '顯示目前密碼'
                  "
                  [attr.aria-pressed]="showCurrentPassword"
                >
                  <svg
                    *ngIf="showCurrentPassword"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                    ></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg
                    *ngIf="!showCurrentPassword"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="m3 3 18 18"></path>
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
                    <path
                      d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a16 16 0 0 1-2.1 3.2"
                    ></path>
                    <path
                      d="M6.6 6.6C3.5 8.5 2 12 2 12s3.5 8 10 8a10.7 10.7 0 0 0 4.1-.8"
                    ></path>
                  </svg>
                </button>
              </div>
              <p class="account-error" *ngIf="errors['currentPassword']">
                {{ errors["currentPassword"] }}
              </p>
            </div>
            <div class="account-field">
              <label for="profile-new-password"
                >新密碼 <span aria-hidden="true">*</span></label
              >

              <div class="password-control">
                <input
                  id="profile-new-password"
                  name="newPassword"
                  [type]="showNewPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  [(ngModel)]="newPassword"
                  (ngModelChange)="clearFieldError('newPassword')"
                  [attr.aria-invalid]="!!errors['newPassword']"
                  aria-describedby="profile-password-hint"
                />
                <button
                  class="password-toggle"
                  type="button"
                  (click)="showNewPassword = !showNewPassword"
                  [attr.aria-label]="
                    showNewPassword ? '隱藏新密碼' : '顯示新密碼'
                  "
                  [attr.aria-pressed]="showNewPassword"
                >
                  <svg
                    *ngIf="showNewPassword"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                    ></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg
                    *ngIf="!showNewPassword"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="m3 3 18 18"></path>
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
                    <path
                      d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a16 16 0 0 1-2.1 3.2"
                    ></path>
                    <path
                      d="M6.6 6.6C3.5 8.5 2 12 2 12s3.5 8 10 8a10.7 10.7 0 0 0 4.1-.8"
                    ></path>
                  </svg>
                </button>
              </div>
              <p class="account-hint" id="profile-email-hint">
                至少 8 個字元，並包含至少 1 個英文字母與 1 個數字。
              </p>

              <p class="account-error" *ngIf="errors['newPassword']">
                {{ errors["newPassword"] }}
              </p>
            </div>
            <div class="account-field">
              <label for="profile-confirm-password"
                >確認新密碼 <span aria-hidden="true">*</span></label
              >
              <div class="password-control">
                <input
                  id="profile-confirm-password"
                  name="confirmPassword"
                  [type]="showConfirmPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  [(ngModel)]="confirmPassword"
                  (ngModelChange)="clearFieldError('confirmPassword')"
                  [attr.aria-invalid]="!!errors['confirmPassword']"
                />
                <button
                  class="password-toggle"
                  type="button"
                  (click)="showConfirmPassword = !showConfirmPassword"
                  [attr.aria-label]="
                    showConfirmPassword ? '隱藏確認新密碼' : '顯示確認新密碼'
                  "
                  [attr.aria-pressed]="showConfirmPassword"
                >
                  <svg
                    *ngIf="showConfirmPassword"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                    ></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg
                    *ngIf="!showConfirmPassword"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="m3 3 18 18"></path>
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
                    <path
                      d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a16 16 0 0 1-2.1 3.2"
                    ></path>
                    <path
                      d="M6.6 6.6C3.5 8.5 2 12 2 12s3.5 8 10 8a10.7 10.7 0 0 0 4.1-.8"
                    ></path>
                  </svg>
                </button>
              </div>
              <p class="account-error" *ngIf="errors['confirmPassword']">
                {{ errors["confirmPassword"] }}
              </p>
            </div>
            <div class="profile-password-action">
              <button
                class="ds-button ds-button--outline"
                type="button"
                (click)="changePassword()"
                [disabled]="changingPassword"
              >
                {{ changingPassword ? "修改中…" : "修改密碼" }}
              </button>
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
  birthday = "";
  newPassword = "";
  currentPassword = "";
  confirmPassword = "";
  roleLabel = "";
  saving = false;
  success = false;
  message = "";
  errors: Record<string, string> = {};
  changingPassword = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  readonly maxBirthday = this.localDateValue(new Date());

  constructor(
    public auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const user = this.auth.user!;
    this.name = user.name;
    this.email = user.email;
    this.phone = user.phone;
    this.birthday = user.birthday;
    this.roleLabel = user.role === "ADMIN" ? "管理員" : "一般會員";
    this.currentPassword = "";
    this.newPassword = "";
    this.confirmPassword = "";
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

    if (!this.birthday) {
      this.errors["birthday"] = "請選擇生日。";
    } else if (this.birthday > this.maxBirthday) {
      this.errors["birthday"] = "生日不能晚於今天。";
    }

    if (Object.keys(this.errors).length) return;

    this.saving = true;
    this.auth
      .updateProfile(cleanedName, cleanedPhone, this.birthday)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (response) => {
          this.success = true;
          this.message = response.message || "會員資料修改成功。";
          this.name = response.data.name;
          this.phone = response.data.phone;
          this.birthday = response.data.birthday;
        },
        error: (error) =>
          (this.message = error.error?.message || "修改失敗，請稍後再試一次。"),
      });
  }

  changePassword(): void {
    if (this.changingPassword) return;
    this.errors = {};
    this.message = "";
    this.success = false;
    if (!this.currentPassword)
      this.errors["currentPassword"] = "請輸入目前密碼。";
    if (!this.newPassword) {
      this.errors["newPassword"] = "請輸入新密碼。";
    } else if (!PATTERNS.PASSWORD.test(this.newPassword)) {
      this.errors["newPassword"] =
        "新密碼至少需要 8 個字元，並包含英文字母與數字。";
    }
    if (!this.confirmPassword) {
      this.errors["confirmPassword"] = "請再次輸入新密碼。";
    } else if (this.newPassword !== this.confirmPassword) {
      this.errors["confirmPassword"] = "兩次輸入的新密碼不一致。";
    }
    if (Object.keys(this.errors).length) return;

    this.changingPassword = true;
    this.auth
      .changePassword(this.currentPassword, this.newPassword)
      .pipe(finalize(() => (this.changingPassword = false)))
      .subscribe({
        next: () => {
          this.auth.clearSession();
          this.router.navigate(["/login"], {
            queryParams: { passwordChanged: 1 },
          });
        },
        error: (error) => {
          const reason =
            error.error?.message || "密碼修改失敗，請確認目前密碼。";
          this.currentPassword = "";
          this.errors["currentPassword"] = reason;
          this.message = reason;
        },
      });
  }

  cancel(): void {
    this.router.navigate([this.auth.isAdmin ? "/admin" : "/quiz"]);
  }

  private localDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
