import { Component, inject, OnInit, output } from '@angular/core';
import { UntypedFormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { MatStepperModule } from '@angular/material/stepper';
import { TranslateModule } from '@ngx-translate/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormToken } from '@core/utils/Interfaces/form-token.model';
import { EnhancedGapAnalysisFormDataService } from '@core/services/enhanced-gap-analysis-form-data/enhanced-gap-analysis-form-data.service';
import { LanguageService } from '@core/services/language/language.service';
import { StepCommunicationService } from '@core/services/step-communication/step-communication.service';
import { Step } from '@core/utils/enums/gap-analysis-enums';
import { Liabilities } from '@core/utils/Interfaces/forms/liabilities.interface';
import { EnhancedGapAnalysisFormService } from '@core/services/enhanced-gap-analysis-form/enhanced-gap-analysis-form.service';
import { GapAnalysisForm } from '@core/utils/Interfaces/gap-analysis-form.model';
import { ErrorMessageComponent } from '@core/components/error-message/error-message.component';
import { TotalComponent } from '@core/components/total/total.component';
import { TooltipDirective } from '@core/directives/tooltip/tooltip.directive';
import { CurrencyOptionsDirective } from '@core/directives/currency-options/currencyOptions.directive';

@Component({
  selector: 'app-assets-liabilities',
  templateUrl: './assets-liabilities.component.html',
  styleUrls: ['./assets-liabilities.component.scss'],
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
    TotalComponent,
    MatStepperModule,
    ErrorMessageComponent,
    TranslateModule,
  ],
})
export class AssetsLiabilitiesComponent implements OnInit {
  recalculate = output<any>();

  private fb = inject(UntypedFormBuilder);
  private stepCommunicationService = inject(StepCommunicationService);
  private enhancedGapAnalysisFormDataService = inject(EnhancedGapAnalysisFormDataService);
  private enhancedGapAnalysisFormService = inject(EnhancedGapAnalysisFormService);
  public languageService = inject(LanguageService);

  public gapData!: FormToken;
  public hasSecondaryApplicant: boolean | undefined = false;
  public currentGlobalFormValue!: GapAnalysisForm;

  public liabilityForm = this.fb.group({
    NewMortgageLoanBalanceValue: [null, [Validators.required]],
    ExistingLiabilitiesDebtBalance: null,
    TotalOutstandingLiabilitiesDebtBalance: null,
  });

  ngOnInit() {
    this.enhancedGapAnalysisFormService.gapAnalysisForm$.subscribe({
      next: (fromData: GapAnalysisForm) => {
        this.currentGlobalFormValue = fromData;
      },
    });
    this.fillData();
    this.stepCommunicationService.selectedIndex$.subscribe({
      next: (data: { previouslySelectedIndex: Step; selectedIndex: Step }) => {
        if (data.previouslySelectedIndex === Step.LIABILITIES) {
          this.saveLiabilities();
        } else if (data.selectedIndex === Step.LIABILITIES) {
          this.saveLiabilities();
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
        this.hasSecondaryApplicant = pdfData.IsSecondaryApplicant ? pdfData.IsSecondaryApplicant : false;
        let liabilitiesFormData: Liabilities = {
          NewMortgageLoanBalanceValue: pdfData.NewMortgageLoanBalanceValue,
          ExistingLiabilitiesDebtBalance: pdfData.ExistingLiabilitiesDebtBalance,
          TotalOutstandingLiabilitiesDebtBalance: pdfData.TotalOutstandingLiabilitiesDebtBalance,
        };
        this.loadLiabilitiesForm(liabilitiesFormData);
      }
    });
  }

  calculateTotalOutstandingLiabilities(): number {
    let totalOutstandingLiabilitiesDebtBalance = 0;
    const newMortgageLoanBalance = parseInt(this.liabilityForm.get('NewMortgageLoanBalanceValue')?.value || 0);
    const existingLiabilitiesDebtBalance = parseInt(
      this.liabilityForm.get('ExistingLiabilitiesDebtBalance')?.value || 0
    );

    totalOutstandingLiabilitiesDebtBalance = parseInt(
      (newMortgageLoanBalance + existingLiabilitiesDebtBalance).toFixed(0)
    );
    this.liabilityForm.get('TotalOutstandingLiabilitiesDebtBalance')?.setValue(totalOutstandingLiabilitiesDebtBalance);

    return totalOutstandingLiabilitiesDebtBalance;
  }

  public isFormInvalid() {
    if (
      !this.liabilityForm.controls['NewMortgageLoanBalanceValue'].valid &&
      this.liabilityForm.controls['NewMortgageLoanBalanceValue'].touched
    ) {
      return true;
    }
    return false;
  }

  public saveLiabilities() {
    const values = this.liabilityForm.value;
    this.enhancedGapAnalysisFormService.updateFormData('liabilitiesForm', values);
  }

  private loadLiabilitiesForm(liabilitiesFormData: Liabilities) {
    this.liabilityForm.setValue(liabilitiesFormData);
  }
}
