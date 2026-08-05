import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isApiRequest = req.url.startsWith('/api/');
    const request = isApiRequest && this.auth.token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${this.auth.token}` } })
      : req;
    return next.handle(request).pipe(catchError(error => {
      const isAuthEntryRequest = req.url === '/api/auth/login' || req.url === '/api/auth/register';
      if (error.status === 401 && !isAuthEntryRequest) {
        const returnUrl = this.router.url;
        this.auth.clearSession();
        if (!this.router.url.startsWith('/login')) {
          this.router.navigate(['/login'], { queryParams: { returnUrl } });
        }
      }
      return throwError(() => error);
    }));
  }
}
