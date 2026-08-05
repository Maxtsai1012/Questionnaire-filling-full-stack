import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  constructor(public auth: AuthService, private router: Router) {}

  createQuestionnaire(): void {
    alert('請登入建立表單!!');
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/member/quizzes/new' } });
  }
}
