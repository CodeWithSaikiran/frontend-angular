import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService, AuthResponse } from './auth.service';

@Injectable()
export class HttpConfigInterceptor implements HttpInterceptor {
    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(
        null
    );

    constructor(private authService: AuthService) { }

    intercept(
        request: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        // Add token to request if it exists
        const token = this.authService.getToken();
        if (token && !this.isTokenExpired(token)) {
            request = this.addToken(request, token);
        }

        return next.handle(request).pipe(
            catchError((error) => {
                if (error instanceof HttpErrorResponse && error.status === 401) {
                    return this.handle401Error(request, next);
                }
                return throwError(() => error);
            })
        );
    }

    private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
        return request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    private handle401Error(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            const refreshToken = this.authService.getRefreshToken();

            if (refreshToken) {
                return this.authService.refreshToken(refreshToken).pipe(
                    switchMap((response: AuthResponse) => {
                        this.isRefreshing = false;
                        this.refreshTokenSubject.next(response.token);
                        return next.handle(this.addToken(request, response.token));
                    }),
                    catchError((err) => {
                        this.isRefreshing = false;
                        this.authService.logout();
                        return throwError(() => err);
                    })
                );
            } else {
                this.isRefreshing = false;
                this.authService.logout();
                return throwError(() => new Error('No refresh token available'));
            }
        } else {
            return this.refreshTokenSubject.pipe(
                filter((token): token is string => token != null),
                take(1),
                switchMap((token: string) => {
                    return next.handle(this.addToken(request, token));
                })
            );
        }
    }

    private isTokenExpired(token: string): boolean {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            const payload = JSON.parse(jsonPayload);
            return payload.exp * 1000 < Date.now();
        } catch (e) {
            return true;
        }
    }
}
