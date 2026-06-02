import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  getInitials(): string {
    if (this.currentUser?.firstName && this.currentUser?.lastName) {
      return (this.currentUser.firstName[0] + this.currentUser.lastName[0]).toUpperCase();
    }
    return this.currentUser?.username?.substring(0, 2).toUpperCase() || 'U';
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString();
  }

  getMemberSince(): string {
    // This should come from API, using placeholder
    return 'January 2024';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  updateProfile(): void {
    // Implement profile update
    alert('Profile update feature coming soon!');
  }

  changePassword(): void {
    // Implement password change
    alert('Change password feature coming soon!');
  }

  viewActivity(): void {
    // Implement activity view
    alert('View activity feature coming soon!');
  }

  securitySettings(): void {
    // Implement security settings
    alert('Security settings feature coming soon!');
  }
}