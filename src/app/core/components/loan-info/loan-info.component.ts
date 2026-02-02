import { Component, inject, input, OnInit, output } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import moment from 'moment';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

import { CarrierLoanType } from '@core/models/insurance/carrier-loan-type.model';
import { ProductService } from '@core/services/tenant/product.service';
import { FORM_STATUS, GUID_EMPTY, LOAN_TYPE } from '@core/utils/enums/insurance-enums';
import { getLoanTypeList, getPaymentFrequencyList, getPaymentTypeList } from '@core/utils/enums/system-enums';
import { EnumService } from '@core/services/insurance/enum.service';
import { OnlyDecimalDirective } from '@core/directives/only-decimal/onlyDecimal.directive';
import { DateDirective } from '@core/directives/date-directive/date.directive';

@Component({
  selector: 'loan-info',
  templateUrl: './loan-info.component.html',
  styleUrls: ['./loan-info.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    CurrencyMaskModule,
    OnlyDecimalDirective,
    MatDatepickerModule,
    DateDirective,
    MatMomentDateModule,
  ],
})
export class LoanInfoComponent implements OnInit {
  title = input<string>();
  description = input<string>();
  public loanFormInfoEvent = output<FormGroup>();
  public isFormValidEvent = output<boolean>();
  public isReQuoteRequiredEvent = output<boolean>();

  private productService = inject(ProductService);
  private fb = inject(FormBuilder);
  private enumService = inject(EnumService);

  public loanTypeList: CarrierLoanType[] = [];
  public frequencyTypeList = getPaymentFrequencyList();
  public paymentTypeList = getPaymentTypeList();
  public minFundingDate!: Date;
  public isLoanTermVisible: boolean = false;
  public isAmortizationVisible: boolean = false;
  public loanForm: FormGroup = this.fb.group({
    loanId: [GUID_EMPTY, [Validators.required]],
    loanType: [null, [Validators.required]],
    loanAmount: [null, [Validators.min(0), Validators.required]],
    paymentAmount: [null, [Validators.min(0), Validators.required]],
    paymentFrequency: [null, [Validators.required]],
    paymentType: [null, [Validators.required]],
    fundingDate: [null, [Validators.required]],
    firstPaymentDate: [null, [Validators.required]],
    loanTerm: [null, [Validators.min(0), Validators.required, Validators.max(999), Validators.min(0)]],
    insuranceType: [null, [Validators.required]],
    interestRate: [
      null,
      [
        Validators.required,
        Validators.pattern('^[0-9]+([.][0-9]{0,5})?$'),
        Validators.min(0.000001),
        Validators.max(999),
        Validators.maxLength(8),
      ],
    ],
    amortization: [null, [Validators.min(0), Validators.required, Validators.max(999), Validators.min(0)]],
  });

  ngOnInit() {
    this.fillLoanTypeList();
    this.formValidation();
    this.setDefaultDates();
  }

  private setDefaultDates() {
    const monthLater = new Date();
    monthLater.setMonth(monthLater.getMonth() + 1);
    this.setMinFundingDate();
    this.loanForm.get('firstPaymentDate')?.setValue(monthLater);
  }

  private setMinFundingDate() {
    this.loanForm.get('fundingDate')?.valueChanges.subscribe({
      next: (data) => {
        this.minFundingDate = moment(data).toDate();
      },
    });
  }

  private fillLoanTypeList() {
    this.productService.carrierLoanTypes$.subscribe((carrierLoanTypes) => {
      if (carrierLoanTypes) {
        this.loanTypeList = carrierLoanTypes;
      }
    });
  }

  public formValidation() {
    this.loanForm.statusChanges.subscribe((status) => {
      if (status === FORM_STATUS.INVALID) {
        this.isFormValidEvent.emit(false);
      } else if (status === FORM_STATUS.VALID) {
        this.isFormValidEvent.emit(true);
      }
    });
    this.isReQuoteRequiredEvent.emit(true);
  }

  public loanFormInfoValues() {
    this.loanFormInfoEvent.emit(this.loanForm);
  }

  public setInsuranceType(event: MatSelectChange) {
    this.loanForm.get('insuranceType')?.setValue(this.enumService.getSystemValue(getLoanTypeList(), event.value));

    if (event.value === LOAN_TYPE.LINE_OF_CREDIT) {
      this.isLoanTermVisible = false;
      this.isAmortizationVisible = false;
      this.loanForm.get('loanTerm')?.setValue(60);
      this.loanForm.get('amortization')?.setValue(60);
    } else {
      this.isLoanTermVisible = true;
      this.isAmortizationVisible = true;
      this.loanForm.get('loanTerm')?.setValue('');
      this.loanForm.get('amortization')?.setValue('');
    }
    this.isReQuoteRequiredEvent.emit(true);
  }

  public onValueChanged(event: any) {
    this.isReQuoteRequiredEvent.emit(true);
  }

  public clearForm() {
    this.isReQuoteRequiredEvent.emit(true);
    this.loanForm?.reset();
    this.loanForm.get('loanId')?.setValue(GUID_EMPTY);
    this.setDefaultDates();
  }
}
