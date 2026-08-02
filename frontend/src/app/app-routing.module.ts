import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { QuizListComponent } from './pages/client/quiz-list/quiz-list.component';
import { QuizFormComponent } from './pages/client/quiz-form/quiz-form.component';
import { QuizConfirmComponent } from './pages/client/quiz-confirm/quiz-confirm.component';
import { QuizStatsComponent } from './pages/client/quiz-stats/quiz-stats.component';

import { AdminListComponent } from './pages/admin/admin-list/admin-list.component';
import { AdminEditComponent } from './pages/admin/admin-edit/admin-edit.component';
import { AdminDetailComponent } from './pages/admin/admin-detail/admin-detail.component';

const routes: Routes = [
  { path: '', redirectTo: 'quiz', pathMatch: 'full' },
  { path: 'quiz', component: QuizListComponent },
  { path: 'quiz/:id/form', component: QuizFormComponent },
  { path: 'quiz/:id/confirm', component: QuizConfirmComponent },
  { path: 'quiz/:id/stats', component: QuizStatsComponent },

  { path: 'admin', component: AdminListComponent },
  { path: 'admin/new', component: AdminEditComponent },
  { path: 'admin/:id/edit', component: AdminEditComponent },
  { path: 'admin/:id/detail', component: AdminDetailComponent },

  { path: '**', redirectTo: 'quiz' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
