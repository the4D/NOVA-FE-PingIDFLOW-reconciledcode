import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { Store } from '@ngrx/store';
import { concatMap, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  private readonly roleClaim: string = 'extension_NovaRole';

  constructor(private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // let role: string = this.msalService.instance.getActiveAccount()?.idTokenClaims![this.roleClaim] as string;
    const token = sessionStorage.getItem('token') || null;
    console.log({ tokenInAuthGuard: token });
    if (token) {
      return of(true);
    } else {
      this.router.navigate(['/login']);
      return of(false);
    }
  }
}
