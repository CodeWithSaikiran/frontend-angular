import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';

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
    this.signupForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      firstName: ['', [Validators.maxLength(50)]],
      lastName: ['', [Validators.maxLength(50)]]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    
    return null;
  }

  get f() { return this.signupForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';
    
    if (this.signupForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.authService.signup({
      username: this.f['username'].value,
      email: this.f['email'].value,
      password: this.f['password'].value,
      firstName: this.f['firstName'].value,
      lastName: this.f['lastName'].value
    }).subscribe({
      next: (response) => {
        this.success = response.message || 'Registration successful! Please login.';
        this.loading = false;
        
        // Reset form
        this.signupForm.reset();
        this.submitted = false;
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.error = error.error?.error || error.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}