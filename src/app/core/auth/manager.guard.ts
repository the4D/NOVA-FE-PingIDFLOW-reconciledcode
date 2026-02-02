import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ManagerGuard implements CanActivate {
  constructor(private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // Get user role from sessionStorage
    const userInfo = sessionStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        if (parsed.role === 'Administrator' || parsed.role === 'Manager') {
          return of(true);
        }
      } catch {
        // Invalid user info
      }
    }
    this.router.navigate(['/login']);
    return of(false);
  }
}
