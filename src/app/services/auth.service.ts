import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  username: string;
  email: string;
  message: string;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  private currentUserSubject: BehaviorSubject<User | null>;
  private tokenRefreshTimeout: any;

  constructor(private http: HttpClient) {
    const storedUser = sessionStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.scheduleTokenRefresh();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginRequest)
      .pipe(
        tap(response => {
          if (response && response.token) {
            const user: User = {
              username: response.username,
              email: response.email,
              token: response.token
            };
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            sessionStorage.setItem('accessToken', response.token);
            sessionStorage.setItem('refreshToken', response.refreshToken);
            this.currentUserSubject.next(user);
            this.scheduleTokenRefresh();
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  signup(signupRequest: SignupRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, signupRequest);
  }

  logout(): void {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }
  }

  getToken(): string | null {
    return sessionStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem('refreshToken');
  }

  refreshToken(refreshToken: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          if (response && response.token) {
            sessionStorage.setItem('accessToken', response.token);
            sessionStorage.setItem('refreshToken', response.refreshToken);
            this.scheduleTokenRefresh();
          }
        }),
        catchError(error => {
          console.error('Token refresh error:', error);
          this.logout();
          return throwError(() => error);
        })
      );
  }

  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    if (this.isTokenExpired(token)) {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        return this.refreshToken(refreshToken).pipe(
          map(() => true),
          catchError(() => {
            this.logout();
            return of(false);
          })
        );
      }
      this.logout();
      return of(false);
    }

    // Validate with backend
    return this.http.get<any>(`${this.apiUrl}/validate`).pipe(
      map(response => response?.valid === true),
      catchError(() => of(false))
    );
  }

  private isTokenExpired(token: string): boolean {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      // Check if token expires within next 5 minutes
      return payload.exp * 1000 < Date.now() + 5 * 60 * 1000;
    } catch (e) {
      return true;
    }
  }

  private scheduleTokenRefresh(): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    const token = this.getToken();
    if (!token) {
      return;
    }

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      // Refresh token 5 minutes before expiration
      const expiresIn = payload.exp * 1000 - Date.now() - 5 * 60 * 1000;

      if (expiresIn > 0) {
        this.tokenRefreshTimeout = setTimeout(() => {
          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            this.refreshToken(refreshToken).subscribe(
              () => { /* Token refreshed */ },
              () => this.logout()
            );
          }
        }, expiresIn);
      }
    } catch (e) {
      console.error('Error scheduling token refresh:', e);
    }
  }
}

