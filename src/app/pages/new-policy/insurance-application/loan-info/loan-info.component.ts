import { AfterViewInit, Component, ElementRef, inject, input, OnInit, viewChild } from '@angular/core';
import { FormBuilder, Validators, AbstractControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Store } from '@ngrx/store';
import { Observable, take, startWith, map, Subscription, switchMap, debounceTime } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { formatDate, AsyncPipe } from '@angular/common';
import { MatOptionSelectionChange, MatOptionModule } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

import { Application, applicationInitialState } from '@core/models/insurance/application.model';
import { Loan } from '@core/models/insurance/loan.model';
import { ApplicationService } from '@core/services/insurance/application.service';
import { ProductService } from '@core/services/tenant/product.service';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { InsuranceType, CarrierLoanType } from '@core/models/insurance/carrier-loan-type.model';
import { SystemService } from '@core/services/system/system.service';
import { LOAN_TYPE, APPLICATION_TYPE, CREDIT_TYPE, QQ_LOAN_IDENTIFIER } from '@core/utils/enums/insurance-enums';
import { getPaymentTypeList, getPaymentFrequencyList, getChannelTypeNewList } from '@core/utils/enums/system-enums';
import { UserResourceParams, UsersByCriteria, User, User2 } from '@core/models/tenant/user.model';
import { BranchService } from '@core/services/tenant/branch.service';
import { UserService } from '@core/services/tenant/user.service';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import moment from 'moment';
import { AppState } from '@store';
import { setLoanToInsuranceApplication } from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import { Branch } from '@core/models/tenant/branch.model';
import { insuranceApplicationLoanSelector } from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { OnlyDecimalDirective } from '@core/directives/only-decimal/onlyDecimal.directive';
import { OnlyIntegerDirective } from '@core/directives/only-integer/only-integer.directive';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { TooltipDirective } from '@core/directives/tooltip/tooltip.directive';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DateDirective } from '@core/directives/date-directive/date.directive';
import { EnumService } from '@core/services/insurance/enum.service';

enum VALUE_TYPE {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
}

export const getCarrierLoanTypeList = (loanTypeValue: string, loanTypeList: CarrierLoanType[]): InsuranceType[] =>
  loanTypeList
    .filter((loanType: CarrierLoanType) => loanType.value === loanTypeValue)
    .map((types) => types.insuranceTypes)[0];

@Component({
  selector: 'app-loan-info',
  templateUrl: './loan-info.component.html',
  styleUrls: ['./loan-info.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    MatDividerModule,
    TooltipDirective,
    CurrencyMaskModule,
    MatDatepickerModule,
    OnlyIntegerDirective,
    OnlyDecimalDirective,
    AsyncPipe,
    DateDirective,
    MatMomentDateModule,
  ],
})
export class LoanInfoComponent implements OnInit, AfterViewInit {
  public stepper = input.required<MatStepper>();
  public stepList = input.required<any[]>();

  lenderInput = viewChild<ElementRef>('lenderInput');
  loanContainer = viewChild<ElementRef>('loanContainer');

  private fb = inject(FormBuilder);
  private applicationService = inject(ApplicationService);
  private store = inject(Store<AppState>);
  private productService = inject(ProductService);
  private systemService = inject(SystemService);
  private branchService = inject(BranchService);
  private userService = inject(UserService);
  private activatedRoute = inject(ActivatedRoute);
  private stepService = inject(SharedStepService);

  public title!: string;
  public description!: string;
  public nextButtonLabel!: string;
  public isReadOnly: boolean = false;
  private loanIdentifier!: string;
  public loanTypeList: CarrierLoanType[] = [];
  public frequencyTypeList = getPaymentFrequencyList();
  public paymentTypeList = getPaymentTypeList();
  public channelTypeList = getChannelTypeNewList();
  public branchList!: Branch[];
  public filteredUserList$!: Observable<User[]>;
  private userList: User[] = [];
  private lenderSubscription$ = new Subscription();
  private loanSubscription$ = new Subscription();
  private loanSelectorSubscription$ = new Subscription();
  private subscription$ = new Subscription();
  private paramsSubscription$ = new Subscription();
  public counter: number = 0;
  private lenderId: string | undefined;
  public user!: User2;
  public branchCode!: string;
  public minFundingDate!: Date;
  public isLoanTermVisible: boolean = false;
  public isAmortizationVisible: boolean = false;
  private userId$ = new Subscription();
  public application: Application = applicationInitialState();
  private sourceApplicationType: string = '';
  private loan!: Loan;
  public applicationType: number = 0;
  private loanSelector$ = this.store.select(insuranceApplicationLoanSelector);
  public toolTip: any = {
    LoanID: 'Please enter Loan Number of the Loan to be insured',
    FundingDate: 'The date in which the loan was completed and funds were dispersed',
    FirstPaymentDate: 'Date of first payment made against loan',
  };

  userNotFoundValidator = (control?: AbstractControl) => {
    const name = this.lenderForm.get('lender')?.value;
    // !MAKE SURE TO FIX THIS APPROACH
    // if (name) {
    //   if (!name.firstName) {
    //     if (this.userList.length > 0) {
    //       const found = this.userList.some(
    //         (user) => (user.firstName + ' ' + user.lastName).toLowerCase() == name.toLowerCase()
    //       );
    //       if (!found) {
    //         return { userNotfound: true };
    //       }
    //     }
    //   } else {
    //     if (this.userList.length > 0) {
    //       const found = this.userList.some((user) => (user ? user.id : ' '));
    //       if (!found) {
    //         return { userNotfound: true };
    //       }
    //     }
    //   }
    // } else {
    //   return { userNotfound: true };
    // }
    return '';
  };

  // [(control: FormControl) => this.userNotFoundValidator(control), Validators.required],
  public lenderForm = this.fb.group({
    lender: ['', [Validators.required]],
    branch: ['', [Validators.required]],
  });

  public loanForm: FormGroup = this.fb.group({
    loanIdentifier: ['', [Validators.required]],
    loanType: ['', [Validators.required]],
    loanAmount: ['', [Validators.min(0), Validators.required]],
    paymentAmount: ['', [Validators.min(0), Validators.required]],
    paymentFrequency: ['', [Validators.required]],
    fundingDate: ['', [Validators.required]],
    firstPaymentDate: [moment().add(1, 'months').toDate(), [Validators.required]],
    insuranceType: '',
    issueDate: '',
    effectiveDate: '',
    insuredAmount: 0,
    monthlyPaymentAmount: 0,
    interestRate: [
      '',
      [
        Validators.required,
        Validators.pattern('^[0-9]+([.][0-9]{0,5})?$'),
        Validators.min(0.000001),
        Validators.max(999),
        Validators.maxLength(8),
      ],
    ],
    loanTerm: ['', [Validators.min(0), Validators.required, Validators.max(999), Validators.min(0)]],
    paymentType: ['', [Validators.required]],
    channelType: '',
    amortization: ['', [Validators.min(0), Validators.required, Validators.max(999), Validators.min(0)]],
  });

  ngOnDestroy(): void {
    this.lenderSubscription$.unsubscribe();
    this.loanSubscription$.unsubscribe();
    this.subscription$.unsubscribe();
    this.paramsSubscription$.unsubscribe();
    this.loanSelectorSubscription$.unsubscribe();
    this.loanForm.reset();
  }

  ngOnInit(): void {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.title = 'Loan Information';
    this.description = 'Enter the details of the loan held by the applicant';
    this.nextButtonLabel = this.stepList()[this.stepper()?.selectedIndex + 1].title;
    this.productService.carrierLoanTypes$.subscribe((carrierLoanTypes) => {
      if (carrierLoanTypes) {
        this.loanTypeList = carrierLoanTypes;
      }
    });

    this.stepService.currentStateInfo.subscribe((step) => {
      if (step.currentStep === 1 && !step.readOnlyBehavior) {
        this.loanSelector$.pipe(take(1)).subscribe((loan) => {
          if (loan.branchId !== undefined && loan.branchId !== '') {
            this.lenderForm.get('branch')?.setValue(loan.branchId);
          } else {
            this.setBranchByCode(loan.branch?.code);
          }
        });
        this.loanForm.get('applicationIdentifier')?.disable();
        if (this.loan.sourceType === APPLICATION_TYPE.LOS || this.systemService.sourceApplicationValue === '2') {
          this.loanForm.disable();
        }
      }

      if (step.currentStep === 1 && step.readOnlyBehavior) {
        this.loanForm.disable();
        this.lenderForm.disable();
      }
    });

    this.setMinFundingDate();
    this.getLoanFromSession();
  }

  ngAfterViewInit(): void {
    this.activatedRoute.params.pipe(debounceTime(300)).subscribe((params) => {
      this.loanIdentifier = params['application'];
    });
    this.paramsSubscription$ = this.systemService.sourceApplicationType$.pipe(take(1)).subscribe((param: string) => {
      this.loanSelectorSubscription$ = this.loanSelector$.subscribe((loan) => {
        if (param === '2') {
          this.sourceApplicationType = param;
          this.loanForm.disable();
          this.loanContainer()?.nativeElement.focus();
          // this.lenderInput()?.nativeElement.focus();
        } else {
          if (loan && loan.sourceType === APPLICATION_TYPE.LOS) {
            this.applicationType = 2;
            this.sourceApplicationType = '2';
            this.loanForm.disable();
          } else {
            this.loanForm.enable();
          }
        }

        if (this.loanIdentifier !== undefined && this.loanIdentifier !== QQ_LOAN_IDENTIFIER) {
          this.loanForm.get('loanIdentifier')?.disable();
        }
        if (loan?.loanType === LOAN_TYPE.LINE_OF_CREDIT) {
          this.loanForm.get('paymentAmount')?.disable();
        }
      });
    });
    // this.prePopulateFirstPaymentDate();
  }

  private getLoanFromSession = () => {
    this.branchList = [];
    this.loanSubscription$ = this.branchService.branches$
      .pipe(
        switchMap((branches) => {
          this.branchList = branches;
          return this.loanSelector$;
        })
      )
      .subscribe((loan: Loan) => {
        this.loanForm.get('loanIdentifier')?.setValue(null);
        if (loan.loanIdentifier !== '') {
          if (loan.loanIdentifier === QQ_LOAN_IDENTIFIER) {
            loan = {
              ...loan,
              loanIdentifier: '',
            };
          }
          this.loan = loan;
          this.loanForm.patchValue({
            loanIdentifier: loan.loanIdentifier,
            loanType: loan.loanType ? loan.loanType : '',
            loanAmount: loan.loanAmount.toString(),
            paymentAmount: loan.paymentAmount.toString(),
            paymentFrequency: loan.paymentFrequency.toString(),
            fundingDate: loan.fundingDate,
            firstPaymentDate: loan.firstPaymentDate,
            insuranceType: loan.insuranceType,
            issueDate: loan.issueDate,
            effectiveDate: loan.effectiveDate,
            // insuredAmount: loan.insuredAmount,
            monthlyPaymentAmount: loan.monthlyPaymentAmount,
            interestRate: loan.interestRate.toString(),
            loanTerm: loan.loanTerm.toString(),
            paymentType: loan.paymentType,
            channelType: loan.channelType,
            amortization: loan.amortization.toString(),
          });
          if (loan.applications)
            this.loanForm.get('amortization')?.setValue(loan.applications[0].amortization.toString());
          this.parseApplicationCreditType(false);
          this.branchCode = loan.branch?.code ? loan.branch?.code : '';
          this.setLenderForm(this.branchCode, loan.user);
          this.loanForm.get('loanIdentifier')?.disable();
          if (loan?.loanType === LOAN_TYPE.LINE_OF_CREDIT) {
            this.loanForm.get('paymentAmount')?.disable();
          }
        }
      });

    setTimeout(() => {
      if (this.loan === undefined) {
        this.store.dispatch(setLoadingSpinner({ status: false }));
        this.setLenderForm('', undefined);
      }
    }, 1500);
  };

  public lenderFn = () => {
    if (!this.isReadOnly) {
      this.counter = this.counter + 1;
      if (
        this.lenderForm.controls['lender'].value &&
        this.lenderForm.controls['lender'].value.length > 2 &&
        this.counter > 1
      ) {
        let searchOptions: UserResourceParams = {
          orderBy: 'CreatedOn desc',
        };
        let filterValue = this.lenderForm.controls['lender'].value;
        // !MAKE SURE TO FIX THIS ONE HERE
        searchOptions.name = filterValue;
        if (this.stepper().selectedIndex === 0) {
          this.subscription$ = this.userService
            .getUsersByCriteria(searchOptions)
            .pipe(take(1))
            .subscribe((userList) => {
              this.userList = userList.value.sort((a, b) => {
                if (a.firstName < b.firstName) return -1;
                if (a.firstName > b.firstName) return 1;
                return 0;
              });
              this.filteredUserList$ = this.lenderForm.controls['lender'].valueChanges.pipe(
                startWith(''),
                map((value) => (typeof value === 'string' ? value : value)),
                map((name) => (name ? this.filterUser(name) : this.userList.slice()))
              );
            });
        }
      }
    }
  };

  public userSelected(event: MatOptionSelectionChange) {
    this.user = event.source.value as User2;
    this.lenderId = event.source.value.id;
  }

  private filterUser = (value: User | string): User[] => {
    let filterValue: string | User;
    if (typeof value === 'string') {
      filterValue = value;
      return this.userList.filter((user) =>
        (user.firstName + ' ' + user.lastName).toLowerCase().includes(filterValue.toString())
      );
    }

    if (typeof value === 'object') {
      filterValue = `${value.firstName.toLowerCase} ${value.lastName.toLowerCase()}`;
      return this.userList.filter((user) =>
        (user.firstName + ' ' + user.lastName).toLowerCase().includes((filterValue as User).firstName)
      );
    }

    return [];
  };

  public displayFn(user: User | string): string {
    if (typeof user === 'string') {
      return user;
    }
    this.lenderId = user ? user.id : this.lenderId;
    this.counter = 0;
    return user && user.firstName ? `${user.firstName} ${user.lastName}` : '';
  }

  public disableButton() {
    if (this.isReadOnly) {
      return false;
    }

    if (this.stepService.currentStateValue.currentStep === 1 && this.stepService.currentStateValue.readOnlyBehavior) {
      return false;
    }

    if (
      (!this.loanForm.valid && !this.isReadOnly && this.applicationType !== 2 && this.sourceApplicationType !== '2') ||
      !this.lenderForm.valid
    ) {
      return true;
    }

    return false;
  }

  private setLenderForm(branchCode: string | undefined, user: User2 | undefined) {
    if (user === undefined || user.id === '') {
      this.userService.user$.subscribe((user: User) => {
        this.user = {
          id: user.id ? user.id : '',
          tenantId: user.tenantId ? user.tenantId : '',
          branchId: user.branchId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          employeeId: user.employeeId,
          role: user.role,
        };
        // const valueTemp: string =this.lenderForm.get('lender')?.value?.toString();
        this.lenderForm.get('lender')?.setValue(`${user.firstName} ${user.lastName}`);
        if (branchCode === '') this.lenderForm.get('branch')?.setValue(user.branchId);
      });
    } else {
      this.lenderForm.get('lender')?.setValue(`${user.firstName.toString()} ${user.lastName}`);
      this.user = user;
    }

    if (branchCode !== '') {
      this.setBranchByCode(branchCode);
    }
  }

  private setBranchByCode(branchCode: string | undefined) {
    const branchId = this.branchList.filter((branch) => branch.code === branchCode)[0]?.id;
    this.lenderForm.get('branch')?.setValue(branchId);
    setTimeout(() => {
      this.store.dispatch(setLoadingSpinner({ status: false }));
    }, 1700);
  }

  private getControlValue(
    controlName: string,
    form: FormGroup,
    valueType: VALUE_TYPE
  ): string | number | boolean | Date {
    const controlValue = form.get(controlName)?.value;

    if (controlValue !== null && controlValue !== undefined) {
      switch (valueType) {
        case VALUE_TYPE.STRING:
          return controlValue.toString();

        case VALUE_TYPE.NUMBER:
          return controlValue;

        case VALUE_TYPE.BOOLEAN:
          return controlValue;

        case VALUE_TYPE.DATE:
          return controlValue.toString();

        default:
          return controlValue.toString();
      }
    }

    switch (valueType) {
      case VALUE_TYPE.STRING:
        return '';

      case VALUE_TYPE.NUMBER:
        return 0;

      case VALUE_TYPE.BOOLEAN:
        return false;

      case VALUE_TYPE.DATE:
        return '';

      default:
        return '';
    }
  }

  public parseApplicationCreditType(fromUI: boolean) {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    let loanType = this.getControlValue('loanType', this.loanForm, VALUE_TYPE.STRING);

    const insuranceType = this.productService.carrierLoanTypesValue?.filter((type) => type.value === loanType)[0]
      ?.insuranceTypes[0]?.type;
    switch (loanType) {
      case LOAN_TYPE.MORTGAGE:
        this.loan = {
          ...this.loan,
          creditType: CREDIT_TYPE.Mortgage,
        };
        !this.loanForm.controls['paymentAmount'].enabled &&
          this.applicationType !== 2 &&
          this.sourceApplicationType !== '2' &&
          this.loanForm.controls['paymentAmount'].enable();
        this.loanForm.get('insuranceType')?.setValue(insuranceType);
        this.isLoanTermVisible = true;
        this.isAmortizationVisible = true;
        if (fromUI) {
          this.loanForm.get('loanTerm')?.setValue('');
          this.loanForm.get('amortization')?.setValue('');
        }
        this.store.dispatch(setLoadingSpinner({ status: false }));
        break;
      case LOAN_TYPE.LINE_OF_CREDIT:
        this.loan = {
          ...this.loan,
          creditType: CREDIT_TYPE.LOC,
        };

        // Max amount cannot exceed $6000 for LOC
        let amount =
          0.03 * parseFloat(this.getControlValue('loanAmount', this.loanForm, VALUE_TYPE.STRING).toString());
        if(amount > 6000)
          amount = 6000;

        this.loanForm.controls['paymentAmount'].setValue(amount.toString());
        this.loanForm.controls['paymentAmount'].disable();
        this.loanForm.get('insuranceType')?.setValue(insuranceType);
        this.isLoanTermVisible = false;
        this.isAmortizationVisible = false;
        if (fromUI) {
          this.loanForm.get('loanTerm')?.setValue('12');
          this.loanForm.get('amortization')?.setValue('12');
          this.store.dispatch(setLoadingSpinner({ status: false }));
        }
        break;
      case LOAN_TYPE.LOAN:
        this.loan = {
          ...this.loan,
          creditType: CREDIT_TYPE.Loan,
        };
        !this.loanForm.controls['paymentAmount'].enabled &&
          this.applicationType !== 2 &&
          this.sourceApplicationType !== '2' &&
          this.loanForm.controls['paymentAmount'].enable();
        this.loanForm.get('insuranceType')?.setValue(insuranceType);
        this.isLoanTermVisible = true;
        this.isAmortizationVisible = true;
        if (fromUI) {
          this.loanForm.get('loanTerm')?.setValue('');
          this.loanForm.get('amortization')?.setValue('');
          this.store.dispatch(setLoadingSpinner({ status: false }));
        }
        break;
      default:
        this.loanForm.get('insuranceType')?.setValue('');
        break;
    }
  }

  onChangeEvent(event: any) {
    if (this.loan?.creditType === CREDIT_TYPE.LOC) {
      const totalAmount = parseFloat(this.getControlValue('loanAmount', this.loanForm, VALUE_TYPE.STRING).toString());
      let amount = 0.03 * totalAmount;

      // Max amount cannot exceed $6000 for LOC
      if(amount > 6000)
        amount = 6000;

      this.loanForm.controls['paymentAmount'].setValue(amount.toString());
    }
  }

  private getBranchById(branchId: string): Branch {
    return this.branchService.branchesValue.filter((branch) => branch.id === branchId)[0];
  }

  public createApplication() {
    if (this.stepService.currentStateValue.readOnlyBehavior) {
      this.stepService.currentState = {
        ...this.stepService.currentStateValue,
        currentStep: 2,
      };
      this.stepper().next();
    } else {
      this.store.dispatch(setLoadingSpinner({ status: true }));

      const lenderValues = this.lenderForm.getRawValue();
      const lenderName = `${this.userService.userValue.firstName} ${this.userService.userValue.lastName}`;
      let userId = this.userService.userValue.id ? this.userService.userValue.id : '0';
      if (lenderValues.lender !== lenderName) {
        if (this.lenderId !== undefined) {
          userId = this.lenderId;
          this.setLoanDispatch(userId, lenderValues.branch !== null ? lenderValues.branch : '');
        } else {
          let searchOptions: UserResourceParams = {
            orderBy: 'CreatedOn desc',
            email: this.loan.user?.email,
          };
          this.userId$ = this.userService.getUsersByCriteria(searchOptions).subscribe((response: UsersByCriteria) => {
            if (response && response.value[0].id) {
              this.setLoanDispatch(response.value[0].id, lenderValues.branch !== null ? lenderValues.branch : '');
            }
          });
        }
      } else {
        this.setLoanDispatch(userId, lenderValues.branch !== null ? lenderValues.branch : '');
      }
    }
  }

  private setLoanDispatch(userId: string, branchId: string) {
    let loan = this.loanForm.getRawValue();
    loan.paymentAmount = this.getControlValue('paymentAmount', this.loanForm, VALUE_TYPE.STRING).toString();
    loan.loanIdentifier =
      this.loanIdentifier !== undefined &&
        this.loanIdentifier !== '' &&
        this.loanIdentifier !== QQ_LOAN_IDENTIFIER &&
        // this.loanIdentifier === this.loanForm.controls['loanIdentifier'].value
        this.loanIdentifier === this.getControlValue('loanIdentifier', this.loanForm, VALUE_TYPE.STRING).toString()
        ? this.loanIdentifier
        : this.getControlValue('loanIdentifier', this.loanForm, VALUE_TYPE.STRING).toString();

    this.loan = {
      ...this.loan,
      ...loan,
      paymentAmount: parseFloat(loan.paymentAmount?.toString()),
      loanIdentifier: loan.loanIdentifier?.toString(),
      paymentFrequency: loan.paymentFrequency !== null ? loan.paymentFrequency?.toString() : '',
      fundingDate: loan.fundingDate !== null ? loan.fundingDate : '',
      interestRate: loan.interestRate !== null ? parseFloat(loan.interestRate) : 0,
      loanTerm: loan.loanTerm !== null ? parseInt(loan.loanTerm) : 0,
      paymentType: loan.paymentType !== null ? loan.paymentType : '',
      amortization: loan.amortization !== null ? parseInt(loan.amortization) : 0,
      branchId: branchId,
      userId: userId,
      user: this.user,
    };

    if (this.sourceApplicationType !== '2') {
      if (this.stepService.currentStateValue.currentStep === 1) {
        this.stepService.currentState = {
          ...this.stepService.currentStateValue,
          currentStep: 2,
        };
      }

      this.loan = {
        ...this.loan,
        loanIdentifier: loan.loanIdentifier,
        insuranceType: this.loan.insuranceType
          ? this.loan.insuranceType
          : this.getControlValue('insuranceType', this.loanForm, VALUE_TYPE.STRING).toString(),
        sourceType: this.loan.sourceType && this.loan.sourceType !== '' ? this.loan.sourceType : 'Nova',
        paymentAmount: parseFloat(loan.paymentAmount),
        monthlyPaymentAmount: loan.monthlyPaymentAmount !== null ? loan.monthlyPaymentAmount : 0,
        issueDate: this.loan.issueDate ? this.loan.issueDate : formatDate(new Date(), 'yyyy-MM-dd', 'en-US'),
        effectiveDate: this.loan.effectiveDate
          ? this.loan.effectiveDate
          : formatDate(new Date(), 'yyyy-MM-dd', 'en-US'),
        loanAmount: parseFloat(this.getControlValue('loanAmount', this.loanForm, VALUE_TYPE.STRING).toString()),
      };
    }

    if (
      this.loanIdentifier === QQ_LOAN_IDENTIFIER ||
      this.loanIdentifier === undefined ||
      this.loan.loanIdentifier !== this.loanIdentifier
    ) {
      let urlIdentifier = { application: this.loan.loanIdentifier };
      window.history.pushState(
        urlIdentifier,
        'New Policy',
        `/new-policy/insurance-application/${this.loan.loanIdentifier}`
      );
    }

    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.store.dispatch(setLoanToInsuranceApplication({ loan: this.loan }));

    this.subscription$.unsubscribe();
    this.userId$.unsubscribe();
    this.stepper().next();
    this.applicationService.setApplicationStep(this.stepper().selectedIndex);
    this.store.dispatch(setLoadingSpinner({ status: false }));
  }

  private setMinFundingDate() {
    this.loanForm.get('fundingDate')?.valueChanges.subscribe({
      next: (data) => {
        this.minFundingDate = moment(data).toDate();
      },
    });
  }
}
