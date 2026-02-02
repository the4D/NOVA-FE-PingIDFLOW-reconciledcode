import { Component, inject, input, OnInit, output } from '@angular/core';
import { Application, ApplicationRequest } from '@core/models/insurance/application.model';
import { EnumValue } from '@core/models/insurance/enum.model';
import { getApplicantTypeList, getCoverageTypeList } from '@core/utils/enums/system-enums';
import {
  AbstractControl,
  UntypedFormBuilder,
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from '@store';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { StepperMessageService } from '@core/services/insurance/stepper-message.service';
import { InsuranceType } from '@core/models/insurance/carrier-loan-type.model';
import { ProductService } from '@core/services/tenant/product.service';
import { Loan } from '@core/models/insurance/loan.model';
import {
  COVERAGE_TYPE,
  HUNDRED_VALUE,
  INSURANCE_TYPE,
  LOAN_TYPE,
  PAYMENT_TYPE,
  SEVERITY_ERROR,
  WORK_HOUR,
} from '@core/utils/enums/insurance-enums';
import {
  InsuranceTypeApplicantRequest,
  InsuranceTypeApplicationRequest,
  InsuranceTypeCoverageRequest,
  InsuranceTypeCoverageResponse,
  QuoteInsuranceTypeRequest,
  QuoteInsuranceTypeResponse,
} from '@core/models/insurance/quote-insurance-type.model';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import {
  quoteInsuranceTypeApplication,
  quoteInsuranceTypeQuickQuote,
} from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import {
  insuranceApplicationApplicantFormGroupSelector,
  insuranceApplicationLoanSelector,
  loadingInformationSelector,
  quoteInsuranceTypeResponseSelector,
} from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { Observable, shareReplay, Subscription, take } from 'rxjs';
import { EnumService } from '@core/services/insurance/enum.service';
import { Applicant } from '@core/models/insurance/applicant.model';
import { WaiverReason } from '@core/models/insurance/waiverReason.model';
import { WaiverReasonService } from '@core/services/insurance/waiverReason.service';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { OnlyDecimalDirective } from '@core/directives/only-decimal/onlyDecimal.directive';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { TooltipDirective } from '@core/directives/tooltip/tooltip.directive';
import { NgClass, AsyncPipe, DecimalPipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MessageType } from '@core/models/insurance/stepper-message.model';

interface ApplicationCoverages {
  id: number | undefined;
  lifeLoanPercentageGlobal?: number;
  lifeLoanAmountGlobal?: number;
  insuredPaymentPercentageGlobal?: number;
  insuredPaymentAmountGlobal?: number;
}

@Component({
  selector: 'coverage-taken',
  templateUrl: './coverage-taken.component.html',
  styleUrls: ['./coverage-taken.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    TooltipDirective,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    OnlyDecimalDirective,
    CurrencyMaskModule,
    AsyncPipe,
    DecimalPipe,
    MatDividerModule,
    MatTooltipModule,
  ],
})
export class CoverageTakenComponent implements OnInit {
  applications = input.required<Application[]>();
  applicationIndex = input.required<number>();
  applicantLength = input.required<number>();
  insuranceType = input.required<string>();
  quoteType = input.required<string>();
  matTabGroupSelected = input.required<number>();
  isQuickQuote = input<boolean>(false);
  isRequotingDone = output<number>();

  private store = inject(Store<AppState>);
  private stepperMessage = inject(StepperMessageService);
  private productService = inject(ProductService);
  private enumService = inject(EnumService);
  private fb = inject(UntypedFormBuilder);
  private stepService = inject(SharedStepService);
  private waiverReasonService = inject(WaiverReasonService);

  public loan!: Loan;
  public coverageTypeList: EnumValue[] = getCoverageTypeList();
  public carrierInsuranceTypeList!: InsuranceType[];
  public isInterestOnlyPaymentType: boolean = false;
  public quoteInsuranceTypeResponse!: QuoteInsuranceTypeResponse;
  public quoteInsuranceTypeResponseData$: Observable<QuoteInsuranceTypeResponse>;
  public waiverReasonsList!: WaiverReason[];
  public waiverReasonServiceData$: Observable<WaiverReason[]>;
  public isReadOnly: boolean = false;
  private applicationCoveragesValues: ApplicationCoverages[] = [];
  private insuranceQuoteResponse$!: Subscription;
  public tabsNumber!: number;

  public coverageForm: FormGroup = this.fb.group({});

  constructor() {
    this.quoteInsuranceTypeResponseData$ = this.store.select(quoteInsuranceTypeResponseSelector).pipe(shareReplay());
    this.waiverReasonServiceData$ = this.waiverReasonService.waiverReasons$;
  }

  ngOnInit() {
    this.addControlsForm();
    this.getCoveragesList();
    this.getQuotesFromSession();
    this.getLoanFromSession();

    this.stepService.currentStateInfo.subscribe((step) => {
      if (step.currentStep === 3 && step.readOnlyBehavior) {
        this.isReadOnly = true;
        this.coverageForm.disable();
      }

      if (step.currentStep === 3 && !step.readOnlyBehavior) {
        this.addControlsForm();
        this.getLoanFromSession();
        this.getQuotesFromSession();
        this.getLifeCoveragePercentage();
        this.dropDownListBehavior();
        this.setValidationErrors();
      }
      this.store.dispatch(setLoadingSpinner({ status: false }));
    });
    this.getLifeCoveragePercentage();
    this.checkSelectDropDowns();
  }

  public addControlsForm() {
    this.applications().forEach((application: Application) => {
      Object.keys(this.coverageForm.controls).forEach((controlName: string) => {
        if (controlName.includes(`-${application.id}`)) {
          this.coverageForm.removeControl(controlName);
        }
      });

      if (this.coverageForm.controls[`lifeLoanPercentage-${application.id}`] === undefined) {
        this.coverageForm.addControl(
          `lifeLoanPercentage-${application.id}`,
          new UntypedFormControl(null, [Validators.required, Validators.min(0), Validators.max(100)])
        );
      }

      if (this.coverageForm.controls[`lifeLoanAmount-${application.id}`] === undefined) {
        this.coverageForm.addControl(
          `lifeLoanAmount-${application.id}`,
          new UntypedFormControl(null, [Validators.required, Validators.min(0)])
        );
      }

      if (this.coverageForm.controls[`insuredPaymentPercentage-${application.id}`] === undefined) {
        this.coverageForm.addControl(
          `insuredPaymentPercentage-${application.id}`,
          new UntypedFormControl(null, [Validators.required, Validators.min(0), Validators.max(100)])
        );
      }

      if (this.coverageForm.controls[`insuredPaymentAmount-${application.id}`] === undefined) {
        this.coverageForm.addControl(
          `insuredPaymentAmount-${application.id}`,
          new UntypedFormControl(null, [Validators.required, Validators.min(0)])
        );
      }
    });
  }

  private getCoveragesList() {
    this.waiverReasonServiceData$.pipe(take(1)).subscribe((waiverReasons: WaiverReason[]) => {
      this.waiverReasonsList = waiverReasons;
      this.checkSelectDropDowns();
    });
  }

  private getQuotesFromSession() {
    this.insuranceQuoteResponse$ = this.store
      .select(quoteInsuranceTypeResponseSelector)
      .subscribe((quoteResponse: QuoteInsuranceTypeResponse) => {
        this.quoteInsuranceTypeResponse = quoteResponse;
        if (quoteResponse) {
          this.getCoverageInfo(quoteResponse);
        }
      });

    this.getTotalPremiumPayment();
  }

  public getLoanFromSession = (loadCarrier: boolean = true) => {
    this.store.select(insuranceApplicationLoanSelector).subscribe((loan: Loan) => {
      if (loan) {
        this.loan = loan;
        // !WE HAVE TO CHECK NEXT LINE
        // this.insuranceType() = loan.insuranceType;
        if (loadCarrier) {
          this.getCarrierInsuranceTypeList();
        }
      }
    });
  };

  private getCoverageInfo = (quoteInsuranceTypeResponse: QuoteInsuranceTypeResponse) => {
    this.tabsNumber = 1;
    if (
      quoteInsuranceTypeResponse &&
      quoteInsuranceTypeResponse?.applications &&
      quoteInsuranceTypeResponse.applications?.length > 0
    ) {
      this.tabsNumber = quoteInsuranceTypeResponse.applications.length;

      quoteInsuranceTypeResponse.applications.forEach((application: ApplicationRequest) => {
        application.applicants.forEach((applicant: Applicant) => {
          applicant.applicantCoverages?.forEach((coverage) => {
            this.coverageForm.addControl(
              `dropDown${coverage.coverageType}-${applicant.applicantSequence}`,
              new UntypedFormControl(
                this.getCoverageSelection(applicant.applicantType, coverage.coverageType, application.id),
                Validators.required
              )
            );
          });
        });
      });

      this.setValidationErrors();
    }

    this.getLifeCoveragePercentage();
  };

  private getCoverageSelection = (applicantType: string, coverageType: string, applicationId: number | undefined) =>
    this.quoteInsuranceTypeResponse.applications
      .filter((application: ApplicationRequest) => application.id === applicationId)[0]
      .applicants.find((reason) => reason.applicantType === applicantType)
      ?.applicantCoverages?.filter((coverage) => coverage.coverageType === coverageType)[0].coverageCode;

  private setValidationErrors() {
    let messages: string = '';
    const applications: Application[] = this.quoteInsuranceTypeResponse.applications;
    if (
      applications[this.applicationIndex()] &&
      applications[this.applicationIndex()].validations !== undefined &&
      applications[this.applicationIndex()].validations?.length !== undefined &&
      applications[this.applicationIndex()].validations?.length !== 0
    ) {
      const errorNumbers = applications[this.applicationIndex()].validations?.filter(
        (validation) => validation.severity !== SEVERITY_ERROR.Error
      ).length;

      if (applications[this.applicationIndex()].validations && errorNumbers && errorNumbers > 0) {
        applications[this.applicationIndex()].validations?.forEach((validation) => {
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

  private checkSelectDropDowns() {
    if (this.waiverReasonsList && this.waiverReasonsList.length > 0) {
      this.quoteInsuranceTypeResponseData$.subscribe((response) => {
        response.applications.forEach((application: ApplicationRequest) => {
          application.applicants.forEach((applicant) => {
            applicant.applicantCoverages?.forEach((coverage) => {
              const resp = this.waiverReasonsList.find(
                (waiver) =>
                  waiver.coverageType === coverage.coverageType &&
                  waiver.waiverReasonCode === coverage.coverageCode.toString()
              );
              const control = this.coverageForm.get(`dropDown${coverage.coverageType}-${applicant.applicantSequence}`);
              control?.setValue(coverage.coverageCode.toString());

              if (control !== null) {
                if ((resp !== undefined && !resp?.isSelectable) || this.isReadOnly) {
                  control?.disable();
                } else {
                  control?.enable();
                }
              }
            });
          });
        });
      });
    }
  }

  public getCoverageDescription(abbreviation: string) {
    return this.coverageTypeList
      .filter((coverage: EnumValue) => coverage.abbreviation === abbreviation)
      .map((cove: EnumValue): string => cove.description)[0];
  }

  public addPremiumPlusTax = (amount: number | undefined, tax: number | undefined): number => {
    return (amount ? amount : 0) + (tax ? tax : 0);
  };

  public selectionChangeInsurance(event: MatSelectChange) {
    const controlValues: string[] = event.source.ngControl.name
      ? event.source.ngControl.name?.toString().replace('dropDown', '').split('-')
      : ['0', '0'];
    this.reQuoteInsurance(parseInt(controlValues[1]));
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

  public displayHorizontally(): boolean {
    return this.carrierInsuranceTypeList?.filter((insurance) => insurance.type === this.loan.insuranceType)[0]
      .displayHorizontally;
  }

  reQuoteInsurance(applicantIdentifier?: number | undefined) {
    this.stepperMessage.messageContent = {
      message: '',
      type: MessageType.WARNING,
      showIt: false,
    };

    const selectedIndex: number | null = this.matTabGroupSelected();
    const quoteTypeRequest = this.prepareQuoteRequest(
      selectedIndex !== null ? selectedIndex : 0,
      this.carrierInsuranceTypeList[selectedIndex !== null ? selectedIndex : 0].type,
      applicantIdentifier
    );

    this.store.dispatch(setLoadingSpinner({ status: true }));

    if (this.isQuickQuote()) {
      this.store.dispatch(quoteInsuranceTypeQuickQuote({ request: quoteTypeRequest }));
    } else {
      this.store.dispatch(quoteInsuranceTypeApplication({ request: quoteTypeRequest }));
    }
    sessionStorage.setItem("LASTSELECTEDAPPLICATION", this.applicationIndex()?.toString());
    this.store
      .select(loadingInformationSelector)
      .pipe(take(2))
      .subscribe((loading) => {
        if (!loading) {
          this.getTotalPremiumPayment();
          this.getLifeCoveragePercentage();
          this.dropDownListBehavior();
          this.store.dispatch(setLoadingSpinner({ status: false }));
          setTimeout(() => {
            this.isRequotingDone.emit(this.applicationIndex());
          }, 500);
        }
      });
  }

  private dropDownListBehavior() {
    this.quoteInsuranceTypeResponseData$.subscribe((response) => {
      response.applications.forEach((application: ApplicationRequest) => {
        application.applicants?.forEach((applicant) => {
          applicant?.applicantCoverages?.forEach((coverage) => {
            const control = this.coverageForm.get(`dropDown${coverage.coverageType}-${applicant.applicantSequence}`);

            this.coverageForm
              .get(`dropDown${coverage.coverageType}-${applicant.applicantSequence}`)
              ?.setValue(coverage.coverageCode.toString());

            const selectable = this.waiverReasonsByCoverageType(coverage.coverageType)?.find(
              (cover) => cover.waiverReasonCode === coverage.coverageCode.toString()
            )?.isSelectable;

            if (selectable !== undefined && !selectable) {
              control?.disable();
            } else {
              control?.enable();
            }
          });
        });
      });
    });
  }

  public getLifeCoveragePercentage() {
    this.store.select(quoteInsuranceTypeResponseSelector).subscribe((quoteTypeResponse: QuoteInsuranceTypeResponse) => {
      quoteTypeResponse.applications.forEach((application: Application) => {
        const coverageLifeValue = application.coverages?.find(
          (coverage: InsuranceTypeCoverageResponse) => coverage.coverageType === COVERAGE_TYPE.LIFE
        );

        const coverageDisValue = application?.coverages?.find(
          (coverage: InsuranceTypeCoverageResponse) => coverage.coverageType === COVERAGE_TYPE.DIS
        );

        const coverageIuiValue = application?.coverages?.find(
          (coverage: InsuranceTypeCoverageResponse) => coverage.coverageType === COVERAGE_TYPE.IUI
        );

        const coveragePercent = coverageLifeValue?.coveragePercent;
        const lifeInsuredAmount = coverageLifeValue?.insuredAmount;

        let insuredPaymentPercentGlobalDIS = coverageDisValue?.coveragePercent;

        const insuredPaymentPercentGlobal =
          insuredPaymentPercentGlobalDIS === 0 ? coverageIuiValue?.coveragePercent : insuredPaymentPercentGlobalDIS;

        let disabilityInsuredAmountDIS = coverageDisValue?.insuredAmount;

        const disabilityInsuredAmount =
          disabilityInsuredAmountDIS === 0 ? coverageIuiValue?.insuredAmount : disabilityInsuredAmountDIS;

        let coveragesValues = this.applicationCoveragesValues.find(
          (applicationCover) => applicationCover.id === application.id
        );

        if (coveragesValues?.id === undefined) {
          this.applicationCoveragesValues.push({
            id: application.id,
            lifeLoanPercentageGlobal: coveragePercent ? coveragePercent : 0,
            lifeLoanAmountGlobal: lifeInsuredAmount ? lifeInsuredAmount : 0,
            insuredPaymentPercentageGlobal: insuredPaymentPercentGlobal ? insuredPaymentPercentGlobal : 0,
            insuredPaymentAmountGlobal: disabilityInsuredAmount ? disabilityInsuredAmount : 0,
          });
        } else if (coveragesValues.id === application.id) {
          if (coveragesValues.lifeLoanPercentageGlobal !== coveragePercent) {
            coveragesValues = {
              ...coveragesValues,
              lifeLoanPercentageGlobal: coveragePercent,
            };
          }

          if (coveragesValues.lifeLoanAmountGlobal !== lifeInsuredAmount) {
            coveragesValues = {
              ...coveragesValues,
              lifeLoanAmountGlobal: lifeInsuredAmount,
            };
          }

          if (coveragesValues.insuredPaymentPercentageGlobal !== insuredPaymentPercentGlobal) {
            coveragesValues = {
              ...coveragesValues,
              insuredPaymentPercentageGlobal: insuredPaymentPercentGlobal,
            };
          }

          if (coveragesValues.insuredPaymentAmountGlobal !== disabilityInsuredAmount) {
            coveragesValues = {
              ...coveragesValues,
              insuredPaymentAmountGlobal: disabilityInsuredAmount,
            };
          }
        }

        this.coverageForm
          .get(`lifeLoanPercentage-${application.id}`)
          ?.setValue(coveragesValues?.lifeLoanPercentageGlobal?.toFixed(8));

        this.coverageForm.get(`lifeLoanAmount-${application.id}`)?.setValue(coveragesValues?.lifeLoanAmountGlobal);

        const coverage: InsuranceTypeCoverageResponse[] = this.applications()[this.applicationIndex()].coverages || [];

        if (this.insuranceType() !== 'OB' || (this.insuranceType() === 'OB' && coverage?.filter((cov) => cov.coverageType === 'LIFE')[0].premiumAmount > 0)) {
          this.coverageForm
            .get(`insuredPaymentPercentage-${application.id}`)
            ?.setValue(coveragesValues?.insuredPaymentPercentageGlobal?.toFixed(8));


          this.coverageForm
            .get(`insuredPaymentAmount-${application.id}`)
            ?.setValue(coveragesValues?.insuredPaymentAmountGlobal);
        }
      });
    });
  }

  public getTotalPremiumPayment() {
    let premiumValue: number = 0;
    if (
      this.quoteInsuranceTypeResponse.applications !== null &&
      this.quoteInsuranceTypeResponse.applications.length > 0
    ) {
      this.quoteInsuranceTypeResponse?.applications[this.applicationIndex()]?.coverages?.forEach(
        (coverage: InsuranceTypeCoverageResponse) => {
          premiumValue += coverage.premiumAmount + coverage.premiumTaxAmount;
        }
      );
    }

    return premiumValue;
  }

  private prepareQuoteRequest = (
    indexTab: number,
    applicationCarrierType: string,
    applicantIdentifier?: number | undefined
  ): QuoteInsuranceTypeRequest => ({
    loanId: this.quoteInsuranceTypeResponse.loanId,
    loanType: this.loan.loanType,
    insuranceType: this.loan.insuranceType,
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
  });

  private getApplicationsRequest(applicationCarrierType: string): InsuranceTypeApplicationRequest[] {
    let insuranceTypeApplicationsRequest: InsuranceTypeApplicationRequest[] = [];
    this.quoteInsuranceTypeResponse.applications.forEach((application) => {
      if (application.id) {
        const applicationRequest: InsuranceTypeApplicationRequest = {
          id: application.id,
          loanAmountCovered: application.loanAmountCovered,
          loanPaymentAmountCovered: application.loanPaymentAmountCovered,
          amortization: application.amortization,
          applicants: application.applicants.map((applicant: Applicant) => {
            const applicationId: number = application.id !== undefined ? application.id : 0;
            //const coverages = this.getCoveragesRequest(applicant, application.applicants, applicationId);
            const coverages = this.getCoveragesRequest(applicant, application.applicants, applicationId);

            let applicantType = applicant.applicantType;
            if (applicationCarrierType === INSURANCE_TYPE.SINGLE_PREMIUM) {
              applicantType = this.enumService.getAbbreviation(getApplicantTypeList(), applicant.applicantSequence);
            }

            const applicantTemp: InsuranceTypeApplicantRequest = {
              applicantType: applicantType,
              applicantSequence: applicant.applicantSequence,
              applicantIdentifier: applicant.applicantIdentifier,
              firstName: applicant.firstName,
              lastName: applicant.lastName,
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
          }),
        };

        insuranceTypeApplicationsRequest.push(applicationRequest);
      }
    });

    return insuranceTypeApplicationsRequest;
  }

  private getProvinceByApplicant(applicant: Applicant): string {
    let province: string | undefined = '';
    this.store.select(insuranceApplicationApplicantFormGroupSelector).subscribe((formGroups) => {
      province = formGroups.filter(
        (group) => group.personalInfoForm?.applicantIdentifier === applicant.applicantIdentifier
      )[0]?.addressForm?.province;

      if (!province) {
        province = formGroups.find(
          (group) => group.personalInfoForm?.applicantIdentifier === applicant.applicantIdentifier
        )?.personalInfoForm?.applicantAddresses[0].province;
      }
    });

    return province;
  }

  private getCoveragesRequest(
    applicant: Applicant,
    applicantList: Applicant[],
    applicationId: number
  ): InsuranceTypeCoverageRequest[] {
    const lifeParams = ['LIFE', 'CI', 'IUI', 'ADB'];
    const disParams = ['DIS', 'IUI'];
    let coveragesRequest: InsuranceTypeCoverageRequest[] = [];
    let lifeCoverageCodeTaken: string = '0';
    let coverageLifePercentage = this.getPercentagePerCoverageType('LIFE', applicantList);
    applicant.applicantCoverages?.forEach((coverage) => {
      const control = this.coverageForm.controls[`dropDown${coverage.coverageType}-${applicant.applicantSequence}`];

      const lifeLoanPercentage = this.coverageForm.controls[`lifeLoanPercentage-${applicationId}`]?.value || 0;
      const disabilityPaymentPercentage = this.coverageForm.controls[`insuredPaymentPercentage-${applicationId}`]?.value || 0;

      if (coverage.coverageType === COVERAGE_TYPE.LIFE) {
        lifeCoverageCodeTaken = control.value;
      }

      let coveragePercentage = 0;
      if (parseFloat(lifeLoanPercentage) === 0 && parseFloat(disabilityPaymentPercentage) === 0) {
        if (coverageLifePercentage === HUNDRED_VALUE && lifeParams.includes(coverage.coverageType)) {
          coveragePercentage = HUNDRED_VALUE;
        } else {
          coveragePercentage = this.getPercentagePerCoverageType(coverage.coverageType, applicantList);
        }
      } else {
        if (disParams.includes(coverage.coverageType)) {
          if (
            Number(this.getCoverageCode(lifeCoverageCodeTaken, control)) % HUNDRED_VALUE === 0 &&
            Number(this.coverageForm.controls[`insuredPaymentPercentage-${applicationId}`].value) === 0
          ) {
            coveragePercentage =
              parseFloat(lifeLoanPercentage) >= HUNDRED_VALUE ? HUNDRED_VALUE : parseFloat(lifeLoanPercentage);
          } else {
            coveragePercentage =
              parseFloat(lifeLoanPercentage) >= disabilityPaymentPercentage
                ? disabilityPaymentPercentage
                : parseFloat(lifeLoanPercentage);
          }
        } else {
          if (
            Number(this.getCoverageCode(lifeCoverageCodeTaken, control)) % HUNDRED_VALUE === 0 &&
            Number(this.coverageForm.controls[`lifeLoanPercentage-${applicationId}`].value) === 0
          ) {
            coveragePercentage = HUNDRED_VALUE;
          } else {
            coveragePercentage = lifeLoanPercentage;
          }
        }
      }

      const coverageTemp: InsuranceTypeCoverageRequest = {
        coverageType: coverage.coverageType,
        coverageCode: this.getCoverageCode(lifeCoverageCodeTaken, control),
        coveragePercent: coveragePercentage,
        healthQuestionAnswers: [],
      };
      coveragesRequest.push(coverageTemp);
    });

    return coveragesRequest;
  }

  private getPercentagePerCoverageType(coverageType: string, applicantList: Applicant[]): number {
    let percentage: number = 0;
    applicantList.every((applicant) => {
      const control = this.coverageForm.controls[`dropDown${coverageType}-${applicant.applicantSequence}`];

      if (parseInt(control.value) % HUNDRED_VALUE === 0) {
        percentage = HUNDRED_VALUE;
        return false;
      }

      return true;
    });

    return percentage;
  }

  public getCoverageCode(lifeCoverageCodeTaken: string, control: AbstractControl): string {
    return lifeCoverageCodeTaken === '100' && control.value.toString().indexOf('12') !== -1
      ? control.value.toString().replace('12', '00')
      : control.value;
  }

  public waiverReasonsByCoverageType = (coverageType: string) => {
    const result = this.waiverReasonsList?.filter((waiver: WaiverReason) => waiver.coverageType === coverageType);
    return result;
  };

  public canBeTakenPartially = () =>
    this.carrierInsuranceTypeList?.filter((insurance) => insurance.type === this.loan.insuranceType)[0]
      .canBeTakenPartially;

  private removeValidators(
    lifeLoanPercentageControl: AbstractControl | null,
    lifeLoanAmountControl: AbstractControl | null,
    insuredPercentageControl: AbstractControl | null,
    insuredPaymentControl: AbstractControl | null
  ) {
    lifeLoanPercentageControl?.clearValidators();
    lifeLoanAmountControl?.clearValidators();
    insuredPercentageControl?.clearValidators();
    insuredPaymentControl?.clearValidators();

    lifeLoanPercentageControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
    insuredPercentageControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);

    lifeLoanAmountControl?.setValidators([Validators.required, Validators.min(0)]);
    insuredPaymentControl?.setValidators([Validators.required, Validators.min(0)]);
  }

  public reQuoteValues(event: any) {
    const controlName: string = event.target.name;
    const control = this.coverageForm.get(controlName);
    const coverage: InsuranceTypeCoverageResponse[] = this.applications()[this.applicationIndex()].coverages || [];
    const controlValue = parseFloat(control?.value);

    if (!control?.pristine && !isNaN(controlValue) && controlValue > 0) {
      const lifeLoanPercentageControl = this.coverageForm.get(
        `lifeLoanPercentage-${this.applications()[this.applicationIndex()].id}`
      );
      const lifeLoanAmountControl = this.coverageForm.get(
        `lifeLoanAmount-${this.applications()[this.applicationIndex()].id}`
      );
      const insuredPercentageControl = this.coverageForm.get(
        `insuredPaymentPercentage-${this.applications()[this.applicationIndex()].id}`
      );
      const insuredPaymentControl = this.coverageForm.get(
        `insuredPaymentAmount-${this.applications()[this.applicationIndex()].id}`
      );

      this.removeValidators(
        lifeLoanPercentageControl,
        lifeLoanAmountControl,
        insuredPercentageControl,
        insuredPaymentControl
      );
      let callReQuoteFlag = false;

      // TODO: Validate field on change
      const applicationValues = this.applicationCoveragesValues.find(
        (values) => values.id === this.applications()[this.applicationIndex()].id
      );
      switch (controlName) {
        case `lifeLoanPercentage-${this.applications()[this.applicationIndex()].id}`:
          if (parseFloat(control?.value) < 0) {
            lifeLoanPercentageControl?.setValidators([Validators.min(0)]);
            control?.setErrors({
              minValue: true,
            });
            return;
          }


          if (this.insuranceType() === 'OB' && coverage?.filter((cov) => cov.coverageType === 'LIFE')[0].premiumAmount > 0) {
            insuredPercentageControl?.setValue(controlValue);
          }
          const lifeLoanAmountValue: number = (this.loan.loanAmount * controlValue) / HUNDRED_VALUE;
          lifeLoanAmountControl?.setValue(lifeLoanAmountValue);
          callReQuoteFlag = true;
          break;

        case `lifeLoanAmount-${this.applications()[this.applicationIndex()].id}`:

          
          if (parseFloat(control?.value) < 0) {
            lifeLoanAmountControl?.setValidators([Validators.min(0)]);
            control?.setErrors({
              minValue: true,
            });
            return;
          }
          if (parseFloat(control?.value) > this.loan.loanAmount && applicationValues?.lifeLoanAmountGlobal !== undefined) {
            lifeLoanAmountControl?.setValidators([Validators.max(applicationValues?.lifeLoanAmountGlobal)]);
            control?.setErrors({
              maxValue: true,
            });
            return;
          }

          const lifeLoanPercentageValue: number = (HUNDRED_VALUE * controlValue) / this.loan.loanAmount;
          lifeLoanPercentageControl?.setValue(lifeLoanPercentageValue.toFixed(8));

          if (this.insuranceType() === 'OB') {
            insuredPercentageControl?.setValue(lifeLoanPercentageValue.toFixed(8));
          }


          callReQuoteFlag = true;
          break;

        case `insuredPaymentPercentage-${this.applications()[this.applicationIndex()].id}`:

          
          if (parseFloat(control?.value) < 0) {
            lifeLoanPercentageControl?.setValidators([Validators.min(0)]);
            control?.setErrors({
              minValue: true,
            });
            return;
          }

          if (parseFloat(control?.value) > parseFloat(lifeLoanPercentageControl?.value) && this.insuranceType() !== 'OB') {
            insuredPercentageControl?.setValidators([Validators.max(lifeLoanPercentageControl?.value)]);
            insuredPercentageControl?.setErrors({
              maxValue: true,
            });
            return;
          }


          if (
            insuredPercentageControl &&
            applicationValues?.insuredPaymentAmountGlobal !== undefined
          ) {
            insuredPercentageControl.setValue(controlValue);
            const paymentValue: number =
              (applicationValues?.insuredPaymentAmountGlobal * parseFloat(insuredPercentageControl?.value)) / HUNDRED_VALUE;
            insuredPaymentControl?.setValue(paymentValue);
          }

          callReQuoteFlag = true;
          if (this.insuranceType() === 'OB' && coverage?.filter((cov) => cov.coverageType === 'LIFE')[0].premiumAmount > 0) {
            lifeLoanPercentageControl?.setValue(controlValue);
          }
          break;

        case `insuredPaymentAmount-${this.applications()[this.applicationIndex()].id}`:
          if (parseFloat(control?.value) < 0) {
            insuredPaymentControl?.setValidators([Validators.min(0)]);
            insuredPaymentControl?.setErrors({
              minValue: true,
            });
            return;
          }
          if (parseFloat(control?.value) > this.loan.paymentAmount) {
            insuredPaymentControl?.setValidators([Validators.min(0)]);
            insuredPaymentControl?.setErrors({
              minValue: true,
            });
            return;
          }
          if (parseFloat(control?.value) > this.loan.paymentAmount && applicationValues?.insuredPaymentAmountGlobal && this.insuranceType() !== 'OB') {
            insuredPaymentControl?.setValidators([Validators.max(applicationValues?.insuredPaymentAmountGlobal)]);
            insuredPaymentControl?.setErrors({
              maxValue: true,
            });
            return;
          }
          const paymentPercentage: number = (parseFloat(control?.value) * HUNDRED_VALUE) / this.loan.paymentAmount;
          if (this.insuranceType() === 'OB') {
            insuredPercentageControl?.setValue(paymentPercentage.toFixed(8));
            lifeLoanPercentageControl?.setValue(paymentPercentage.toFixed(8));
          }
          if (this.insuranceType() !== 'OB') {
            insuredPercentageControl?.setValue(paymentPercentage.toFixed(8));
          }
          callReQuoteFlag = true;
          break;

        default:
          callReQuoteFlag = false;
          break;
      }

      if (callReQuoteFlag) {
        this.reQuoteInsurance();
      }
    }
  }
}
