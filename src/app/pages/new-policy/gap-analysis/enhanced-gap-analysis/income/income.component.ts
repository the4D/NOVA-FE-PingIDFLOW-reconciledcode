import { distinctUntilChanged } from 'rxjs';
import { MatOptionModule } from '@angular/material/core';
import { Component, inject, OnInit } from '@angular/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { UntypedFormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { EnhancedGapAnalysisFormDataService } from '@core/services/enhanced-gap-analysis-form-data/enhanced-gap-analysis-form-data.service';
import { PRIMARY, SALARY, SECONDARY, YEAR } from '@core/utils/enums/gap-analysis-constants';
import { FormToken } from '@core/utils/Interfaces/form-token.model';
import { AddNumbers } from '@core/utils/functions/numericOperations';
import { reduceTaxBand } from '@pages/new-policy/gap-analysis/util/gap-analysis-util';
import { newGetAnnualIncomeBeforeTax, newGetValueOf } from '@pages/new-policy/gap-analysis/util/gap-analysis-util';
import { StepCommunicationService } from '@core/services/step-communication/step-communication.service';
import { Step } from '@core/utils/enums/gap-analysis-enums';
import { Income } from '@core/utils/Interfaces/forms/income.interface';
import { EnhancedGapAnalysisFormService } from '@core/services/enhanced-gap-analysis-form/enhanced-gap-analysis-form.service';
import { GapAnalysisForm } from '@core/utils/Interfaces/gap-analysis-form.model';
import { LanguageService } from '@core/services/language/language.service';
import { EnumValue } from '@core/models/insurance/enum.model';
import { getProvinceList } from '@core/utils/enums/system-enums';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyOptionPipe } from '@core/utils/pipes/currency-option/currency-option.pipe';
import { ErrorMessageComponent } from '@core/components/error-message/error-message.component';
import { TooltipDirective } from '@core/directives/tooltip/tooltip.directive';
import { CurrencyOptionsDirective } from '@core/directives/currency-options/currencyOptions.directive';

@Component({
  selector: 'app-income',
  templateUrl: './income.component.html',
  styleUrls: ['./income.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    CurrencyMaskModule,
    CurrencyOptionsDirective,
    MatSelectModule,
    MatOptionModule,
    TooltipDirective,
    MatIconModule,
    MatDividerModule,
    MatStepperModule,
    ErrorMessageComponent,
    CurrencyOptionPipe,
    TranslateModule,
  ],
})
export class IncomeComponent implements OnInit {
  private fb = inject(UntypedFormBuilder);
  private enhancedGapAnalysisFormDataService = inject(EnhancedGapAnalysisFormDataService);
  private stepCommunicationService = inject(StepCommunicationService);
  public enhancedGapAnalysisFormService = inject(EnhancedGapAnalysisFormService);
  public languageService = inject(LanguageService);

  public provinceList!: EnumValue[];
  public gapAnalysisForm!: GapAnalysisForm;
  public newIncomeForm = this.fb.group({
    B1_GrossMonthlyBaseSalary: [null, [Validators.required]],
    B1_ProvinceOrTerritory: [null, [Validators.required]],
    B1_GrossMonthlyBonuses: null,
    B1_GrossMonthlyRentals: null,
    B1_EstimatedAnnualIncomeAfterTax: null,
    B1_EstimatedMonthlyIncomeAfterTax: null,
    B1_IncomeType: null,
    B2_GrossMonthlyBaseSalary: [null, [Validators.required]],
    B2_ProvinceOrTerritory: [null, [Validators.required]],
    B2_GrossMonthlyBonuses: null,
    B2_GrossMonthlyRentals: null,
    B2_EstimatedAnnualIncomeAfterTax: null,
    B2_EstimatedMonthlyIncomeAfterTax: null,
    B2_IncomeType: null,

    CombinedEstimatedAnnualIncomeAfterTax: null,
    CombinedEstimatedMonthlyIncomeAfterTax: null,
  });

  ngOnInit(): void {
    this.provinceList = getProvinceList();
    this.enhancedGapAnalysisFormService.gapAnalysisForm$
      .pipe(
        distinctUntilChanged(
          (prev: GapAnalysisForm, curr: GapAnalysisForm) =>
            prev.meetingDetailForm?.IsSecondaryApplicant === curr.meetingDetailForm?.IsSecondaryApplicant
        )
      )
      .subscribe({
        next: (data: GapAnalysisForm) => {
          this.gapAnalysisForm = data;
          this.resetIncomeFormForBorrowerTwo();
        },
      });
    this.fillData();
    this.stepCommunicationService.selectedIndex$.subscribe({
      next: (data: { previouslySelectedIndex: Step; selectedIndex: Step }) => {
        if (data.previouslySelectedIndex == Step.INCOME) {
          this.setGapAnalysisData();
        } else if (data.selectedIndex == Step.INCOME) {
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
        let incomeFormData: Income = {
          B1_GrossMonthlyBaseSalary: pdfData.B1_GrossMonthlyBaseSalary,
          B1_ProvinceOrTerritory: pdfData.B1_ProvinceOrTerritory,
          B1_GrossMonthlyBonuses: pdfData.B1_GrossMonthlyBonuses,
          B1_GrossMonthlyRentals: pdfData.B1_GrossMonthlyRentals,
          B1_EstimatedAnnualIncomeAfterTax: pdfData.B1_EstimatedAnnualIncomeAfterTax,
          B1_EstimatedMonthlyIncomeAfterTax: pdfData.B1_EstimatedMonthlyIncomeAfterTax,
          B1_IncomeType: SALARY,

          B2_GrossMonthlyBaseSalary: pdfData.B2_GrossMonthlyBaseSalary,
          B2_ProvinceOrTerritory: pdfData.B2_ProvinceOrTerritory,
          B2_GrossMonthlyBonuses: pdfData.B2_GrossMonthlyBonuses,
          B2_GrossMonthlyRentals: pdfData.B2_GrossMonthlyRentals,
          B2_EstimatedAnnualIncomeAfterTax: pdfData.B2_EstimatedAnnualIncomeAfterTax,
          B2_EstimatedMonthlyIncomeAfterTax: pdfData.B2_EstimatedMonthlyIncomeAfterTax,
          B2_IncomeType: SALARY,

          CombinedEstimatedAnnualIncomeAfterTax: pdfData.CombinedEstimatedAnnualIncomeAfterTax,
          CombinedEstimatedMonthlyIncomeAfterTax: pdfData.CombinedEstimatedMonthlyIncomeAfterTax,
        };

        this.loadIncomeForm(incomeFormData);
      }
    });
  }

  public onProvinceChange(event: MatSelectChange, applicantType: string) {
    if (applicantType === PRIMARY && this.gapAnalysisForm.meetingDetailForm?.IsSecondaryApplicant) {
      this.newIncomeForm.get('B2_ProvinceOrTerritory')?.setValue(event.value);
    }
  }

  public getMonthlyIncome(applicantType: string) {
    const values = this.newIncomeForm.value;
    const total = AddNumbers([
      reduceTaxBand(
        newGetAnnualIncomeBeforeTax(applicantType, values) * YEAR,
        applicantType === PRIMARY ? values.B1_ProvinceOrTerritory : values.B2_ProvinceOrTerritory
      ) / YEAR,
      applicantType === PRIMARY
        ? newGetValueOf(values.B1_GrossMonthlyRentals)
        : newGetValueOf(values.B2_GrossMonthlyRentals),
    ]);

    if (applicantType == PRIMARY) {
      this.newIncomeForm.get('B1_EstimatedMonthlyIncomeAfterTax')?.setValue(total.toFixed(0));
    } else {
      this.newIncomeForm.get('B2_EstimatedMonthlyIncomeAfterTax')?.setValue(total.toFixed(0));
    }

    return parseInt(total.toFixed(0));
  }

  public getCombinedAnnualIncome(): number {
    if (!this.gapAnalysisForm.meetingDetailForm?.IsSecondaryApplicant) {
      return this.getAnnualIncomeVariation(PRIMARY);
    } else {
      const total = this.getAnnualIncomeVariation(PRIMARY) + this.getAnnualIncomeVariation(SECONDARY);
      this.newIncomeForm.get('CombinedEstimatedAnnualIncomeAfterTax')?.setValue(total);

      return total;
    }
  }

  public getCombinedMonthlyIncome() {
    if (!this.gapAnalysisForm.meetingDetailForm?.IsSecondaryApplicant) {
      return this.getMonthlyIncome(PRIMARY);
    } else {
      const total = this.getMonthlyIncome(PRIMARY) + this.getMonthlyIncome(SECONDARY);
      this.newIncomeForm.get('CombinedEstimatedMonthlyIncomeAfterTax')?.setValue(total);

      return total;
    }
  }

  public getAnnualIncomeVariation(applicantType: string) {
    const values = this.newIncomeForm.value;
    let annualIncome = newGetAnnualIncomeBeforeTax(applicantType, values) * YEAR;
    const total = AddNumbers([
      reduceTaxBand(
        annualIncome,
        applicantType === PRIMARY ? values.B1_ProvinceOrTerritory : values.B2_ProvinceOrTerritory
      ),
      applicantType === PRIMARY
        ? newGetValueOf(values.B1_GrossMonthlyRentals) * YEAR
        : newGetValueOf(values.B2_GrossMonthlyRentals) * YEAR,
    ]);

    if (applicantType == PRIMARY) {
      this.newIncomeForm.get('B1_EstimatedAnnualIncomeAfterTax')?.setValue(total);
    } else {
      this.newIncomeForm.get('B2_EstimatedAnnualIncomeAfterTax')?.setValue(total);
    }

    return parseInt(total.toFixed(0));
  }

  public isFormInvalid() {
    if (this.gapAnalysisForm.meetingDetailForm?.IsSecondaryApplicant) {
      if (
        (!this.newIncomeForm.get('B1_GrossMonthlyBaseSalary')?.valid &&
          this.newIncomeForm.get('B1_GrossMonthlyBaseSalary')?.touched) ||
        (!this.newIncomeForm.get('B1_ProvinceOrTerritory')?.valid &&
          this.newIncomeForm.get('B1_ProvinceOrTerritory')?.touched) ||
        (!this.newIncomeForm.get('B2_GrossMonthlyBaseSalary')?.valid &&
          this.newIncomeForm.get('B2_GrossMonthlyBaseSalary')?.touched) ||
        (!this.newIncomeForm.get('B2_GrossMonthlyBaseSalary')?.valid &&
          this.newIncomeForm.get('B2_GrossMonthlyBaseSalary')?.touched)
      ) {
        return true;
      } else return false;
    } else {
      if (
        (!this.newIncomeForm.get('B1_GrossMonthlyBaseSalary')?.valid &&
          this.newIncomeForm.get('B1_GrossMonthlyBaseSalary')?.touched) ||
        (!this.newIncomeForm.get('B1_ProvinceOrTerritory')?.valid &&
          this.newIncomeForm.get('B1_ProvinceOrTerritory')?.touched)
      ) {
        return true;
      } else return false;
    }
  }

  public setGapAnalysisData() {
    const values: Income = this.newIncomeForm.value;
    this.enhancedGapAnalysisFormService.updateFormData('incomeForm', values);
  }

  private loadIncomeForm(incomeFormData: Income) {
    this.newIncomeForm.setValue(incomeFormData);
  }
  private resetIncomeFormForBorrowerTwo() {
    this.newIncomeForm.get('B2_GrossMonthlyBaseSalary')?.setValue(null);
    this.newIncomeForm.get('B2_ProvinceOrTerritory')?.setValue(null);
    this.newIncomeForm.get('B2_GrossMonthlyBonuses')?.setValue(null);
    this.newIncomeForm.get('B2_GrossMonthlyRentals')?.setValue(null);
    this.newIncomeForm.get('B2_EstimatedAnnualIncomeAfterTax')?.setValue(null);
    this.newIncomeForm.get('B2_EstimatedMonthlyIncomeAfterTax')?.setValue(null);
    this.newIncomeForm.get('B2_IncomeType')?.setValue(null);
    this.newIncomeForm.get('CombinedEstimatedAnnualIncomeAfterTax')?.setValue(null);
    this.newIncomeForm.get('CombinedEstimatedMonthlyIncomeAfterTax')?.setValue(null);
    this.setGapAnalysisData();
  }
}
