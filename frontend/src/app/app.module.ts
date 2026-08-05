import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
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
import { LoginComponent } from './pages/auth/login.component';
import { RegisterComponent } from './pages/auth/register.component';
import { AuthInterceptor } from './core/auth.interceptor';
import { ProfileComponent } from './pages/member/profile.component';
import { HomeComponent } from './pages/home/home.component';

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
    AdminFeedbackComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
