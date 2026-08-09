import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { QuizListComponent } from './pages/client/quiz-list/quiz-list.component';
import { QuizFormComponent } from './pages/client/quiz-form/quiz-form.component';
import { QuizConfirmComponent } from './pages/client/quiz-confirm/quiz-confirm.component';
import { QuizStatsComponent } from './pages/client/quiz-stats/quiz-stats.component';

import { AdminListComponent } from './pages/admin/admin-list/admin-list.component';
import { AdminEditComponent } from './pages/admin/admin-edit/admin-edit.component';
import { AdminDetailComponent } from './pages/admin/admin-detail/admin-detail.component';
import { LoginComponent } from './pages/auth/login.component';
import { RegisterComponent } from './pages/auth/register.component';
import { AdminGuard } from './core/admin.guard';
import { AuthGuard } from './core/auth.guard';
import { ProfileComponent } from './pages/member/profile.component';
import { HomeComponent } from './pages/home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'quiz', component: QuizListComponent },
  { path: 'quiz/:id/form', component: QuizFormComponent },
  { path: 'quiz/:id/confirm', component: QuizConfirmComponent },
  { path: 'quiz/:id/stats', component: QuizStatsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'member/profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'member/quizzes', component: AdminListComponent, canActivate: [AuthGuard], data: { managementScope: 'owned' } },
  { path: 'member/quizzes/new', component: AdminEditComponent, canActivate: [AuthGuard], data: { managementScope: 'owned' } },
  { path: 'member/quizzes/:id/edit', component: AdminEditComponent, canActivate: [AuthGuard], data: { managementScope: 'owned' } },
  { path: 'member/quizzes/:id/detail', component: AdminDetailComponent, canActivate: [AuthGuard], data: { managementScope: 'owned' } },

  { path: 'admin', component: AdminListComponent, canActivate: [AdminGuard], data: { managementScope: 'admin' } },
  { path: 'admin/new', component: AdminEditComponent, canActivate: [AdminGuard], data: { managementScope: 'admin' } },
  { path: 'admin/:id/edit', component: AdminEditComponent, canActivate: [AdminGuard], data: { managementScope: 'admin' } },
  { path: 'admin/:id/detail', component: AdminDetailComponent, canActivate: [AdminGuard], data: { managementScope: 'admin' } },

  { path: '**', redirectTo: 'quiz' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
