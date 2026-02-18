import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '@shared/components/header/header.component';
import { FooterComponent } from '@shared/components/footer/footer.component';

enum EResetPasswordStatus {
    COMPLETED = 'COMPLETED',
    RECOVERY_CODE_REQUIRED = 'RECOVERY_CODE_REQUIRED',
    OTP_REQUIRED = 'OTP_REQUIRED',
    INVALID_VALUE = 'INVALID_VALUE',
    INVALID_DATA = 'INVALID_DATA',
    CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
}

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent, FooterComponent],
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
    public readonly PING_ID_BASE_URL = `https://auth-stage.securiancanada.ca`;

    resetPasswordForm: FormGroup;
    isSubmitting = false;
    showPassword = false;
    showConfirmPassword = false;
    showSuccessModal = false;
    flowId: string = '';
    email: string = '';
    errors: {
        verificationCode?: string;
        password?: string;
        confirmPassword?: string;
        general?: string;
    } = {};

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.resetPasswordForm = this.fb.group({
            verificationCode: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }


    private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;

        if (password && confirmPassword && password !== confirmPassword) {
            return { passwordMismatch: true };
        }
        return null;
    }

    ngOnInit(): void {
        
        this.route.queryParams.subscribe(params => {
            this.flowId = params['flowId'] || '';
            this.email = params['email'] || '';

            

            if (!this.flowId) {
                console.warn('No flowId found, redirecting to forgot-password');
                this.router.navigate(['/forgot-password']);
            }
        });
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPasswordVisibility(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    clearError(field: string): void {
        
        if (field === 'verificationCode') {
            this.errors.verificationCode = undefined;
        } else if (field === 'password') {
            this.errors.password = undefined;
        } else if (field === 'confirmPassword') {
            this.errors.confirmPassword = undefined;
        }
        this.errors.general = undefined;
    }

    handleResendCode(): void {

        this.router.navigate(['/forgot-password']);
    }

    private async postNewPassword(recoveryCode: string, newPassword: string, flowId: string): Promise<any> {
        const resetPasswordUrl = `${this.PING_ID_BASE_URL}/flows/${flowId}`;

        

        try {
            const requestBody = JSON.stringify({ recoveryCode, newPassword });

            const response = await fetch(resetPasswordUrl, {
                headers: {
                    'Content-Type': 'application/vnd.pingidentity.password.recover+json',
                },
                credentials: 'include',
                method: 'POST',
                body: requestBody,
            });

            

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response not OK:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }

            const responseData = await response.json();
            
            return responseData;
        } catch (fetchError: any) {
            console.error('Error in postNewPassword:', fetchError);
            console.error('Error type:', fetchError.constructor.name);
            console.error('Error message:', fetchError.message);
            throw fetchError;
        }
    }

    async handleSubmit(): Promise<void> {
        

        this.errors = {};




        if (this.resetPasswordForm.invalid) {
            
            this.validateForm();
            return;
        }

        if (!this.flowId) {
            console.error('No flowId available');
            this.errors.general = 'Session expired. Please start the password reset process again.';
            return;
        }

        this.isSubmitting = true;
        const { verificationCode, password } = this.resetPasswordForm.value;

        try {
            const response = await this.postNewPassword(verificationCode, password, this.flowId);

            if (response.status === EResetPasswordStatus.INVALID_VALUE ||
                response.status === EResetPasswordStatus.CONSTRAINT_VIOLATION) {
                this.errors.verificationCode = 'Invalid verification code. Please check and try again.';
            } else {

                this.showSuccessModal = true;
            }
        } catch (error: any) {
            console.error('Reset password error:', error);
            console.error('Error details:', {
                message: error?.message,
                stack: error?.stack,
                name: error?.name
            });


            if (error?.message?.includes('404')) {
                this.errors.general = 'Your password reset session has expired. Please start the process again from the forgot password page.';
            } else {
                this.errors.general = 'Unable to reset password. Please try again.';
            }
        } finally {
            
            this.isSubmitting = false;
        }
    }

    handleCancel(): void {
        this.router.navigate(['/login']);
    }

    closeModal(): void {
        this.showSuccessModal = false;
    }

    async continueToVerification(): Promise<void> {

        this.router.navigate(['/login/otp'], {
            queryParams: {
                flowId: this.flowId,
                email: this.email
            }
        });
    }

    private validateForm(): void {
        const verificationCodeControl = this.resetPasswordForm.get('verificationCode');
        const passwordControl = this.resetPasswordForm.get('password');
        const confirmPasswordControl = this.resetPasswordForm.get('confirmPassword');

        if (verificationCodeControl?.hasError('required')) {
            this.errors.verificationCode = 'Verification code is required';
        }

        if (passwordControl?.hasError('required')) {
            this.errors.password = 'Password is required';
        } else if (passwordControl?.hasError('minlength')) {
            this.errors.password = 'Password must be at least 8 characters';
        }

        if (confirmPasswordControl?.hasError('required')) {
            this.errors.confirmPassword = 'Please confirm your password';
        } else if (this.resetPasswordForm.hasError('passwordMismatch')) {
            this.errors.confirmPassword = 'Passwords do not match';
        }
    }
}
