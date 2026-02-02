import { Component, HostListener, inject, OnDestroy, OnInit, viewChild } from '@angular/core';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { debounceTime, Subscription, take } from 'rxjs';
import { ApplicationPadService } from '@core/services/insurance/application-pad.service';
import { ApplicantService } from '@core/services/insurance/applicant.service';
import { ApplicationService } from '@core/services/insurance/application.service';
import { MultiApplicantService } from '@core/services/insurance/multi-applicant.service';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { SystemService } from '@core/services/system/system.service';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { QuoteService } from '@core/services/insurance/quote.service';
import { LoanService } from '@core/services/insurance/loan.service';
import { HealthQuestionService } from '@core/services/insurance/health-question.service';
import {
  initializeInsuranceApplication,
  loadExistingLoanApplication,
} from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import {
  insuranceApplicationLoanSelector,
  loadingInformationSelector,
} from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { AppState } from '@store';
import { APPLICATION_STATUS, QQ_LOAN_IDENTIFIER, STEP_LIST } from '@core/utils/enums/insurance-enums';
import { StepperMessageService } from '@core/services/insurance/stepper-message.service';
import { CommunicationService } from '@core/services/insurance/communication.service';
import { AdditionalInfoComponent } from './additional-info/additional-info.component';
import { ApplicantQuestionComponent } from './applicant-question/applicant-question.component';
import { StepperMessageComponent } from '../../../core/components/stepper-message/stepper-message.component';
import { PricingCoverageComponent } from './pricing-coverage/pricing-coverage.component';
import { ApplicantInfoComponent } from './applicant-info/applicant-info.component';
import { LoanInfoComponent } from './loan-info/loan-info.component';
import { NgxMaskModule } from 'ngx-mask';
import { SummaryComponent } from './summary/summary.component';
import { MessageType } from '@core/models/insurance/stepper-message.model';

@Component({
  selector: 'app-insurance-application',
  templateUrl: './insurance-application.component.html',
  styleUrls: ['./insurance-application.component.scss'],
  standalone: true,
  imports: [
    MatStepperModule,
    LoanInfoComponent,
    ApplicantInfoComponent,
    PricingCoverageComponent,
    StepperMessageComponent,
    ApplicantQuestionComponent,
    AdditionalInfoComponent,
    SummaryComponent,
    NgxMaskModule,
  ],
})
export class InsuranceApplicationComponent implements OnInit, OnDestroy {
  applicationStepper = viewChild.required<MatStepper>('stepper');

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any) {
    if (this.stepService.currentStateValue.currentStep !== 8 && this.systemService.sourceApplicationValue === '2') {
      this.getResponseApplication();
      window.focus();
      event.preventDefault();
    }
  }

  private applicationService = inject(ApplicationService);
  private applicantService = inject(ApplicantService);
  private activatedRoute = inject(ActivatedRoute);
  private multiApplicantService = inject(MultiApplicantService);
  private store = inject(Store<AppState>);
  private systemService = inject(SystemService);
  private stepService = inject(SharedStepService);
  private quoteService = inject(QuoteService);
  private loanService = inject(LoanService);
  private applicationPadService = inject(ApplicationPadService);
  private healthQuestionService = inject(HealthQuestionService);
  private stepperMessage = inject(StepperMessageService);
  private router = inject(Router);
  private communication = inject(CommunicationService);

  public currentStep: number = 0;
  public loanIdentifier: string = '';
  public stepList = STEP_LIST;
  public loanSelectorSubscription$ = new Subscription();
  public loadingSelectorSubscription$ = new Subscription();
  private timesLoanSelectorTaken: number = 0;

  constructor() {}

  ngOnDestroy(): void {
    this.loanIdentifier = '';
    this.stepService.destroySession();
    this.applicationService.destroySession();
    this.applicantService.destroySession();
    this.multiApplicantService.applicationStatus = 1;
    this.quoteService.destroySession();
    this.loanService.destroySession();
    this.applicationPadService.destroySession();
    this.healthQuestionService.destroySession();
    this.store.dispatch(initializeInsuranceApplication());
    this.stepperMessage.messageContent = {
      message: '',
      type: MessageType.WARNING,
      showIt: false,
    };
    this.loanSelectorSubscription$.unsubscribe();
    this.loadingSelectorSubscription$.unsubscribe();
  }

  ngOnInit(): void {
    this.activatedRoute.params.pipe(debounceTime(300)).subscribe((params) => {
      if (params['application']) {
        this.loanIdentifier = params['application'];
        this.getApplicationStepFromSession();
      }

      if (params['sourceApplication'] !== undefined) {
        this.systemService.sourceApplicationType = params['sourceApplication'];
      }

      if (this.loanIdentifier) {
        if (this.loanIdentifier === QQ_LOAN_IDENTIFIER) {
          setTimeout(() => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
          }, 800);
        } else {
          this.store.dispatch(setLoadingSpinner({ status: true }));
          this.store.dispatch(loadExistingLoanApplication({ loanIdentifier: this.loanIdentifier }));
        }
      }
    });
  }

  private deleteQueryParams() {
    this.router.navigate(['/new-policy/insurance-application'], {
      relativeTo: this.activatedRoute,
      queryParams: {},
      queryParamsHandling: 'merge',
    });
  }

  private getApplicationStepFromSession = () => {
    this.loadingSelectorSubscription$ = this.store
      .select(loadingInformationSelector)
      .pipe(take(2))
      .subscribe((loading) => {
        if (!loading) {
          this.loanSelectorSubscription$ = this.store
            .select(insuranceApplicationLoanSelector)
            .pipe(take(2))
            .subscribe((loan) => {
              this.timesLoanSelectorTaken = this.timesLoanSelectorTaken + 1;
              let initialStep = 0;
              if (loan && loan.applications && loan.applications) {
                loan.applications.every((application) => {
                  if (
                    application.applicationStatus === APPLICATION_STATUS.PENDING ||
                    application.applicationStatus === APPLICATION_STATUS.SUBMITTED
                  ) {
                    initialStep = 5;
                    return false;
                  }
                  return true;
                });
              }

              if (loan.loanIdentifier === '' && this.timesLoanSelectorTaken === 2) {
                this.deleteQueryParams();
              }

              if (this.applicationStepper !== undefined && this.applicationStepper().selectedIndex !== undefined) {
                this.applicationStepper().selectedIndex = initialStep;
              }
            });
        }
      });
  };

  private getResponseApplication() {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.loanService
      .getLoanResponse(this.loanIdentifier)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const closeMsg = {
            command: 'readyToClose',
            content: response,
          };
          this.store.dispatch(setLoadingSpinner({ status: false }));
          this.communication.eventContent.event.source.postMessage(
            JSON.stringify(closeMsg),
            this.communication.eventContent.targetOrigin
          );
        },
        error: (error) => {
          console.error('An error Ocurred Trying to Get Application Response: ', error);
          let errorResponse = {
            message: 'An error ocurred trying to get application response',
            status: 500,
          };
          this.communication.eventContent.event.source.postMessage(
            JSON.stringify(errorResponse),
            this.communication.eventContent.targetOrigin
          );
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
      });
  }
}
