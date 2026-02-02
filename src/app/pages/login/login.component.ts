import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { AppState } from '@store';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { HeaderComponent } from '@shared/components/header/header.component';
import { FooterComponent } from '@shared/components/footer/footer.component';

export enum EFlowState {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  PASSWORD_LOCKED_OUT = 'PASSWORD_LOCKED_OUT',
  FAILED = 'FAILED',
  USERNAME_PASSWORD_REQUIRED = 'USERNAME_PASSWORD_REQUIRED',
  VERIFICATION_CODE_REQUIRED = 'VERIFICATION_CODE_REQUIRED',
  OTP_REQUIRED = 'OTP_REQUIRED',
  COMPLETED = 'COMPLETED',
  INVALID_VALUE = 'INVALID_VALUE',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  PASSWORD_EXPIRED = 'PASSWORD_EXPIRED',
  REGISTRATION = 'REGISTRATION',
  INCOMPLETE_REGISTRATION = 'INCOMPLETE_REGISTRATION',
}

interface LoginError {
  email: string;
  password: string;
  general: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnDestroy {
  public readonly PING_ID_BASE_URL = `https://auth-stage.securiancanada.ca`;
  public readonly currentYear = new Date().getFullYear();
  
  public loginForm: FormGroup;
  public isLoggingIn = false;
  public showPassword = false;
  public errors: LoginError = {
    email: '',
    password: '',
    general: '',
  };


  private readonly destroy$ = new Subject<void>();
  private readonly store = inject(Store<AppState>);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.checkExistingSession();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkExistingSession(): void {
    const token = sessionStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      this.router.navigate(['/']);
    }
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public clearError(field: keyof LoginError): void {
    this.errors[field] = '';
    this.errors.general = '';
  }

  private generateRandomString(length = 43): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, length);
  }

  private async retrievePingFlow(): Promise<string> {
    try {
      const nonce = this.generateRandomString(12);
      const codeChallenge = this.generateRandomString(43);
      const authUrl = `${this.PING_ID_BASE_URL}/as/authorize`;
      
      const bodyPayload = {
        response_type: 'code',
        client_id: '86699ee4-d30a-488c-afd4-ab1a165353f5',
        scope: 'openid',
        code_challenge: codeChallenge,
        nonce,
        response_mode: 'pi.flow',
        code_challenge_method: 'S256',
      };

      const response = await fetch(authUrl, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: new URLSearchParams(bodyPayload),
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data?.id || '';
    } catch (error: any) {
      console.error('Error retrieving Ping flow:', error);
      throw new Error(error?.message || 'Failed to initialize authentication flow');
    }
  }

  private async loginUser(email: string, password: string, flowId: string): Promise<any> {
    const loginUrl = `${this.PING_ID_BASE_URL}/flows/${flowId}`;

    const response = await fetch(loginUrl, {
      headers: {
        'Content-Type': 'application/vnd.pingidentity.usernamePassword.check+json',
      },
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  public async handleLogin(): Promise<void> {
    if (this.isLoggingIn || this.loginForm.invalid) {
      this.validateForm();
      return;
    }

    this.isLoggingIn = true;
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.errors = { email: '', password: '', general: '' };

    try {
      const { email, password } = this.loginForm.value;
      const flowId = await this.retrievePingFlow();
      
      if (!flowId) {
        this.errors.general = 'Failed to initialize authentication. Please try again.';
        return;
      }

      const loginFlow = await this.loginUser(email, password, flowId);

      switch (loginFlow.status) {
        case EFlowState.OTP_REQUIRED:
        case EFlowState.VERIFICATION_CODE_REQUIRED:
          console.log('Navigating to OTP component with flowId:', flowId);
          this.router.navigate(['/login/otp'], { queryParams: { flowId } });
          break;
        
        case EFlowState.INVALID_CREDENTIALS:
        case EFlowState.FAILED:
          this.errors.general = 'Invalid email or password. Please try again.';
          break;
        
        case EFlowState.PASSWORD_LOCKED_OUT:
          this.errors.general = 'Your account has been locked. Please contact support.';
          break;
        
        case EFlowState.PASSWORD_EXPIRED:
          this.errors.general = 'Your password has expired. Please reset your password.';
          break;
        
        case EFlowState.CONSTRAINT_VIOLATION:
          this.errors.general = 'An error occurred. Please try again later.';
          break;
        
        case EFlowState.COMPLETED:
          this.router.navigate(['/dashboard']);
          break;
        
        default:
          console.warn('Unhandled flow state:', loginFlow.status);
          this.errors.general = 'An unexpected error occurred. Please try again.';
      }
    } catch (error: any) {
      console.error('Login error:', error);
      this.errors.general = 'Unable to connect to authentication service. Please try again.';
    } finally {
      this.isLoggingIn = false;
      this.store.dispatch(setLoadingSpinner({ status: false }));
    }
  }

  private validateForm(): void {
    const emailControl = this.loginForm.get('email');
    const passwordControl = this.loginForm.get('password');

    if (emailControl?.invalid) {
      if (emailControl.errors?.['required']) {
        this.errors.email = 'Email is required';
      } else if (emailControl.errors?.['email']) {
        this.errors.email = 'Please enter a valid email address';
      }
    }

    if (passwordControl?.invalid) {
      if (passwordControl.errors?.['required']) {
        this.errors.password = 'Password is required';
      } else if (passwordControl.errors?.['minlength']) {
        this.errors.password = 'Password must be at least 8 characters';
      }
    }
  }

  public get emailControl() {
    return this.loginForm.get('email');
  }

  public get passwordControl() {
    return this.loginForm.get('password');
  }
}
