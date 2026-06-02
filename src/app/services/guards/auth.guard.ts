import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      return of(this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }));
    }

    return this.authService.validateToken().pipe(
      map(isValid => {
        if (isValid) {
          return true;
        }
        this.authService.logout();
        return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      }),
      catchError(() => of(this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })))
    );
  }
}
