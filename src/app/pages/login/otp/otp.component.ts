import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { EFlowState } from '../login.component';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '@core/services/tenant/user.service';
import { AuthService } from '../../../auth.service';
import { Store } from '@ngrx/store';
import { AppState } from '@store';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { HeaderComponent } from '@shared/components/header/header.component';
import { FooterComponent } from '@shared/components/footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-verify',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterLink],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.scss',
})
export class OtpComponent implements AfterViewInit {
  public PING_ID_BASE_URL = `https://auth-stage.securiancanada.ca`;
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private store = inject(Store<AppState>);
  public errorMessage = '';
  public otpVerificationError = false;
  public resendLinkText = 'Resend code? Click here.';
  private isSubmitting = false;

  @ViewChild('digit1') digit1!: ElementRef<HTMLInputElement>;
  @ViewChild('digit2') digit2!: ElementRef<HTMLInputElement>;
  @ViewChild('digit3') digit3!: ElementRef<HTMLInputElement>;
  @ViewChild('digit4') digit4!: ElementRef<HTMLInputElement>;
  @ViewChild('digit5') digit5!: ElementRef<HTMLInputElement>;
  @ViewChild('digit6') digit6!: ElementRef<HTMLInputElement>;

  private inputs: ElementRef<HTMLInputElement>[] = [];

  constructor(private router: Router) { }


  ngAfterViewInit() {
    this.inputs = [
      this.digit1,
      this.digit2,
      this.digit3,
      this.digit4,
      this.digit5,
      this.digit6
    ];


    setTimeout(() => {
      if (this.digit1) {
        this.digit1.nativeElement.focus();
      }
    });
  }

  handleChange(e: any) {
    console.log(e.target.value);
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && !/^\d$/.test(value)) {
      input.value = '';
      return;
    }

    if (value && index < this.inputs.length - 1) {
      this.inputs[index + 1].nativeElement.focus();
    }
    this.checkComplete();
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && index > 0) {
      this.inputs[index - 1].nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    digits.split('').forEach((digit, i) => {
      if (this.inputs[i]) {
        this.inputs[i].nativeElement.value = digit;
      }
    });

    const nextIndex = Math.min(digits.length, this.inputs.length - 1);
    if (this.inputs[nextIndex]) {
      this.inputs[nextIndex].nativeElement.focus();
    }

    this.checkComplete();
  }

  onLastDigitBlur(): void {
    // Removed automatic submission on blur to prevent duplicate calls
    // Submission is already handled by checkComplete() when all 6 digits are entered
  }

  onResendClick(event: Event): void {
    event.preventDefault();
    console.log('Resend OTP requested');


    const originalText = this.resendLinkText;
    this.resendLinkText = 'Code resent!';
    setTimeout(() => {
      this.resendLinkText = originalText;
    }, 2000);
  }

  private checkComplete(): void {
    const otp = this.getOTPValue();
    if (otp.length === 6 && !this.isSubmitting) {
      console.log('OTP Complete:', otp);
      this.triggerSubmitOTP();
    }
  }

  private getOTPValue(): string {
    return this.inputs.map(input => input?.nativeElement.value || '').join('');
  }

  private triggerSubmitOTP(): void {
    if (this.isSubmitting) {
      console.log('Already submitting, skipping duplicate call');
      return;
    }

    let hiddenInput = document.getElementById('otp-box') as HTMLInputElement;
    if (!hiddenInput) {
      hiddenInput = document.createElement('input');
      hiddenInput.id = 'otp-box';
      hiddenInput.type = 'hidden';
      document.body.appendChild(hiddenInput);
    }
    hiddenInput.value = this.getOTPValue();


    this.submitOTP();
  }
  async submitOTP() {
    if (this.isSubmitting) {
      console.log('Submit already in progress, ignoring duplicate call');
      return;
    }

    try {
      this.isSubmitting = true;
      this.otpVerificationError = false;
      this.store.dispatch(setLoadingSpinner({ status: true }));
      //@ts-ignore
      const otp = document.getElementById('otp-box').value!;
      const url = new URL(window.location.href);
      const flowId = url.searchParams.get('flowId');

      console.log("{ flowId at submit OTP}", { flowId });

      if (!flowId) {
        this.otpVerificationError = true;
        this.errorMessage = 'Invalid session. Please return to login page.';
        return;
      }

      const flowUrl = `${this.PING_ID_BASE_URL}/flows/${flowId}`;

      // Submit the OTP directly
      const response = await fetch(flowUrl, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/vnd.pingidentity.otp.check+json',
        },
        method: 'POST',
        body: JSON.stringify({ otp }),
      });

      const parsedResponse = await response.json();

      console.log('{ OTP Verification Response }', parsedResponse);
      console.log('{ OTP Verification Response status }', parsedResponse.status);
      console.log('{ EFlowState.COMPLETED }', EFlowState.COMPLETED);
      console.log('{ Status Match }', parsedResponse.status === EFlowState.COMPLETED);

      // Check for errors in the response
      if (parsedResponse.code) {
        this.otpVerificationError = true;
        this.errorMessage = parsedResponse.message || parsedResponse.details?.[0]?.message || 'Verification unsuccessful. Please try again.';
        this.store.dispatch(setLoadingSpinner({ status: false }));
        return parsedResponse.code;
      }

      // If status is COMPLETED, proceed with getting the token
      //if (parsedResponse.status === EFlowState.COMPLETED && parsedResponse._embedded?.user) {
      console.log('{ Entering COMPLETED block }');
      const { username, id } = parsedResponse._embedded.user;
      console.log('{ User Info }', { username, id });

      this.userService.getUserToken({ email: username, pingUserId: id }).subscribe({
        next: (data) => {
          console.log('{ getUserToken Response }', data);
          if (!!data?.data?.token) {
            sessionStorage.setItem('token', data?.data?.token);

            // Store user info for other components to access
            const userInfo = {
              email: username,
              pingUserId: id,
              firstName: parsedResponse._embedded.user.name?.given || '',
              lastName: parsedResponse._embedded.user.name?.family || '',
              given_name: parsedResponse._embedded.user.name?.given || '',
              role: data?.data?.role || 'User'
            };
            sessionStorage.setItem('userInfo', JSON.stringify(userInfo));

            this.authService.login(data?.data?.token);
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.router.navigate(['/new-policy']);
            return;
          } else {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.otpVerificationError = true;
            this.errorMessage = 'Failed to retrieve authentication token. Please try again.';
            this.isSubmitting = false;
          }
        },
        error: (error: any) => {
          console.error('{ getUserToken Error }', error);
          this.store.dispatch(setLoadingSpinner({ status: false }));
          this.otpVerificationError = true;
          this.errorMessage = 'Failed to authenticate. Please try again.';
          this.isSubmitting = false;
        }
      });

    } catch (error: any) {
      this.otpVerificationError = true;
      this.errorMessage = error.message || 'An error occurred. Please try again.';
    } finally {
      // Only dispatch if we haven't already in the success path
      if (this.otpVerificationError) {
        this.store.dispatch(setLoadingSpinner({ status: false }));
        this.isSubmitting = false;
      }
    }
  }
}
