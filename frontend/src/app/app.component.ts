import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-shell">
      <app-navbar></app-navbar>
      <main [class.app-main--home]="isHomePage">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    main {
      flex: 1;
      min-width: 0;
      padding-bottom: 40px;
      background-color: var(--bg-main);
    }
    .app-main--home {
      background-color: var(--ds-color-background);
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.auth.validateStoredSession();
  }

  get isHomePage(): boolean {
    const path = this.router.url.split('?')[0].split('#')[0];
    return path === '/' || path === '/home';
  }
}
