import { FormBuilder, Validators, FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMaskModule } from 'ngx-mask';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { take } from 'rxjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { StepCommunicationService } from '@core/services/step-communication/step-communication.service';
import { DatePipe } from '@angular/common';
import { SECURIAN_FORMATS } from '@core/directives/date-directive/date-format';
import { Income } from '@core/utils/Interfaces/forms/income.interface';
import { Liabilities } from '@core/utils/Interfaces/forms/liabilities.interface';
import { FormToken } from '@core/utils/Interfaces/form-token.model';
import { DialogBoxService } from '@core/services/dialog-box/dialog-box.service';
import { MonthlyExpenses } from '@core/utils/Interfaces/forms/monthly-expenses.interface';
import { ExistingCoverages } from '@core/utils/Interfaces/forms/existing-coverage.interface';
import { GapAnalysisForm } from '@core/utils/Interfaces/gap-analysis-form.model';
import { ErrorMessageComponent } from '@core/components/error-message/error-message.component';
import { EnhancedGapAnalysisService } from '@core/services/enhanced-gap-analysis/enhanced-gap-analysis.service';
import { ReadForm } from '@core/models/form-maker-service/form-maker-service.model';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { LanguageService } from '@core/services/language/language.service';
import { EnhancedGapAnalysisFormDataService } from '@core/services/enhanced-gap-analysis-form-data/enhanced-gap-analysis-form-data.service';
import { Step } from '@core/utils/enums/gap-analysis-enums';
import { MeetingDetails } from '@core/utils/Interfaces/forms/meeting-details.interface';
import { EnhancedGapAnalysisFormService } from '@core/services/enhanced-gap-analysis-form/enhanced-gap-analysis-form.service';
import { TooltipDirective } from '@core/directives/tooltip/tooltip.directive';
import { DateDirective } from '@core/directives/date-directive/date.directive';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

@Component({
  selector: 'app-meeting-details',
  templateUrl: './meeting-details.component.html',
  styleUrls: ['./meeting-details.component.scss'],
  providers: [DatePipe, { provide: SECURIAN_FORMATS, useValue: SECURIAN_FORMATS }],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMaskModule,
    MatDividerModule,
    MatCheckboxModule,
    TooltipDirective,
    MatIconModule,
    MatStepperModule,
    ErrorMessageComponent,
    TranslateModule,
    MatDatepickerModule,
    DateDirective,
    MatMomentDateModule,
  ],
})
export class MeetingDetailsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private dialogBoxService = inject(DialogBoxService);
  private enhancedGapAnalysisService = inject(EnhancedGapAnalysisService);
  private enhancedGapAnalysisFormService = inject(EnhancedGapAnalysisFormService);
  private enhancedGapAnalysisFormDataService = inject(EnhancedGapAnalysisFormDataService);
  private translateService = inject(TranslateService);
  private datePipe = inject(DatePipe);
  private stepCommunicationService = inject(StepCommunicationService);
  public languageService = inject(LanguageService);

  public fileName: string = '';
  public jointApplicationChecked: boolean = false;

  public meetingDetailsForm: FormGroup = this.fb.group({
    PrimaryName: null,
    SecondaryName: null,
    Name: [null, [Validators.required]],
    Email: [null, [Validators.required, Validators.email]],
    Phone: [null, [Validators.required]],
    MeetingDate: [null, [Validators.required]],
    IsSecondaryApplicant: false,
  });

  ngOnInit() {
    this.stepCommunicationService.selectedIndex$.subscribe({
      next: (data: { previouslySelectedIndex: Step; selectedIndex: Step }) => {
        if (data.previouslySelectedIndex == Step.MEETING_DETAILS) {
          this.loadMeetingDetailForm();
        } else if (data.selectedIndex == Step.MEETING_DETAILS) {
        }
      },
      error: () => {},
      complete: () => {},
    });

    this.setBorrowerName();
  }

  private setBorrowerName() {
    this.meetingDetailsForm.get('PrimaryName')?.setValue(this.translateService.instant('meeting.borrowerOne'));
    if (this.meetingDetailsForm.get('IsSecondaryApplicant')?.value) {
      this.meetingDetailsForm.get('PrimaryName')?.setValue(this.translateService.instant('meeting.borrowerTwo'));
    }
  }

  onJointApplicationChanged(value: MatCheckboxChange) {
    this.jointApplicationChecked = value.checked;
  }

  onFileSelected = (event: any) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(event.target.files[0]);
    if (event.target.files[0].type !== 'application/pdf') {
      this.dialogBoxService.openDialog(
        'dialog.incompatibleFileType',
        'dialog.warning',
        '/new-policy/gap-analysis/enhanced-gap-analysis'
      );
      return;
    }

    fileReader.onload = () => {
      const temporaryFileName = event.target.files[0].name;
      let readForm: ReadForm = {
        formImage:
          fileReader.result?.toString().split(',').pop() == 'data:'
            ? ''
            : fileReader.result?.toString().split(',').pop(),
      };
      this.getGapAnalysis(readForm, temporaryFileName);
    };
  };

  private getGapAnalysis(readForm: ReadForm, fileName: string) {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.enhancedGapAnalysisService
      .readForm(readForm)
      .pipe(take(1))
      .subscribe({
        next: (response: FormToken) => {
          this.loadGapAnalysisData(response, fileName);
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
        error: (error) => {
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
      });
  }

  private loadGapAnalysisData = (response: FormToken, fileName: string) => {
    this.enhancedGapAnalysisFormDataService._gapAnalysisData.next(response);
    if (response && response.pdfData) {
      this.fileName = fileName;
      const pdfData: FormToken = JSON.parse(response.pdfData);
      this.setGapAnalysisData(pdfData);
    } else {
      this.dialogBoxService.openDialog(
        'dialog.incompatibleFile',
        'dialog.warning',
        '/new-policy/gap-analysis/enhanced-gap-analysis'
      );
    }
  };

  public isFormInvalid() {
    if (
      (!this.meetingDetailsForm.get('Name')?.valid && this.meetingDetailsForm.get('Name')?.touched) ||
      (!this.meetingDetailsForm.get('Email')?.valid && this.meetingDetailsForm.get('Email')?.touched) ||
      (!this.meetingDetailsForm.get('Phone')?.valid && this.meetingDetailsForm.get('Phone')?.touched) ||
      (!this.meetingDetailsForm.get('MeetingDate')?.valid && this.meetingDetailsForm.get('MeetingDate')?.touched)
    ) {
      return true;
    } else return false;
  }

  public setGapAnalysisData(pdfData: FormToken) {
    let MeetingDate = pdfData.MeetingDate ? this.datePipe.transform(pdfData.MeetingDate, 'YYYY-MM-dd')?.toString() : '';
    const meetingDetailsForm: MeetingDetails = {
      Name: pdfData.Name ? pdfData.Name : '',
      Email: pdfData.Email ? pdfData.Email : '',
      Phone: pdfData.Phone ? pdfData.Phone : '',
      MeetingDate: MeetingDate,
      IsSecondaryApplicant: pdfData.IsSecondaryApplicant,
      PrimaryName: this.translateService.instant('meeting.borrowerOne'),
      SecondaryName: pdfData.IsSecondaryApplicant ? this.translateService.instant('meeting.borrowerTwo') : '',
    };

    const incomeForm: Income = {
      B1_GrossMonthlyBaseSalary: pdfData.B1_GrossMonthlyBaseSalary,
      B1_ProvinceOrTerritory: pdfData.B1_ProvinceOrTerritory,
      B1_GrossMonthlyBonuses: pdfData.B1_GrossMonthlyBonuses,
      B1_GrossMonthlyRentals: pdfData.B1_GrossMonthlyRentals,
      B1_EstimatedAnnualIncomeAfterTax: pdfData.B1_EstimatedAnnualIncomeAfterTax,
      B1_EstimatedMonthlyIncomeAfterTax: pdfData.B1_EstimatedMonthlyIncomeAfterTax,
      B1_IncomeType: pdfData.B1_IncomeType,
      B2_GrossMonthlyBaseSalary: pdfData.B2_GrossMonthlyBaseSalary,
      B2_ProvinceOrTerritory: pdfData.B2_ProvinceOrTerritory,
      B2_GrossMonthlyBonuses: pdfData.B2_GrossMonthlyBonuses,
      B2_GrossMonthlyRentals: pdfData.B2_GrossMonthlyRentals,
      B2_EstimatedAnnualIncomeAfterTax: pdfData.B2_EstimatedAnnualIncomeAfterTax,
      B2_EstimatedMonthlyIncomeAfterTax: pdfData.B2_EstimatedMonthlyIncomeAfterTax,
      B2_IncomeType: pdfData.B2_IncomeType,
      CombinedEstimatedAnnualIncomeAfterTax: pdfData.CombinedEstimatedAnnualIncomeAfterTax,
      CombinedEstimatedMonthlyIncomeAfterTax: pdfData.CombinedEstimatedMonthlyIncomeAfterTax,
    };

    const liabilitiesForm: Liabilities = {
      NewMortgageLoanBalanceValue: pdfData.NewMortgageLoanBalanceValue,
      ExistingLiabilitiesDebtBalance: pdfData.ExistingLiabilitiesDebtBalance,
      TotalOutstandingLiabilitiesDebtBalance: pdfData.TotalOutstandingLiabilitiesDebtBalance,
    };

    const monthlyExpenseForm: MonthlyExpenses = {
      NewMonthlyMortgageLoanPayment: pdfData.NewMonthlyMortgageLoanPayment,
      ExistingMonthlyLiabilityDebtPayments: pdfData.ExistingMonthlyLiabilityDebtPayments,
      OtherMonthlyExpensesInPercentage: pdfData.OtherMonthlyExpensesInPercentage,
      OtherMonthlyExpensesInNumber: pdfData.OtherMonthlyExpensesInNumber,
      TotalMonthlyIncome: pdfData.TotalMonthlyIncome,
      TotalMonthlyExpenses: pdfData.TotalMonthlyExpenses,
      NetMonthlyIncome: pdfData.NetMonthlyIncome,
    };

    const existingCoverageForm: ExistingCoverages = {
      B1_ExistingLifeInsurance: pdfData.B1_ExistingLifeInsurance,
      B1_DisabilityInsuranceInPercentage: pdfData.B1_DisabilityInsuranceInPercentage,
      B1_ExistingCriticalIllnessInsurance: pdfData.B1_ExistingCriticalIllnessInsurance,

      B2_ExistingLifeInsurance: pdfData.B2_ExistingLifeInsurance,
      B2_DisabilityInsuranceInPercentage: pdfData.B2_DisabilityInsuranceInPercentage,
      B2_ExistingCriticalIllnessInsurance: pdfData.B2_ExistingCriticalIllnessInsurance,
    };

    const filledForm: GapAnalysisForm = {
      meetingDetailForm: meetingDetailsForm,
      incomeForm: incomeForm,
      liabilitiesForm: liabilitiesForm,
      monthlyExpensesForm: monthlyExpenseForm,
      existingCoveragesForm: existingCoverageForm,
    };
    this.meetingDetailsForm.setValue(meetingDetailsForm);
    this.enhancedGapAnalysisFormService.updateForm(filledForm);
  }

  public loadMeetingDetailForm() {
    this.enhancedGapAnalysisFormService.updateFormData('meetingDetailForm', this.meetingDetailsForm.value);
  }

  public resetIncomeFormDataForBorrowerTwo() {}

  public resetExistingCoverageFormDataForBorrowerTwo() {}
}
