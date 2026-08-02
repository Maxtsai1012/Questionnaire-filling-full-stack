import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NavbarComponent } from './components/navbar/navbar.component';
import { ChartViewComponent } from './components/chart-view/chart-view.component';

import { QuizListComponent } from './pages/client/quiz-list/quiz-list.component';
import { QuizFormComponent } from './pages/client/quiz-form/quiz-form.component';
import { QuizConfirmComponent } from './pages/client/quiz-confirm/quiz-confirm.component';
import { QuizStatsComponent } from './pages/client/quiz-stats/quiz-stats.component';

import { AdminListComponent } from './pages/admin/admin-list/admin-list.component';
import { AdminEditComponent } from './pages/admin/admin-edit/admin-edit.component';
import { AdminDetailComponent } from './pages/admin/admin-detail/admin-detail.component';
import { AdminFeedbackComponent } from './pages/admin/admin-feedback/admin-feedback.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    ChartViewComponent,
    QuizListComponent,
    QuizFormComponent,
    QuizConfirmComponent,
    QuizStatsComponent,
    AdminListComponent,
    AdminEditComponent,
    AdminDetailComponent,
    AdminFeedbackComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
