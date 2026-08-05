import { Component } from "@angular/core";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-navbar",
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="brand">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            ></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          動態問卷系統
        </a>
        <div class="nav-links">
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
            *ngIf="auth.user?.role === 'MEMBER'"
            routerLink="/member/quizzes/new"
            routerLinkActive="active"
            >建立問卷</a
          >
          <a
            *ngIf="auth.user?.role === 'MEMBER'"
            routerLink="/member/quizzes"
            routerLinkActive="active"
            >我的問卷</a
          >
          <button
            *ngIf="!auth.user"
            class="nav-link-button"
            type="button"
            (click)="createQuestionnaire()"
          >建立問卷</button>
          <a *ngIf="auth.isAdmin" routerLink="/admin" routerLinkActive="active"
            >管理後台</a
          >
          <a *ngIf="!auth.user" routerLink="/login" routerLinkActive="active"
            >登入</a
          >
          <a *ngIf="!auth.user" routerLink="/register" routerLinkActive="active"
            >註冊</a
          >
          <a
            *ngIf="auth.user"
            routerLink="/member/profile"
            routerLinkActive="active"
            >會員資料</a
          >
          <button
            *ngIf="auth.user"
            class="logout-button"
            (click)="auth.logout()"
          >
            登出
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      .navbar {
        background-color: var(--ds-color-surface);
        color: var(--ds-color-text-primary);
        border-bottom: var(--ds-border-subtle);
        box-shadow: 0 2px 10px rgb(31 67 82 / 0.06);
      }
      .nav-container {
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 16px;
        height: 64px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--ds-color-text-primary);
        font-size: 1.25rem;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .brand svg {
        color: var(--ds-color-primary);
      }
      .nav-links {
        display: flex;
        gap: 20px;
        align-items: center;
      }
      .nav-links a {
        color: var(--ds-color-secondary);
        font-weight: 600;
        font-size: 0.95rem;
        padding: 8px 12px;
        border-radius: 6px;
        transition: all 0.2s;
      }
      .nav-links a:hover,
      .nav-links a.active {
        color: var(--ds-color-primary-hover);
        background: var(--ds-color-background);
      }
      .logout-button {
        min-height: 40px;
        border: 1px solid var(--ds-color-primary);
        background: var(--ds-color-surface);
        color: var(--ds-color-primary-hover);
        border-radius: var(--ds-radius-button);
        padding: 8px 14px;
        font-weight: 600;
        cursor: pointer;
      }
      .nav-link-button {
        min-height: 40px;
        border: 0;
        background: transparent;
        color: var(--ds-color-secondary);
        border-radius: 6px;
        padding: 8px 12px;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }
      .nav-link-button:hover {
        color: var(--ds-color-primary-hover);
        background: var(--ds-color-background);
      }
      .logout-button:hover {
        background: var(--ds-color-background);
      }
      .brand:focus-visible,
      .nav-links a:focus-visible,
      .nav-link-button:focus-visible,
      .logout-button:focus-visible {
        outline: 2px solid transparent;
        box-shadow: var(--ds-shadow-focus);
      }
      @media (max-width: 768px) {
        .nav-container {
          height: auto;
          min-height: 64px;
          align-items: flex-start;
          flex-direction: column;
          gap: 10px;
          padding-top: 12px;
          padding-bottom: 12px;
        }
        .nav-links {
          width: 100%;
          overflow-x: auto;
          gap: 6px;
          padding-bottom: 2px;
        }
        .nav-links a,
        .nav-link-button,
        .logout-button {
          flex: 0 0 auto;
          min-height: 40px;
          display: inline-flex;
          align-items: center;
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
