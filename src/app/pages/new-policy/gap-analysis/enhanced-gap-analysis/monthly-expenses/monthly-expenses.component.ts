import { Component, inject, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMaskModule } from 'ngx-mask';
import { FormToken } from '@core/utils/Interfaces/form-token.model';
import { LanguageService } from '@core/services/language/language.service';
import { ExpandDetails, initialStateDetails } from '@core/utils/enums/gap-analysis-constants';
import { StepCommunicationService } from '@core/services/step-communication/step-communication.service';
import { Step } from '@core/utils/enums/gap-analysis-enums';
import { MonthlyExpenses } from '@core/utils/Interfaces/forms/monthly-expenses.interface';
import { EnhancedGapAnalysisFormService } from '@core/services/enhanced-gap-analysis-form/enhanced-gap-analysis-form.service';
import { GapAnalysisForm } from '@core/utils/Interfaces/gap-analysis-form.model';
import { EnhancedGapAnalysisFormDataService } from '@core/services/enhanced-gap-analysis-form-data/enhanced-gap-analysis-form-data.service';
import { CurrencyOptionPipe } from '@core/utils/pipes/currency-option/currency-option.pipe';
import { InfoBoxComponent } from '@core/components/info-box/info-box.component';
import { ErrorMessageComponent } from '@core/components/error-message/error-message.component';
import { OnlyIntegerDirective } from '@core/directives/only-integer/only-integer.directive';
import { TooltipDirective } from '@core/directives/tooltip/tooltip.directive';
import { CurrencyOptionsDirective } from '@core/directives/currency-options/currencyOptions.directive';

@Component({
  selector: 'app-monthly-expenses',
  templateUrl: './monthly-expenses.component.html',
  styleUrls: ['./monthly-expenses.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    CurrencyMaskModule,
    CurrencyOptionsDirective,
    TooltipDirective,
    MatIconModule,
    NgxMaskModule,
    OnlyIntegerDirective,
    MatDividerModule,
    NgClass,
    MatStepperModule,
    ErrorMessageComponent,
    InfoBoxComponent,
    AsyncPipe,
    CurrencyOptionPipe,
    TranslateModule,
  ],
})
export class MonthlyExpensesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private enhancedGapAnalysisFormService = inject(EnhancedGapAnalysisFormService);
  private enhancedGapAnalysisFormDataService = inject(EnhancedGapAnalysisFormDataService);
  private stepCommunicationService = inject(StepCommunicationService);
  public languageService = inject(LanguageService);

  public expandedExpenses: ExpandDetails = initialStateDetails();
  public showMessage: boolean = true;
  public gapData!: FormToken;
  public hasSecondaryApplicant: boolean = false;
  public currentGlobalFormValue!: GapAnalysisForm;
  public currentMonthlyExpenses: number = 0;

  public controlNames: string[] = ['monthlyLivingExpensesAmount', 'monthlyLivingExpensesPercentage', 'monthlyNewDebt'];

  public monthlyExpenseForm: FormGroup = this.fb.group({
    NewMonthlyMortgageLoanPayment: [null, [Validators.required]],
    ExistingMonthlyLiabilityDebtPayments: [null],
    OtherMonthlyExpensesInPercentage: [55, [Validators.required]],
    OtherMonthlyExpensesInNumber: [null, [Validators.required]],

    TotalMonthlyIncome: null,
    TotalMonthlyExpenses: null,
    NetMonthlyIncome: null,
  });

  ngOnInit() {
    this.enhancedGapAnalysisFormService.gapAnalysisForm$.subscribe({
      next: (globalFormData: GapAnalysisForm) => {
        this.currentGlobalFormValue = globalFormData;
        this.convertLivingExpensesPercentageToNumber();
      },
    });
    this.fillData();
    this.stepCommunicationService.selectedIndex$.subscribe({
      next: (data: { previouslySelectedIndex: Step; selectedIndex: Step }) => {
        if (data.previouslySelectedIndex === Step.MONTHLY_EXPENSES) {
          this.saveExpenses();
        }
      },
      error: () => {},
      complete: () => {},
    });
  }

  public fillData() {
    this.enhancedGapAnalysisFormDataService._gapAnalysisData.subscribe((data: FormToken) => {
      if (data && data.pdfData) {
        const pdfData: FormToken = JSON.parse(data.pdfData);
        this.gapData = pdfData;
        this.hasSecondaryApplicant = pdfData.IsSecondaryApplicant ? pdfData.IsSecondaryApplicant : false;

        this.convertLivingExpensesPercentageToNumber();

        const monthlyExpenseFormData: MonthlyExpenses = {
          NewMonthlyMortgageLoanPayment: pdfData.NewMonthlyMortgageLoanPayment,
          ExistingMonthlyLiabilityDebtPayments: pdfData.ExistingMonthlyLiabilityDebtPayments,
          OtherMonthlyExpensesInPercentage: pdfData.OtherMonthlyExpensesInPercentage,
          OtherMonthlyExpensesInNumber: pdfData.OtherMonthlyExpensesInNumber,

          TotalMonthlyIncome: pdfData.TotalMonthlyIncome,
          TotalMonthlyExpenses: pdfData.TotalMonthlyExpenses,
          NetMonthlyIncome: pdfData.NetMonthlyIncome,
        };

        this.loadMonthlyExpenseForm(monthlyExpenseFormData);
      }
    });
  }

  public convertLivingExpensesPercentageToNumber(): number {
    const totalMonthlyIncome = this.getTotalMonthlyIncome();
    const livingExpensesPercentage =
      parseInt(this.monthlyExpenseForm.get('OtherMonthlyExpensesInPercentage')?.value, 10) || 0;

    let livingExpensesInNumber: number = 0;
    if (!isNaN(livingExpensesPercentage) && totalMonthlyIncome > 0) {
      livingExpensesInNumber = Number(((totalMonthlyIncome * livingExpensesPercentage) / 100).toFixed(0));
    }
    this.monthlyExpenseForm.get('OtherMonthlyExpensesInNumber')?.setValue(livingExpensesInNumber);
    return livingExpensesInNumber;
  }

  public convertLivingExpenseNumberToPercentage(): number {
    const totalMonthlyIncome = this.getTotalMonthlyIncome();
    const livingExpensesNumber = parseInt(this.monthlyExpenseForm.get('OtherMonthlyExpensesInNumber')?.value, 10) || 0;
    let livingExpensesPercentage = 0;
    if (totalMonthlyIncome > 0) {
      livingExpensesPercentage = Number(((livingExpensesNumber / totalMonthlyIncome) * 100).toFixed(0));
    } else {
      livingExpensesPercentage = 0;
    }
    this.monthlyExpenseForm.get('OtherMonthlyExpensesInPercentage')?.setValue(livingExpensesPercentage);
    return livingExpensesPercentage;
  }

  getNetMonthlyIncome(): number {
    const netMonthlyIncome = this.getTotalMonthlyIncome() - this.getTotalMonthlyExpenses();
    this.monthlyExpenseForm.get('NetMonthlyIncome')?.setValue(netMonthlyIncome.toFixed(0));
    return parseInt(netMonthlyIncome.toFixed(0));
  }

  getTotalMonthlyIncome(): number {
    let totalMonthlyIncome = 0;

    if (this.currentGlobalFormValue.incomeForm) {
      const incomeForm = this.currentGlobalFormValue.incomeForm;

      if (!this.currentGlobalFormValue.meetingDetailForm?.IsSecondaryApplicant) {
        totalMonthlyIncome = parseFloat(incomeForm.B1_EstimatedMonthlyIncomeAfterTax || '0');
      } else {
        totalMonthlyIncome =
          parseFloat(incomeForm.B1_EstimatedMonthlyIncomeAfterTax || '0') +
          parseFloat(incomeForm.B2_EstimatedMonthlyIncomeAfterTax || '0');
      }
    }

    this.monthlyExpenseForm.get('TotalMonthlyIncome')?.setValue(totalMonthlyIncome);
    return totalMonthlyIncome;
  }

  getTotalMonthlyExpenses(): number {
    const NewMonthlyMortgageLoanPayment =
      parseFloat(this.monthlyExpenseForm.get('NewMonthlyMortgageLoanPayment')?.value) || 0;
    const ExistingMonthlyLiabilityDebtPayments =
      parseFloat(this.monthlyExpenseForm.get('ExistingMonthlyLiabilityDebtPayments')?.value) || 0;
    const OtherMonthlyExpensesInNumber =
      parseFloat(this.monthlyExpenseForm.get('OtherMonthlyExpensesInNumber')?.value) || 0;
    const totalMonthlyExpenses =
      NewMonthlyMortgageLoanPayment + ExistingMonthlyLiabilityDebtPayments + OtherMonthlyExpensesInNumber;
    this.monthlyExpenseForm.get('TotalMonthlyExpenses')?.setValue(totalMonthlyExpenses.toFixed(0));
    return parseInt(totalMonthlyExpenses.toFixed(0));
  }

  public isFormInvalid() {
    if (
      (!this.monthlyExpenseForm.get('NewMonthlyMortgageLoanPayment')?.valid &&
        this.monthlyExpenseForm.get('NewMonthlyMortgageLoanPayment')?.touched) ||
      (!this.monthlyExpenseForm.get('OtherMonthlyExpensesInPercentage')?.valid &&
        this.monthlyExpenseForm.get('OtherMonthlyExpensesInPercentage')?.touched) ||
      (!this.monthlyExpenseForm.get('OtherMonthlyExpensesInNumber')?.valid &&
        this.monthlyExpenseForm.get('OtherMonthlyExpensesInNumber')?.touched)
    ) {
      return true;
    } else return false;
  }

  public saveExpenses() {
    const values: MonthlyExpenses = this.monthlyExpenseForm.value;
    this.enhancedGapAnalysisFormService.updateFormData('monthlyExpensesForm', values);
  }

  private loadMonthlyExpenseForm(monthlyExpenseFormData: MonthlyExpenses) {
    this.monthlyExpenseForm.patchValue(monthlyExpenseFormData);
  }
}
