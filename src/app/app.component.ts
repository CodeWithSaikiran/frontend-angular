import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'auth-frontend';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    // Validate token on app initialization
    this.authService.validateToken().subscribe(
      isValid => {
        if (!isValid) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
      error => {
        console.error('Error validating token:', error);
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    );
  }
}
