import { NgZone } from '@angular/core';

import { ApplicationService } from '@core/services/insurance/application.service';
import { formatDate } from '@angular/common';
import {
  FormControlStatus,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subscription, combineLatest, filter, of, take } from 'rxjs';
import { AfterViewInit, Component, Host, inject, input, OnDestroy, OnInit, output, QueryList } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { isEqual } from 'lodash';

import { ApplicantFormGroup } from '@core/models/insurance/applicant-formGroup.model';
import { ApplicationEvent, Application, ApplicationRequest } from '@core/models/insurance/application.model';
import { ApplicantEmail } from '@core/models/insurance/applicationDto.model';
import { Loan, LoanRequest } from '@core/models/insurance/loan.model';
import { MultiApplicantService } from '@core/services/insurance/multi-applicant.service';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { SystemService } from '@core/services/system/system.service';
import { ProductService } from '@core/services/tenant/product.service';
import { InsuranceTypeCoverage, CarrierLoanType, InsuranceType } from '@core/models/insurance/carrier-loan-type.model';
import {
  APPLICATION_TYPE,
  CONSENT_MARKETING_TERMS,
  CONSENT_APPLICATION_TERMS,
  INSURANCE_TYPE,
  LOAN_TYPE,
  PAYMENT_TYPE,
  getSmokerTypeList,
  getEmployedTypeList,
  FORM_STATUS,
  WORK_HOUR,
} from '@core/utils/enums/insurance-enums';
import {
  getGenderList,
  getPhoneTypeList,
  getProvinceList,
  getPlaceOfBirthList,
  getApplicantTypeList,
  getLoanTypeList,
} from '@core/utils/enums/system-enums';
import { EnumService } from '@core/services/insurance/enum.service';
import { SharedStep, SharedStepService } from '@core/services/insurance/shared-step.service';
import {
  insuranceApplicationApplicantFormGroupSelector,
  insuranceApplicationLoanSelector,
  loadingInformationSelector,
} from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { AppState } from '@store';
import { Applicant, ApplicantResult } from '@core/models/insurance/applicant.model';
import { ApplicantPhone } from '@core/models/insurance/applicant-phone.model';
import { upsertLoanApplication } from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import { ApplicantInfoComponent } from '../applicant-info.component';
import { AllCapsDirective } from '@core/directives/all-caps/all-caps.directive';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { TooltipDirective } from '@core/directives/tooltip/tooltip.directive';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { NgxMaskModule } from 'ngx-mask';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DateDirective } from '@core/directives/date-directive/date.directive';

@Component({
  selector: 'app-applicant-form',
  templateUrl: './applicant-form.component.html',
  styleUrls: ['./applicant-form.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMaskModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    TooltipDirective,
    MatIconModule,
    MatRadioModule,
    MatCheckboxModule,
    AllCapsDirective,
    DateDirective,
  ],
})
export class ApplicantFormComponent implements OnInit, OnDestroy, AfterViewInit {
 
  public applicantResults: ApplicantResult[] = [];
  public showForm: boolean = false;
  public dontShowNewApplicantButton: boolean = false;
  public selectedApplicant: any = null;

  private applicationService = inject(ApplicationService);

  public index = input.required<number>();
  public stepper = input.required<MatStepper>();
  public applicantRemoved = input.required<string>();
  public applicantAdded = input.required<boolean>();
  private ngZone = inject(NgZone);
  sendApplicantEvent = output<ApplicationEvent>();
  formValidEvent = output<boolean>();
  nameChangedEvent = output<{ fName: string, lName: string }>();
  applicationTypeEvent = output<number>();

  private fb = inject(FormBuilder);
  private multiApplicantService = inject(MultiApplicantService);
  private store = inject(Store<AppState>);
  private enumService = inject(EnumService);
  private systemService = inject(SystemService);
  private productService = inject(ProductService);
  private stepService = inject(SharedStepService);

  private applicantFormGroups: ApplicantFormGroup[] = [];
  private sourceApplicationType: string = '';
  private stepInfo!: SharedStep;
  private carrierInsuranceTypeList!: InsuranceType[];
  private carrierSubscription$ = new Subscription();
  private formSubscription$ = new Subscription();
  private combinedSubscription$ = new Subscription();
  public title!: string;
  public isApplicantDataPresent:boolean = false;
  public description!: string;
  public maxDate = new Date();
  public loan!: Loan;
  public application!: Application;
  public placeOfBirthList = getPlaceOfBirthList();
  public isReadOnly: boolean = false;
  public phoneTypeList = getPhoneTypeList();
  public genderList = getGenderList();
  public smokerTypeList = getSmokerTypeList();
  public selfEmployedTypeList = getEmployedTypeList();
  public provinceList = getProvinceList();
  public applicationType: number = 0;
  public insuranceTypeCoverages!: InsuranceTypeCoverage[];
  public workHourTooltip = 'For the past three (3) months at your occupation';
  public workHour = WORK_HOUR.MIN_WORK_HOURS_PER_WEEK;

  validAlphaNumericPattern = '^[a-zA-Z0-9]*';
  public applicantForm: FormGroup = this.fb.group({
    personalInfoForm: this.fb.group({
      applicantIdentifier: [
        null,
        [Validators.required, Validators.maxLength(20), Validators.pattern(this.validAlphaNumericPattern)],
      ],
      applicationId: null,
      applicantSequence: null,
      applicantType: null,
      firstName: [null, [Validators.required]],
      middleName: null,
      lastName: [null, [Validators.required]],
      birthDate: [null, [Validators.required]],
      placeOfBirth: [null, [Validators.required]],
      gender: [null, [Validators.required]],
      isSmoker: [null, [Validators.required]],
      language: 'en',
      selfEmployed: [null, [Validators.required]],
      occupation: [null, [Validators.required]],
      workHours: [false, [Validators.required]],
      applicationSignedDate: new Date(),
      loanIdentifier: null,
    }),
    emailForm: this.fb.group({
      applicantIdentifier: null,
      emailAddress: [null, [Validators.email]],
      isPrimary: true,
      emailType: 'Personal',
    }),
    homePhoneForm: this.fb.group({
      applicantIdentifier: null,
      extension: null,
      isPrimary: true,
      number: [null, [Validators.required]],
      phoneType: this.enumService.getAbbreviation(getPhoneTypeList(), 1),
    }),
    workPhoneForm: this.fb.group({
      applicantIdentifier: null,
      extension: null,
      isPrimary: false,
      number: null,
      phoneType: this.enumService.getAbbreviation(getPhoneTypeList(), 2),
    }),
    addressForm: this.fb.group({
      unitNumber: null,
      streetNumber: null,
      street: [null, [Validators.required]],
      city: [null, [Validators.required]],
      province: [null, [Validators.required]],
      postalCode: [null, [Validators.required]],
      country: 'CA',
      addressType: 'Mailing',
      addressStructureType: 'Civic',
      status: 'Own',
      addressReferenceType: 'Member Employment',
      isPrimary: true,
    }),
    consentForm: this.fb.group({
      hasConsented: [null, [Validators.required]],
    }),
  });
  public searchText: string = '';


  constructor(@Host() public parent: ApplicantInfoComponent) {}

  ngAfterViewInit(): void {
    this.unCheckAddress();
    if (this.index() > 0) {
      this.checkCurrentAddressStatus();
    }
  }

  // Called when search text changes
  onSearchChange(): void {
    if (!this.searchText || this.searchText.trim().length < 2) {
      this.applicantResults = [];
      return;
    }
    this.store.dispatch(setLoadingSpinner({ status: true }));
    //const params: any = { ApplicantIdentifier: this.searchText.trim() };
    this.applicationService.getApplicants(this.searchText?.trim()).subscribe((res: ApplicantResult[]) => {
      this.store.dispatch(setLoadingSpinner({ status: false }));
      this.applicantResults = res.map((value: ApplicantResult) => {
        let formattedBirthDate = '';
        if (value.birthDate) {
          const dateObj = new Date(value.birthDate);
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
          formattedBirthDate = `${day}/${month}/${year}`;
        }
        return {
          ...value,
          formattedBirthDate: formattedBirthDate,
          name: value.firstName + ' ' + value.lastName
        };
      });
      this.showForm = false;

    });
  }

  onSelectApplicant(applicant: any): void {
    this.selectedApplicant = applicant;
    this.showForm = true;
    this.searchText = '';
    const info = applicant;
    if (info) {
      this.applicantForm.patchValue({
        personalInfoForm: {
          applicantIdentifier: info.applicantIdentifier,
          firstName: info.firstName,
          middleName: info.middleName,
          lastName: info.lastName,
          birthDate: info.birthDate,
          placeOfBirth: info.placeOfBirth,
          gender: info.gender,
          isSmoker: info.isSmoker,
          maritalStatus: info.maritalStatus,
          workHours: info.workHours === 20 ? false : true,
          selfEmployed: info.selfEmployed,
          occupation: info.occupation,
        },
        homePhoneForm: {
          applicantIdentifier: info?.applicantPhone?.find((phone: ApplicantPhone) => phone.isPrimary)?.applicantIdentifier,
          number: info?.applicantPhone?.find((phone: ApplicantPhone) => phone.isPrimary)?.number || '',
          phoneType: info?.applicantPhone?.find((phone: ApplicantPhone) => phone.isPrimary)?.phoneType || 'Home',
          isPrimary: info?.applicantPhone?.find((phone: ApplicantPhone) => phone.isPrimary)?.isPrimary || true,
        },
        workPhoneForm: {
          applicantIdentifier: info?.applicantPhone?.find((phone: ApplicantPhone) => !phone.isPrimary)?.applicantIdentifier,
          number: info?.applicantPhone?.find((phone: ApplicantPhone) => !phone.isPrimary)?.number || '',
          phoneType: info?.applicantPhone?.find((phone: ApplicantPhone) => !phone.isPrimary)?.phoneType || 'Work',
          isPrimary:  false,
        },
        emailForm: {
          applicantIdentifier: info?.applicantEmail?.find((email: ApplicantEmail) => email.isPrimary)?.applicantIdentifier,
          emailAddress: info?.applicantEmail?.find((email: ApplicantEmail) => email.isPrimary)?.emailAddress || '',
        },
        addressForm: {
          street: info?.applicantAddresses?.[0]?.street || '',
          city: info?.applicantAddresses?.[0]?.city || '',
          province: this.enumService.getAbbreviationByDescription(getProvinceList(), info?.applicantAddresses?.[0]?.provinceName) || '',
          postalCode: info?.applicantAddresses?.[0]?.postalCode || '',
          country: info?.applicantAddresses?.[0]?.country || 'CA',
          streetNumber: info?.applicantAddresses?.[0]?.streetNumber || '',
          unitNumber: info?.applicantAddresses?.[0]?.unitNumber || '',
          addressType: info?.applicantAddresses?.[0]?.addressType || 'Mailing',

        }
      });
    }
  }

  onAddNewApplicant(): void {
    this.showForm = true;
    this.selectedApplicant = null;
    this.dontShowNewApplicantButton = true;
    this.searchText = '';  
    this.applicantForm.reset();
  }

  public showErrors() {
    this.applicantForm.markAllAsTouched();
    this.applicantForm.statusChanges.subscribe((status: FormControlStatus) => {
      this.formValidEvent.emit(status === FORM_STATUS.VALID);
    });
  }

  public send(applicantForms: QueryList<ApplicantFormComponent>) {
    if (!this.applicantForm.valid && this.sourceApplicationType !== '2' && this.applicationType !== 2) {
      this.showErrors();
      this.sendApplicantEvent.emit({ pass: false });
      return;
    } else {
      this.saveLoanInfo(applicantForms);
    }
  }

  private addCheckBoxControls() {
    if (this.index() > 0) {
      this.applicantForm.addControl(
        `sameAddressBox_${this.index()}`,
        new FormControl({ value: false, disabled: false })
      );
    }
  }

  ngOnInit(): void {
    this.addCheckBoxControls();
    this.combinedSubscription$ = combineLatest([
      this.applicantForm.get('personalInfoForm')?.get('firstName')?.valueChanges ?? of(''),
      this.applicantForm.get('personalInfoForm')?.get('lastName')?.valueChanges ?? of(''),
    ]).subscribe(([firstName, lastName]) => {
      if (!firstName || !lastName) return;
      this.nameChangedEvent.emit({ fName: firstName, lName: lastName });
    });

    this.getLoanFromSession();
    this.getApplicantInfoFromSession();
    this.formValidEvent.emit(this.applicantForm.valid);

    this.formSubscription$ = this.applicantForm.statusChanges.subscribe((statusChange) => {
      let status: string = FORM_STATUS.VALID;

      Object.keys(this.applicantForm.controls).forEach((controlName) => {
        const control = this.applicantForm.get(controlName);
        let controlChecked = false;
        if (control?.touched && !controlChecked) {
          status = control.status;
          controlChecked = true;
          return;
        }
      });

      if (statusChange === 'INVALID') {
        this.formValidEvent.emit(false);
      } else if (statusChange === 'VALID') {
        this.formValidEvent.emit(true);
      }
    });

    this.systemService.sourceApplicationType$.pipe(take(1)).subscribe((param: string) => {
      this.sourceApplicationType = param;
      if (param === '2') {
        this.applicantForm.disable();
        this.applicantForm.get('personalInfoForm')?.get('workHours')?.enable();
      } else {
        if (this.loan.sourceType === APPLICATION_TYPE.LOS) {
          this.applicationType = 2;
          this.applicationTypeEvent.emit(this.applicationType);
          this.applicantForm.disable();
          this.applicantForm.get('personalInfoForm')?.get('workHours')?.enable();
        } else {
          this.applicantForm.enable();
        }
      }
    });

    this.stepService.currentStateInfo.subscribe((step: SharedStep) => {
      this.stepInfo = step;
      if (step.currentStep === 2 && !step.readOnlyBehavior) {
        this.getLoanFromSession();
        this.getApplicantInfoFromSession();
        if (this.loan.sourceType === APPLICATION_TYPE.LOS) {
          // this.systemService.sourceApplicationType = '2';
          this.applicantForm.disable();
          this.applicantForm.get('personalInfoForm')?.get('workHours')?.enable();
        }
      }

      if (step.currentStep === 2 && step.readOnlyBehavior) {
        this.applicantForm.disable();
      }
    });
  }

  private getCarrierLoanTypesFromSession = () => {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.carrierSubscription$ = this.productService.carrierLoanTypes$
      .pipe(take(1))
      .subscribe((carrier: CarrierLoanType[]) => {
        this.carrierInsuranceTypeList = carrier.filter(
          (values) => values.value === this.loan.loanType
        )[0]?.insuranceTypes;
        this.insuranceTypeCoverages = carrier
          .filter((loanType: CarrierLoanType) => loanType.value === this.loan.loanType)[0]
          ?.insuranceTypes.filter((type) => type.type === this.loan.insuranceType)[0]?.coverages;
        this.store.dispatch(setLoadingSpinner({ status: false }));
      });
  };

  getLoanFromSession() {
    this.store.select(insuranceApplicationLoanSelector).subscribe((loan) => {
      this.loan = loan;
      if (loan.applications) {
        let applicationId;
        if (this.index() <= 1) {
          applicationId =
            loan?.applications[0]?.applicants[this.index()]?.applicationId !== undefined
              ? loan?.applications[0]?.applicants[this.index()]?.applicationId
              : loan?.applications[0]?.applicants[this.index()]?.id;
        } else {
          applicationId =
            this.applicantForm.get('personalInfoForm')?.value.applicationId === null
              ? 0
              : loan?.applications[1]?.applicants[this.index() - 2]?.applicationId !== undefined
                ? loan?.applications[1]?.applicants[this.index() - 2]?.applicationId
                : loan?.applications[1]?.applicants[this.index() - 2]?.id;
        }
        if (applicationId) {
          this.applicantForm.get('personalInfoForm')?.get('applicationId')?.setValue(applicationId);
        }
      }
      this.getCarrierLoanTypesFromSession();
      this.applicantForm
        .get('personalInfoForm')
        ?.get('loanIdentifier')
        ?.setValue(loan.loanIdentifier, { emitEvent: false });
    });
  }

  ngOnDestroy() {
    // this.formValidEvent.complete();
    // this.nameChangedEvent.complete();
    // this.sendApplicantEvent.complete();
    this.formSubscription$.unsubscribe();
    this.combinedSubscription$.unsubscribe();
    this.carrierSubscription$.unsubscribe();
  }

  private getApplicantInfoFromSession() {
    this.store
      .select(insuranceApplicationApplicantFormGroupSelector)
      .subscribe((applicantFormGroups: ApplicantFormGroup[]) => {
        if (!applicantFormGroups || applicantFormGroups.length <= this.index()) return;

        this.applicantFormGroups = applicantFormGroups;
        const formValues = applicantFormGroups[this.index()];
        if (!formValues) return;

        const applicant = formValues.personalInfoForm;
        
        if(applicant){
          this.isApplicantDataPresent = true;
        }else{
          this.isApplicantDataPresent = false;  
        }

        this.isReadOnly = this.multiApplicantService.setReadOnly(this.applicantForm);
        this.applicantForm.patchValue(applicantFormGroups[this.index()], { emitEvent: false });
        // this.applicantForm.patchValue(formValues, { emitEvent: false });

        let workHoursPerWeek =
          applicantFormGroups[this.index()].personalInfoForm?.workHours === undefined
            ? 0
            : applicantFormGroups[this.index()].personalInfoForm?.workHours;

        if (typeof workHoursPerWeek == 'number' && !isNaN(workHoursPerWeek)) {
          workHoursPerWeek = workHoursPerWeek === undefined ? 0 : workHoursPerWeek;
          this.applicantForm
            .get('personalInfoForm')
            ?.get('workHours')
            ?.setValue(workHoursPerWeek < WORK_HOUR.MIN_WORK_HOURS_PER_WEEK ? true : false);
        }

        if (applicant?.applicantIdentifier && applicant.applicantIdentifier) {
          this.patchIdentifiersToForm(applicant.applicationId, applicant.applicantIdentifier);
        }
      });
  }

  private getApplicantType(
    applicationId: number,
    applicantType: string,
    index: number,
    sourceType: string,
    applicantSequence: number
  ) {
    if (sourceType === APPLICATION_TYPE.LOS) {
      return this.enumService.getAbbreviation(getApplicantTypeList(), applicantSequence);
    } else {
      return applicationId !== null
        ? applicantType
        : this.enumService.getAbbreviation(getApplicantTypeList(), index + 1);
    }
  }

  public createApplicantList(applicantForms: QueryList<ApplicantFormComponent>, sourceType: string) {
    const applicantsList: Applicant[] = [];
    const applicationIds: number[] = [];
    const applicationsList: ApplicationRequest[] = [];

    applicantForms.forEach((applicantInfo, index) => {
      let values = applicantInfo.applicantForm.getRawValue();
      const applicantEmail: ApplicantEmail[] = [];
      if (values.emailForm.emailAddress != null && values.emailForm.emailAddress !== '') {
        applicantEmail.push({
          emailAddress: values.emailForm.emailAddress,
          emailType: values.emailForm.emailType,
          isPrimary: values.emailForm.isPrimary,
        });
      }
      const applicantPhoneNumbers: ApplicantPhone[] = [
        {
          number: values.homePhoneForm.number,
          extension: '',
          phoneType: values.homePhoneForm.phoneType,
          isPrimary: values.homePhoneForm.isPrimary,
        },
      ];
      if (values.workPhoneForm.number !== null && values.workPhoneForm.number !== '') {
        applicantPhoneNumbers.push({
          number: values.workPhoneForm.number,
          extension: '',
          phoneType: values.workPhoneForm.phoneType,
          isPrimary: values.workPhoneForm.isPrimary,
        });
      }

      let applicant: Applicant = {
        applicationId: values.personalInfoForm.applicationId === null ? 0 : values.personalInfoForm.applicationId,
        applicantIdentifier: values.personalInfoForm.applicantIdentifier,
        applicantType: !this.applicantAdded()
          ? this.getApplicantType(
              values.personalInfoForm.applicationId,
              values.personalInfoForm.applicantType,
              index,
              this.loan.sourceType,
              values.personalInfoForm.applicantSequence
            )
          : this.enumService.getAbbreviation(getApplicantTypeList(), index + 1),
        firstName: values.personalInfoForm.firstName,
        middleName: values.personalInfoForm.middleName,
        lastName: values.personalInfoForm.lastName,
        placeOfBirth: values.personalInfoForm.placeOfBirth,
        birthDate: values.personalInfoForm.birthDate,
        gender: values.personalInfoForm.gender,
        isSmoker: values.personalInfoForm.isSmoker,
        language: values.personalInfoForm.language,
        selfEmployed: values.personalInfoForm.selfEmployed,
        workHours: values.personalInfoForm.workHours == true ? 0 : 20,
        occupation: values.personalInfoForm.occupation,
        applicationSignedDate: values.personalInfoForm.applicationSignedDate,
        applicantAddresses: [
          {
            streetNumber: values.addressForm.streetNumber,
            unitNumber: values.addressForm.unitNumber,
            street: values.addressForm.street,
            city: values.addressForm.city,
            province: values.addressForm.province,
            postalCode: values.addressForm.postalCode,
            country: 'CA',
            addressType: 'Mailing',
            addressStructureType: 'Civic',
            addressStatus: 'Own',
            isPrimary: values.addressForm.isPrimary,
            moveInDate: null,
            markForReview: false,
          },
        ],
        applicantPhones: applicantPhoneNumbers,
        applicantEmails: applicantEmail,
        applicantConsents: [
          {
            consentType: CONSENT_MARKETING_TERMS,
            hasConsented: values.consentForm.hasConsented,
          },
          {
            consentType: CONSENT_APPLICATION_TERMS,
            hasConsented: true,
          },
        ],
      };

      if (this.applicantAdded()) {
        applicant = {
          ...applicant,
          applicantType: this.enumService.getAbbreviation(getApplicantTypeList(), index + 1),
        };
      }

      if (!this.applicantAdded()) {
        applicant = {
          ...applicant,
          applicantSequence: values.personalInfoForm.applicantSequence ? values.personalInfoForm.applicantSequence : -1,
        };
      }

      if (
        values.personalInfoForm.applicationId !== undefined &&
        values.personalInfoForm.applicationId !== null &&
        sourceType !== APPLICATION_TYPE.LOS &&
        !this.applicantAdded()
      ) {
        applicant = {
          ...applicant,
          applicationId: values.personalInfoForm.applicationId,
          applicantSequence: values.personalInfoForm.applicantSequence,
        };
      }

      applicantsList.push(applicant);
      if (!applicationIds.includes(values.personalInfoForm.applicationId)) {
        applicationIds.push(values.personalInfoForm.applicationId === null ? 0 : values.personalInfoForm.applicationId);
      }
    });
    applicationIds
      .filter((item, i, ar) => ar.indexOf(item) === i)
      .forEach((applicationId) => {
        //Vinitha check these values
        applicationsList.push({
          id: applicationId,
          amortization: 0,
          applicants: applicantsList.filter((x) => x.applicationId == applicationId),
        });
      });
    return applicationsList;
  }

  private createApplications(applicationIds: number[], applicantsList: Applicant[]): ApplicationRequest[] {
    const applicationsList: ApplicationRequest[] = [];
    applicationIds
      .filter((item, i, ar) => ar.indexOf(item) === i)
      .forEach((applicationId) => {
        //Vinitha check these values
        applicationsList.push({
          id: applicationId,
          amortization: 0,
          applicants: applicantsList.filter((x) => x.applicationId == applicationId),
        });
      });
    return applicationsList;
  }

  private createLoanRequestObject(applications: ApplicationRequest[]) {
    let insuranceType = this.enumService.getSystemValue(getLoanTypeList(), this.loan.loanType);
    if (this.loan.paymentType === PAYMENT_TYPE.INTEREST_ONLY && this.loan.loanType !== LOAN_TYPE.LINE_OF_CREDIT) {
      insuranceType = INSURANCE_TYPE.SINGLE_PREMIUM;
    }
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

  public saveLoanInfo = (applicantForms: QueryList<ApplicantFormComponent>) => {
    let applications: ApplicationRequest[] = [];
    applications = this.createApplicantList(applicantForms, this.loan.sourceType);
    const loanRequest = this.createLoanRequestObject(applications);

    this.store.dispatch(setLoadingSpinner({ status: true }));

    if (this.stepInfo.currentStep === 2 && this.stepInfo.readOnlyBehavior) {
      this.sendApplicantEvent.emit({ pass: true });
      this.store.dispatch(setLoadingSpinner({ status: false }));
    } else if (
      this.stepService.currentStateValue.currentStep === 2 &&
      this.loan.sourceType.toString() === APPLICATION_TYPE.LOS
    ) {
      this.sendApplicantEvent.emit({ pass: true });
      this.store.dispatch(setLoadingSpinner({ status: false }));
    } else {
      this.store.dispatch(upsertLoanApplication({ request: loanRequest }));
      this.store
        .select(loadingInformationSelector)
        .pipe(filter((loading) => !loading))
        .subscribe((loading) => {
          if (!loading) {
            if (this.stepper().selectedIndex === 1) {
              this.sendApplicantEvent.emit({ pass: true });
            }
          }
        });
    }
  };

  private patchIdentifiersToForm(applicationIdentifier: number | undefined, applicantIdentifier: string, id?: string) {
    if (id) {
      this.applicantForm.get('personalInfoForm')?.get('id')?.setValue(id, { emitEvent: false });
      this.applicantForm.get('emailForm')?.get('applicantId')?.setValue(id, { emitEvent: false });
      this.applicantForm.get('homePhoneForm')?.get('applicantId')?.setValue(id, { emitEvent: false });
      this.applicantForm.get('workPhoneForm')?.get('applicantId')?.setValue(id, { emitEvent: false });
      this.applicantForm.get('addressForm')?.get('applicantId')?.setValue(id, { emitEvent: false });
      this.applicantForm.get('consentForm')?.get('applicantId')?.setValue(id, { emitEvent: false });
    }
    this.applicantForm
      .get('homePhoneForm')
      ?.get('applicantIdentifier')
      ?.setValue(applicantIdentifier, { emitEvent: false });
    this.applicantForm
      .get('homePhoneForm')
      ?.get('applicationIdentifier')
      ?.setValue(applicationIdentifier, { emitEvent: false });

    this.applicantForm
      .get('workPhoneForm')
      ?.get('applicantIdentifier')
      ?.setValue(applicantIdentifier, { emitEvent: false });
    this.applicantForm
      .get('workPhoneForm')
      ?.get('applicationIdentifier')
      ?.setValue(applicationIdentifier, { emitEvent: false });

    this.applicantForm
      .get('addressForm')
      ?.get('applicantIdentifier')
      ?.setValue(applicantIdentifier, { emitEvent: false });
    this.applicantForm
      .get('addressForm')
      ?.get('applicationIdentifier')
      ?.setValue(applicationIdentifier, { emitEvent: false });

    this.applicantForm
      .get('emailForm')
      ?.get('applicantIdentifier')
      ?.setValue(applicantIdentifier, { emitEvent: false });
    this.applicantForm
      .get('emailForm')
      ?.get('applicationIdentifier')
      ?.setValue(applicationIdentifier, { emitEvent: false });

    this.applicantForm
      .get('consentForm')
      ?.get('applicantIdentifier')
      ?.setValue(applicantIdentifier, { emitEvent: false });
    this.applicantForm
      .get('consentForm')
      ?.get('applicationIdentifier')
      ?.setValue(applicationIdentifier, { emitEvent: false });

    return this.applicantForm.value;
  }

  public onSameAddressChange() {
    const parentValues = this.parent.applicantForms.get(0)?.applicantForm.getRawValue();
    this.applicantForm.get('addressForm')?.patchValue(parentValues.addressForm);
  }

  public unCheckAddress() {
    this.applicantForm.get('addressForm')?.valueChanges.subscribe(() => {
      this.checkCurrentAddressStatus();
    });
  }

  public checkCurrentAddressStatus() {
    if (this.parent.applicantForms !== undefined) {
      const parentValues = this.parent.applicantForms.get(0)?.applicantForm.getRawValue();
      const isParentAddressValid = this.parent.applicantForms.get(0)?.applicantForm.get('addressForm')?.valid;
      this.parent.applicantForms.forEach((form, index) => {
        const currentValues = form.applicantForm.getRawValue();
        if (index > 0 && isEqual(parentValues.addressForm, currentValues.addressForm)) {
          form.applicantForm.get(`sameAddressBox_${index}`)?.setValue(true);
        } else if (index > 0) {
          form.applicantForm.get(`sameAddressBox_${index}`)?.setValue(false);
          if (!isParentAddressValid) {
            form.applicantForm.get(`sameAddressBox_${index}`)?.disable();
          } else {
            form.applicantForm.get(`sameAddressBox_${index}`)?.enable();
          }
        }
      });
    }
  }
}
