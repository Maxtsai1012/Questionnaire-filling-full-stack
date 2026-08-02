import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          動態問卷系統
        </a>
        <div class="nav-links">
          <a routerLink="/quiz" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">前台問卷</a>
          <a routerLink="/admin" routerLinkActive="active">後台管理</a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background-color: #0f172a;
      color: #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
      color: #ffffff;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .brand svg {
      color: #3b82f6;
    }
    .nav-links {
      display: flex;
      gap: 20px;
    }
    .nav-links a {
      color: #94a3b8;
      font-weight: 600;
      font-size: 0.95rem;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .nav-links a:hover, .nav-links a.active {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }
  `]
})
export class NavbarComponent {}
