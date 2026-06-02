import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  remainingAttempts: number | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    if (this.authService.currentUserValue) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.remainingAttempts = null;

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.login({
      username: this.f['username'].value,
      password: this.f['password'].value
    }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.handleLoginError(error);
        this.loading = false;
      }
    });
  }

  private handleLoginError(error: any): void {
    const errorResponse = error.error;

    if (!errorResponse) {
      this.error = 'An unexpected error occurred. Please try again.';
      return;
    }

    const errorCode = errorResponse.code;

    switch (errorCode) {
      case 'ACCOUNT_LOCKED':
        this.error = `Account is locked. Try again in ${errorResponse.remainingMinutes} minute(s).`;
        break;
      case 'ACCOUNT_DISABLED':
        this.error = 'Your account has been disabled. Please contact support.';
        break;
      case 'INVALID_CREDENTIALS':
        this.remainingAttempts = errorResponse.attemptsRemaining;
        if (this.remainingAttempts > 0) {
          this.error = `Invalid username or password. ${this.remainingAttempts} attempt(s) remaining.`;
        } else {
          this.error = 'Invalid credentials. Account has been locked.';
        }
        break;
      default:
        this.error = errorResponse.error || 'Login failed. Please check your credentials.';
    }
  }
}