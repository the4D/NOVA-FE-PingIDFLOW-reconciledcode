import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChildren,
  QueryList,
  input,
  inject,
  viewChild,
  viewChildren,
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { Store } from '@ngrx/store';
import { ApplicantQuote } from '@core/models/insurance/applicant-quote.model';
import { distinctUntilChanged, Observable, shareReplay, Subject, Subscription, take } from 'rxjs';
import { MessageComponent } from '@core/components/message/message.component';
import { Loan, LoanRequest } from '@core/models/insurance/loan.model';
import {
  InsuranceTypeApplicantCoverageResponse,
  QuoteInsuranceTypeResponse,
} from '@core/models/insurance/quote-insurance-type.model';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { WaiverReasonService } from '@core/services/insurance/waiverReason.service';
import { WaiverReason } from '@core/models/insurance/waiverReason.model';
import { InsuranceType } from '@core/models/insurance/carrier-loan-type.model';
import { INSURANCE_TYPE, LOAN_TYPE, PAYMENT_TYPE, SEVERITY_ERROR, WORK_HOUR } from '@core/utils/enums/insurance-enums';
import { getApplicantTypeList, getCoverageTypeList } from '@core/utils/enums/system-enums';
import { EnumValue } from '@core/models/insurance/enum.model';
import { EnumService } from '@core/services/insurance/enum.service';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { AppState } from '@store';
import {
  insuranceApplicationApplicantFormGroupSelector,
  insuranceApplicationLoanSelector,
  loadingInformationSelector,
  quoteInsuranceTypeResponseSelector,
} from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { ProductService } from '@core/services/tenant/product.service';
import { Application, ApplicationRequest } from '@core/models/insurance/application.model';
import { Applicant } from '@core/models/insurance/applicant.model';
import { upsertLoanApplication } from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import { ApplicantFormGroup } from '@core/models/insurance/applicant-formGroup.model';
import { ApplicantAddress } from '@core/models/insurance/applicant-address.model';
import { ApplicantPhone } from '@core/models/insurance/applicant-phone.model';
import { ApplicantEmail } from '@core/models/insurance/applicant-email.model';
import { ApplicantConsent } from '@core/models/insurance/applicant-consent.model';
import { StepperMessageService } from '@core/services/insurance/stepper-message.service';
import { CoverageTakenComponent } from '@core/components/coverage-taken/coverage-taken.component';
import { CoverageTakenComponent as CoverageTakenComponent_1 } from '../../../../core/components/coverage-taken/coverage-taken.component';
import { StepperMessageComponent } from '../../../../core/components/stepper-message/stepper-message.component';
import { NgClass, AsyncPipe } from '@angular/common';
import { PolicyGroupingComponent } from '../../../../core/components/policy-grouping/policy-grouping.component';
import { MatDividerModule } from '@angular/material/divider';
import { PricingCoverageTopInfoComponent } from './pricing-coverage-top-info/pricing-coverage-top-info.component';
import { MessageType } from '@core/models/insurance/stepper-message.model';

@Component({
  selector: 'app-pricing-coverage',
  templateUrl: './pricing-coverage.component.html',
  styleUrls: ['./pricing-coverage.component.scss'],
  standalone: true,
  imports: [
    PricingCoverageTopInfoComponent,
    MatDividerModule,
    PolicyGroupingComponent,
    MatTabsModule,
    StepperMessageComponent,
    CoverageTakenComponent_1,
    NgClass,
    AsyncPipe,
  ],
})
export class PricingCoverageComponent implements OnInit, AfterViewInit {
  matTabGroup = viewChild<MatTabGroup>('tabPrices');
  coverageTakenComponent = viewChild<CoverageTakenComponent | undefined>('coverageTakenComponent');

  // @ViewChildren(CoverageTakenComponent) coveragesTakenForms!: QueryList<CoverageTakenComponent>;
  coveragesTakenForms = viewChildren<CoverageTakenComponent>('coveragesTakenForms');
  @ViewChildren(CoverageTakenComponent) coverageTakenForms!: QueryList<CoverageTakenComponent>;

  public stepper = input.required<MatStepper>();
  public stepList = input.required<any[]>();

  private store = inject(Store<AppState>);
  private dialog = inject(MatDialog);
  private enumService = inject(EnumService);
  private fb = inject(FormBuilder);
  private stepService = inject(SharedStepService);
  private productService = inject(ProductService);
  private cd = inject(ChangeDetectorRef);
  private stepperMessage = inject(StepperMessageService);
  private ref = inject(ChangeDetectorRef);

  private ngUnsubscribe$ = new Subject<void>();
  private subscriptionQuote$!: Subscription;
  private insuranceQuoteResponse$!: Subscription;
  public title!: string;
  public description!: string;
  public nextButtonLabel!: string;
  public isReadOnly: boolean = false;
  public loan!: Loan;
  public isInterestOnlyPaymentType: boolean = false;
  public quoteInsuranceTypeResponse!: QuoteInsuranceTypeResponse;
  public tabsNumber!: number;
  public applicantList: Array<ApplicantQuote> = new Array<ApplicantQuote>();
  public coverageTypeList: EnumValue[] = getCoverageTypeList();
  public quoteInsuranceTypeResponseData$: Observable<QuoteInsuranceTypeResponse>;
  public waiverReasonServiceData$: Observable<WaiverReason[]>;
  public waiverReasonsList!: WaiverReason[];
  public firstApplicationButtonSelected: boolean = false;
  public selectFirstButton: boolean = false;

  public carrierInsuranceTypeList!: InsuranceType[];
  public applicationIndex: number = 0;
  public applicantFormGroupList!: ApplicantFormGroup[];
  public insuranceType!: string;
  public matTabIndexSelected: number = 0;
  private currentApplicationSelected!: Application;

  public coverageForm: FormGroup = this.fb.group({
    lifeLoanPercentage: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
    lifeLoanAmount: [null, [Validators.required, Validators.min(0)]],
    insuredPaymentPercentage: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
    insuredPaymentAmount: [null, [Validators.required, Validators.min(0)]],
  });

  constructor(waiverReasonService: WaiverReasonService) {
    this.quoteInsuranceTypeResponseData$ = this.store.select(quoteInsuranceTypeResponseSelector).pipe(shareReplay());
    this.waiverReasonServiceData$ = waiverReasonService.waiverReasons$;
    this.store.dispatch(setLoadingSpinner({ status: true }));
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  ngOnInit(): void {
    this.getApplicantFormGroups();
    this.getQuotesFromSession();
    this.getLoanFromSession();
    this.title = this.stepList()[this.stepper().selectedIndex].title;
    this.description = this.stepList()[this.stepper().selectedIndex].description;
    this.nextButtonLabel = this.stepList()[this.stepper().selectedIndex + 1].title;
    this.stepServiceBehavior();

  }

  private stepServiceBehavior() {
    this.stepService.currentStateInfo.subscribe((step) => {
      if (step.currentStep === 3 && step.readOnlyBehavior) {
        this.isReadOnly = true;
        this.coverageForm.disable();
      }

      if (step.currentStep === 3 && !step.readOnlyBehavior) {
        this.getLoanFromSession();
        this.getQuotesFromSession();
        this.setValidationErrors();
      }
      this.store.dispatch(setLoadingSpinner({ status: false }));
    });
  }

  private getApplicantFormGroups() {
    this.store
      .select(insuranceApplicationApplicantFormGroupSelector)
      .subscribe((applicantFormGroups: ApplicantFormGroup[]) => {
        this.applicantFormGroupList = applicantFormGroups;
      });
  }

  public getCarrierInsuranceTypeList() {
    this.carrierInsuranceTypeList = this.productService.carrierLoanTypesValue?.filter(
      (loanType) => loanType.value === this.loan?.loanType
    )[0]?.insuranceTypes;
    if (this.loan.paymentType === PAYMENT_TYPE.INTEREST_ONLY && this.loan.loanType !== LOAN_TYPE.LINE_OF_CREDIT) {
      this.isInterestOnlyPaymentType = true;
    } else {
      this.isInterestOnlyPaymentType = false;
    }
  }

  private setValidationErrors() {
    let messages: string = '';
    const applications: Application[] = this.quoteInsuranceTypeResponse.applications;
    if (
      applications[this.applicationIndex] &&
      applications[this.applicationIndex].validations !== undefined &&
      applications[this.applicationIndex].validations?.length !== undefined &&
      applications[this.applicationIndex].validations?.length !== 0
    ) {
      const errorNumbers = applications[this.applicationIndex].validations?.filter(
        (validation) => validation.severity !== SEVERITY_ERROR.Error
      ).length;

      if (applications[this.applicationIndex].validations && errorNumbers && errorNumbers > 0) {
        applications[this.applicationIndex].validations?.forEach((validation) => {
          messages =
            messages !== ''
              ? `${messages} \n${validation.errorMessage.replace('\n', '')}`
              : `${validation.errorMessage.replace('\n', '')}`;
        });
      }
    }

    if (messages !== '') {
      this.stepperMessage.messageContent = {
        message: messages,
        type: MessageType.WARNING,
        showIt: true,
      };
    }
  }

  private getQuotesFromSession() {
    this.insuranceQuoteResponse$ = this.store
      .select(quoteInsuranceTypeResponseSelector)
      .subscribe((quoteResponse: QuoteInsuranceTypeResponse) => {
        this.quoteInsuranceTypeResponse = quoteResponse;
      });
  }

  public getLoanFromSession = (loadCarrier: boolean = true) => {
    this.store.select(insuranceApplicationLoanSelector).subscribe((loan: Loan) => {
      if (loan) {
        this.loan = loan;

        this.insuranceType = loan.insuranceType;
        if (loadCarrier) {
          this.getCarrierInsuranceTypeList();
        }
      }
    });
  };

  public getInsuranceTypeSelected() {
    return this.quoteInsuranceTypeResponse.insuranceType;
  }

  refreshQuotesValues() {
    this.quoteInsuranceTypeResponseData$.subscribe((quoteResponse: QuoteInsuranceTypeResponse) => {
      this.quoteInsuranceTypeResponse = {
        applications: [],
        loanId: '',
        insuranceType: '',
        loanCoverageLimit: 0,
        paymentCoverageLimit: 0,
        healthQuestions: [],
      };
      this.quoteInsuranceTypeResponse = { ...quoteResponse };
    });
  }

  public back = () => {
    this.stepService.currentState = {
      ...this.stepService.currentStateValue,
      currentStep: 2,
    };

    if (this.subscriptionQuote$) this.subscriptionQuote$.unsubscribe();
    if (this.insuranceQuoteResponse$) this.insuranceQuoteResponse$.unsubscribe();

    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();

    this.stepper().previous();
  };

  public saveCoverage = () => {
    if (this.stepService.currentStateValue.currentStep === 3) {
      this.stepService.currentState = {
        ...this.stepService.currentStateValue,
        currentStep: 4,
      };
    }

    if (this.subscriptionQuote$) this.subscriptionQuote$.unsubscribe();
    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();

    this.stepperMessage.messageContent = {
      message: '',
      type: MessageType.INFO,
      showIt: false,
    };

    if (this.isReadOnly) {
      this.stepper().next();
    } else {
      this.stepper().selectedIndex = 3;
    }
  };

  public messageDialog(message: string): MatDialogRef<MessageComponent> {
    return this.dialog.open(MessageComponent, {
      width: '500px',
      data: {
        type: MessageType.WARNING,
        message,
      },
    });
  }

  public isListReady(
    list: Array<ApplicantQuote> | Array<InsuranceTypeApplicantCoverageResponse> | Array<Application>
  ): boolean {
    if (list !== null && list !== undefined && list.length > 0) {
      return true;
    }
    return false;
  }

  public isNextButtonDisabled() {
    if (this.isReadOnly) {
      return false;
    }

    return false;
  }

  private getApplicationList(insuranceType: string): ApplicationRequest[] {
    let applicantList: Applicant[] = [];
    let applicationList: ApplicationRequest[] = [];

    this.store
      .select(quoteInsuranceTypeResponseSelector)
      .pipe(
        take(1),
        distinctUntilChanged(
          (prev: QuoteInsuranceTypeResponse, curr: QuoteInsuranceTypeResponse) =>
            prev.insuranceType === curr.insuranceType
        )
      )
      .subscribe({
        next: (quoteResponse) => {
          if (quoteResponse.applications.length > 0) {
            applicantList = [];
            let spApplicantSequence = 0;
            if (insuranceType === INSURANCE_TYPE.SINGLE_PREMIUM) {
              quoteResponse.applications.forEach((application: ApplicationRequest) => {
                this.getApplicantList(application).forEach((applicant) => {
                  let applicantTemp: Applicant = {
                    ...applicant,
                    //applicantSequence: applicantList.length + 1,
                    applicantType: this.enumService.getAbbreviation(getApplicantTypeList(), applicantList.length + 1),
                  };
                  applicantList.push(applicantTemp);
                });
              });
              applicationList.push({
                id: quoteResponse.applications[0].id !== undefined ? quoteResponse.applications[0].id : 1,
                amortization: quoteResponse.applications[0].amortization,
                applicants: applicantList.sort((a, b) =>
                  String(a.applicantSequence)?.localeCompare(String(b.applicantSequence), 'en', {
                    numeric: true,
                  })
                ),
              });
            } else {
              quoteResponse.applications.forEach((application: ApplicationRequest) => {
                applicantList = [];
                applicationList.push({
                  id: application.applicants.length > 2 ? 0 : application.id,
                  amortization: application.amortization,
                  applicants: this.getApplicantList(application),
                });
              });
            }
          }
        },
        error: (error) => {
          console.error('Error on getApplicantList: ', error);
        },
      });
    return applicationList;
  }
  private getApplicantList(application: ApplicationRequest): Applicant[] {
    let applicantList: Applicant[] = [];
    let spApplicantSequence = 0;
    applicantList = [];
    application.applicants.forEach((applicant: Applicant, index) => {
      let applicantAddress: ApplicantAddress[] = [];
      let applicantPhones: ApplicantPhone[] = [];
      let applicantEmails: ApplicantEmail[] = [];
      let applicantConsents: ApplicantConsent[] = [];
      let gender!: string;
      let language!: string;
      let occupation!: string;
      let placeOfBirth!: string;
      let workHours: number = -1;

      this.applicantFormGroupList
        .filter((group) => group.personalInfoForm?.applicantIdentifier === applicant.applicantIdentifier)
        .forEach((applicantGroup, index) => {
          if (applicantGroup.personalInfoForm) {
            gender = applicantGroup.personalInfoForm.gender;
            language = applicantGroup.personalInfoForm.language;
            occupation = applicantGroup.personalInfoForm.occupation;
            placeOfBirth = applicantGroup.personalInfoForm.placeOfBirth;
            workHours = applicantGroup.personalInfoForm.workHours;
          }
          if (applicantGroup.addressForm) applicantAddress.push(applicantGroup.addressForm);
          if (applicantGroup.homePhoneForm) applicantPhones.push(applicantGroup.homePhoneForm);
          if (applicantGroup.workPhoneForm) applicantPhones.push(applicantGroup.workPhoneForm);
          if (applicantGroup.emailForm) applicantEmails.push(applicantGroup.emailForm);
          if (applicantGroup.consentForm) {
            applicantConsents.push(applicantGroup.consentForm);
            applicantConsents.push({
              consentType: 'ApplicationTerms',
              hasConsented: true,
            });
          }
        });

      spApplicantSequence =
        applicant.applicantSequence !== undefined ? applicant.applicantSequence : spApplicantSequence + 1;
      const applicantType = this.enumService.getAbbreviation(getApplicantTypeList(), spApplicantSequence);

      let applicantTemp: Applicant = {
        applicantIdentifier: applicant.applicantIdentifier,
        applicantSequence: spApplicantSequence,
        applicantType: applicantType,
        firstName: applicant.firstName,
        middleName: applicant.middleName,
        lastName: applicant.lastName,
        placeOfBirth: placeOfBirth,
        birthDate: applicant.birthDate,
        gender: gender,
        isSmoker: applicant.isSmoker,
        language: language,
        selfEmployed: applicant.selfEmployed,
        workHours: workHours === 0 ? workHours : WORK_HOUR.MIN_WORK_HOURS_PER_WEEK,
        occupation: occupation,
        applicantAddresses: applicantAddress,
        applicantPhones: applicantPhones,
        applicantEmails: applicantEmails,
        applicantConsents: applicantConsents,
      };

      applicantList.push(applicantTemp);
    });

    return applicantList.sort((a, b) =>
      String(a.applicantSequence)?.localeCompare(String(b.applicantSequence), 'en', {
        numeric: true,
      })
    );
  }
  private createLoanUpsertRequest(insuranceType: string) {
    const loanDto: LoanRequest = {
      loan: {
        loanIdentifier: this.loan.loanIdentifier,
        branchId: this.loan.branchId,
        userId: this.loan.userId,
        sourceType: this.loan.sourceType,
        loanType: this.loan.loanType,
        insuranceType: insuranceType,
        paymentType: this.loan.paymentType,
        channelType: this.loan.channelType,
        fundingDate: this.loan.fundingDate,
        firstPaymentDate: this.loan.firstPaymentDate,
        issueDate: this.loan.issueDate,
        effectiveDate: this.loan.effectiveDate,
        loanAmount: this.loan.loanAmount,
        paymentAmount: this.loan.paymentAmount,
        monthlyPaymentAmount: this.loan.monthlyPaymentAmount,
        paymentFrequency: this.loan.paymentFrequency,
        interestRate: this.loan.interestRate,
        loanTerm: this.loan.loanTerm,
        amortization: this.loan.amortization,
      },
      applications: this.getApplicationList(insuranceType),
    };

    return loanDto;
  }

  public onClickTab(event: number) {
    sessionStorage.removeItem("LASTSELECTEDAPPLICATION");

    if (this.stepper().selectedIndex === 2 && event >= 0 && event !== this.selectedIndexValue()) {
      this.matTabIndexSelected = event;
      this.stepperMessage.messageContent = {
        message: '',
        type: MessageType.WARNING,
        showIt: false,
      };
      this.insuranceType = this.carrierInsuranceTypeList[event].type;
      this.applicationIndex = 0;
      this.store.dispatch(setLoadingSpinner({ status: true }));
      const loanRequest: LoanRequest = this.createLoanUpsertRequest(this.carrierInsuranceTypeList[event].type);
      this.store.dispatch(upsertLoanApplication({ request: loanRequest }));

      this.store.select(loadingInformationSelector).subscribe({
        next: (loading) => {
          this.store.dispatch(setLoadingSpinner({ status: true }));
          if (!loading) {
            if (this.insuranceType !== 'SP') {
              this.coveragesTakenForms()[0]?.addControlsForm();
              // this.applicationIndex = -1;
              // if (this.loan.applications !== undefined && this.loan.applications?.length > 1) {
              //   setTimeout(() => {
              //     this.applicationIndex = 1;
              //   }, 500);
              // }
            }

            this.refreshQuotesValues();
            this.getLoanFromSession(false);
            this.coveragesTakenForms()[0]?.getLifeCoveragePercentage();
            this.store.dispatch(setLoadingSpinner({ status: false }));
            setTimeout(() => {
              this.firstApplicationButtonSelected = true;
              this.applicationIndex = 0;
            }, 500);
          }
        },
      });

      this.firstApplicationButtonSelected = false;
    }
  }

  public selectedIndexValue(): number {
    return this.carrierInsuranceTypeList.filter(({ type }) => type === this.loan.insuranceType)[0].sequence;
  }

  public executeTaskPostRequoting() {
    this.selectFirstButton = true;
    const lastSelectedApplicationIndex: string | null = sessionStorage.getItem("LASTSELECTEDAPPLICATION");
    if (lastSelectedApplicationIndex) {
      const el = document.getElementById(lastSelectedApplicationIndex);
      if (el) {
        el.click();
      }
    }
  }

  public isApplicationButtonSelected(
    applicationSelected: number,
    applicationId: number | undefined,
    firstApplicationId: number | undefined
  ): boolean {
    if (
      this.currentApplicationSelected?.id === applicationId ||
      (this.currentApplicationSelected === undefined && applicationSelected === 0) //||
      //(this.currentApplicationSelected?.id !== firstApplicationId && this.applicationIndex === 0)
    ) {
      this.firstApplicationButtonSelected = true;
    } else {
      this.firstApplicationButtonSelected = false;
    }
    return this.firstApplicationButtonSelected;
  }
  public changeApplicationSelected(buttonSelected: number, applicationSelected: number, application: Application) {

    this.firstApplicationButtonSelected = buttonSelected === 1;
    this.applicationIndex = applicationSelected;
    this.currentApplicationSelected = application;

    this.store
      .select(quoteInsuranceTypeResponseSelector)
      .subscribe((quoteResponse: QuoteInsuranceTypeResponse) => {
        const applications: Application[] = quoteResponse.applications;

        if (applications.length > 1 && this.insuranceType !== 'SP') {
          this.coverageTakenForms.forEach((coveTaken: CoverageTakenComponent) => {
            Object.keys(coveTaken.coverageForm.controls).forEach((controlName: string) => {
              if (controlName.includes(`-${application.id}`)) {
                coveTaken.coverageForm.removeControl(controlName);
              }
            });
            coveTaken.addControlsForm();
            coveTaken.getLifeCoveragePercentage();
            this.ref.detectChanges()
          })
        }
      });



  }
}
