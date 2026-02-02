// auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const TOKEN_KEY = 'access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isLoggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this._isLoggedIn$.asObservable();

  constructor() {
    window.addEventListener('storage', (e) => {
      if (e.key === TOKEN_KEY) {
        this._isLoggedIn$.next(this.hasToken());
      }
    });
  }

  private hasToken(): boolean {
    try {
      const t = sessionStorage.getItem(TOKEN_KEY);
      return !!t && t !== 'null' && t !== 'undefined';
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  // call this after successful login
  login(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token);
    this._isLoggedIn$.next(true);
  }

  logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    this._isLoggedIn$.next(false);
  }

  // optional: validate token expiry by decoding JWT or calling backend
  //   tokenExpired(): boolean {
  //     const token = this.getToken();
  //     if (!token) return true;
  //     try {
  //       const [, payloadB64] = token.split('.');
  //       const payload = JSON.parse(atob(payloadB64));
  //       const exp = payload?.exp;
  //       if (!exp) return false;
  //       return Date.now() > exp * 1000;
  //     } catch {
  //       return false;
  //     }
  //   }
}
