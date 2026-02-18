import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './core/auth/administrator.guard';
import { ContainerComponent } from '@pages/container/container.component';
import { CancelPolicyComponent } from '@pages/existing-policy/cancel-policy/cancel-policy.component';
import { ExistingPolicyComponent } from '@pages/existing-policy/existing-policy.component';
import { SubmitClaimComponent } from '@pages/existing-policy/submit-claim/submit-claim.component';
import { UpdateInfoComponent } from '@pages/existing-policy/update-info/update-info.component';
import { EnhancedGapAnalysisComponent } from '@pages/new-policy/gap-analysis/enhanced-gap-analysis/enhanced-gap-analysis.component';
import { GapAnalysisComponent } from '@pages/new-policy/gap-analysis/gap-analysis.component';
import { GenericGapAnalysisComponent } from '@pages/new-policy/gap-analysis/generic-gap-analysis/generic-gap-analysis.component';
import { InsuranceApplicationComponent } from '@pages/new-policy/insurance-application/insurance-application.component';
import { NewPolicyComponent } from '@pages/new-policy/new-policy.component';
import { QuickQuoteComponent } from '@pages/new-policy/quick-quote/quick-quote.component';
import { ReportsComponent } from '@pages/reports/reports.component';
import { ReleaseNotesComponent } from '@pages/release-notes/release-notes.component';
import { SettingComponent } from '@pages/persona/setting/setting.component';
import { ProfileComponent } from '@pages/persona/profile/profile.component';
import { ErrorReportingComponent } from '@pages/error-reporting/error-reporting.component';
import { LoginComponent } from '@pages/login/login.component';
import { OtpComponent } from '@pages/login/otp/otp.component';
import { ForgotPasswordComponent } from '@pages/login/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from '@pages/login/reset-password/reset-password.component';

export const securianRoutes: Routes = [
  {
    path: '',
    component: NewPolicyComponent,
    canActivate: [AuthGuard],
    data: { title: 'New Policy' },
  },
  {
    path: 'new-policy',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: NewPolicyComponent,
        data: { title: 'New Policy' },
      },
      {
        path: 'gap-analysis',
        component: GapAnalysisComponent,
        data: { title: 'New Policy - Gap Analysis' },
      },
      {
        path: 'gap-analysis/generic-gap-analysis',
        component: GenericGapAnalysisComponent,
        data: { title: 'New Policy - Gap Analysis - Generic Gap Analysis' },
      },
      {
        path: 'gap-analysis/enhanced-gap-analysis',
        component: EnhancedGapAnalysisComponent,
        data: { title: 'New Policy - Gap Analysis - Enhanced Gap Analysis' },
      },
      {
        path: 'quick-quote',
        component: QuickQuoteComponent,
        data: { title: 'New Policy - Quick Quote' },
      },
      {
        path: 'insurance-application',
        children: [
          {
            path: ':application',
            component: InsuranceApplicationComponent,
            data: { title: 'New Policy - Insurance Application' },
          },
          {
            path: ':application/:sourceApplication',
            component: InsuranceApplicationComponent,
            data: { title: 'No Title - Nothing' },
          },
          {
            path: '',
            component: InsuranceApplicationComponent,
            data: { title: 'New Policy - Insurance Application' },
          },
        ],
      },
    ],
  },
  {
    path: 'existing-policy',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: ExistingPolicyComponent,
        data: { title: 'Existing Policy' },
      },
      {
        path: 'update-info',
        children: [
          {
            path: ':id',
            component: UpdateInfoComponent,
            data: { title: 'Existing Policy - View Member Information Update' },
          },
          {
            path: '',
            component: UpdateInfoComponent,
            data: { title: 'Existing Policy - Update Account' },
          },
        ],
      },
      {
        path: 'submit-claim',
        children: [
          {
            path: ':id',
            component: SubmitClaimComponent,
            data: { title: 'Existing Policy - View Submitted Claim' },
          },
          {
            path: '',
            component: SubmitClaimComponent,
            data: { title: 'Existing Policy - Submit Claim' },
          },
        ],
      },
      {
        path: 'cancel-policy',
        children: [
          {
            path: ':id',
            component: CancelPolicyComponent,
            data: { title: 'Existing Policy - View Policy Cancellation' },
          },
          {
            path: '',
            component: CancelPolicyComponent,
            data: { title: 'Existing Policy - Cancel Policy' },
          },
        ],
      },
    ],
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [AdminGuard],
    data: { title: 'Reports' },
  },
  {
    path: 'error-reporting',
    component: ErrorReportingComponent,
    canActivate: [AdminGuard],
    data: { title: 'Reports' },
  },
  {
    path: 'release-notes',
    component: ReleaseNotesComponent,
    canActivate: [AuthGuard],
    data: { title: 'Release Notes' },
  },
  {
    path: 'settings',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: SettingComponent,
        data: { title: 'Settings - User Setup' },
      },
    ],
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    component: ProfileComponent,
    data: { title: 'Profile' },
  },
  {
    path: 'container',
    pathMatch: 'full',
    canActivate: [AuthGuard],
    component: ContainerComponent,
    data: { title: 'Container' },
  },
  {
    path: 'login',
    pathMatch: 'full',
    canActivate: [],
    component: LoginComponent,
    data: { title: '' },
  },

  {
    path: 'login/otp',
    pathMatch: 'full',
    canActivate: [],
    component: OtpComponent,
    data: { title: '' },
  },
  {
    path: 'forgot-password',
    pathMatch: 'full',
    canActivate: [],
    component: ForgotPasswordComponent,
    data: { title: 'Forgot Password' },
  },
  {
    path: 'reset-password',
    pathMatch: 'full',
    canActivate: [],
    component: ResetPasswordComponent,
    data: { title: 'Reset Password' },
  },
];
