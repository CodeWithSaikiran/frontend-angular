import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { LoginRequest, SignupRequest, AuthResponse, User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.getUserFromStorage()
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginRequest)
      .pipe(
        tap(response => {
          if (response && response.token) {
            const user: User = {
              username: response.username,
              email: response.email,
              token: response.token
            };
            localStorage.setItem(environment.tokenKey, JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        })
      );
  }

  signup(signupRequest: SignupRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/signup`, signupRequest);
  }

  logout(): void {
    localStorage.removeItem(environment.tokenKey);
    this.currentUserSubject.next(null);
  }

  validateToken(): Observable<boolean> {
    const currentUser = this.currentUserValue;
    if (!currentUser || !currentUser.token) {
      return new Observable(observer => observer.next(false));
    }
    
    return this.http.get(`${this.apiUrl}/auth/validate`, {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    }).pipe(
      map((response: any) => response.valid)
    );
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem(environment.tokenKey);
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }
}