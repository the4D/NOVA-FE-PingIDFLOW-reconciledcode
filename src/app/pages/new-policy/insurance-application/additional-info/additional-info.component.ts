import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  Input,
  OnInit,
  viewChild,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  UntypedFormBuilder,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Store } from '@ngrx/store';
import { filter, map, Observable } from 'rxjs';
import { isEqual } from 'lodash';
import { ApplicationPADDtoFull } from '@core/models/insurance/application-pad-full.model';
import { Coverage } from '@core/models/insurance/coverage.model';
import { Loan } from '@core/models/insurance/loan.model';
import { User } from '@core/models/tenant/user.model';
import { BranchService } from '@core/services/tenant/branch.service';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { APPLICANT_TYPE, FORM_STATUS, INSURANCE_TYPE } from '@core/utils/enums/insurance-enums';
import {
  getAddressStatusList,
  getAddressStructureTypeList,
  getAddressTypeList,
  getCountryList,
  getProvinceList,
} from '@core/utils/enums/system-enums';
import { EnumService } from '@core/services/insurance/enum.service';
import { QuoteInsuranceTypeResponse } from '@core/models/insurance/quote-insurance-type.model';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { AppState } from '@store';
import {
  insuranceApplicationApplicantFormGroupSelector,
  insuranceApplicationLoanSelector,
  insuranceApplicationPADSelector,
  loadingInformationSelector,
  quoteInsuranceTypeResponseSelector,
} from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { Applicant } from '@core/models/insurance/applicant.model';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { applicationFullPad } from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import { ApplicantFormGroup } from '@core/models/insurance/applicant-formGroup.model';
import { AllCapsDirective } from '../../../../core/directives/all-caps/all-caps.directive';
import { NgxMaskModule } from 'ngx-mask';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TooltipDirective } from '../../../../core/directives/tooltip/tooltip.directive';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NoHealthQuestionsComponent } from '../applicant-question/no-health-questions/no-health-questions.component';
import { NgIf, NgTemplateOutlet, NgFor, AsyncPipe } from '@angular/common';
import { InfoButtonsComponent } from './info-buttons/info-buttons.component';

export const getWithdrawalList = (): any[] => {
  const result: any[] = [];
  for (let i = 1; i <= 28; i++) {
    result.push({
      id: `${i}`,
      description: `${i}`,
    });
  }

  return result;
};

interface IApplicantQuote {
  applicationIdentifier: string;
  applicantIdentifier: string;
  fullName: string;
  applicantType: string;
  coverages: Coverage[];
  applicantTotalPremiumWithTaxIncluded: number;
}

export const coveragesTaken = (
  quoteTypeResponse$: Observable<QuoteInsuranceTypeResponse>,
  currentStep: number,
  readOnlyBehavior: boolean
) => {
  let flag = false;
  quoteTypeResponse$.subscribe((response) => {
    if (response.loanId === '' && response.applications.length === 0 && currentStep === 5 && readOnlyBehavior) {
      flag = true;
    } else {
      response.applications.forEach((application) => {
        application.applicants?.forEach((applicant) => {
          applicant.applicantCoverages?.forEach((coverage) => {
            if (!flag) flag = coverage.coverageCode.endsWith('00');
            // if (coverage.healthQuestionConfigurations.length > 0) {
            //   flag = true;
            // }
          });
          // return flag;
        });
      });
    }
  });

  return flag;
};
@Component({
  selector: 'app-additional-info',
  templateUrl: './additional-info.component.html',
  styleUrls: ['./additional-info.component.scss'],
  standalone: true,
  imports: [
    NoHealthQuestionsComponent,
    NgTemplateOutlet,
    MatTabsModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    TooltipDirective,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
    NgxMaskModule,
    AllCapsDirective,
    AsyncPipe,
    InfoButtonsComponent,
  ],
})
export class AdditionalInfoComponent implements OnInit, AfterViewInit {
  @ViewChild('infoTabs') matTabGroup!: MatTabGroup;
  public stepper = input.required<MatStepper>();

  private store = inject(Store<AppState>);
  private fb = inject(FormBuilder);
  private branchService = inject(BranchService);
  private enumService = inject(EnumService);
  private stepService = inject(SharedStepService);
  private cd = inject(ChangeDetectorRef);

  public coverageList: Coverage[] = [];
  public nextButtonLabel!: string;
  public insuredLoanAmount: number = 0;
  public totalCoverageCost: number = 0;
  public loan!: Loan;
  public applicantList: Array<IApplicantQuote> = new Array<IApplicantQuote>();
  public isReadOnly: boolean = false;
  public branchList$ = this.branchService.branches$.pipe(map((branches) => branches.sort((a, b) => +a.code - +b.code)));
  private userList: User[] = [];
  public coveragePercent: number | undefined;
  public provinceList = getProvinceList();
  public withdrawalList = getWithdrawalList();
  public withdrawalTooltip =
    'If the selected premium withdrawal date falls on a weekend or holiday, the premium will be withdrawn on the following business day';
  public loanTypes: string[] = ['PLN', 'PMTG', 'PLOC'];
  public validNumericPattern = '^[0-9]*$';
  public isCoveragesTake: boolean = false;
  public quoteTypeResponse$: Observable<QuoteInsuranceTypeResponse> = this.store.select(
    quoteInsuranceTypeResponseSelector
  );
  public modifiedDataSourceForPAD: any;
  public loan$: Observable<Loan> = this.store.select(insuranceApplicationLoanSelector);
  public formGroupSelector$: Observable<ApplicantFormGroup[]> = this.store.select(
    insuranceApplicationApplicantFormGroupSelector
  );
  public quoteTypeResponse!: QuoteInsuranceTypeResponse;
  public buttonLabel: string = 'Next: Summary';
  public premiumCollectionForm: FormGroup = this.fb.group({});
  private checkedAddressDone: boolean = false;
  public isCoverageTaken: boolean = false;

  constructor() {}

  ngAfterViewInit(): void {
    this.setApplicantButtonName();
    this.checkCurrentAddressStatus();
  }

  ngOnInit(): void {
    this.getLoanFromSession();
    this.addFormControls();
    this.getApplicationPADFromSession();
    this.stepService.currentStateInfo.subscribe((step) => {
      if (step.currentStep === 5 && !step.readOnlyBehavior) {
        this.getLoanFromSession();
        Object.keys(this.premiumCollectionForm.controls).forEach((key) => {
          //   this.premiumCollectionForm.controls[key].clearValidators()
          //   this.premiumCollectionForm.controls[key].markAsUntouched()
          this.premiumCollectionForm.controls[key].reset();
          //   this.premiumCollectionForm.controls[key].setErrors(null)
        });
        this.getApplicationPADFromSession();
      }
      if (step.currentStep === 5 && step.readOnlyBehavior) {
        this.premiumCollectionForm.disable();
      }
    });

    this.checkCurrentAddressStatus();
    // this.generatePadDataSource();
    // Subscribing to the form
    this.premiumCollectionForm.statusChanges.subscribe((status) => {
      if (status === FORM_STATUS.VALID && this.quoteTypeResponse.applications.length > 1 && !this.checkedAddressDone) {
        this.checkCurrentAddressStatus();
      }
    });
  }

  private addFormControls() {
    this.quoteTypeResponse$.subscribe({
      next: (response: QuoteInsuranceTypeResponse) => {
        this.quoteTypeResponse = response;
        if (!this.isSinglePremium()) {
          response.applications.forEach((application, index) => {
            this.premiumCollectionForm.addControl(`applicantAddressType_${application.id}`, new FormControl('Mailing'));
            this.premiumCollectionForm.addControl(
              `institutionNumber_${application.id}`,
              new FormControl(null, [
                Validators.required,
                Validators.maxLength(3),
                Validators.pattern(this.validNumericPattern),
              ])
            );
            this.premiumCollectionForm.addControl(
              `institutionName_${application.id}`,
              new FormControl(null, [Validators.required, Validators.max(127)])
            );
            this.premiumCollectionForm.addControl(
              `institutionAddress_${application.id}`,
              new FormControl(null, Validators.required)
            );
            this.premiumCollectionForm.addControl(
              `institutionCity_${application.id}`,
              new FormControl(null, Validators.required)
            );
            this.premiumCollectionForm.addControl(
              `institutionProvince_${application.id}`,
              new FormControl(null, Validators.required)
            );
            this.premiumCollectionForm.addControl(
              `institutionPostalCode_${application.id}`,
              new FormControl(null, Validators.required)
            );
             this.premiumCollectionForm.addControl(`withdrawal_${application.id}`, new FormControl(null, Validators.required));
            this.premiumCollectionForm.addControl(`institutionUnit_${application.id}`, new FormControl(null));
            this.premiumCollectionForm.addControl(
              `transitNumber_${application.id}`,
              new FormControl(null, [Validators.required, Validators.pattern(this.validNumericPattern)])
            );
            this.premiumCollectionForm.addControl(
              `accountNumber_${application.id}`,
              new FormControl(null, [Validators.required, Validators.pattern(this.validNumericPattern)])
            );
            this.premiumCollectionForm.addControl(
              `accountHolder_${application.id}`,
              new FormControl('Toronto Dominion')
            );
            this.premiumCollectionForm.addControl(`bankNumber_${application.id}`, new FormControl('999'));
            this.premiumCollectionForm.addControl(`streetNumber_${application.id}`, new FormControl(null));
            if (index > 0) {
              this.premiumCollectionForm.addControl(`addressPad_${application.id}`, new FormControl(null));
            }


            if (this.loan.loanType === 'PLOC') {
              this.premiumCollectionForm.get(`withdrawal_${application.id}`)?.setValue('15');
              this.premiumCollectionForm.get(`withdrawal_${application.id}`)?.markAsDirty();
              this.premiumCollectionForm.get(`withdrawal_${application.id}`)?.updateValueAndValidity();
              this.premiumCollectionForm.get(`withdrawal_${application.id}`)?.disable({ onlySelf: true, emitEvent: false });
            }
          });
        }
      },
      error: () => {},
      complete: () => {},
    });
  }

  public isSinglePremium() {
    if (this.loan?.insuranceType === INSURANCE_TYPE.SINGLE_PREMIUM) {
      return true;
    }
    return false;
  }

  public coveragesTaken() {
    return coveragesTaken(
      this.quoteTypeResponse$,
      this.stepService.currentStateValue.currentStep,
      this.stepService.currentStateValue.readOnlyBehavior
    );
  }

  public postalCodeValidator(control: FormControl) {
    if (`${control?.value}` && `${control?.value}`.indexOf('-') > -1 && `${control?.value}`.indexOf('-') === 3) {
      control?.setValue(`${control?.value}`.replace('-', ' '));
    } else if (`${control?.value}` && `${control?.value}`.indexOf('-') > -1) {
      control?.setValue(`${control?.value}`.replace('-', ''));
    }
    const value: string = `${control?.value}`;
    const isValid = /^([A-Z]\d[A-Z])( )(\d[A-Z]\d)$/.test(value.toUpperCase());

    return isValid ? null : { invalidPostalCode: true };
  }

  private getApplicationPADFromSession = () => {
    this.store.select(insuranceApplicationPADSelector).subscribe((padInformation) => {
      padInformation.applicationPADs.forEach((padInfo) => {
        if (padInfo.applicationPAD !== null && padInfo.applicationPAD !== undefined) {
          const applicationId = padInfo.applicationId;
          const { institutionNumber, institutionName, accountNumber, transitNumber, withdrawalDay } =
            padInfo.applicationPAD;

          this.premiumCollectionForm.get(`institutionNumber_${applicationId}`)?.setValue(institutionNumber);
          this.premiumCollectionForm.get(`institutionName_${applicationId}`)?.setValue(institutionName);
          this.premiumCollectionForm.get(`accountNumber_${applicationId}`)?.setValue(accountNumber);
          this.premiumCollectionForm.get(`transitNumber_${applicationId}`)?.setValue(transitNumber);

          if (padInfo.applicationPAD.applicantAddress) {
            const { street, postalCode, province, city, unitNumber, streetNumber } =
              padInfo.applicationPAD.applicantAddress;

            this.premiumCollectionForm.get(`institutionAddress_${applicationId}`)?.setValue(street);
            this.premiumCollectionForm.get(`institutionPostalCode_${applicationId}`)?.setValue(postalCode);
            this.premiumCollectionForm.get(`institutionCity_${applicationId}`)?.setValue(city);
            this.premiumCollectionForm.get(`institutionUnit_${applicationId}`)?.setValue(unitNumber);
            this.premiumCollectionForm.get(`streetNumber_${applicationId}`)?.setValue(streetNumber);

            const provinceId: number = this.enumService.getId(this.provinceList, province);
            if (province !== undefined && province !== '') {
              if (this.stepService.currentStateValue.currentStep === 5) {
                if (typeof province !== 'number') {
                  this.premiumCollectionForm
                    .get(`institutionProvince_${applicationId}`)
                    ?.setValue(this.provinceList.filter((prov) => prov.id === provinceId)[0].abbreviation);
                } else {
                  this.premiumCollectionForm
                    .get(`institutionProvince_${applicationId}`)
                    ?.setValue(this.provinceList.filter((prov) => prov.id === parseInt(province))[0].abbreviation);
                }
              } else {
                if (typeof province !== 'number' && provinceId !== 0) {
                  this.premiumCollectionForm
                    .get(`institutionProvince_${applicationId}`)
                    ?.setValue(this.provinceList.filter((prov) => prov.id === provinceId)[0].abbreviation);
                } else {
                  this.premiumCollectionForm
                    .get(`institutionProvince_${applicationId}`)
                    ?.setValue(this.provinceList.filter((prov) => prov.id === parseInt(province))[0].abbreviation);
                }
              }
            }
          }

          this.premiumCollectionForm.patchValue(padInfo.applicationPAD);
          if (withdrawalDay) {
            this.premiumCollectionForm.get(`withdrawal_${applicationId}`)?.setValue(withdrawalDay.toString());
          }
        }
      });
    });
  };

  private getLoanFromSession = () => {
    this.loan$.subscribe((loan: Loan) => {
      this.loan = loan;
      this.insuredLoanAmount = loan.loanAmount;
    });
  };

  public back = () => {
    this.stepService.currentState = {
      ...this.stepService.currentStateValue,
      currentStep: 4,
    };
    this.stepper().previous();
  };

  public requestSubmission() {
    if (
      this.matTabGroup !== undefined &&
      this.matTabGroup.selectedIndex !== null &&
      this.matTabGroup._allTabs.length === this.matTabGroup.selectedIndex + 1
    ) {
      if (
        coveragesTaken(
          this.quoteTypeResponse$,
          this.stepService.currentStateValue.currentStep,
          this.stepService.currentStateValue.readOnlyBehavior
        ) &&
        !this.isSinglePremium() &&
        !this.stepService.currentStateValue.readOnlyBehavior
      ) {
        this.store.dispatch(setLoadingSpinner({ status: true }));

        const applicationPad: ApplicationPADDtoFull = {
          loanIdentifier: this.loan.loanIdentifier,
          applicationPADs: [],
        };

        this.quoteTypeResponse.applications.forEach((application) => {
          if (this.isCoveragesTaken(application.id)) {
            let applicant: Applicant = application.applicants.filter(
              ({ applicantType }) => applicantType === APPLICANT_TYPE.PRIMARY
            )[0];
            const applicantIdentifier = applicant.applicantIdentifier ? applicant.applicantIdentifier : '0';
            applicationPad.applicationPADs.push({
              applicationId: application.id ? application.id : 0,
              applicationPAD: {
                applicantIdentifier: applicantIdentifier,
                applicationId: application.id,
                institutionNumber: this.premiumCollectionForm.get(`institutionNumber_${application.id}`)?.value,
                institutionName: this.premiumCollectionForm.get(`institutionName_${application.id}`)?.value,
                accountNumber: this.premiumCollectionForm.get(`accountNumber_${application.id}`)?.value,
                transitNumber: this.premiumCollectionForm.get(`transitNumber_${application.id}`)?.value,
                withdrawalDay: this.premiumCollectionForm.get(`withdrawal_${application.id}`)?.value,
                applicantAddress: {
                  streetNumber: this.premiumCollectionForm.get(`streetNumber_${application.id}`)?.value,
                  unitNumber: this.premiumCollectionForm.get(`institutionUnit_${application.id}`)?.value,
                  street: this.premiumCollectionForm.get(`institutionAddress_${application.id}`)?.value,
                  city: this.premiumCollectionForm.get(`institutionCity_${application.id}`)?.value,
                  province: this.premiumCollectionForm.get(`institutionProvince_${application.id}`)?.value,
                  postalCode: this.premiumCollectionForm.get(`institutionPostalCode_${application.id}`)?.value,
                  country: this.enumService.getAbbreviation(getCountryList(), 1),
                  addressType: this.enumService.getAbbreviation(getAddressTypeList(), 6),
                  addressStructureType: this.enumService.getAbbreviation(getAddressStructureTypeList(), 1),
                  addressStatus: this.enumService.getAbbreviation(getAddressStatusList(), 1),
                  isPrimary: false,
                  markForReview: false,
                },
              },
            });
          }
        });

        this.store.dispatch(applicationFullPad({ request: applicationPad }));
        this.store
          .select(loadingInformationSelector)
          .pipe(filter((loading) => !loading))
          .subscribe((loading) => {
            if (!loading) {
              if (this.stepper().selectedIndex === 4) {
                this.store.dispatch(setLoadingSpinner({ status: false }));
              }
            }
          });
        this.nextStep();
      } else if (
        this.stepService.currentStateValue.currentStep === 5 &&
        this.stepService.currentStateValue.readOnlyBehavior
      ) {
        this.nextStep();
      }
    } else if (this.matTabGroup !== undefined && this.matTabGroup.selectedIndex !== null) {
      const current = this.matTabGroup.selectedIndex ? this.matTabGroup.selectedIndex : 0;
      this.matTabGroup.selectedIndex = current + 1;
      this.matTabGroup.selectedTabChange.subscribe((tab: MatTabChangeEvent) => {
        this.setApplicantButtonName();
        this.checkCurrentAddressStatus();
      });
    } else {
      this.nextStep();
    }
    this.store.dispatch(setLoadingSpinner({ status: false }));
  }

  private nextStep() {
    if (this.stepService.currentStateValue.currentStep === 5 || this.stepService.currentStateValue.currentStep !== 7) {
      this.stepService.currentState = {
        ...this.stepService.currentStateValue,
        currentStep: 6,
      };
    }
    this.stepper().next();
  }

  public disableNextButton() {
    if (this.matTabGroup !== null && this.matTabGroup !== undefined && this.matTabGroup.selectedIndex !== null) {
      // This one is evaluating when we are on second tab
      const applicationsIds = this.quoteTypeResponse.applications.map((application) =>
        application.id ? application.id : 0
      );
      if (
        this.matTabGroup.selectedIndex > 0 &&
        this.premiumCollectionForm.status !== FORM_STATUS.DISABLED &&
        !this.isFormValid(applicationsIds[0].toString()) &&
        !this.isFormValid(applicationsIds[1].toString()) &&
        this.coveragesTaken() &&
        !this.isSinglePremium()
      ) {
        return true;
      }

      // This is validating when we are on last tab
      const applicationId: number | undefined = this.quoteTypeResponse.applications[this.matTabGroup.selectedIndex]?.id;
      if (
        this.premiumCollectionForm.status !== FORM_STATUS.DISABLED &&
        !this.isFormValid(applicationId ? applicationId.toString() : '0') &&
        this.coveragesTaken() &&
        !this.isSinglePremium()
      ) {
        return true;
      }
    }
    return false;
  }

  public isFormValid(applicationId: string): boolean {
    if (
      this.matTabGroup !== null &&
      this.matTabGroup !== undefined &&
      this.matTabGroup.selectedIndex !== null &&
      this.isCoveragesTaken(parseInt(applicationId))
    ) {
      return this.validateControlsByApplicationId(applicationId);
    }
    return true;
  }

  private validateControlsByApplicationId(applicationId: string | undefined) {
    let flag: boolean = true;
    Object.keys(this.premiumCollectionForm.controls).forEach((key: string) => {
      if (key.includes(`_${applicationId}`) && ((!key.includes('withdrawal_') && this.loan.loanType === 'PLOC')|| (key.includes('withdrawal_') && this.loan.loanType !== 'PLOC'))) {
        if ( !this.premiumCollectionForm.controls[key].valid) {
          flag = false;
        }
      }
    });

    return flag;
  }

  public setApplicantButtonName() {
    if (
      this.quoteTypeResponse &&
      this.quoteTypeResponse.applications.length > 0 &&
      this.matTabGroup !== undefined &&
      this.matTabGroup.selectedIndex !== null
    ) {
      if (this.quoteTypeResponse.applications.length - 1 > this.matTabGroup.selectedIndex) {
        this.buttonLabel = `Next: Application ` + (this.matTabGroup.selectedIndex + 2);
      } else {
        this.buttonLabel = 'Next: Summary';
      }
      this.cd.detectChanges();
    }
  }

  public onClickTab(event: number) {
    this.setApplicantButtonName();
    this.checkCurrentAddressStatus();
  }

  public onSaveAddressChange(event: MatCheckboxChange) {
    if (event.checked) {
      if (this.matTabGroup.selectedIndex !== null) {
        const applicationId = this.quoteTypeResponse.applications[0].id;
        const actualApplicationId = this.quoteTypeResponse.applications[this.matTabGroup.selectedIndex]?.id;

        Object.keys(this.premiumCollectionForm.controls).forEach((key) => {
          if (key.includes(`_${applicationId}`)) {
            const tempControlName = key.replace(`_${applicationId}`, `_${actualApplicationId}`);
            this.premiumCollectionForm.get(tempControlName)?.setValue(this.premiumCollectionForm.get(key)?.value);
          }
        });
      }
    }

    this.checkCurrentAddressStatus();
  }

  private checkCurrentAddressStatus() {
    if (this.quoteTypeResponse.applications.length > 1 && !this.checkedAddressDone) {
      this.checkedAddressDone = true;
      const actualApplications = this.quoteTypeResponse.applications.map((application) =>
        application.id ? application.id : 0
      );

      const firstApplicationValues: string[] = [];
      const secondApplicationValues: string[] = [];
      const thirdApplicationValues: string[] = [];
      const forthApplicationValues: string[] = [];
      Object.keys(this.premiumCollectionForm.controls).forEach((key) => {
        if (key.indexOf('addressPad_') === -1 && key.includes(`_${actualApplications[0]}`)) {
          firstApplicationValues.push(this.premiumCollectionForm.get(key)?.value?.toString());
        }

        if (key.indexOf('addressPad_') === -1 && key.includes(`_${actualApplications[1]}`)) {
          secondApplicationValues.push(this.premiumCollectionForm.get(key)?.value?.toString());
        }
        if (key.indexOf('addressPad_') === -1 && key.includes(`_${actualApplications[2]}`)) {
          thirdApplicationValues.push(this.premiumCollectionForm.get(key)?.value?.toString());
        }
        if (key.indexOf('addressPad_') === -1 && key.includes(`_${actualApplications[3]}`)) {
          forthApplicationValues.push(this.premiumCollectionForm.get(key)?.value?.toString());
        }
      });

      if (isEqual(firstApplicationValues, secondApplicationValues)) {
        this.premiumCollectionForm.get(`addressPad_${actualApplications[1]}`)?.setValue(true);
      } else {
        this.premiumCollectionForm.get(`addressPad_${actualApplications[1]}`)?.setValue(false);
      }

      if (isEqual(firstApplicationValues, thirdApplicationValues)) {
        this.premiumCollectionForm.get(`addressPad_${actualApplications[2]}`)?.setValue(true);
      } else {      
        this.premiumCollectionForm.get(`addressPad_${actualApplications[2]}`)?.setValue(false);
      }

      if (isEqual(firstApplicationValues, forthApplicationValues)) {
        this.premiumCollectionForm.get(`addressPad_${actualApplications[3]}`)?.setValue(true);
      } else {       
        this.premiumCollectionForm.get(`addressPad_${actualApplications[3]}`)?.setValue(false);
      }

      this.checkedAddressDone = false;
    }
  }

  public isCoveragesTaken(applicationIdentifier: number | undefined): boolean {
    let isCoverageTaken = false;

    if (applicationIdentifier && this.quoteTypeResponse) {
      const application = this.quoteTypeResponse.applications.find(
        (application) => application.id === applicationIdentifier
      );

      if (application) {
        const allCoverages = application.applicants.flatMap((applicant) => applicant.applicantCoverages || []);

        isCoverageTaken = allCoverages.some((coverage) => coverage.coverageCode.endsWith('00'));
      }
    }

    return isCoverageTaken;
  }

  public isFirstApplicationHaveNoCoverage(): boolean {
    let isCoverageTaken = false;

    if (this.quoteTypeResponse && this.quoteTypeResponse.applications.length > 0) {
      const firstApplication = this.quoteTypeResponse.applications[0];

      const allCoverages = firstApplication.applicants.flatMap((applicant) => applicant.applicantCoverages || []);

      isCoverageTaken = allCoverages.some((coverage) => coverage.coverageCode.endsWith('00'));
    }

    return !isCoverageTaken; // Invert the result to indicate if the first application has no coverage ending with "00"
  }
}
