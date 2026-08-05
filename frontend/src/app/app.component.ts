import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-shell">
      <app-navbar *ngIf="showSharedNavbar"></app-navbar>
      <main>
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
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.validateStoredSession();
  }

  get showSharedNavbar(): boolean {
    const path = this.router.url.split('?')[0].split('#')[0];
    return path !== '/' && path !== '/home';
  }
}
