import { Component, inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { distinctUntilChanged } from 'rxjs';
import { GapAnalysisForm } from '@core/utils/Interfaces/gap-analysis-form.model';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMaskModule } from 'ngx-mask';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { FormToken } from '@core/utils/Interfaces/form-token.model';
import { CurrencyOptionsDirective } from '@core/directives/currency-options/currencyOptions.directive';
import { InfoBoxComponent } from '@core/components/info-box/info-box.component';
import { EnhancedGapAnalysisFormDataService } from '@core/services/enhanced-gap-analysis-form-data/enhanced-gap-analysis-form-data.service';
import { StepCommunicationService } from '@core/services/step-communication/step-communication.service';
import { ExistingCoverages } from '@core/utils/Interfaces/forms/existing-coverage.interface';
import { Step } from '@core/utils/enums/gap-analysis-enums';
import { EnhancedGapAnalysisFormService } from '@core/services/enhanced-gap-analysis-form/enhanced-gap-analysis-form.service';
import { TooltipDirective } from '@core/directives/tooltip/tooltip.directive';

@Component({
  selector: 'app-existing-coverages',
  templateUrl: './existing-coverages.component.html',
  styleUrls: ['./existing-coverages.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TooltipDirective,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    CurrencyMaskModule,
    CurrencyOptionsDirective,
    NgxMaskModule,
    MatStepperModule,
    InfoBoxComponent,
    TranslateModule,
  ],
})
export class ExistingCoveragesComponent implements OnInit {
  private fb = inject(UntypedFormBuilder);
  private enhancedGapAnalysisFormService = inject(EnhancedGapAnalysisFormService);
  private enhancedGapAnalysisFormDataService = inject(EnhancedGapAnalysisFormDataService);
  private stepCommunicationService = inject(StepCommunicationService);

  public gapData!: FormToken;
  public gapAnalysisForm!: GapAnalysisForm;
  public existingCoveragesForm = this.fb.group({
    B1_ExistingLifeInsurance: null,
    B1_DisabilityInsuranceInPercentage: 60,
    B1_ExistingCriticalIllnessInsurance: null,
    B2_ExistingLifeInsurance: null,
    B2_DisabilityInsuranceInPercentage: 60,
    B2_ExistingCriticalIllnessInsurance: null,
  });

  public currencyOptions = {
    align: 'right',
    allowNegative: false,
    precision: 0,
    prefix: '',
    thousands: '',
  };

  ngOnInit() {
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
          this.resetExistingCoverageFormForBorrowerTwo();
        },
      });
    this.fillData();
    this.stepCommunicationService.selectedIndex$.subscribe({
      next: (data: { previouslySelectedIndex: Step; selectedIndex: Step }) => {
        if (data.previouslySelectedIndex == Step.EXISTING_COVERAGES) {
          this.setGapAnalysisData();
        } else if (data.selectedIndex == Step.EXISTING_COVERAGES) {
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
        const existingCoverageData: ExistingCoverages = {
          B1_ExistingLifeInsurance: pdfData.B1_ExistingLifeInsurance,
          B1_DisabilityInsuranceInPercentage: pdfData.B1_DisabilityInsuranceInPercentage,
          B1_ExistingCriticalIllnessInsurance: pdfData.B1_ExistingCriticalIllnessInsurance,

          B2_ExistingLifeInsurance: pdfData.B2_ExistingLifeInsurance,
          B2_DisabilityInsuranceInPercentage: pdfData.B2_DisabilityInsuranceInPercentage,
          B2_ExistingCriticalIllnessInsurance: pdfData.B2_ExistingCriticalIllnessInsurance,
        };

        this.loadExistingCoveragesForm(existingCoverageData);
      }
    });
  }

  public setGapAnalysisData() {
    const values = this.existingCoveragesForm.value;
    this.enhancedGapAnalysisFormService.updateFormData('existingCoveragesForm', values);
  }

  private loadExistingCoveragesForm(existingCoverageFormData: ExistingCoverages) {
    this.existingCoveragesForm.setValue(existingCoverageFormData);
  }

  public resetExistingCoverageFormForBorrowerTwo() {
    this.existingCoveragesForm.get('B2_ExistingLifeInsurance')?.setValue(null);
    this.existingCoveragesForm.get('B2_DisabilityInsuranceInPercentage')?.setValue(60);
    this.existingCoveragesForm.get('B2_ExistingCriticalIllnessInsurance')?.setValue(null);
    this.setGapAnalysisData();
  }
}
