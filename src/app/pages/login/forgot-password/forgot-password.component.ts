import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '@shared/components/header/header.component';
import { FooterComponent } from '@shared/components/footer/footer.component';

enum EForgotPasswordStatus {
  RECOVERY_CODE_REQUIRED = 'RECOVERY_CODE_REQUIRED',
  USERNAME_PASSWORD_REQUIRED = 'USERNAME_PASSWORD_REQUIRED',
  PASSWORD_REQUIRED = 'PASSWORD_REQUIRED',
  INVALID_VALUE = 'INVALID_VALUE',
  INVALID_DATA = 'INVALID_DATA',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  public readonly PING_ID_BASE_URL = `https://auth-stage.securiancanada.ca`;

  forgotPasswordForm: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errors: { email?: string; general?: string } = {};

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
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

  private async postForgotPassword(email: string, flowId: string): Promise<any> {
    const forgotPasswordUrl = `${this.PING_ID_BASE_URL}/flows/${flowId}`;

    const response = await fetch(forgotPasswordUrl, {
      headers: {
        'Content-Type': 'application/vnd.pingidentity.password.forgot+json',
      },
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ username: email }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async handleSubmit(): Promise<void> {
    this.errors = {};
    this.successMessage = '';

    if (this.forgotPasswordForm.invalid) {
      this.validateForm();
      return;
    }

    this.isSubmitting = true;
    const email = this.forgotPasswordForm.get('email')?.value;

    try {
      const flowId = await this.retrievePingFlow();

      if (!flowId) {
        this.errors.general = 'Failed to initialize password reset. Please try again.';
        return;
      }

      const response = await this.postForgotPassword(email, flowId);

      if (response.status === EForgotPasswordStatus.INVALID_VALUE ||
        response.status === EForgotPasswordStatus.INVALID_DATA) {
        this.errors.general = 'The email address you entered is not registered in our system.';
      } else if (response.status === EForgotPasswordStatus.RECOVERY_CODE_REQUIRED) {
        // Navigate to reset password page with flowId
        this.router.navigate(['/reset-password'], { queryParams: { flowId, email } });
      } else {
        this.errors.general = 'An error occurred. Please try again later.';
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      this.errors.general = 'Unable to process password reset request. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  handleCancel(): void {
    this.router.navigate(['/login']);
  }

  clearError(field: string): void {
    if (field === 'email') {
      this.errors.email = undefined;
    }
    this.errors.general = undefined;
  }

  private validateForm(): void {
    const emailControl = this.forgotPasswordForm.get('email');

    if (emailControl?.hasError('required')) {
      this.errors.email = 'Email is required';
    } else if (emailControl?.hasError('email')) {
      this.errors.email = 'Please enter a valid email address';
    }
  }
}
