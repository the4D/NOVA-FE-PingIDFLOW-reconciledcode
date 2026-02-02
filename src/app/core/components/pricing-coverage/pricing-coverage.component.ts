import { ChangeDetectorRef, Component, inject, OnInit, viewChild } from '@angular/core';
import { Observable, Subscription, shareReplay } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import { NgClass, AsyncPipe } from '@angular/common';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  applicantCoveragesQQ,
  InsuranceTypeApplicantCoverageResponse,
  InsuranceTypeApplicantRequest,
  InsuranceTypeApplicationRequest,
  InsuranceTypeCoverageRequest,
  QuoteInsuranceTypeRequest,
  QuoteInsuranceTypeResponse,
} from '@core/models/insurance/quote-insurance-type.model';
import {
  insuranceApplicationApplicantFormGroupSelector,
  insuranceApplicationLoanSelector,
  loadingInformationSelector,
  quoteInsuranceTypeResponseSelector,
} from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { InsuranceType } from '@core/models/insurance/carrier-loan-type.model';
import { Loan } from '@core/models/insurance/loan.model';
import { ProductService } from '@core/services/tenant/product.service';
import {
  APPLICANT_TYPE,
  HUNDRED_VALUE,
  INSURANCE_TYPE,
  LOAN_TYPE,
  PAYMENT_TYPE,
  WORK_HOUR,
} from '@core/utils/enums/insurance-enums';
import { getApplicantTypeList, getCoverageTypeList } from '@core/utils/enums/system-enums';
import { StepperMessageService } from '@core/services/insurance/stepper-message.service';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { WaiverReason } from '@core/models/insurance/waiverReason.model';
import { WaiverReasonService } from '@core/services/insurance/waiverReason.service';
import { Application } from '@core/models/insurance/application.model';
import { ApplicantQuote } from '@core/models/insurance/applicant-quote.model';
import { EnumService } from '@core/services/insurance/enum.service';
import { Applicant } from '@core/models/insurance/applicant.model';
import { EnumValue } from '@core/models/insurance/enum.model';
import { ApplicantFormGroup } from '@core/models/insurance/applicant-formGroup.model';
import { quoteInsuranceTypeQuickQuote } from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import { MessageType } from '@core/models/insurance/stepper-message.model';
import { CoverageTakenComponent } from '../coverage-taken/coverage-taken.component';
import { MessageComponent } from '../message/message.component';
import { StepperMessageComponent } from '../stepper-message/stepper-message.component';

@Component({
  selector: 'pricing-coverage',
  templateUrl: './pricing-coverage.component.html',
  styleUrls: ['./pricing-coverage.component.scss'],
  standalone: true,
  imports: [StepperMessageComponent, CoverageTakenComponent, NgClass, AsyncPipe, MatTab, MatTabGroup],
})
export class PricingCoverageComponent implements OnInit {
  matTabGroup = viewChild<MatTabGroup>('tabPrices');

  private store = inject(Store<AppState>);
  private dialog = inject(MatDialog);
  private enumService = inject(EnumService);
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private stepperMessage = inject(StepperMessageService);
  private waiverReasonService = inject(WaiverReasonService);

  public title!: string;
  public description!: string;
  public isReadOnly: boolean = false;
  public totalCoverageCost: number = 0;
  public loan!: Loan;
  public isInterestOnlyPaymentType: boolean = false;
  public quoteInsuranceTypeResponse!: QuoteInsuranceTypeResponse;
  public tabsNumber!: number;
  public applicantList: Array<ApplicantQuote> = new Array<ApplicantQuote>();
  public coverageTypeList: EnumValue[] = getCoverageTypeList();
  public quoteInsuranceTypeResponseData$: Observable<QuoteInsuranceTypeResponse>;
  public waiverReasonServiceData$: Observable<WaiverReason[]>;
  public waiverReasonsList!: WaiverReason[];
  public firstApplicationButtonSelected: boolean = true;
  public carrierInsuranceTypeList!: InsuranceType[];
  public applicationIndex: number = 0;
  public applicantFormGroupList!: ApplicantFormGroup[];
  public insuranceType!: string;
  private insuranceQuoteResponse$!: Subscription;
  public matTabIndexSelected: number = 0;
  private currentApplicationSelected!: Application;

  public coverageForm: FormGroup = this.fb.group({
    lifeLoanPercentage: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
    lifeLoanAmount: [null, [Validators.required, Validators.min(0)]],
    insuredPaymentPercentage: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
    insuredPaymentAmount: [null, [Validators.required, Validators.min(0)]],
  });

  constructor(private cd: ChangeDetectorRef) {
    this.quoteInsuranceTypeResponseData$ = this.store.select(quoteInsuranceTypeResponseSelector).pipe(shareReplay());
    this.waiverReasonServiceData$ = this.waiverReasonService.waiverReasons$;
    this.store.dispatch(setLoadingSpinner({ status: true }));
  }
  ngAfterContentInit(): void {
    this.cd.detectChanges();
  }
  ngOnInit(): void {
    this.getApplicantFormGroups();
    this.getQuotesFromSession();
    this.getLoanFromSession();
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

  private getProvinceByApplicant(applicant: Applicant): string {
    let province: string | undefined = '';
    this.store.select(insuranceApplicationApplicantFormGroupSelector).subscribe((formGroups) => {
      province = formGroups.find(
        (group) => group.personalInfoForm?.applicantIdentifier === applicant.applicantIdentifier
      )?.addressForm?.province;

      if (province === undefined) {
        province = formGroups.find(
          (group) => group.personalInfoForm?.applicantIdentifier === applicant.applicantIdentifier
        )?.personalInfoForm?.applicantAddresses[0].province;
      }
    });

    return province;
  }

  private getApplicationsRequest(applicationCarrierType: string): InsuranceTypeApplicationRequest[] {
    let insuranceTypeApplicationsRequest: InsuranceTypeApplicationRequest[] = [];
    if (applicationCarrierType === INSURANCE_TYPE.SINGLE_PREMIUM) {
      const application = this.quoteInsuranceTypeResponse.applications[0];
      const applicationRequest: InsuranceTypeApplicationRequest = {
        id: application.id !== undefined ? application.id : 1,
        loanAmountCovered: application.loanAmountCovered,
        loanPaymentAmountCovered: application.loanPaymentAmountCovered,
        amortization: application.amortization,
        applicants: this.getAllApplicants(),
      };
      insuranceTypeApplicationsRequest.push(applicationRequest);
    } else {
      if (
        this.quoteInsuranceTypeResponse.applications.length <= 1 &&
        this.quoteInsuranceTypeResponse.applications[0].applicants.length > 2
      ) {
        let index = 1;
        while (index <= 2) {
          insuranceTypeApplicationsRequest.push({
            id: index,
            loanAmountCovered: 0,
            loanPaymentAmountCovered: 0,
            amortization: this.quoteInsuranceTypeResponse.applications[0].amortization,
            applicants: this.getApplicantsByGrouping(index),
          });
          index += 1;
        }
      } else {
        this.quoteInsuranceTypeResponse.applications.forEach((application) => {
          if (application.id) {
            const applicationRequest: InsuranceTypeApplicationRequest = {
              id: application.id,
              loanAmountCovered: application.loanAmountCovered,
              loanPaymentAmountCovered: application.loanPaymentAmountCovered,
              amortization: application.amortization,
              applicants: this.getApplicants(application, applicationCarrierType),
            };

            insuranceTypeApplicationsRequest.push(applicationRequest);
          }
        });
      }
    }
    return insuranceTypeApplicationsRequest;
  }

  private getApplicantsByGrouping(index: number): InsuranceTypeApplicantRequest[] {
    let applicants: InsuranceTypeApplicantRequest[] = [];

    this.quoteInsuranceTypeResponse.applications[0].applicants.forEach((applicant: Applicant, applicantIndex) => {
      if (index === 1 && applicantIndex % 2 === 0) {
        applicants.push({
          applicantSequence: applicantIndex + 1,
          applicantIdentifier: `${applicantIndex + 1}${applicantIndex}${applicantIndex + 1}${applicantIndex + 3}`,
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          applicantType:
            applicant.applicantType === APPLICANT_TYPE.PRIMARY ? APPLICANT_TYPE.PRIMARY : APPLICANT_TYPE.SECONDARY,
          birthDate: applicant.birthDate,
          isSmoker: applicant.isSmoker,
          selfEmployed: applicant.selfEmployed,
          workHours: applicant.workHours,
          province: this.getProvinceByApplicant(applicant),
          coverages: applicantCoveragesQQ(),
          gender: applicant.gender,
          applicantEmails: applicant.applicantEmails,
          applicantPhones: applicant.applicantPhones,
          applicantAddresses: applicant.applicantAddresses,
          applicantConsents: applicant.applicantConsents,
        });
      }

      if (index === 2 && applicantIndex % 2 !== 0) {
        applicants.push({
          applicantSequence: applicantIndex + 1,
          applicantIdentifier: `${applicantIndex + 1}${applicantIndex}${applicantIndex + 1}${applicantIndex + 3}`,
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          applicantType:
            applicant.applicantType === APPLICANT_TYPE.SECONDARY ? APPLICANT_TYPE.PRIMARY : APPLICANT_TYPE.SECONDARY,
          birthDate: applicant.birthDate,
          isSmoker: applicant.isSmoker,
          selfEmployed: applicant.selfEmployed,
          workHours: applicant.workHours,
          province: this.getProvinceByApplicant(applicant),
          coverages: applicantCoveragesQQ(),
          gender: applicant.gender,
          applicantEmails: applicant.applicantEmails,
          applicantPhones: applicant.applicantPhones,
          applicantAddresses: applicant.applicantAddresses,
          applicantConsents: applicant.applicantConsents,
        });
      }
    });

    return applicants;
  }

  private coveragesTakenInitial(applicant: Applicant) {
    let coveragesRequest: InsuranceTypeCoverageRequest[] = [];

    applicant.applicantCoverages?.forEach((coverage) => {
      let initialCode = coverage.coverageCode;
      const codeToChange = parseInt(initialCode) % HUNDRED_VALUE;
      if (codeToChange > 0) {
        initialCode = coverage.coverageCode.replace(
          codeToChange.toString(),
          codeToChange.toString().length === 1 ? '0' : '00'
        );
      }

      let covRequest: InsuranceTypeCoverageRequest = {
        coverageType: coverage.coverageType,
        coverageCode: initialCode,
        coveragePercent: HUNDRED_VALUE,
        healthQuestionAnswers: coverage.healthQuestionAnswers,
      };

      coveragesRequest.push(covRequest);
    });

    return coveragesRequest;
  }

  private getAllApplicants(): InsuranceTypeApplicantRequest[] {
    const applicantsRequest: InsuranceTypeApplicantRequest[] = [];
    this.quoteInsuranceTypeResponse.applications.forEach((application) => {
      application.applicants.forEach((applicant: Applicant) => {
        const coverages = this.coveragesTakenInitial(applicant);
        const applicantType = this.enumService.getAbbreviation(getApplicantTypeList(), applicant.applicantSequence);

        const applicantTemp: InsuranceTypeApplicantRequest = {
          // ! This is new for QQ
          applicantSequence: applicant.applicantSequence,
          applicantIdentifier: applicant.applicantIdentifier,
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          applicantType: applicantType,
          birthDate: applicant.birthDate,
          isSmoker: applicant.isSmoker,
          selfEmployed: applicant.selfEmployed,
          workHours: applicant.workHours === 0 ? applicant.workHours : WORK_HOUR.MIN_WORK_HOURS_PER_WEEK,
          province: this.getProvinceByApplicant(applicant) ? this.getProvinceByApplicant(applicant) : '',
          coverages: coverages,
          gender: applicant.gender,
          applicantEmails: applicant.applicantEmails,
          applicantPhones: applicant.applicantPhones,
          applicantAddresses: applicant.applicantAddresses,
          applicantConsents: applicant.applicantConsents,
        };

        applicantsRequest.push(applicantTemp);
      });
    });

    return applicantsRequest.sort((a, b) => {
      if (a.applicantSequence && b.applicantSequence) {
        return a.applicantSequence?.toString().localeCompare(b.applicantSequence?.toString());
      }
      return 0;
    });
  }

  private getApplicants(application: Application, applicationCarrierType: string): InsuranceTypeApplicantRequest[] {
    return application.applicants.map((applicant: Applicant) => {
      const coverages = this.coveragesTakenInitial(applicant);
      let applicantType = applicant.applicantType;
      if (applicationCarrierType === INSURANCE_TYPE.SINGLE_PREMIUM) {
        applicantType = this.enumService.getAbbreviation(getApplicantTypeList(), applicant.applicantSequence);
      }

      const applicantTemp: InsuranceTypeApplicantRequest = {
        // ! This is new for QQ
        applicantSequence: applicant.applicantSequence,
        applicantIdentifier: applicant.applicantIdentifier,
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        applicantType: applicantType,
        birthDate: applicant.birthDate,
        isSmoker: applicant.isSmoker,
        selfEmployed: applicant.selfEmployed,
        workHours: applicant.workHours === 0 ? applicant.workHours : WORK_HOUR.MIN_WORK_HOURS_PER_WEEK,
        province: this.getProvinceByApplicant(applicant) ? this.getProvinceByApplicant(applicant) : '',
        coverages: coverages,
        gender: applicant.gender,
        applicantEmails: applicant.applicantEmails,
        applicantPhones: applicant.applicantPhones,
        applicantAddresses: applicant.applicantAddresses,
        applicantConsents: applicant.applicantConsents,
      };

      return applicantTemp;
    });
  }

  private prepareQuoteRequest = (indexTab: number, applicationCarrierType: string): QuoteInsuranceTypeRequest => {
    return {
      loanId: this.quoteInsuranceTypeResponse.loanId,
      loanType: this.loan.loanType,
      insuranceType: this.carrierInsuranceTypeList[indexTab].type,
      paymentType: this.loan.paymentType,
      fundingDate: this.loan.fundingDate,
      firstPaymentDate: this.loan.firstPaymentDate,
      loanAmount: this.loan.loanAmount,
      paymentAmount: this.loan.paymentAmount,
      monthlyPaymentAmount: this.loan.monthlyPaymentAmount,
      paymentFrequency: this.loan.paymentFrequency,
      interestRate: this.loan.interestRate,
      loanTerm: this.loan.loanTerm,
      amortization: this.loan.amortization,
      applications: this.getApplicationsRequest(applicationCarrierType),
    };
  };

  public onClickTab(event: any) {
    if (event >= 0 && event !== this.selectedIndexValue()) {
      this.matTabIndexSelected = event;
      this.stepperMessage.messageContent = {
        message: '',
        type: MessageType.WARNING,
        showIt: false,
      };
      this.insuranceType = this.carrierInsuranceTypeList[event].type;
      this.applicationIndex = 0;
      this.store.dispatch(setLoadingSpinner({ status: true }));
      const quoteTypeRequest = this.prepareQuoteRequest(event, this.carrierInsuranceTypeList[event].type);

      this.store.dispatch(setLoadingSpinner({ status: true }));
      this.store.dispatch(quoteInsuranceTypeQuickQuote({ request: quoteTypeRequest }));

      this.store.select(loadingInformationSelector).subscribe({
        next: (loading) => {
          this.store.dispatch(setLoadingSpinner({ status: true }));

          if (!loading) {
            this.refreshQuotesValues();
            this.getLoanFromSession(false);
            this.store.dispatch(setLoadingSpinner({ status: false }));
          }
        },
      });
    }
  }

  public selectedIndexValue(): number {
    return this.carrierInsuranceTypeList.filter(({ type }) => type === this.loan.insuranceType)[0].sequence;
  }
  public isApplicationButtonSelected(
    applicationSelected: number,
    applicationId: number | undefined,
    firstApplicationId: number | undefined
  ): boolean {
    if (
      this.currentApplicationSelected?.id === applicationId ||
      (this.currentApplicationSelected === undefined && applicationSelected === 0)
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
  }
}
