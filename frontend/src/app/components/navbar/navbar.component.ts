import { Component } from "@angular/core";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-navbar",
  template: `
    <nav class="navbar" aria-label="主要導覽">
      <div class="nav-container">
        <a routerLink="/" class="brand" aria-label="動態問卷系統首頁">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            ></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>動態問卷系統</span>
        </a>

        <div class="nav-links" aria-label="主要功能">
          <a
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            >首頁</a
          >
          <a
            routerLink="/quiz"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            >瀏覽問卷</a
          >
          <a
            *ngIf="auth.user"
            [routerLink]="auth.isAdmin ? '/admin/new' : '/member/quizzes/new'"
            routerLinkActive="active"
            >建立問卷</a
          >
          <a
            *ngIf="auth.user"
            routerLink="/member/quizzes"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            >我的問卷</a
          >
          <button
            *ngIf="!auth.user"
            class="nav-link-button"
            type="button"
            (click)="createQuestionnaire()"
          >
            建立問卷
          </button>
          <a
            *ngIf="auth.isAdmin"
            routerLink="/admin"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            >管理後台</a
          >
        </div>

        <div class="nav-account">
          <ng-container *ngIf="!auth.user; else signedInAccount">
            <img
              class="nav-avatar nav-avatar--guest"
              src="assets/avatars/avatars_default.png"
              alt=""
              width="56"
              height="56"
              aria-hidden="true"
            />
            <a
              class="nav-auth-button nav-auth-button--outline"
              routerLink="/login"
              >登入</a
            >
            <a
              class="nav-auth-button nav-auth-button--primary"
              routerLink="/register"
              >註冊</a
            >
          </ng-container>

          <ng-template #signedInAccount>
            <a
              class="nav-profile-link"
              routerLink="/member/profile"
              routerLinkActive="active"
              >會員資料</a
            >
            <img
              class="nav-avatar nav-avatar--member"
              src="assets/avatars/avatars_cropped.png"
              alt=""
              width="48"
              height="48"
              aria-hidden="true"
            />
            <span class="user-greeting" [title]="auth.user?.name || ''"
              >{{ auth.user?.name }}，你好！</span
            >
            <button
              class="nav-auth-button nav-auth-button--outline"
              type="button"
              (click)="auth.logout()"
            >
              登出
            </button>
          </ng-template>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      .navbar {
        position: relative;
        z-index: 20;
        background: var(--ds-color-surface);
        color: var(--ds-color-text-primary);
        border-bottom: 1px solid var(--primary);
        box-shadow: 0 2px 10px rgb(16 48 60 / 0.06);
      }

      .nav-container {
        width: min(calc(100% - 32px), var(--ds-content-max-width));
        min-height: 72px;
        display: flex;
        align-items: center;
        gap: 20px;
        margin-inline: auto;
      }

      .brand {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--teal-950);
        font-size: 1.2rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        white-space: nowrap;
      }

      .brand:hover {
        color: var(--teal-700);
      }

      .brand svg {
        color: var(--teal-600);
      }

      .nav-links,
      .nav-account {
        display: flex;
        align-items: center;
      }

      .nav-links {
        gap: 4px;
      }

      .nav-account {
        flex: 0 0 auto;
        gap: 10px;
        margin-left: auto;
      }

      .nav-links a,
      .nav-link-button,
      .nav-profile-link {
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        padding: 8px 11px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--teal-800);
        font: inherit;
        font-size: 0.9375rem;
        font-weight: 600;
        line-height: 1;
        white-space: nowrap;
        cursor: pointer;
        transition:
          color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      .nav-links a:hover,
      .nav-links a.active,
      .nav-link-button:hover,
      .nav-profile-link:hover,
      .nav-profile-link.active {
        background: var(--teal-50);
        color: var(--teal-700);
      }

      .nav-avatar {
        flex: 0 0 auto;
        display: block;
        border-radius: 50%;
        object-fit: cover;
      }

      .nav-avatar--guest {
        width: 48px;
        height: 48px;
      }

      .nav-avatar--member {
        width: 46px;
        height: 46px;
        border: 2px solid var(--primary);
        background: var(--teal-50);
      }

      .user-greeting {
        max-width: 132px;
        overflow: hidden;
        color: var(--teal-800);
        font-size: 0.875rem;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .nav-auth-button {
        min-width: 68px;
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 9px 16px;
        border: 1px solid var(--teal-600);
        border-radius: 8px;
        font: inherit;
        font-size: 0.9375rem;
        font-weight: 700;
        line-height: 1;
        white-space: nowrap;
        cursor: pointer;
        transition:
          color 180ms ease,
          background-color 180ms ease,
          border-color 180ms ease,
          box-shadow 180ms ease,
          transform 180ms ease;
      }

      .nav-auth-button--outline {
        background: var(--ds-color-surface);
        color: var(--teal-700);
      }

      .nav-auth-button--outline:hover {
        border-color: var(--teal-700);
        background: var(--teal-50);
        color: var(--teal-700);
        transform: translateY(-1px);
      }

      .nav-auth-button--primary {
        background: var(--teal-600);
        color: var(--ds-color-surface);
        box-shadow: 0 7px 16px rgb(31 129 150 / 0.24);
      }

      .nav-auth-button--primary:hover {
        border-color: var(--teal-700);
        background: var(--teal-700);
        color: var(--ds-color-surface);
        box-shadow: 0 8px 18px rgb(31 129 150 / 0.3);
        transform: translateY(-1px);
      }

      .brand:focus-visible,
      .nav-links a:focus-visible,
      .nav-link-button:focus-visible,
      .nav-profile-link:focus-visible,
      .nav-auth-button:focus-visible {
        outline: 2px solid transparent;
        box-shadow: var(--ds-shadow-focus);
      }

      @media (max-width: 1100px) {
        .nav-container {
          gap: 10px;
        }

        .nav-links a,
        .nav-link-button,
        .nav-profile-link {
          padding-inline: 8px;
        }

        .user-greeting {
          max-width: 96px;
        }
      }

      @media (max-width: 900px) {
        .nav-container {
          flex-wrap: wrap;
          gap: 8px 12px;
          padding-block: 10px;
        }

        .nav-links {
          order: 3;
          width: 100%;
          overflow-x: auto;
          padding-top: 2px;
          scrollbar-width: thin;
        }

        .nav-account {
          margin-left: auto;
        }
      }

      @media (max-width: 600px) {
        .brand {
          font-size: 1rem;
        }

        .brand svg {
          width: 22px;
          height: 22px;
        }

        .nav-account {
          gap: 6px;
        }

        .nav-avatar--guest,
        .nav-avatar--member {
          width: 40px;
          height: 40px;
        }

        .nav-profile-link,
        .user-greeting {
          display: none;
        }

        .nav-auth-button {
          min-width: 58px;
          min-height: 38px;
          padding-inline: 11px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .nav-links a,
        .nav-link-button,
        .nav-profile-link,
        .nav-auth-button {
          transition: none;
        }
      }
    `,
  ],
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}

  createQuestionnaire(): void {
    this.auth.navigateToCreateOrLogin();
  }
}
