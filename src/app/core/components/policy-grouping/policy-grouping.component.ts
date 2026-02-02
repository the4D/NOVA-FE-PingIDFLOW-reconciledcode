import { ChangeDetectorRef, Component, EventEmitter, inject, input, OnInit, Output } from '@angular/core';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgClass, AsyncPipe, DatePipe, formatDate } from '@angular/common';
import { FormBuilder, FormControl, Validators, FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatStepper } from '@angular/material/stepper';
import { Store } from '@ngrx/store';
import { filter, Observable, take } from 'rxjs';
import { Applicant, applicantInitialState } from '@core/models/insurance/applicant.model';
import { Application, ApplicationEvent, ApplicationRequest } from '@core/models/insurance/application.model';
import {
  InsuranceTypeApplicantRequest,
  InsuranceTypeApplicationRequest,
  InsuranceTypeCoverageRequest,
  QuoteInsuranceTypeRequest,
  quoteInsuranceTypeRequestInitialState,
  QuoteInsuranceTypeResponse,
} from '@core/models/insurance/quote-insurance-type.model';
import { ApplicantGroup, RegroupQuoteApplication } from '@core/models/insurance/regroup-applicant.model';
import { EnumService } from '@core/services/insurance/enum.service';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import {
  APPLICANT_TYPE,
  APPLICATION_STATUS,
  GUID_EMPTY,
  INSURANCE_TYPE,
  LOAN_TYPE,
  NOT_APPLICABLE,
  PAYMENT_TYPE,
  QQ_LOAN_IDENTIFIER,
} from '@core/utils/enums/insurance-enums';
import {
  getAddressStatusList,
  getAddressStructureTypeList,
  getAddressTypeList,
  getApplicantTypeList,
  getConsentTypeList,
  getCountryList,
  getEmailTypeList,
  getLoanTypeList,
  getPhoneTypeList,
} from '@core/utils/enums/system-enums';
import { AppState } from '@store';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import {
  quoteInsuranceTypeQuickQuote,
  regroupingApplicants,
  setInsuranceApplicationPad,
  upsertLoanApplication,
} from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import {
  insuranceApplicationApplicantFormGroupSelector,
  insuranceApplicationLoanSelector,
  loadingInformationSelector,
  quoteInsuranceTypeResponseSelector,
} from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { Loan, LoanRequest } from '@core/models/insurance/loan.model';
import { ApplicantCoverage } from '@core/models/insurance/coverage.model';
import { ApplicantAddress } from '@core/models/insurance/applicant-address.model';
import { ApplicantPhone } from '@core/models/insurance/applicant-phone.model';
import { ApplicantEmail } from '@core/models/insurance/applicant-email.model';
import { ApplicantConsent } from '@core/models/insurance/applicant-consent.model';
import _ from 'lodash';

interface ApplicantList {
  applicantType: string;
  applicantSequence: number | undefined;
  applicantIdentifier: string | undefined;
  applicationId: number | undefined;
  applicationStatus: string;
  firstName: string;
  lastName: string;
  gender: string;
  placeOfBirth: string;
  applicantAddresses: ApplicantAddress[];
  applicantPhones: ApplicantPhone[];
  applicantEmails: ApplicantEmail[];
  applicantConsents: ApplicantConsent[];
}

interface ApplicantOrdered {
  applicantIdentifier: string;
  applicantType: string;
  applicationId?: number;
}

@Component({
  selector: 'policy-grouping',
  templateUrl: './policy-grouping.component.html',
  styleUrls: ['./policy-grouping.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    AsyncPipe,
    DatePipe,
  ],
})
export class PolicyGroupingComponent implements OnInit {
  insuranceType = input<string>();
  stepper = input<MatStepper>();
  isQuickQuote = input<boolean>();

  @Output() sendApplicantEvent = new EventEmitter<ApplicationEvent>();
  private fb = inject(FormBuilder);
  private store = inject(Store<AppState>);
  private enumService = inject(EnumService);
  private stepService = inject(SharedStepService);

  public title: string = 'Policy Grouping';
  public description: string =
    'The maximum number of Applicants for a Monthly Policy is two per application. We will automatically pair together applicants to create multiple applications. You can change the pairings in the section beside.';
  public applicantList: ApplicantList[] = [];
  public quoteInsuranceTypeResponseData$: Observable<QuoteInsuranceTypeResponse> = new Observable();
  public applications!: ApplicationRequest[];
  public joinApplicantForm: FormGroup = this.fb.group({});
  public loanIdentifier!: string;
  public loan!: Loan;
  public isContentReady: boolean = false;

  constructor(private cd: ChangeDetectorRef) {
    this.quoteInsuranceTypeResponseData$ = this.store.select(quoteInsuranceTypeResponseSelector);
  }

  ngAfterContentInit(): void {
    this.cd.detectChanges();
  }

  ngOnInit() {
    this.getLoanFromSession();
    this.checkWhileLoading();
  }

  public getLoanFromSession = (loadCarrier: boolean = true) => {
    this.store.select(insuranceApplicationLoanSelector).subscribe((loan: Loan) => {
      if (loan) {
        this.loan = loan;
        this.loanIdentifier = loan.loanIdentifier;
      }
    });
  };

  private checkWhileLoading() {
    this.store.select(loadingInformationSelector).subscribe((loading) => {
      if (!loading) {
        this.stepService.currentStateInfo.subscribe((step) => {
          if (step.readOnlyBehavior && step.currentStep === 3) {
            this.quoteInsuranceTypeResponseData$.subscribe((response) => {
              this.applications = response.applications;

              this.applicantList = [];
              response.applications.forEach((application, index) => {
                application.applicants.forEach((applicant) => {
                  let applicantTemp = {
                    applicantType: applicant.applicantType,
                    applicantSequence: applicant.applicantSequence,
                    applicantIdentifier: applicant.applicantIdentifier,
                    applicationId: application.id,
                    applicationStatus: application.applicationStatus,
                    firstName: applicant.firstName,
                    lastName: applicant.lastName,
                    gender: applicant.gender,
                    applicantAddresses: applicant.applicantAddresses,
                    applicantConsents: applicant.applicantConsents,
                    applicantEmails: applicant.applicantEmails,
                    applicantPhones: applicant.applicantPhones,
                    placeOfBirth: applicant.placeOfBirth,
                  };

                  this.applicantList.push(applicantTemp);
                });

                if (this.applicantList.length === 3) {
                  this.applicantList.push({
                    applicantType: NOT_APPLICABLE,
                    applicantSequence: -1,
                    applicantIdentifier: NOT_APPLICABLE,
                    applicationId: application.id,
                    applicationStatus: application.applicationStatus,
                    firstName: NOT_APPLICABLE,
                    lastName: '',
                    gender: '',
                    applicantAddresses: [],
                    applicantConsents: [],
                    applicantEmails: [],
                    applicantPhones: [],
                    placeOfBirth: '',
                  });
                }

                if (index + 1 === response.applications.length) {
                  this.addApplicantsControlForm();
                }
              });

              Object.keys(this.joinApplicantForm.controls).forEach((controlName) => {
                this.joinApplicantForm.get(`${controlName}`)?.disable();
              });
            });
          } else if (step.currentStep === 3 || !this.stepper() || this.stepper()?.selectedIndex === 2) {
            this.removePreviousControls();
          }
        });
      }
    });
  }

  private removePreviousControls() {
    Object.keys(this.joinApplicantForm.controls).forEach((controlName) => {
      this.joinApplicantForm.removeControl(`${controlName}`);
      this.joinApplicantForm.get(controlName)?.reset();
      this.joinApplicantForm.get(controlName)?.updateValueAndValidity();
    });
    this.buildApplicants();
  }

  public buildApplicants() {
    this.store.select(quoteInsuranceTypeResponseSelector).subscribe((response) => {
      this.isContentReady = false;
      this.applications = [];
      this.applications = response.applications;
      this.applicantList = [];
      response.applications.forEach((application, index) => {
        application.applicants.forEach((applicant) => {
          let applicantTemp = {
            applicantType: applicant.applicantType,
            applicantSequence: applicant.applicantSequence,
            applicantIdentifier: applicant.applicantIdentifier,
            applicationId: application.id,
            applicationStatus: application.applicationStatus,
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            gender: applicant.gender,
            applicantAddresses: applicant.applicantAddresses,
            applicantConsents: applicant.applicantConsents,
            applicantEmails: applicant.applicantEmails,
            applicantPhones: applicant.applicantPhones,
            placeOfBirth: applicant.placeOfBirth,
          };

          this.applicantList.push(applicantTemp);
        });
        if (index + 1 === response.applications.length) {
          this.addApplicantsControlForm();
        }
      });
    });
  }

  private addApplicantsControlForm() {
    this.applicantList.forEach((applicant) => {
      const controlName = `joinDropDown${applicant.applicantIdentifier}-${applicant.applicationId}`;
      if (this.joinApplicantForm.get(controlName) === null) {
        this.joinApplicantForm.addControl(
          controlName,
          new FormControl(
            {
              disabled: applicant.applicationStatus === APPLICATION_STATUS.SUBMITTED ? true : false,
            },
            Validators.required
          )
        );
      }
    });
    this.setControlValues();
  }

  private setControlValues() {
    this.applicantList.forEach((applicant) => {
      const controlName = `joinDropDown${applicant.applicantIdentifier}-${applicant.applicationId}`;
      const controlValue: string | undefined = this.getJoinedApplicant(
        applicant.applicantIdentifier,
        applicant.applicationId
      );
      this.joinApplicantForm.get(controlName)?.setValue(controlValue);
      this.joinApplicantForm.get(controlName)?.updateValueAndValidity({ onlySelf: true });
    });
    this.isContentReady = true;
  }

  private getJoinedApplicant(applicantIdentifier: string | undefined, applicationId: number | undefined) {
    const applicant = this.applications
      .filter((application) => application.id === applicationId)[0]
      .applicants.filter((applicant) => applicant.applicantIdentifier !== applicantIdentifier?.toString());
    return applicant.length > 0 ? applicant[0].applicantIdentifier?.toString() : '0';
  }

  public getApplicantsToJoin = (applicantIdentifier: string | undefined, applicationId: number) => {
    const mapApplicantsList = [];
    mapApplicantsList.push({
      key: '0',
      trackValue: `${applicationId} ${applicantIdentifier}`,
      value: 'N/A',
    });

    this.applicantList
      .filter((applicant) => applicant.applicantIdentifier !== applicantIdentifier)
      .forEach((applicant) => {
        mapApplicantsList.push({
          key: applicant.applicantIdentifier ?? '0',
          trackValue: `${applicationId} ${applicantIdentifier} ${applicant.applicantIdentifier}`,
          value: applicant.firstName + ' ' + applicant.lastName,
        });
      });
    return mapApplicantsList;
  };

  private createLoanUpsertRequest(applications: ApplicationRequest[]): LoanRequest {
    let insuranceType = this.insuranceType();
    // let insuranceType = this.enumService.getSystemValue(getLoanTypeList(), this.loan.loanType);
    // if (this.loan.paymentType === PAYMENT_TYPE.INTEREST_ONLY && this.loan.loanType !== LOAN_TYPE.LINE_OF_CREDIT) {
    //   insuranceType = INSURANCE_TYPE.SINGLE_PREMIUM;
    // }
    const loanDto: LoanRequest = {
      loan: {
        loanIdentifier: this.loan.loanIdentifier,
        branchId: this.loan.branchId,
        userId: this.loan.userId,
        sourceType: this.loan.sourceType,
        loanType: this.loan.loanType,
        insuranceType: insuranceType,
        paymentType: this.loan.paymentType,
        fundingDate: this.loan.fundingDate,
        firstPaymentDate: this.loan.firstPaymentDate,
        issueDate: formatDate(this.loan.issueDate, 'yyyy-MM-dd', 'en-US'),
        effectiveDate: this.loan.effectiveDate,
        loanAmount: this.loan.loanAmount,
        paymentAmount: this.loan.paymentAmount,
        monthlyPaymentAmount: this.loan.monthlyPaymentAmount,
        paymentFrequency: this.loan.paymentFrequency,
        interestRate: this.loan.interestRate,
        loanTerm: this.loan.loanTerm,
        amortization: this.loan.amortization,
      },
      applications: applications,
    };
    return loanDto;
  }

  private getApplicantType(
    remainingApplicantsOrdered: ApplicantOrdered[],
    applications: ApplicationRequest[],
    applicant: Applicant,
    applicationIdsHasZero: boolean,
    applicantCount: number
  ): any {
    if (this.isQuickQuote() === undefined) {
      if (
        applicationIdsHasZero ||
        remainingApplicantsOrdered.some(
          (remainingApplicant, index) =>
            remainingApplicantsOrdered.findIndex((obj) => obj.applicationId === remainingApplicant.applicationId) !==
            index
        )
      ) {
        return !remainingApplicantsOrdered.some(
          (remainingApplicant, index) =>
            remainingApplicantsOrdered.findIndex((obj) => obj.applicationId === remainingApplicant.applicationId) !==
            index
        )
          ? APPLICANT_TYPE.PRIMARY
          : applicant.applicantType;
      } else {
        return applications.some(
          (remainingApplicant, index) => applications.findIndex((obj) => obj.id === applicant.applicationId) !== index
        )
          ? APPLICANT_TYPE.PRIMARY
          : APPLICANT_TYPE.SECONDARY;
      }
    } else {
      if (
        remainingApplicantsOrdered.some(
          (remainingApplicant, index) =>
            remainingApplicantsOrdered.findIndex((obj) => obj.applicantIdentifier !== applicant.applicantIdentifier) !==
            index
        )
      ) {
        return applications.some(
          (remainingApplicant, index) => applications.findIndex((obj) => obj.id !== applicant.applicationId) !== index
        ) && applicantCount === 0
          ? APPLICANT_TYPE.PRIMARY
          : APPLICANT_TYPE.SECONDARY;
      }
    }
  }

  private isApplicationAdded(regroupApplications: ApplicationRequest[][], applicant: ApplicantOrdered): boolean {
    let hasDuplicateApplications = false;
    regroupApplications.filter((regroupApplication) =>
      regroupApplication.forEach((application) => {
        if (application.id === applicant.applicationId) {
          hasDuplicateApplications = true;
          return;
        }
      })
    );
    return hasDuplicateApplications;
  }
  private applicantExist(
    regroupApplications: ApplicationRequest[][],
    applicantIdentifier: string | undefined
  ): boolean {
    let hasDuplicateIdentifiers = false;
    regroupApplications.forEach((regroupApplication) => {
      regroupApplication.forEach((applicants) => {
        applicants.applicants.forEach((applicant) => {
          if (applicant.applicantIdentifier === applicantIdentifier) {
            hasDuplicateIdentifiers = true;
            return;
          }
        });
      });
    });
    return hasDuplicateIdentifiers;
  }
  private getApplicantBySequence(applicantIdentifier: string) {
    const result = this.applications.map(
      (application) =>
        application.applicants.filter(
          (applicant) => applicant.applicantIdentifier === applicantIdentifier.toString()
        )[0]
    );
    return result[0] ? result[0] : result[1] ? result[1] : result[2] ? result[2] : result[3];
  }

  private getRemainingApplication(applicationId: number): number {
    const result = this.applications.filter((application) => application.id !== applicationId)[0].id;
    return result ? result : 0;
  }
  private getApplicantByApplicationID(applicantIdentifier: string, applicationId: number) {
    let result: Applicant[] = [];
    let applicationGroup: ApplicationRequest[] = [];
    if (this.isQuickQuote() !== undefined) {
      var keepGoing = true;
      this.applications.forEach((application) => {
        application.applicants.forEach((applicant) => {
          if (applicant.applicantIdentifier === applicantIdentifier.toString() && keepGoing) {
            applicationGroup.push(application);
            keepGoing = false;
          }
        });
      });
      result = this.applications.map(
        (application) =>
          application.applicants.filter((applicant) =>
            applicant.applicantIdentifier !== applicantIdentifier.toString() && this.isQuickQuote() !== undefined
              ? applicationGroup[0].id
              : applicant.applicationId === applicationId
          )[0]
      );
    } else {
      result = this.applications.map(
        (application) =>
          application.applicants.filter(
            (applicant) => applicant.applicantIdentifier !== applicantIdentifier.toString() && applicant.applicationId === applicationId
          )[0]
      );
    }
    return result[0] ? result[0] : result[1];
  }
  private getRemainingApplicants(applicantIdentifiers: string[]): Applicant[] {
    const applicantList: Applicant[] = [];
    this.applications.forEach((application: ApplicationRequest) => {
      application.applicants
        .filter(
          (applicant: Applicant) =>
            !applicantIdentifiers.includes(applicant.applicantIdentifier ? applicant.applicantIdentifier : '')
        )
        .forEach((applicant: Applicant) => {
          applicantList.push(applicant);
        });
    });
    return applicantList;
  }
  private getApplicantsApplicationId(principalApplicationIds: number[], applicationId: number): number {
    const applicantId: number = 0;
    principalApplicationIds.includes(applicationId);
    principalApplicationIds.forEach((principalApplicationId) => {
      if (principalApplicationId === applicationId) {
        applicationId = 0;
      } else {
      }
    });
    return applicantId;
  }
  private getApplicantsOrdered(applicants: Applicant[], principalApplicationIds: number[]): ApplicantOrdered[] {
    const applicantsOrdered: ApplicantOrdered[] = [];
    if (applicants.length === 1) {
      applicantsOrdered.push({
        applicantIdentifier: applicants[0].applicantIdentifier ? applicants[0].applicantIdentifier : '0',
        applicantType: APPLICANT_TYPE.PRIMARY,
        applicationId: principalApplicationIds.includes(applicants[0].applicationId ?? 0)
          ? 0
          : applicants[0].applicationId,
      });
      return applicantsOrdered;
    }

    const applicantFiltered = applicants.filter(
      (applicant) => applicant.applicantType === this.enumService.getAbbreviation(getApplicantTypeList(), 1)
    );

    switch (applicantFiltered.length) {
      case 1: // !Where we have one PRIMARY Applicant
        applicantsOrdered.push({
          applicantIdentifier: applicantFiltered[0].applicantIdentifier
            ? applicantFiltered[0].applicantIdentifier
            : '0',
          applicantType: APPLICANT_TYPE.PRIMARY,
          applicationId: applicantFiltered[0].applicationId,
        });
        if (applicants.length > 1) {
          const secondApplicant = applicants.filter(
            (applicant) => applicant.applicantIdentifier !== applicantFiltered[0].applicantIdentifier
          )[0];
          applicantsOrdered.push({
            applicantIdentifier: secondApplicant.applicantIdentifier ? secondApplicant.applicantIdentifier : '0',
            applicantType: APPLICANT_TYPE.SECONDARY,
            applicationId: principalApplicationIds.includes(secondApplicant.applicationId ?? 0)
              ? 0
              : applicants[0].applicationId,
          });
        }
        break;

      case 2: // !Where we have two PRIMARY Applicants
        const applicantsSorted = applicants.sort(
          (a, b) => (a.applicantSequence ? a.applicantSequence : 0) - (b.applicantSequence ? b.applicantSequence : 1)
        );

        applicantsOrdered.push({
          applicantIdentifier: applicantsSorted[0].applicantIdentifier ? applicantsSorted[0].applicantIdentifier : '0',
          applicantType: APPLICANT_TYPE.PRIMARY,
          applicationId: applicantsSorted[0].applicationId,
        });

        if (applicants.length > 1) {
          applicantsOrdered.push({
            applicantIdentifier: applicantsSorted[1].applicantIdentifier
              ? applicantsSorted[1].applicantIdentifier
              : '0',
            applicantType:
              applicants[0].applicationId === applicants[1].applicationId
                ? APPLICANT_TYPE.SECONDARY
                : APPLICANT_TYPE.PRIMARY,
            applicationId: applicantsSorted[1].applicationId,
          });
        }
        break;

      default: // !Where we have two Secondary Applicants
        if (applicants.length > 1) {
          const applicantsSorted = applicants.sort(
            (a, b) => (a.applicantSequence ? a.applicantSequence : 0) - (b.applicantSequence ? b.applicantSequence : 1)
          );

          applicantsOrdered.push({
            applicantIdentifier: applicantsSorted[0].applicantIdentifier
              ? applicantsSorted[0].applicantIdentifier
              : '0',
            applicantType: APPLICANT_TYPE.PRIMARY,
            applicationId: applicantsSorted[0].applicationId,
          });

          applicantsOrdered.push({
            applicantIdentifier: applicantsSorted[1].applicantIdentifier
              ? applicantsSorted[1].applicantIdentifier
              : '0',
            applicantType: APPLICANT_TYPE.SECONDARY,
            applicationId: applicantsSorted[1].applicationId,
          });
        }
        break;
    }

    return applicantsOrdered;
  }

  public joinApplicantSelectionChanged(event: MatSelectChange) {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.isContentReady = false;
    const applicantIdentifier = event.value + '';
    const applicationIds: number[] = [];
    const principalApplicationIds: number[] = [];
    const controlValues: string[] = event.source.ngControl.name
      ? event.source.ngControl.name?.toString().replace('joinDropDown', '').split('-')
      : ['0', '0'];

    let loanRequest: LoanRequest;
    let applications: ApplicationRequest[] = [];

    this.store.dispatch(setLoadingSpinner({ status: true }));
    const principalApplicant = this.getApplicantBySequence(controlValues[0]);
    principalApplicationIds.push(principalApplicant.applicationId ?? 0);
    const secondaryApplicant = applicantIdentifier !== '0' ? this.getApplicantBySequence(applicantIdentifier.toString()) : this.getApplicantByApplicationID(controlValues[0], parseInt(controlValues[1]));
    principalApplicationIds.push(secondaryApplicant?.applicationId ?? 0);
    const applicantIdentifiers: string[] = [
      principalApplicant?.applicantIdentifier ? principalApplicant?.applicantIdentifier : '',
      applicantIdentifier !== '0' && secondaryApplicant?.applicantIdentifier
        ? secondaryApplicant?.applicantIdentifier
        : '',
    ];
    //const secondApplicationId = this.getRemainingApplication(parseInt(controlValues[1]));
    const applicantIdentifiers1: string[] = [
      applicantIdentifier === '0' && secondaryApplicant?.applicantIdentifier
        ? secondaryApplicant?.applicantIdentifier
        : '',
    ];
    const remainingApplicantsOrdered = this.getApplicantsOrdered(
      this.getRemainingApplicants(applicantIdentifiers.concat(applicantIdentifiers1)),
      principalApplicationIds
    );
    this.applications.forEach((application) => {
      applicationIds.push(application.id ?? 0);
    });

    remainingApplicantsOrdered.map(({ applicationId }) => applicationId);
    if (
      applicantIdentifier === '0' ||
      remainingApplicantsOrdered.some((app) => app.applicationId === 0) ||
      _.difference(
        remainingApplicantsOrdered.map(({ applicationId }) => applicationId),
        applicationIds
      ).length === 0
    ) {
      applicationIds.push(0);
    }
    applications = this.getApplicationsAfterRegrouping(
      applicantIdentifiers,
      remainingApplicantsOrdered,
      principalApplicant,
      secondaryApplicant,
      applicationIds,
      applicantIdentifiers1
    );

    if (this.isQuickQuote() !== undefined) {
      this.store.dispatch(setLoadingSpinner({ status: true }));
      const quoteTypeRequest: QuoteInsuranceTypeRequest = this.prepareRequest(applications);
      this.store.dispatch(quoteInsuranceTypeQuickQuote({ request: quoteTypeRequest }));
    } else {
      loanRequest = this.createLoanUpsertRequest(applications);
      this.store.dispatch(upsertLoanApplication({ request: loanRequest }));
      this.store
        .select(loadingInformationSelector)
        .pipe(filter((loading) => !loading))
        .subscribe((loading) => {
          if (!loading) {
            if (this.stepper()?.selectedIndex === 1) {
              this.sendApplicantEvent.emit({ pass: true });
            }
          }
        });
    }

    this.store.select(loadingInformationSelector).subscribe((loading) => {
      if (!loading) {
        this.removePreviousControls();
        setTimeout(() => {
          this.store.dispatch(setLoadingSpinner({ status: false }));
        }, 1300);
      }
    });
  }

  private prepareRequest(reJoiningRequest: ApplicationRequest[]): QuoteInsuranceTypeRequest {
    let quoteRequest: QuoteInsuranceTypeRequest = quoteInsuranceTypeRequestInitialState();
    this.store
      .select(insuranceApplicationLoanSelector)
      .pipe(take(1))
      .subscribe((loan: Loan) => {
        quoteRequest = {
          loanId: GUID_EMPTY,
          loanType: loan.loanType,
          insuranceType: loan.insuranceType,
          paymentType: loan.paymentType,
          fundingDate: loan.fundingDate,
          firstPaymentDate: loan.firstPaymentDate,
          loanAmount: loan.loanAmount,
          paymentAmount: loan.paymentAmount,
          monthlyPaymentAmount: loan.paymentAmount,
          paymentFrequency: loan.paymentFrequency,
          interestRate: loan.interestRate,
          loanTerm: loan.loanTerm,
          amortization: loan.amortization,
          applications: this.getApplications(reJoiningRequest),
          branchId: loan.branchId,
          lenderId: loan.userId,
        };
      });

    return quoteRequest;
  }

  private prepareReJoinApplicants(reJoiningRequest: RegroupQuoteApplication): RegroupQuoteApplication[] {
    let reJoinedApplicants: RegroupQuoteApplication[] = [];
    let joinApplicantsGroup: ApplicantGroup[] = [];
    let prevAppId = 0;
    reJoiningRequest.applicants.forEach((reJoinApplicant) => {
      let joinApplicant: ApplicantGroup = {
        applicationId: reJoinApplicant.applicationId,
        applicantIdentifier: reJoinApplicant.applicantIdentifier,
        applicantType: reJoinApplicant.applicantType,
      };

      if (prevAppId === 0 || prevAppId === reJoinApplicant.applicationId) {
        joinApplicantsGroup.push(joinApplicant);
      } else {
        reJoinedApplicants.push({
          loanIdentifier: QQ_LOAN_IDENTIFIER,
          applicants: joinApplicantsGroup,
        });
        joinApplicantsGroup = [];
        joinApplicantsGroup.push(joinApplicant);
      }

      prevAppId = reJoinApplicant.applicationId;
    });
    reJoinedApplicants.push({
      loanIdentifier: '20240710QQ',
      applicants: joinApplicantsGroup,
    });
    return reJoinedApplicants;
  }

  private getApplicationsAfterRegrouping(
    applicantIdentifiers: string[],
    remainingApplicantsOrdered: ApplicantOrdered[],
    principalApplicant: Applicant | undefined,
    secondaryApplicant: Applicant,
    applicationIds: number[] = [],
    applicantIdentifiers1: string[]
  ): ApplicationRequest[] {
    let applications: ApplicationRequest[] = [];
    let applicationId: number = 0;
    let amortization: number = 0;
    let regroupApplications: ApplicationRequest[][] = [];
    if (applicantIdentifiers.length > 0) {
      let regroupApplications1: ApplicationRequest[] = [];
      let regroupApplicants: Applicant[] = [];
      this.applications.forEach((application) => {
        application.applicants.forEach((applicant) => {
          applicantIdentifiers.forEach((applicantIdentifier) => {
            if (applicant.applicantIdentifier === applicantIdentifier) {
              const applicantTemp: Applicant = {
                ...applicant,
                applicationId: principalApplicant?.applicationId ?? 0,
              };
              regroupApplicants.push(applicantTemp);
            }
            if (applicant.applicantIdentifier === principalApplicant?.applicantIdentifier) {
              applicationId = principalApplicant?.applicationId ?? 0;
              amortization = application.amortization !== undefined ? application.amortization : 0;
            }
          });
        });
      });
      regroupApplications1.push({
        id: applicationId,
        amortization: amortization,
        applicants: regroupApplicants,
      });
      regroupApplications.push(regroupApplications1);
      regroupApplicants = [];
      regroupApplications1 = [];
    }

    if (remainingApplicantsOrdered.length > 0) {
      const hasDuplicateIds = remainingApplicantsOrdered.some(
        (applicant, index) =>
          remainingApplicantsOrdered.findIndex((obj) => obj.applicationId === applicant.applicationId) !== index
      );
      if (hasDuplicateIds && this.isQuickQuote() === undefined) {
        let regroupApplicants: Applicant[] = [];
        let regroupApplications2: ApplicationRequest[] = [];
        this.applications.forEach((application) => {
          application.applicants.forEach((applicant) => {
            remainingApplicantsOrdered.forEach((applicantIdentifier) => {
              if (
                applicant.applicantIdentifier === applicantIdentifier.applicantIdentifier &&
                applicant.applicationId === applicantIdentifier.applicationId
              ) {
                regroupApplicants.push(applicant);
              }
              if (
                applicant.applicantIdentifier !== principalApplicant?.applicantIdentifier &&
                regroupApplicants.some(function (el) {
                  return el.applicantIdentifier === applicant.applicantIdentifier;
                })
              ) {
                applicationId = application.id ?? 0;
                amortization = application.amortization !== undefined ? application.amortization : 0;
              }
            });
          });
        });
        regroupApplications2.push({
          id: applicationId,
          amortization: amortization,
          applicants: regroupApplicants.sort((a, b) =>
            String(a.applicantSequence)?.localeCompare(String(b.applicantSequence), 'en', {
              numeric: true,
            })
          ),
        });
        regroupApplications.push(regroupApplications2);
        regroupApplicants = [];
        regroupApplications2 = [];
      } else {
        let regroupApplicants: Applicant[] = [];
        let regroupApplications4: ApplicationRequest[] = [];
        this.applications.forEach((application) => {
          application.applicants.forEach((applicant) => {
            remainingApplicantsOrdered.forEach((applicantIdentifier) => {
              if (applicant.applicantIdentifier === applicantIdentifier.applicantIdentifier) {
                const applicantTemp: Applicant = {
                  ...applicant,
                  applicationId:
                    regroupApplications.some(
                      (regroupApplication, index) =>
                        regroupApplication.findIndex((obj) => obj.id === applicantIdentifier.applicationId) !== index
                    ) && !this.isApplicationAdded(regroupApplications, applicantIdentifier)
                      ? applicantIdentifier.applicationId
                      : 0,
                };
                regroupApplicants.push(applicantTemp);
                applicationId =
                  regroupApplications.some(
                    (regroupApplication, index) =>
                      regroupApplication.findIndex((obj) => obj.id === applicantIdentifier.applicationId) !== index
                  ) && !this.isApplicationAdded(regroupApplications, applicantIdentifier)
                    ? (applicantIdentifier.applicationId ?? 0)
                    : 0;
                amortization = application.amortization !== undefined ? application.amortization : 0;
              }
            });
          });
          if (regroupApplicants.length > 0) {
            regroupApplications4.push({
              id: applicationId,
              amortization: amortization,
              applicants: regroupApplicants.sort((a, b) =>
                String(a.applicantSequence)?.localeCompare(String(b.applicantSequence), 'en', {
                  numeric: true,
                })
              ),
            });
            regroupApplications.push(regroupApplications4);
            regroupApplicants = [];
            regroupApplications4 = [];
          }
        });
      }
    }
    if (applicationIds.includes(0)) {
      const hasDuplicateIdentifiers = this.applicantExist(regroupApplications, secondaryApplicant?.applicantIdentifier);
      if (!hasDuplicateIdentifiers) {
        let regroupApplications3: ApplicationRequest[] = [];
        let regroupApplicants: Applicant[] = [];
        const applicantTemp: Applicant = {
          ...secondaryApplicant,
          applicationId: 0,
          applicantType: APPLICANT_TYPE.PRIMARY,
        };
        regroupApplicants.push(applicantTemp);

        regroupApplications3.push({
          id: 0,
          amortization: amortization,
          applicants: regroupApplicants,
        });
        regroupApplications.push(regroupApplications3);
        regroupApplicants = [];
        regroupApplications3 = [];
      }
    }
    regroupApplications.forEach((regroupApplication) => {
      regroupApplication.forEach((application) => {
        {
          let app: Applicant[] = [];
          applicationId = application.id ? application.id : 0;

          application.applicants.forEach((applicant) => {
            const applicantAddress: ApplicantAddress[] = [
              {
                applicantId: applicant.id,
                streetNumber: applicant?.applicantAddresses?.find((x) => x.streetNumber)?.streetNumber ?? '',
                unitNumber: applicant?.applicantAddresses?.find((x) => x.unitNumber)?.unitNumber ?? '',
                street: applicant?.applicantAddresses?.find((x) => x.street)?.street ?? '',
                city: applicant?.applicantAddresses?.find((x) => x.city)?.city ?? '',
                province: this.getProvinceByApplicant(applicant),
                postalCode: applicant?.applicantAddresses?.find((x) => x.postalCode)?.postalCode ?? '',
                country: this.enumService.getAbbreviation(
                  getCountryList(),
                  applicant?.applicantAddresses?.find((x) => x.country)?.country
                ),
                addressType: this.enumService.getAbbreviation(
                  getAddressTypeList(),
                  applicant.applicantAddresses.find((x) => x.addressType)?.addressType
                ),
                addressStructureType: this.enumService.getAbbreviation(getAddressStructureTypeList(), 1),
                addressStatus: this.enumService.getAbbreviation(
                  getAddressStatusList(),
                  applicant.applicantAddresses.find((x) => x.addressStatus)?.addressStatus
                ),
                isPrimary: applicant?.applicantAddresses?.find((x) => x.isPrimary)?.isPrimary ?? true,
                moveInDate: null,
                markForReview: applicant?.applicantAddresses?.find((x) => x.markForReview)?.markForReview ?? false,
              },
            ];
            const applicantPhone: ApplicantPhone[] = [
              {
                number: applicant?.applicantPhones?.find((x) => x.number)?.number ?? '',
                extension: '',
                phoneType: this.enumService.getAbbreviation(getPhoneTypeList(), 1),
                isPrimary: applicant?.applicantPhones?.find((x) => x.isPrimary)?.isPrimary ?? true,
              },
            ];
            
            let applicantEmail: ApplicantEmail[] = []
            if(applicant?.applicantEmails?.find((x) => x.emailAddress)?.emailAddress) 
            {
              applicantEmail = [
                {
                  emailAddress: applicant?.applicantEmails?.find((x) => x.emailAddress)?.emailAddress ?? '',
                  emailType: this.enumService.getAbbreviation(getEmailTypeList(), 1),
                  isPrimary: applicant?.applicantEmails?.find((x) => x.isPrimary)?.isPrimary ?? true,
                },
              ];
            }

            const applicantConsent: ApplicantConsent[] = [
              {
                id: applicant?.applicantConsents?.find((x) => x.id)?.id ?? '',
                applicantId: applicant?.applicantConsents?.find((x) => x.applicantId)?.applicantId ?? '',
                consentType: this.enumService.getAbbreviation(getConsentTypeList(), 2),
                hasConsented: applicant?.applicantConsents?.find((x) => x.hasConsented)?.hasConsented ?? true,
              },
            ];

            if (applicantIdentifiers.includes(applicant.applicantIdentifier ? applicant.applicantIdentifier : '')) {
              if (applicant.applicantIdentifier === principalApplicant?.applicantIdentifier) {
                const applicantTemp: Applicant = {
                  ...applicant,
                  gender: applicant.gender,
                  applicantAddresses: applicantAddress,
                  applicantPhones: applicantPhone,
                  applicantEmails: applicantEmail,
                  applicantConsents: applicantConsent,
                  applicantType: APPLICANT_TYPE.PRIMARY,
                  applicationId: applicationId,
                };
                app.push(applicantTemp);
              }
              if (applicant.applicantIdentifier === secondaryApplicant?.applicantIdentifier) {
                const applicantTemp: Applicant = {
                  ...applicant,
                  gender: applicant.gender,
                  applicantAddresses: applicantAddress,
                  applicantPhones: applicantPhone,
                  applicantEmails: applicantEmail,
                  applicantConsents: applicantConsent,
                  applicantType: APPLICANT_TYPE.SECONDARY,
                  applicationId: applicationId,
                };
                app.push(applicantTemp);
              }
            } else if (
              applicantIdentifiers1.includes(applicant.applicantIdentifier ? applicant.applicantIdentifier : '')
            ) {
              if (applicant.applicantIdentifier === secondaryApplicant?.applicantIdentifier) {
                const applicantTemp: Applicant = {
                  ...applicant,
                  gender: applicant.gender,
                  applicantAddresses: applicantAddress,
                  applicantPhones: applicantPhone,
                  applicantEmails: applicantEmail,
                  applicantConsents: applicantConsent,
                  applicantType: APPLICANT_TYPE.PRIMARY,
                  applicationId: applicationId,
                };
                app.push(applicantTemp);
              }
            } else {
              remainingApplicantsOrdered.forEach((applicantOrder) => {
                if (applicant.applicantIdentifier == applicantOrder.applicantIdentifier) {
                  const applicantTemp: Applicant = {
                    ...applicant,
                    gender: applicant.gender,
                    applicantAddresses: applicantAddress,
                    applicantPhones: applicantPhone,
                    applicantEmails: applicantEmail,
                    applicantConsents: applicantConsent,
                    applicantType: this.getApplicantType(
                      remainingApplicantsOrdered,
                      applications,
                      applicant,
                      applicationIds.includes(0),
                      app.length
                    ),
                    applicationId: applicationId,
                  };
                  app.push(applicantTemp);
                }
              });
            }
          });
          applications.push({
            id: applicationId,
            amortization: application.amortization !== undefined ? application.amortization : 0,
            applicants: app,
          });
        }
      });
    });
    return applications;
  }

  private getApplications(reJoiningRequest: ApplicationRequest[]): InsuranceTypeApplicationRequest[] {
    let insuranceTypeApplicationsRequest: InsuranceTypeApplicationRequest[] = [];
    let applications: InsuranceTypeApplicationRequest[] = [];
    reJoiningRequest.forEach((application, index) => {
      {
        const applicationRequest: InsuranceTypeApplicationRequest = {
          id: index + 1,
          loanAmountCovered: 0,
          loanPaymentAmountCovered: 0,
          amortization: application.amortization ?? 0,
          applicants: this.getInsuranceTypeApplicants(application.applicants),
        };

        insuranceTypeApplicationsRequest.push(applicationRequest);
      }
    });

    return insuranceTypeApplicationsRequest;
  }
  private getInsuranceTypeApplicants(applicants: Applicant[]): InsuranceTypeApplicantRequest[] {
    let insuranceTypeApplicantsRequest: InsuranceTypeApplicantRequest[] = [];
    let coverages: InsuranceTypeCoverageRequest[];
    applicants.forEach((applicant) => {
      this.quoteInsuranceTypeResponseData$.pipe(take(1)).subscribe((response: QuoteInsuranceTypeResponse) => {
        response.applications.forEach((application) => {
          const tempApp = application?.applicants.find(
            (applicantFind) => applicantFind.applicantIdentifier === applicant.applicantIdentifier
          );
          if (tempApp !== undefined) {
            coverages = this.getCoveragesRequest(tempApp, response.applications, 0);
          }
        });
      });
      const applicantTemp: InsuranceTypeApplicantRequest = {
        applicantType: applicant.applicantType,
        applicantSequence: applicant.applicantSequence,
        applicantIdentifier: applicant.applicantIdentifier,
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        birthDate: applicant.birthDate,
        isSmoker: applicant.isSmoker,
        selfEmployed: applicant.selfEmployed,
        workHours: applicant.workHours === 0 ? applicant.workHours : 20,
        province: this.getProvinceByApplicant(applicant) ? this.getProvinceByApplicant(applicant) : '',
        coverages: coverages ? coverages : [],
        gender: applicant.gender,
        applicantEmails: [],
        applicantPhones: [],
        applicantAddresses: [],
        applicantConsents: [],
      };
      insuranceTypeApplicantsRequest.push(applicantTemp);
    });

    return insuranceTypeApplicantsRequest;
  }

  private getCoveragesRequest(
    applicant: Applicant,
    applications: Application[],
    applicationId: number
  ): InsuranceTypeCoverageRequest[] {
    let coveragesRequest: InsuranceTypeCoverageRequest[] = [];

    applicant.applicantCoverages?.forEach((applicantCoverage: ApplicantCoverage) => {
      const percentage = applications
        .find((application) => application.id === applicationId)
        ?.coverages?.find((appCover) => appCover.coverageType === applicantCoverage.coverageType)?.coveragePercent;

      coveragesRequest.push({
        coverageType: applicantCoverage.coverageType,
        coverageCode: applicantCoverage.coverageCode,
        coveragePercent: percentage !== undefined ? percentage : 0,
        healthQuestionAnswers: [],
      });
    });

    return coveragesRequest;
  }

  private getProvinceByApplicant(applicant: Applicant | undefined): string {
    let province: string | undefined = '';
    this.store.select(insuranceApplicationApplicantFormGroupSelector).subscribe((formGroups) => {
      province = formGroups.filter(
        (group) => group.personalInfoForm?.applicantIdentifier === applicant?.applicantIdentifier
      )[0]?.addressForm?.province;

      if (province === undefined) {
        province = formGroups.find(
          (group) => group.personalInfoForm?.applicantIdentifier === applicant?.applicantIdentifier
        )?.personalInfoForm?.applicantAddresses[0].province;
      }
    });

    return province;
  }

  private getValueOf(value: any, defaultedValue: any) {
    if (value !== null && value !== undefined && value !== '') {
      return value;
    }

    return defaultedValue;
  }
}
