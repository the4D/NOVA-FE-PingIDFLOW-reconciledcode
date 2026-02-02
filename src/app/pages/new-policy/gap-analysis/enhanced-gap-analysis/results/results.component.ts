import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { BehaviorSubject, take } from 'rxjs';
import { FormMetadata, FormRequestBase } from '@core/models/form-maker-service/form-maker-service.model';
import { toTitleCapitalize } from '@core/utils/functions/titleCapitalize';
import { EnhancedGapAnalysisService } from '@core/services/enhanced-gap-analysis/enhanced-gap-analysis.service';
import { InputMode, OutputMode, Product } from '@core/utils/enums/form-maker-service-enums';
import {
  BORROWER_TYPE,
  COVERAGE_PERCENTAGE,
  COVERAGE_TYPE,
  CRITICAL_ILLNESS_MAX,
  FiFTY_PERCENT,
  LIFE_INSURANCE_MAX,
  MAX_INSURED_AMOUNT,
  PERCENTAGE,
  PRIMARY,
  SECONDARY,
  SUMMARY_DESCRIPTION,
  YEAR,
} from '@core/utils/enums/gap-analysis-constants';
import { AddNumbers } from '@core/utils/functions/numericOperations';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { LanguageService } from '@core/services/language/language.service';
import { CurrencyOptionPipe } from '@core/utils/pipes/currency-option/currency-option.pipe';
import { DatePipe, NgTemplateOutlet, NgClass, AsyncPipe } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  applicantInitialState,
  getValueOf,
  reduceTaxBand,
  resetApplicationState,
} from '@pages/new-policy/gap-analysis/util/gap-analysis-util';
import { StepCommunicationService } from '@core/services/step-communication/step-communication.service';
import { Step } from '@core/utils/enums/gap-analysis-enums';
import { APPLICATION_TYPE, PDF_LANGUAGE, PDF_NAME, PDF_TYPE } from '@core/utils/enums/gap-analysis-pdf-enums';
import { EnhancedGapAnalysisFormDataService } from '@core/services/enhanced-gap-analysis-form-data/enhanced-gap-analysis-form-data.service';
import { ApplicantSelected, FormToken, List } from '@core/utils/Interfaces/form-token.model';
import { EnhancedGapAnalysisFormService } from '@core/services/enhanced-gap-analysis-form/enhanced-gap-analysis-form.service';
import { GapAnalysisForm } from '@core/utils/Interfaces/gap-analysis-form.model';
import { CurrencyOptionPipe as CurrencyOptionPipe_1 } from '@core/utils/pipes/currency-option/currency-option.pipe';
import { TooltipDirective } from '@core/directives/tooltip/tooltip.directive';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyOptionsDirective } from '@core/directives/currency-options/currencyOptions.directive';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { WrapperCardResultComponent } from './wrapper-card-result/wrapper-card-result.component';
import { MatStepperModule } from '@angular/material/stepper';
import { MonthlyIncomeApplicantComponent } from './monthly-income-applicant/monthly-income-applicant.component';
import { AppState } from '@store';
import { cardCollapseInitialState, CollapseCard } from './models/colapse-card.model';
import { CardResultComponent } from './card-result/card-result.component';
import { FormMetadataDto } from '@core/models/gap-analysis/gap-analysis.model';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
  providers: [CurrencyOptionPipe, DatePipe],
  standalone: true,
  imports: [
    MatStepperModule,
    NgTemplateOutlet,
    WrapperCardResultComponent,
    FormsModule,
    ReactiveFormsModule,
    CurrencyMaskModule,
    CurrencyOptionsDirective,
    MatIconModule,
    TooltipDirective,
    NgClass,
    AsyncPipe,
    CurrencyOptionPipe_1,
    TranslateModule,
   
    CardResultComponent,
  ],
})
export class ResultsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store<AppState>);
  private enhancedGapAnalysisService = inject(EnhancedGapAnalysisService);
  private gapAnalysisFormDataService = inject(EnhancedGapAnalysisFormDataService);
  private enhancedGapAnalysisFormService = inject(EnhancedGapAnalysisFormService);
  private translateService = inject(TranslateService);
  private stepCommunicationService = inject(StepCommunicationService);
  public languageService = inject(LanguageService);
  public customOption = inject(CurrencyOptionPipe);
  public datePipe = inject(DatePipe);

  public gapData!: GapAnalysisForm;
  public hasSecondaryApplicant: boolean = false;
  public applicantList!: List[];
  public applicantList$: BehaviorSubject<List[]> = new BehaviorSubject<List[]>([]);
  public collapseCardObj: CollapseCard[] = cardCollapseInitialState();
  public applicantSelected: ApplicantSelected[] = applicantInitialState();
  public incomeCardNegative: boolean = false;
  public isIncomeReduce: boolean = false;
  public incomeForm: FormGroup = this.fb.group({
    incomeReduce: null,
    borrower_1: null,
    borrower_2: null,
    borrower_3: null,
    borrower_4: null,
  });

  public COVERAGE_TYPE = 2;

  ngOnInit() {
    this.fillData();
    this.stepCommunicationService.selectedIndex$.subscribe({
      next: (data: { previouslySelectedIndex: Step; selectedIndex: Step }) => {
        if (data.previouslySelectedIndex === Step.RESULTS) {
          this.applicantSelected = resetApplicationState();
        }
      },
      error: () => {},
      complete: () => {},
    });
  }

  public fillData() {
    this.enhancedGapAnalysisFormService.gapAnalysisForm$.subscribe((data: GapAnalysisForm) => {
      this.gapData = data;
      if (data.meetingDetailForm?.PrimaryName !== undefined) {
        this.applicantList = [
          {
            ...this.applicantList,
            id: PRIMARY,
            description: 'meeting.borrowerOne',
          },
        ];
      }
      if (this.gapData.meetingDetailForm?.IsSecondaryApplicant) {
        this.hasSecondaryApplicant = true;
        this.applicantList.push({
          id: SECONDARY,
          description: 'meeting.borrowerTwo',
        });
        this.fillSelects();
      }

      this.fillIncomeReduce();
      this.applicantList$.next(this.applicantList);
    });
  }

  private fillSelects() {
    this.incomeForm.controls['borrower_1'].setValue(PRIMARY);
    this.incomeForm.controls['borrower_2'].setValue(PRIMARY);
    this.incomeForm.controls['borrower_3'].setValue(PRIMARY);
    this.incomeForm.controls['borrower_4'].setValue(PRIMARY);
  }

  private fillIncomeReduce(coverageType: number = COVERAGE_TYPE.DISABILITY) {
    let value = 0;
    if (this.isPrimarySelected(coverageType)) {
      value =
        this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage !== null &&
        this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage !== undefined
          ? parseFloat(this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage)
          : 0;
    } else {
      value =
        this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage !== null &&
        this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage !== undefined
          ? parseFloat(this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage)
          : 0;
    }

    this.incomeForm.get('incomeReduce')?.setValue(value);
  }

  public getShortageTitle(coveragePercentage: number) {
    const shortage = this.getTotalShortage(coveragePercentage);
    if (shortage === 0) {
      return 'Result';
    }

    if (shortage < 0) {
      return 'Shortage';
    }

    return 'Surplus';
  }

  private getCustomerNameSelected(applicantSelected: string) {
    return applicantSelected === PRIMARY
      ? toTitleCapitalize(this.gapData.meetingDetailForm?.PrimaryName)
      : toTitleCapitalize(this.gapData.meetingDetailForm?.SecondaryName);
  }

  private getPdfVersionName(pdfData: string, pdfFormat: string) {
    switch (this.getPdfName(pdfFormat)) {
      case 'ENGLISH_SINGLE_APPLICANT_DETAILED':
        return [new FormMetadata('CPESINGLEDETAILGAP', 'CPESINGLEDETAILGAP', pdfData)];
      case 'ENGLISH_MULTI_APPLICANT_DETAILED':
        return [new FormMetadata('CPEJOINTDETAILGAP', 'CPEJOINTDETAILGAP', pdfData)];
      case 'FRENCH_SINGLE_APPLICANT_DETAILED':
        return [new FormMetadata('french_detailed_empty_one', 'french_detailed_empty_one.pdf', pdfData)];
      case 'FRENCH_MULTI_APPLICANT_DETAILED':
        return [new FormMetadata('french_detailed_empty_two', 'french_detailed_empty_two.pdf', pdfData)];
      case 'ENGLISH_SINGLE_APPLICANT_SUMMARY':
        return [new FormMetadata('CPESINGLESUMMARYGAP', 'CPESINGLESUMMARYGAP', pdfData)];
      case 'ENGLISH_MULTI_APPLICANT_SUMMARY':
        return [new FormMetadata('CPEJOINTSUMMARYGAP', 'CPEJOINTSUMMARYGAP', pdfData)];
      case 'FRENCH_SINGLE_APPLICANT_SUMMARY':
        return [new FormMetadata('french_summary_empty_one', 'french_summary_empty_one.pdf', pdfData)];
      case 'FRENCH_MULTI_APPLICANT_SUMMARY':
        return [new FormMetadata('french_summary_empty_two', 'french_summary_empty_two.pdf', pdfData)];
      default:
        return [new FormMetadata('CPESINGLEDETAILGAP', 'CPESINGLEDETAILGAP', pdfData)];
    }
  }
  getPdfName(pdfFormat: string): string {
    const applicantType: string = this.gapData.meetingDetailForm?.IsSecondaryApplicant
      ? APPLICATION_TYPE.MULTI
      : APPLICATION_TYPE.SINGLE;
    const pdfLanguage: string =
      this.languageService.languageSelectedStr === 'en-US' ? PDF_LANGUAGE.ENGLISH : PDF_LANGUAGE.FRENCH;
    const pdfType: string = pdfFormat == PDF_TYPE.DETAILED ? PDF_TYPE.DETAILED : PDF_TYPE.SUMMARY;

    return `${pdfLanguage}_${applicantType}_${pdfType}`;
  }

  public onDownloadClicked(pdfFormat: string): void {
    let pdfData: string = '';

    this.gapAnalysisFormDataService.gapAnalysisData = {
      ...this.gapAnalysisFormDataService.gapAnalysisDataObj,

      // OPTIONAL LIFE COVERAGE
      B1_OL_000_ExistingLifeCoverage: `${
        this.customOption
          .transform(
            parseInt(this.gapData.existingCoveragesForm?.B1_ExistingLifeInsurance || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OL_050_ExistingLifeCoverage: `${
        this.customOption
          .transform(
            parseInt(this.gapData.existingCoveragesForm?.B1_ExistingLifeInsurance || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OL_100_ExistingLifeCoverage: `${
        this.customOption
          .transform(
            parseInt(this.gapData.existingCoveragesForm?.B1_ExistingLifeInsurance || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_000_ExistingLifeCoverage: `${
        this.customOption
          .transform(
            parseInt(this.gapData.existingCoveragesForm?.B2_ExistingLifeInsurance || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_050_ExistingLifeCoverage: `${
        this.customOption
          .transform(
            parseInt(this.gapData.existingCoveragesForm?.B2_ExistingLifeInsurance || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_100_ExistingLifeCoverage: `${
        this.customOption
          .transform(
            parseInt(this.gapData.existingCoveragesForm?.B2_ExistingLifeInsurance || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OL_000_CombinedTotalDebtsLiabilities: `${
        this.customOption
          .transform(
            parseInt(this.getTotalOutstandingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OL_050_CombinedTotalDebtsLiabilities: `${
        this.customOption
          .transform(
            parseInt(this.getTotalOutstandingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OL_100_CombinedTotalDebtsLiabilities: `${
        this.customOption
          .transform(
            parseInt(this.getTotalOutstandingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_000_CombinedTotalDebtsLiabilities: `${
        this.customOption
          .transform(
            parseInt(this.getTotalOutstandingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_050_CombinedTotalDebtsLiabilities: `${
        this.customOption
          .transform(
            parseInt(this.getTotalOutstandingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_100_CombinedTotalDebtsLiabilities: `${
        this.customOption
          .transform(
            parseInt(this.getTotalOutstandingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OL_000_NewMortgageLoanBalance: `${
        this.customOption
          .transform(
            parseInt(this.getNewMortgageLoanBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OL_050_NewMortgageLoanBalance: `${
        this.customOption
          .transform(
            parseInt(this.getNewMortgageLoanBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OL_100_NewMortgageLoanBalance: `${
        this.customOption
          .transform(
            parseInt(this.getNewMortgageLoanBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_000_NewMortgageLoanBalance: `${
        this.customOption
          .transform(
            parseInt(this.getNewMortgageLoanBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_050_NewMortgageLoanBalance: `${
        this.customOption
          .transform(
            parseInt(this.getNewMortgageLoanBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_100_NewMortgageLoanBalance: `${
        this.customOption
          .transform(
            parseInt(this.getNewMortgageLoanBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OL_000_ExistingLiabilitiesDebtBalance: `${
        this.customOption
          .transform(
            parseInt(this.getExistingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OL_050_ExistingLiabilitiesDebtBalance: `${
        this.customOption
          .transform(
            parseInt(this.getExistingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OL_100_ExistingLiabilitiesDebtBalance: `${
        this.customOption
          .transform(
            parseInt(this.getExistingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_000_ExistingLiabilitiesDebtBalance: `${
        this.customOption
          .transform(
            parseInt(this.getExistingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_050_ExistingLiabilitiesDebtBalance: `${
        this.customOption
          .transform(
            parseInt(this.getExistingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_100_ExistingLiabilitiesDebtBalance: `${
        this.customOption
          .transform(
            parseInt(this.getExistingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OL_000_Result: `${
        this.customOption
          .transform(
            parseInt(this.getTotalCoverage(COVERAGE_PERCENTAGE.ZERO, COVERAGE_TYPE.LIFE, PRIMARY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OL_050_Result: `${
        this.customOption
          .transform(
            parseInt(this.getTotalCoverage(COVERAGE_PERCENTAGE.FIFTY, COVERAGE_TYPE.LIFE, PRIMARY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OL_100_Result: `${
        this.customOption
          .transform(
            parseInt(this.getTotalCoverage(COVERAGE_PERCENTAGE.HUNDRED, COVERAGE_TYPE.LIFE, PRIMARY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_000_Result: `${
        this.customOption
          .transform(
            parseInt(this.getTotalCoverage(COVERAGE_PERCENTAGE.ZERO, COVERAGE_TYPE.LIFE, SECONDARY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_050_Result: `${
        this.customOption
          .transform(
            parseInt(this.getTotalCoverage(COVERAGE_PERCENTAGE.FIFTY, COVERAGE_TYPE.LIFE, SECONDARY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_100_Result: `${
        this.customOption
          .transform(
            parseInt(this.getTotalCoverage(COVERAGE_PERCENTAGE.HUNDRED, COVERAGE_TYPE.LIFE, SECONDARY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OL_000_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.LIFE, COVERAGE_PERCENTAGE.ZERO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OL_050_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.LIFE, COVERAGE_PERCENTAGE.FIFTY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OL_100_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.LIFE, COVERAGE_PERCENTAGE.HUNDRED).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_000_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.LIFE, COVERAGE_PERCENTAGE.ZERO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_050_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.LIFE, COVERAGE_PERCENTAGE.FIFTY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OL_100_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.LIFE, COVERAGE_PERCENTAGE.HUNDRED).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      // DISABILITY COVERAGE
      B1_OD_000_CombinedMonthlyIncome: `${
        this.customOption
          .transform(
            this.getInsuranceValueMonthly(COVERAGE_TYPE.DISABILITY, COVERAGE_PERCENTAGE.ZERO, PRIMARY, true),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_CombinedMonthlyIncome: `${
        this.customOption
          .transform(
            this.getInsuranceValueMonthly(COVERAGE_TYPE.DISABILITY, COVERAGE_PERCENTAGE.FIFTY, PRIMARY, true),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_CombinedMonthlyIncome: `${
        this.customOption
          .transform(
            this.getInsuranceValueMonthly(COVERAGE_TYPE.DISABILITY, COVERAGE_PERCENTAGE.HUNDRED, PRIMARY, true),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_CombinedMonthlyIncome: `${
        this.customOption
          .transform(
            this.getInsuranceValueMonthly(COVERAGE_TYPE.DISABILITY, COVERAGE_PERCENTAGE.ZERO, SECONDARY, true),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_CombinedMonthlyIncome: `${
        this.customOption
          .transform(
            this.getInsuranceValueMonthly(COVERAGE_TYPE.DISABILITY, COVERAGE_PERCENTAGE.FIFTY, SECONDARY, true),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_CombinedMonthlyIncome: `${
        this.customOption
          .transform(
            this.getInsuranceValueMonthly(COVERAGE_TYPE.DISABILITY, COVERAGE_PERCENTAGE.HUNDRED, SECONDARY, true),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      //BORROWER ONE BASE
      B1_OD_000_BorrowerOneBase: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_BorrowerOneBase: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_BorrowerOneBase: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_BorrowerOneBase: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBase(PRIMARY, true, COVERAGE_TYPE.DISABILITY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_BorrowerOneBase: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBase(PRIMARY, true, COVERAGE_TYPE.DISABILITY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_BorrowerOneBase: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBase(PRIMARY, true, COVERAGE_TYPE.DISABILITY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      // BORROWER TWO BONUSES
      B1_OD_000_BorrowerOneBonuses: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_BorrowerOneBonuses: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_BorrowerOneBonuses: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_BorrowerOneBonuses: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBonuses(PRIMARY, COVERAGE_TYPE.DISABILITY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_BorrowerOneBonuses: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBonuses(PRIMARY, COVERAGE_TYPE.DISABILITY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_BorrowerOneBonuses: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBonuses(PRIMARY, COVERAGE_TYPE.DISABILITY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_000_BorrowerOneRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_BorrowerOneRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_BorrowerOneRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_BorrowerOneRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_BorrowerOneRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_BorrowerOneRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_050_BorrowerOneTax: `- ${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_000_BorrowerOneTax: `- ${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_BorrowerOneTax: `- ${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_BorrowerOneTax: `- ${
        this.customOption
          .transform(
            parseInt(this.getTax(BORROWER_TYPE.ONE).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_BorrowerOneTax: `- ${
        this.customOption
          .transform(
            parseInt(this.getTax(BORROWER_TYPE.ONE).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_BorrowerOneTax: `- ${
        this.customOption
          .transform(
            parseInt(this.getTax(BORROWER_TYPE.ONE).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_000_BorrowerOneDisabilityBenefit: `${
        this.customOption
          .transform(
            parseInt(this.getInsuranceBenefit(PRIMARY, COVERAGE_TYPE.DISABILITY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_BorrowerOneDisabilityBenefit: `${
        this.customOption
          .transform(
            parseInt(this.getInsuranceBenefit(PRIMARY, COVERAGE_TYPE.DISABILITY).toFixed(0).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_BorrowerOneDisabilityBenefit: `${
        this.customOption
          .transform(
            parseInt(this.getInsuranceBenefit(PRIMARY, COVERAGE_TYPE.DISABILITY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_BorrowerOneDisabilityBenefit: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_BorrowerOneDisabilityBenefit: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_BorrowerOneDisabilityBenefit: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_000_BorrowerTwoBase: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBase(SECONDARY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_BorrowerTwoBase: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBase(SECONDARY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_BorrowerTwoBase: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBase(SECONDARY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_BorrowerTwoBase: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_BorrowerTwoBase: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_BorrowerTwoBase: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_000_BorrowerTwoBonuses: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBonuses(SECONDARY, COVERAGE_TYPE.DISABILITY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_BorrowerTwoBonuses: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBonuses(SECONDARY, COVERAGE_TYPE.DISABILITY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_BorrowerTwoBonuses: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBonuses(SECONDARY, COVERAGE_TYPE.DISABILITY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_BorrowerTwoBonuses: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_BorrowerTwoBonuses: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_BorrowerTwoBonuses: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_000_BorrowerTwoRentals: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeInvestment(SECONDARY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_BorrowerTwoRentals: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeInvestment(SECONDARY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_BorrowerTwoRentals: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeInvestment(SECONDARY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_BorrowerTwoRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B2_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_BorrowerTwoRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B2_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_BorrowerTwoRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B2_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_000_BorrowerTwoTax: `- ${
        this.customOption
          .transform(
            parseInt(this.getTax(BORROWER_TYPE.TWO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_BorrowerTwoTax: `- ${
        this.customOption
          .transform(
            parseInt(this.getTax(BORROWER_TYPE.TWO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_BorrowerTwoTax: `- ${
        this.customOption
          .transform(
            parseInt(this.getTax(BORROWER_TYPE.TWO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_BorrowerTwoTax: `- ${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_BorrowerTwoTax: `- ${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_BorrowerTwoTax: `- ${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_000_BorrowerTwoDisabilityBenefit: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_BorrowerTwoDisabilityBenefit: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_BorrowerTwoDisabilityBenefit: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_BorrowerTwoDisabilityBenefit: `${
        this.customOption
          .transform(
            parseInt(this.calculatestepSixAltInsuranceDisaValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_BorrowerTwoDisabilityBenefit: `${
        this.customOption
          .transform(
            parseInt(this.calculatestepSixAltInsuranceDisaValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_BorrowerTwoDisabilityBenefit: `${
        this.customOption
          .transform(
            parseInt(this.calculatestepSixAltInsuranceDisaValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_000_CombinedMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.getMonthlyExpensesTotal().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_CombinedMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.getMonthlyExpensesTotal().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_CombinedMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.getMonthlyExpensesTotal().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_CombinedMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.getMonthlyExpensesTotal().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_CombinedMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.getMonthlyExpensesTotal().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_CombinedMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.getMonthlyExpensesTotal().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_000_NewMortgageLoan: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_NewMortgageLoan: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_NewMortgageLoan: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_NewMortgageLoan: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_NewMortgageLoan: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_NewMortgageLoan: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_000_ExistingLoansPayment: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_ExistingLoansPayment: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_ExistingLoansPayment: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_ExistingLoansPayment: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_ExistingLoansPayment: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_ExistingLoansPayment: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_000_OtherMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_OtherMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_OtherMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_OtherMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_OtherMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_OtherMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_000_Result: `${
        this.customOption
          .transform(
            parseInt(this.getTotalShortage(COVERAGE_PERCENTAGE.ZERO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_Result: `${
        this.customOption
          .transform(
            parseInt(this.getTotalShortage(COVERAGE_PERCENTAGE.FIFTY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_Result: `${
        this.customOption
          .transform(
            parseInt(this.getTotalShortage(COVERAGE_PERCENTAGE.HUNDRED).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_Result: `${
        this.customOption
          .transform(
            parseInt(
              this.getTotalShortage(COVERAGE_PERCENTAGE.ZERO, COVERAGE_TYPE.DISABILITY, SECONDARY, true).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_Result: `${
        this.customOption
          .transform(
            parseInt(
              this.getTotalShortage(COVERAGE_PERCENTAGE.FIFTY, COVERAGE_TYPE.DISABILITY, SECONDARY, true).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_Result: `${
        this.customOption
          .transform(
            parseInt(
              this.getTotalShortage(COVERAGE_PERCENTAGE.HUNDRED, COVERAGE_TYPE.DISABILITY, SECONDARY, true).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OD_000_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.DISABILITY, COVERAGE_PERCENTAGE.ZERO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_050_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.DISABILITY, COVERAGE_PERCENTAGE.FIFTY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OD_100_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.DISABILITY, COVERAGE_PERCENTAGE.HUNDRED).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_000_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.DISABILITY, COVERAGE_PERCENTAGE.ZERO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_050_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.DISABILITY, COVERAGE_PERCENTAGE.FIFTY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OD_100_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.DISABILITY, COVERAGE_PERCENTAGE.HUNDRED).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_BorrowerTwoBase: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBase(SECONDARY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_BorrowerTwoBase: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBase(SECONDARY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_BorrowerTwoBase: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBase(SECONDARY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_BorrowerTwoBase: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_BorrowerTwoBase: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_BorrowerTwoBase: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_BorrowerTwoBonuses: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBonuses(SECONDARY, COVERAGE_TYPE.DISABILITY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_BorrowerTwoBonuses: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBonuses(SECONDARY, COVERAGE_TYPE.DISABILITY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_BorrowerTwoBonuses: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBonuses(SECONDARY, COVERAGE_TYPE.DISABILITY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_BorrowerTwoBonuses: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_BorrowerTwoBonuses: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_BorrowerTwoBonuses: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_BorrowerTwoRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B2_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_BorrowerTwoRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B2_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_BorrowerTwoRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B2_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_BorrowerTwoRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B2_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_BorrowerTwoRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B2_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_BorrowerTwoRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B2_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_BorrowerTwoTax: `- ${
        this.customOption
          .transform(
            parseInt(this.getTax(BORROWER_TYPE.TWO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_BorrowerTwoTax: `- ${
        this.customOption
          .transform(
            parseInt(this.getTax(BORROWER_TYPE.TWO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_BorrowerTwoTax: `- ${
        this.customOption
          .transform(
            parseInt(this.getTax(BORROWER_TYPE.TWO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_BorrowerTwoTax: `- ${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_BorrowerTwoTax: `- ${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_BorrowerTwoTax: `- ${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_CombinedMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.getMonthlyExpensesTotal().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_CombinedMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.getMonthlyExpensesTotal().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_CombinedMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.getMonthlyExpensesTotal().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_CombinedMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.getMonthlyExpensesTotal().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_CombinedMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.getMonthlyExpensesTotal().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_CombinedMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.getMonthlyExpensesTotal().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_NewMortgageLoan: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_NewMortgageLoan: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_NewMortgageLoan: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_NewMortgageLoan: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_NewMortgageLoan: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_NewMortgageLoan: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_ExistingLoansPayment: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_ExistingLoansPayment: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_ExistingLoansPayment: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_ExistingLoansPayment: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_ExistingLoansPayment: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_ExistingLoansPayment: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_OtherMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_OtherMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_OtherMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_OtherMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_OtherMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_OtherMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_Result: `${
        this.customOption
          .transform(
            parseInt(this.getTotalShortage(COVERAGE_PERCENTAGE.ZERO, COVERAGE_TYPE.JOB_LOSS).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_Result: `${
        this.customOption
          .transform(
            parseInt(this.getTotalShortage(COVERAGE_PERCENTAGE.FIFTY, COVERAGE_TYPE.JOB_LOSS).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_Result: `${
        this.customOption
          .transform(
            parseInt(this.getTotalShortage(COVERAGE_PERCENTAGE.HUNDRED, COVERAGE_TYPE.JOB_LOSS).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_Result: `${
        this.customOption
          .transform(
            parseInt(
              this.getTotalShortage(COVERAGE_PERCENTAGE.ZERO, COVERAGE_TYPE.JOB_LOSS, SECONDARY, true).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_Result: `${
        this.customOption
          .transform(
            parseInt(
              this.getTotalShortage(COVERAGE_PERCENTAGE.FIFTY, COVERAGE_TYPE.JOB_LOSS, SECONDARY, true).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_Result: `${
        this.customOption
          .transform(
            parseInt(
              this.getTotalShortage(COVERAGE_PERCENTAGE.HUNDRED, COVERAGE_TYPE.JOB_LOSS, SECONDARY, true).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.JOB_LOSS, COVERAGE_PERCENTAGE.ZERO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.JOB_LOSS, COVERAGE_PERCENTAGE.FIFTY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.JOB_LOSS, COVERAGE_PERCENTAGE.HUNDRED).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.JOB_LOSS, COVERAGE_PERCENTAGE.ZERO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.JOB_LOSS, COVERAGE_PERCENTAGE.FIFTY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.JOB_LOSS, COVERAGE_PERCENTAGE.HUNDRED).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_CombinedMonthlyIncome: `${
        this.customOption
          .transform(
            parseInt(
              this.getInsuranceValueMonthly(COVERAGE_TYPE.JOB_LOSS, COVERAGE_PERCENTAGE.ZERO, PRIMARY, true).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_CombinedMonthlyIncome: `${
        this.customOption
          .transform(
            parseInt(
              this.getInsuranceValueMonthly(COVERAGE_TYPE.JOB_LOSS, COVERAGE_PERCENTAGE.FIFTY, PRIMARY, true).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_CombinedMonthlyIncome: `${
        this.customOption
          .transform(
            parseInt(
              this.getInsuranceValueMonthly(
                COVERAGE_TYPE.JOB_LOSS,
                COVERAGE_PERCENTAGE.HUNDRED,
                PRIMARY,
                true
              ).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_CombinedMonthlyIncome: `${
        this.customOption
          .transform(
            parseInt(
              this.getInsuranceValueMonthly(
                COVERAGE_TYPE.JOB_LOSS,
                COVERAGE_PERCENTAGE.ZERO,
                SECONDARY,
                true
              ).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_CombinedMonthlyIncome: `${
        this.customOption
          .transform(
            parseInt(
              this.getInsuranceValueMonthly(
                COVERAGE_TYPE.JOB_LOSS,
                COVERAGE_PERCENTAGE.FIFTY,
                SECONDARY,
                true
              ).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_CombinedMonthlyIncome: `${
        this.customOption
          .transform(
            parseInt(
              this.getInsuranceValueMonthly(
                COVERAGE_TYPE.JOB_LOSS,
                COVERAGE_PERCENTAGE.HUNDRED,
                SECONDARY,
                true
              ).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_BorrowerOneBase: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_BorrowerOneBase: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_BorrowerOneBase: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_BorrowerOneBase: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBase(PRIMARY, true, COVERAGE_TYPE.DISABILITY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_BorrowerOneBase: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBase(PRIMARY, true, COVERAGE_TYPE.DISABILITY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_BorrowerOneBase: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBase(PRIMARY, true, COVERAGE_TYPE.DISABILITY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_BorrowerOneBonuses: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_BorrowerOneBonuses: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_BorrowerOneBonuses: `${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_BorrowerOneBonuses: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBonuses(PRIMARY, COVERAGE_TYPE.DISABILITY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_BorrowerOneBonuses: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBonuses(PRIMARY, COVERAGE_TYPE.DISABILITY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_BorrowerOneBonuses: `${
        this.customOption
          .transform(
            parseInt(this.getIncomeBonuses(PRIMARY, COVERAGE_TYPE.DISABILITY, true).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_BorrowerOneRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_BorrowerOneRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_BorrowerOneRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_BorrowerOneRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_BorrowerOneRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_BorrowerOneRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_OJL_000_BorrowerOneTax: `- ${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_050_BorrowerOneTax: `- ${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_OJL_100_BorrowerOneTax: `- ${
        this.customOption
          .transform(0, 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_000_BorrowerOneTax: `${
        this.customOption
          .transform(
            parseInt(this.getTax(BORROWER_TYPE.ONE).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_050_BorrowerOneTax: `${
        this.customOption
          .transform(
            parseInt(this.getTax(BORROWER_TYPE.ONE).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_OJL_100_BorrowerOneTax: `${
        this.customOption
          .transform(
            parseInt(this.getTax(BORROWER_TYPE.ONE).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_CI_000_ExistingCriticalIllnessInsurance: `${
        this.customOption
          .transform(
            parseInt(this.getInsuranceValue(COVERAGE_TYPE.CRITICAL_ILLNESS).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_CI_050_ExistingCriticalIllnessInsurance: `${
        this.customOption
          .transform(
            parseInt(this.getInsuranceValue(COVERAGE_TYPE.CRITICAL_ILLNESS).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_CI_100_ExistingCriticalIllnessInsurance: `${
        this.customOption
          .transform(
            parseInt(this.getInsuranceValue(COVERAGE_TYPE.CRITICAL_ILLNESS).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_000_ExistingCriticalIllnessInsurance: `${
        this.customOption
          .transform(
            parseInt(this.getInsuranceValue(COVERAGE_TYPE.CRITICAL_ILLNESS, SECONDARY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_050_ExistingCriticalIllnessInsurance: `${
        this.customOption
          .transform(
            parseInt(this.getInsuranceValue(COVERAGE_TYPE.CRITICAL_ILLNESS, SECONDARY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_100_ExistingCriticalIllnessInsurance: `${
        this.customOption
          .transform(
            parseInt(this.getInsuranceValue(COVERAGE_TYPE.CRITICAL_ILLNESS, SECONDARY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_CI_000_CombinedTotalDebtsLiabilities: `${
        this.customOption
          .transform(
            parseInt(this.getTotalOutstandingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_CI_050_CombinedTotalDebtsLiabilities: `${
        this.customOption
          .transform(
            parseInt(this.getTotalOutstandingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_CI_100_CombinedTotalDebtsLiabilities: `${
        this.customOption
          .transform(
            parseInt(this.getTotalOutstandingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_000_CombinedTotalDebtsLiabilities: `${
        this.customOption
          .transform(
            parseInt(this.getTotalOutstandingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_050_CombinedTotalDebtsLiabilities: `${
        this.customOption
          .transform(
            parseInt(this.getTotalOutstandingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_100_CombinedTotalDebtsLiabilities: `${
        this.customOption
          .transform(
            parseInt(this.getTotalOutstandingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_CI_000_NewMortgageLoanBalance: `${
        this.customOption
          .transform(
            parseInt(this.getNewMortgageLoanBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_CI_050_NewMortgageLoanBalance: `${
        this.customOption
          .transform(
            parseInt(this.getNewMortgageLoanBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_CI_100_NewMortgageLoanBalance: `${
        this.customOption
          .transform(
            parseInt(this.getNewMortgageLoanBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_000_NewMortgageLoanBalance: `${
        this.customOption
          .transform(
            parseInt(this.getNewMortgageLoanBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_050_NewMortgageLoanBalance: `${
        this.customOption
          .transform(
            parseInt(this.getNewMortgageLoanBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_100_NewMortgageLoanBalance: `${
        this.customOption
          .transform(
            parseInt(this.getNewMortgageLoanBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_CI_000_ExistingLiabilitiesDebtBalance: `${
        this.customOption
          .transform(
            parseInt(this.getExistingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_CI_050_ExistingLiabilitiesDebtBalance: `${
        this.customOption
          .transform(
            parseInt(this.getExistingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_CI_100_ExistingLiabilitiesDebtBalance: `${
        this.customOption
          .transform(
            parseInt(this.getExistingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_000_ExistingLiabilitiesDebtBalance: `${
        this.customOption
          .transform(
            parseInt(this.getExistingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_050_ExistingLiabilitiesDebtBalance: `${
        this.customOption
          .transform(
            parseInt(this.getExistingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_100_ExistingLiabilitiesDebtBalance: `${
        this.customOption
          .transform(
            parseInt(this.getExistingLiabilitiesDebtBalanceValue().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_CI_000_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.CRITICAL_ILLNESS, COVERAGE_PERCENTAGE.ZERO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_CI_050_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.CRITICAL_ILLNESS, COVERAGE_PERCENTAGE.FIFTY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_CI_100_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.CRITICAL_ILLNESS, COVERAGE_PERCENTAGE.HUNDRED).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_000_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.CRITICAL_ILLNESS, COVERAGE_PERCENTAGE.ZERO).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_050_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.CRITICAL_ILLNESS, COVERAGE_PERCENTAGE.FIFTY).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_100_CreditorInsuredAmount: `${
        this.customOption
          .transform(
            parseInt(this.getInsuredAmount(COVERAGE_TYPE.CRITICAL_ILLNESS, COVERAGE_PERCENTAGE.HUNDRED).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      B1_CI_000_Result: `${
        this.customOption
          .transform(
            parseInt(this.getTotalCriticalIllness(COVERAGE_PERCENTAGE.ZERO, COVERAGE_TYPE.CRITICAL_ILLNESS).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_CI_050_Result: `${
        this.customOption
          .transform(
            parseInt(
              this.getTotalCriticalIllness(COVERAGE_PERCENTAGE.FIFTY, COVERAGE_TYPE.CRITICAL_ILLNESS).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B1_CI_100_Result: `${
        this.customOption
          .transform(
            parseInt(
              this.getTotalCriticalIllness(COVERAGE_PERCENTAGE.HUNDRED, COVERAGE_TYPE.CRITICAL_ILLNESS).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_000_Result: `${
        this.customOption
          .transform(
            parseInt(
              this.getTotalCriticalIllness(
                COVERAGE_PERCENTAGE.ZERO,
                COVERAGE_TYPE.CRITICAL_ILLNESS,
                SECONDARY
              ).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_050_Result: `${
        this.customOption
          .transform(
            parseInt(
              this.getTotalCriticalIllness(
                COVERAGE_PERCENTAGE.FIFTY,
                COVERAGE_TYPE.CRITICAL_ILLNESS,
                SECONDARY
              ).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      B2_CI_100_Result: `${
        this.customOption
          .transform(
            parseInt(
              this.getTotalCriticalIllness(
                COVERAGE_PERCENTAGE.HUNDRED,
                COVERAGE_TYPE.CRITICAL_ILLNESS,
                SECONDARY
              ).toString()
            ),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      TotalMonthlyIncome: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.TotalMonthlyIncome || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      BorrowerOneMonthlyBaseSalary: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyBaseSalary || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      BorrowerOneMonthlyBonuses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyBonuses || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      BorrowerOneMonthlyRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      BorrowerOneEstimatedMonthlyIncomeAfterTax: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B1_EstimatedMonthlyIncomeAfterTax || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      BorrowerTwoMonthlyBaseSalary: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B2_GrossMonthlyBaseSalary || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      BorrowerTwoMonthlyBonuses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B2_GrossMonthlyBonuses || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      } `,
      BorrowerTwoMonthlyRentals: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B2_GrossMonthlyRentals || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      } `,
      BorrowerTwoEstimatedMonthlyIncomeAfterTax: `${
        this.customOption
          .transform(
            parseInt(this.gapData.incomeForm?.B2_EstimatedMonthlyIncomeAfterTax || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      } `,

      TotalMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.TotalMonthlyExpenses || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      NewMonthlyMortgageLoanPayments: `${
        this.customOption
          .transform(
            parseInt(this.getNewDebt().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      ExistingMonthlyDebtLiabilityPayments: `${
        this.customOption
          .transform(
            parseInt(this.getMonthlyDebtRepayments().toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      OtherMonthlyExpenses: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      NetMonthlyIncome: `${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NetMonthlyIncome || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      TotalCombinedLiabilities: `${
        this.customOption
          .transform(
            parseInt(this.gapData.liabilitiesForm?.TotalOutstandingLiabilitiesDebtBalance || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      NewMortgageLoanBalance: `${
        this.customOption
          .transform(
            parseInt(this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      } `,
      ExistingLiabilitiesDebtsBalance: `${
        this.customOption
          .transform(
            parseInt(this.gapData.liabilitiesForm?.ExistingLiabilitiesDebtBalance || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,

      BorrowerOneExistingLifeInsurance: `${
        this.customOption
          .transform(
            parseInt(this.gapData.existingCoveragesForm?.B1_ExistingLifeInsurance || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      BorrowerOneCriticalIllnessInsurance: `${
        this.customOption
          .transform(
            parseInt(getValueOf(this.gapData.existingCoveragesForm?.B1_ExistingCriticalIllnessInsurance).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      BorrowerOneDisabilityInsurance: `${getValueOf(
        this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage
      )}% `,
      BorrowerTwoExistingLifeInsurance: `${
        this.customOption
          .transform(
            parseInt(this.gapData.existingCoveragesForm?.B2_ExistingLifeInsurance || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      BorrowerTwoCriticalIllnessInsurance: `${
        this.customOption
          .transform(
            parseInt(getValueOf(this.gapData.existingCoveragesForm?.B2_ExistingCriticalIllnessInsurance).toString()),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }`,
      BorrowerTwoDisabilityInsurance: `${getValueOf(
        this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage
      )}% `,

      PrimaryName: toTitleCapitalize(this.translateService.instant('meeting.borrowerOne')),
      SecondaryName: toTitleCapitalize(
        this.gapData.meetingDetailForm?.IsSecondaryApplicant ? this.translateService.instant('meeting.borrowerTwo') : ''
      ),
      Name: toTitleCapitalize(this.gapData.meetingDetailForm?.Name),
      MeetingDate: this.datePipe.transform(this.gapData.meetingDetailForm?.MeetingDate, 'MM/dd/YYYY')?.toString(),
      Email: `${this.gapData.meetingDetailForm?.Email ? this.gapData.meetingDetailForm?.Email : ''}`,
      Phone: `${this.gapData.meetingDetailForm?.Phone ? this.gapData.meetingDetailForm?.Phone : ''}`,
      IsSecondaryApplicant: this.gapData.meetingDetailForm?.IsSecondaryApplicant,

      B1_ProvinceOrTerritory: `${this.gapData.incomeForm?.B1_ProvinceOrTerritory}`,
      B1_GrossMonthlyBaseSalary: `${
        this.gapData.incomeForm?.B1_GrossMonthlyBaseSalary ? this.gapData.incomeForm?.B1_GrossMonthlyBaseSalary : '0'
      }`,
      B1_GrossMonthlyBonuses: `${
        this.gapData.incomeForm?.B1_GrossMonthlyBonuses ? this.gapData.incomeForm?.B1_GrossMonthlyBonuses : '0'
      }`,
      B1_GrossMonthlyRentals: `${
        this.gapData.incomeForm?.B1_GrossMonthlyRentals ? this.gapData.incomeForm?.B1_GrossMonthlyRentals : '0'
      }`,
      B1_EstimatedAnnualIncomeAfterTax: `${
        this.gapData.incomeForm?.B1_EstimatedAnnualIncomeAfterTax
          ? this.gapData.incomeForm?.B1_EstimatedAnnualIncomeAfterTax
          : '0'
      }`,
      B1_EstimatedMonthlyIncomeAfterTax: `${
        this.gapData.incomeForm?.B1_EstimatedMonthlyIncomeAfterTax
          ? this.gapData.incomeForm?.B1_EstimatedMonthlyIncomeAfterTax
          : '0'
      }`,
      B1_IncomeType: `${this.gapData.incomeForm?.B1_IncomeType ? this.gapData.incomeForm?.B1_IncomeType : '0'}`,
      B2_ProvinceOrTerritory: `${this.gapData.incomeForm?.B2_ProvinceOrTerritory}`,
      B2_GrossMonthlyBaseSalary: `${
        this.gapData.incomeForm?.B2_GrossMonthlyBaseSalary ? this.gapData.incomeForm?.B2_GrossMonthlyBaseSalary : '0'
      }`,
      B2_GrossMonthlyBonuses: `${
        this.gapData.incomeForm?.B2_GrossMonthlyBonuses ? this.gapData.incomeForm?.B2_GrossMonthlyBonuses : '0'
      }`,
      B2_GrossMonthlyRentals: `${
        this.gapData.incomeForm?.B2_GrossMonthlyRentals ? this.gapData.incomeForm?.B2_GrossMonthlyRentals : '0'
      }`,
      B2_EstimatedAnnualIncomeAfterTax: `${
        this.gapData.incomeForm?.B2_EstimatedAnnualIncomeAfterTax
          ? this.gapData.incomeForm?.B2_EstimatedAnnualIncomeAfterTax
          : '0'
      }`,
      B2_EstimatedMonthlyIncomeAfterTax: `${
        this.gapData.incomeForm?.B2_EstimatedMonthlyIncomeAfterTax
          ? this.gapData.incomeForm?.B2_EstimatedMonthlyIncomeAfterTax
          : '0'
      }`,
      CombinedEstimatedAnnualIncomeAfterTax: `${
        this.gapData.incomeForm?.CombinedEstimatedAnnualIncomeAfterTax
          ? this.gapData.incomeForm?.CombinedEstimatedAnnualIncomeAfterTax
          : '0'
      }`,
      CombinedEstimatedMonthlyIncomeAfterTax: `${
        this.gapData.incomeForm?.CombinedEstimatedMonthlyIncomeAfterTax
          ? this.gapData.incomeForm?.CombinedEstimatedMonthlyIncomeAfterTax
          : '0'
      }`,

      B2_IncomeType: `${this.gapData.incomeForm?.B2_IncomeType ? this.gapData.incomeForm?.B2_IncomeType : '0'}`,
      NewMortgageLoanBalanceValue: `${
        this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue
          ? this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue
          : '0'
      }`,
      TotalOutstandingLiabilitiesDebtBalance: `${
        this.gapData.liabilitiesForm?.TotalOutstandingLiabilitiesDebtBalance
          ? this.gapData.liabilitiesForm?.TotalOutstandingLiabilitiesDebtBalance
          : '0'
      } `,
      ExistingLiabilitiesDebtBalance: `${
        this.gapData.liabilitiesForm?.ExistingLiabilitiesDebtBalance
          ? this.gapData.liabilitiesForm?.ExistingLiabilitiesDebtBalance
          : '0'
      }`,
      ExistingMonthlyLiabilityDebtPayments: `${
        this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments
          ? this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments
          : '0'
      } `,
      OtherMonthlyExpensesInNumber: `${
        this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber
          ? this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber
          : '0'
      }`,
      OtherMonthlyExpensesInPercentage: `${
        this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInPercentage
          ? this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInPercentage
          : '0'
      }`,
      NewMonthlyMortgageLoanPayment: `${
        this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment
          ? this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment
          : '0'
      }`,
      B1_ExistingLifeInsurance: `${
        this.gapData.existingCoveragesForm?.B1_ExistingLifeInsurance
          ? this.gapData.existingCoveragesForm?.B1_ExistingLifeInsurance
          : '0'
      }`,
      B1_DisabilityInsuranceInPercentage: `${
        this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage
          ? this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage
          : '0'
      }`,
      B1_ExistingCriticalIllnessInsurance: `${
        this.gapData.existingCoveragesForm?.B1_ExistingCriticalIllnessInsurance
          ? this.gapData.existingCoveragesForm?.B1_ExistingCriticalIllnessInsurance
          : '0'
      }`,
      B2_ExistingLifeInsurance: `${
        this.gapData.existingCoveragesForm?.B2_ExistingLifeInsurance
          ? this.gapData.existingCoveragesForm?.B2_ExistingLifeInsurance
          : '0'
      }`,
      B2_DisabilityInsuranceInPercentage: `${
        this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage
          ? this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage
          : '0'
      }`,
      B2_ExistingCriticalIllnessInsurance: `${
        this.gapData.existingCoveragesForm?.B2_ExistingCriticalIllnessInsurance
          ? this.gapData.existingCoveragesForm?.B2_ExistingCriticalIllnessInsurance
          : '0'
      }`,

      B1_OL_DetailedDescription: `${this.getDetailedCoverageDescription(COVERAGE_TYPE.LIFE, BORROWER_TYPE.ONE)}`,
      B1_OD_Detailed_Description: `${this.getDetailedCoverageDescription(COVERAGE_TYPE.DISABILITY, BORROWER_TYPE.ONE)}`,
      B1_OJL_Detailed_Description: `${this.getDetailedCoverageDescription(COVERAGE_TYPE.JOB_LOSS, BORROWER_TYPE.ONE)}`,
      B1_CI_Detailed_Description: `${this.getDetailedCoverageDescription(
        COVERAGE_TYPE.CRITICAL_ILLNESS,
        BORROWER_TYPE.ONE
      )}`,

      B2_OL_Detailed_Description: `${this.getDetailedCoverageDescription(COVERAGE_TYPE.LIFE, BORROWER_TYPE.TWO)}`,
      B2_OD_Detailed_Description: `${this.getDetailedCoverageDescription(COVERAGE_TYPE.DISABILITY, BORROWER_TYPE.TWO)}`,
      B2_OJL_Detailed_Description: `${this.getDetailedCoverageDescription(COVERAGE_TYPE.JOB_LOSS, BORROWER_TYPE.TWO)}`,
      B2_CI_Detailed_Description: `${this.getDetailedCoverageDescription(
        COVERAGE_TYPE.CRITICAL_ILLNESS,
        BORROWER_TYPE.TWO
      )}`,

      B1_Summary_Header: `${this.getSummaryCoverageDescription(BORROWER_TYPE.ONE, SUMMARY_DESCRIPTION.B1_HEADER)}`,
      B1_Summary_B: `${this.getSummaryCoverageDescription(BORROWER_TYPE.ONE, SUMMARY_DESCRIPTION.B1_POINT_B)}`,
      B2_Summary_Header: `${this.getSummaryCoverageDescription(BORROWER_TYPE.TWO, SUMMARY_DESCRIPTION.B2_HEADER)}`,
      B2_Summary_B: `${this.getSummaryCoverageDescription(BORROWER_TYPE.TWO, SUMMARY_DESCRIPTION.B2_POINT_B)}`,
    };

    this.gapAnalysisFormDataService.gapAnalysisData$.subscribe((data: FormToken) => {
      pdfData = JSON.stringify(data);
    });

    this.gapAnalysisFormDataService.gapAnalysisData = {
      ...this.gapAnalysisFormDataService.gapAnalysisDataObj,
      pdfData: pdfData,
    };

    let enhancedGapAnalysisRequest = this.getPdfVersionName(pdfData, pdfFormat);

    const pdfDataDownload: FormMetadataDto = {
      formType: 'DownloadOnly',
      formIdentifier: enhancedGapAnalysisRequest[0]?.formIdentifier,
      templateName: `${enhancedGapAnalysisRequest[0]?.templateName}.pdf`,
      formData: enhancedGapAnalysisRequest[0]?.formData,
    };
    this.store.dispatch(setLoadingSpinner({ status: true }));

    this.enhancedGapAnalysisService
      .generateGapAnalysisForm(pdfDataDownload)
      .pipe(take(1))
      .subscribe({
        next: (formResponse) => {
          if (formResponse.referenceNumber && formResponse.responseCodes.length == 0) {
            this.openPdfFile(formResponse.referenceNumber, formResponse.insuranceForms[0], false);
          }
        },
        error: (err) => {
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
        complete: () => {
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
      });
  }

  private openPdfFile(documentName: string, documentContent: string | undefined, download?: boolean) {
    var blob = this.b64toBlob(documentContent, 'application/pdf');
    var fileURL = URL.createObjectURL(blob);

    if (download) {
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = documentName;
      link.click();
    } else {
      window.open(fileURL);
    }
  }

  private b64toBlob(b64Data: any, contentType: string) {
    contentType = contentType || '';
    let sliceSize = 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);
      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  public collapseContainer(coverageType: number) {
    const collapseValue = this.collapseCardObj.filter((obj) => obj.coverageType === coverageType)[0].isCollapsed;
    this.collapseCardObj.filter((obj) => obj.coverageType === coverageType)[0].isCollapsed = !collapseValue;
  }

  public isContainerCollapse(coverageType: number): boolean {
    return this.collapseCardObj.filter((obj) => obj.coverageType === coverageType)[0].isCollapsed;
  }

  public applicantChange(event: any, coverageType: number) {
    this.applicantSelected.filter((applicant) => applicant.coverageType === coverageType)[0].applicantSelected = (
      event.target as HTMLSelectElement
    ).value;

    if (coverageType === COVERAGE_TYPE.DISABILITY) {
      this.fillIncomeReduce(coverageType);
    }
  }

  private getDetailedCoverageDescription(coverageType: COVERAGE_TYPE, borrowerType: BORROWER_TYPE) {
    if (coverageType == COVERAGE_TYPE.LIFE && borrowerType == BORROWER_TYPE.ONE) {
      return `${this.translateService.instant('results.if_OLC')} ${this.translateService.instant(
        'meeting.borrowerOne'
      )} ${this.translateService.instant('results.descriptionOne')}.`;
    } else if (coverageType == COVERAGE_TYPE.LIFE && borrowerType == BORROWER_TYPE.TWO) {
      return `${this.translateService.instant('results.if_OLC')} ${this.translateService.instant(
        'meeting.borrowerTwo'
      )} ${this.translateService.instant('results.descriptionOne')}.`;
    } else if (coverageType == COVERAGE_TYPE.DISABILITY && borrowerType == BORROWER_TYPE.ONE) {
      return `${this.translateService.instant('results.secondSentence')} ${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NetMonthlyIncome || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }. ${this.translateService.instant('results.eventSentence')} ${this.translateService.instant(
        'meeting.borrowerOne'
      )} ${this.translateService.instant('results.becomes')} ${
        this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage || 0
      }%. `;
    } else if (coverageType == COVERAGE_TYPE.DISABILITY && borrowerType == BORROWER_TYPE.TWO) {
      return `${this.translateService.instant('results.secondSentence')} ${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NetMonthlyIncome || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }. ${this.translateService.instant('results.eventSentence')} ${this.translateService.instant(
        'meeting.borrowerTwo'
      )} ${this.translateService.instant('results.becomes')} ${
        this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage || 0
      }%.`;
    } else if (coverageType == COVERAGE_TYPE.JOB_LOSS && borrowerType == BORROWER_TYPE.ONE) {
      return `${this.translateService.instant('results.secondSentence')} ${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NetMonthlyIncome || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }. ${this.translateService.instant('results.eventSentence')} ${this.translateService.instant(
        'meeting.borrowerOne'
      )} ${this.translateService.instant('results.becomesThree')}.`;
    } else if (coverageType == COVERAGE_TYPE.JOB_LOSS && borrowerType == BORROWER_TYPE.TWO) {
      return `${this.translateService.instant('results.secondSentence')} ${
        this.customOption
          .transform(
            parseInt(this.gapData.monthlyExpensesForm?.NetMonthlyIncome || '0'),
            'USD',
            'symbol',
            '2.0',
            this.languageService.languageSelectedStr
          )
          ?.toString()
          .normalize('NFKC') || 0
      }. ${this.translateService.instant('results.eventSentence')} ${this.translateService.instant(
        'meeting.borrowerTwo'
      )} ${this.translateService.instant('results.becomesThree')}.`;
    } else if (coverageType == COVERAGE_TYPE.CRITICAL_ILLNESS && borrowerType == BORROWER_TYPE.ONE) {
      return `${this.translateService.instant('results.if_OCI')} ${this.translateService.instant(
        'meeting.borrowerOne'
      )} ${this.translateService.instant('results.descriptionFour')}.`;
    } else if (coverageType == COVERAGE_TYPE.CRITICAL_ILLNESS && borrowerType == BORROWER_TYPE.TWO) {
      return `${this.translateService.instant('results.if_OCI')} ${this.translateService.instant(
        'meeting.borrowerTwo'
      )} ${this.translateService.instant('results.descriptionFour')}.`;
    } else return ``;
  }
  private getSummaryCoverageDescription(borrowerType: BORROWER_TYPE, summaryDescription: SUMMARY_DESCRIPTION) {
    if (borrowerType == BORROWER_TYPE.ONE) {
      if (summaryDescription == SUMMARY_DESCRIPTION.B1_HEADER) {
        return `${this.translateService.instant('results.Summary_Header_1')} ${
          this.customOption
            .transform(
              parseInt(this.gapData.monthlyExpensesForm?.NetMonthlyIncome || '0'),
              'USD',
              'symbol',
              '2.0',
              this.languageService.languageSelectedStr
            )
            ?.toString()
            .normalize('NFKC') || 0
        } ${this.translateService.instant(
          'results.Summary_Header_2'
        )} ${this.translateService.instant('meeting.borrowerOne')}${this.translateService.instant(
          'results.Summary_Header_3'
        )}`;
      } else {
        return `${this.translateService.instant('results.Summary_Point_B_1')} ${
          this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage || 0
        }${this.translateService.instant('results.Summary_Point_B_2')}`;
      }
    } else {
      if (summaryDescription == SUMMARY_DESCRIPTION.B2_HEADER) {
        return `${this.translateService.instant('results.Summary_Header_1')} ${
          this.customOption
            .transform(
              parseInt(this.gapData.monthlyExpensesForm?.NetMonthlyIncome || '0'),
              'USD',
              'symbol',
              '2.0',
              this.languageService.languageSelectedStr
            )
            ?.toString()
            .normalize('NFKC') || 0
        } ${this.translateService.instant(
          'results.Summary_Header_2'
        )} ${this.translateService.instant('meeting.borrowerTwo')}${this.translateService.instant(
          'results.Summary_Header_3'
        )}`;
      } else {
        return `${this.translateService.instant('results.Summary_Point_B_1')} ${
          this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage || 0
        }${this.translateService.instant('results.Summary_Point_B_2')}`;
      }
    }
  }

  public getTotalCoverage(coveragePercentage: number, coverageType: number, applicantSelected?: string): number {
    let totalCoverage = 0;
    if (applicantSelected !== undefined) {
      totalCoverage =
        parseFloat(this.getInsuranceValue(coverageType, applicantSelected).toString()) -
        this.getTotalOutstandingLiabilitiesDebtBalanceValue() +
        parseFloat(this.getInsuredAmount(coverageType, coveragePercentage).toString());
    } else {
      totalCoverage =
        parseFloat(this.getInsuranceValue(coverageType).toString()) -
        this.getTotalOutstandingLiabilitiesDebtBalanceValue() +
        parseFloat(this.getInsuredAmount(coverageType, coveragePercentage).toString());
    }
    return totalCoverage === undefined ? 0 : totalCoverage;
  }

  public getTotalCriticalIllness(coveragePercentage: number, coverageType: number, applicantSelected?: string) {
    let result = 0;
    if (applicantSelected === undefined) {
      result =
        parseFloat(this.getInsuranceValue(coverageType).toString()) +
        parseFloat(this.getInsuredAmount(coverageType, coveragePercentage).toString()) -
        this.getTotalOutstandingLiabilitiesDebtBalanceValue();
    } else {
      result =
        parseFloat(this.getInsuranceValue(coverageType, applicantSelected).toString()) +
        parseFloat(this.getInsuredAmount(coverageType, coveragePercentage).toString()) -
        this.getTotalOutstandingLiabilitiesDebtBalanceValue();
    }

    return result === undefined ? 0 : result;
  }

  public getInsuranceValue(coverageType: number, applicantSelected?: string) {
    let value: number = 0;
    if (coverageType === COVERAGE_TYPE.LIFE) {
      if (applicantSelected !== undefined) {
        value =
          applicantSelected === PRIMARY
            ? this.getValueOf(this.gapData.existingCoveragesForm?.B1_ExistingLifeInsurance)
            : this.getValueOf(this.gapData.existingCoveragesForm?.B2_ExistingLifeInsurance);
      } else {
        value =
          this.applicantSelected.filter((applicant) => applicant.coverageType === coverageType)[0].applicantSelected ===
          PRIMARY
            ? this.getValueOf(this.gapData.existingCoveragesForm?.B1_ExistingLifeInsurance)
            : this.getValueOf(this.gapData.existingCoveragesForm?.B2_ExistingLifeInsurance);
      }
    } else {
      if (applicantSelected === undefined) {
        value =
          this.applicantSelected.filter((applicant) => applicant.coverageType === coverageType)[0].applicantSelected ===
          PRIMARY
            ? this.getValueOf(this.gapData.existingCoveragesForm?.B1_ExistingCriticalIllnessInsurance)
            : this.getValueOf(this.gapData.existingCoveragesForm?.B2_ExistingCriticalIllnessInsurance);
      } else {
        value =
          applicantSelected === PRIMARY
            ? this.getValueOf(this.gapData.existingCoveragesForm?.B1_ExistingCriticalIllnessInsurance)
            : this.getValueOf(this.gapData.existingCoveragesForm?.B2_ExistingCriticalIllnessInsurance);
      }
    }

    return value === null || value === undefined ? 0 : value;
  }

  public getValueOf(value: string | undefined): number {
    if (value !== undefined && value !== null) {
      return parseInt(value);
    }

    return 0;
  }

  private validateMaxValue(amountValue: string | undefined, maxValue: number) {
    if (amountValue !== null && amountValue !== undefined) {
      if (parseInt(amountValue) > maxValue) {
        return maxValue;
      }
      return parseInt(amountValue);
    }
    return 0;
  }

  public getInsuredAmount(coverageType: number, coveragePercentage: number) {
    switch (coveragePercentage) {
      case COVERAGE_PERCENTAGE.HUNDRED:
        if (coverageType === COVERAGE_TYPE.LIFE) {
          return this.validateMaxValue(this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue, LIFE_INSURANCE_MAX);
        }

        if (coverageType === COVERAGE_TYPE.DISABILITY) {
          if (
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== null &&
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== undefined &&
            this.gapData.incomeForm?.B1_ProvinceOrTerritory !== undefined
          ) {
            let insuredAmount = parseFloat(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment);
            return insuredAmount > MAX_INSURED_AMOUNT ? MAX_INSURED_AMOUNT : parseInt(insuredAmount.toFixed(0));
          }
        }

        if (coverageType === COVERAGE_TYPE.JOB_LOSS) {
          if (
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== null &&
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== undefined &&
            this.gapData.incomeForm?.B1_ProvinceOrTerritory !== undefined
          ) {
            let insuredAmount = parseFloat(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment);
            return insuredAmount > MAX_INSURED_AMOUNT ? MAX_INSURED_AMOUNT : parseInt(insuredAmount.toFixed(0));
          }
        }

        if (coverageType === COVERAGE_TYPE.CRITICAL_ILLNESS) {
          return this.validateMaxValue(this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue, CRITICAL_ILLNESS_MAX);
        }

        return this.getNewDebt();
      case COVERAGE_PERCENTAGE.FIFTY:
        if (coverageType === COVERAGE_TYPE.LIFE) {
          if (
            this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue !== null &&
            this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue !== undefined
          ) {
            return this.validateMaxValue(
              (parseFloat(this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue) / 2).toString(),
              LIFE_INSURANCE_MAX
            );
          }
        }

        if (coverageType === COVERAGE_TYPE.DISABILITY) {
          if (
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== null &&
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== undefined &&
            this.gapData.incomeForm?.B1_ProvinceOrTerritory !== undefined
          ) {
            let insuredAmount = parseFloat(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment) / 2;
            return insuredAmount > MAX_INSURED_AMOUNT ? MAX_INSURED_AMOUNT : parseInt(insuredAmount.toFixed(0));
          }
        }

        if (coverageType === COVERAGE_TYPE.JOB_LOSS) {
          if (
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== null &&
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== undefined &&
            this.gapData.incomeForm?.B1_ProvinceOrTerritory !== undefined
          ) {
            let insuredAmount = parseFloat(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment) / 2;
            return insuredAmount > MAX_INSURED_AMOUNT ? MAX_INSURED_AMOUNT : parseInt(insuredAmount.toFixed(0));
          }
        }

        if (coverageType === COVERAGE_TYPE.CRITICAL_ILLNESS) {
          if (
            this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue !== null &&
            this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue !== undefined
          ) {
            return this.validateMaxValue(
              (parseFloat(this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue) / 2).toString(),
              CRITICAL_ILLNESS_MAX
            );
          }
        }

        return parseInt((parseFloat(this.getNewDebt().toString()) * 0.5).toFixed(0));

      default:
        if (coverageType === COVERAGE_TYPE.LIFE) {
          return 0;
        }
        return 0;
    }
  }

  public getInsuredAmountJobLoss(coveragePercentage: number, coverageType: number, applicantSelected?: string) {
    let applicantType: string = this.applicantSelected.filter((applicant) => applicant.coverageType === coverageType)[0]
      .applicantSelected;

    return applicantSelected === undefined
      ? this.getInsuranceBenefit(applicantType, coverageType)
      : this.getInsuranceBenefitByApplicant(applicantSelected, coveragePercentage);
  }

  public getTotalShortage(
    coveragePercentage: number,
    coverageType: number = COVERAGE_TYPE.DISABILITY,
    applicantType: string = PRIMARY,
    excludeSelection: boolean = false
  ) {
    if (coverageType === COVERAGE_TYPE.JOB_LOSS) {
      return (
        this.getInsuranceValueMonthly(coverageType, coveragePercentage, applicantType, excludeSelection) -
        this.getMonthlyExpensesTotal() +
        this.getInsuredAmount(coverageType, coveragePercentage)
      );
    } else {
      if (excludeSelection) {
        return (
          this.getInsuranceValueMonthly(coverageType, coveragePercentage, applicantType, excludeSelection) +
          parseFloat(this.getInsuredAmount(2, coveragePercentage).toString()) -
          this.getMonthlyExpensesTotal()
        );
      }

      return (
        this.getInsuranceValueMonthly() -
        this.getMonthlyExpensesTotal() +
        parseFloat(this.getInsuredAmount(2, coveragePercentage).toString())
      );
    }
  }

  public getMonthlyDebtRepayments(): number {
    if (this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments) {
      return parseInt(this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments);
    }
    return 0;
  }

  public getIncomeBase(
    applicantType: string,
    excludeSelection: boolean = false,
    coverageType: number = COVERAGE_TYPE.DISABILITY
  ): number {
    if (applicantType === PRIMARY) {
      if (!excludeSelection && this.isPrimarySelected(coverageType)) {
        return 0;
      }
      return this.gapData.incomeForm?.B1_GrossMonthlyBaseSalary !== null &&
        this.gapData.incomeForm?.B1_GrossMonthlyBaseSalary !== undefined
        ? parseInt(parseFloat(this.gapData.incomeForm?.B1_GrossMonthlyBaseSalary).toFixed(0))
        : 0;
    }

    if (!excludeSelection && !this.isPrimarySelected(coverageType)) {
      return 0;
    }

    return this.gapData.incomeForm?.B2_GrossMonthlyBaseSalary !== null &&
      this.gapData.incomeForm?.B2_GrossMonthlyBaseSalary !== undefined
      ? parseInt(parseFloat(this.gapData.incomeForm?.B2_GrossMonthlyBaseSalary).toFixed(0))
      : 0;
  }

  public getIncomeBonuses(
    applicantType: string,
    coverageType: number = COVERAGE_TYPE.DISABILITY,
    excludeSelection: boolean = false
  ): number {
    if (applicantType === PRIMARY) {
      if (this.isPrimarySelected(coverageType) && !excludeSelection) {
        return 0;
      }
      return this.gapData.incomeForm?.B1_GrossMonthlyBonuses !== null &&
        this.gapData.incomeForm?.B1_GrossMonthlyBonuses !== undefined
        ? parseFloat(this.gapData.incomeForm?.B1_GrossMonthlyBonuses)
        : 0;
    }

    if (!this.isPrimarySelected(coverageType) && !excludeSelection) {
      return 0;
    }

    return this.gapData.incomeForm?.B2_GrossMonthlyBonuses !== null &&
      this.gapData.incomeForm?.B2_GrossMonthlyBonuses !== undefined
      ? parseFloat(this.gapData.incomeForm?.B2_GrossMonthlyBonuses)
      : 0;
  }

  public getIncomeInvestment(applicantType: string): number {
    if (applicantType === PRIMARY) {
      return this.gapData.incomeForm?.B1_GrossMonthlyRentals !== null &&
        this.gapData.incomeForm?.B1_GrossMonthlyRentals !== undefined
        ? parseInt(parseFloat(this.gapData.incomeForm?.B1_GrossMonthlyRentals).toFixed(0))
        : 0;
    }

    return this.gapData.incomeForm?.B2_GrossMonthlyRentals !== null &&
      this.gapData.incomeForm?.B2_GrossMonthlyRentals !== undefined
      ? parseInt(parseFloat(this.gapData.incomeForm?.B2_GrossMonthlyRentals).toFixed(0))
      : 0;
  }

  private getInsuranceBenefitNoSelection(coverageType: number, applicantType: string, coveragePercentage: number = 0) {
    if (coverageType === COVERAGE_TYPE.DISABILITY) {
      if (applicantType === PRIMARY) {
        if (
          this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage &&
          this.gapData.incomeForm?.B1_ProvinceOrTerritory
        ) {
          const primaryInsuranceBenefitPDF =
            reduceTaxBand(
              parseInt(
                (
                  this.getIncomeBase(applicantType, true) *
                  (parseFloat(this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage) * PERCENTAGE)
                ).toFixed(0)
              ) * YEAR,
              this.gapData.incomeForm?.B1_ProvinceOrTerritory
            ) / YEAR;
          return parseInt(primaryInsuranceBenefitPDF.toFixed(0));
        }

        return 0;
      }

      if (
        this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage &&
        this.gapData.incomeForm?.B2_ProvinceOrTerritory
      ) {
        const secondaryInsuranceBenefitPDF =
          reduceTaxBand(
            parseInt(
              (
                this.getIncomeBase(applicantType, true) *
                (parseFloat(this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage) * PERCENTAGE)
              ).toFixed(0)
            ) * YEAR,
            this.gapData.incomeForm?.B2_ProvinceOrTerritory
          ) / YEAR;
        return parseInt(secondaryInsuranceBenefitPDF.toFixed(0));
      }

      return 0;
    } else if (coverageType === COVERAGE_TYPE.JOB_LOSS) {
      if (applicantType === PRIMARY) {
        if (this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage) {
          return parseInt(
            (
              this.getIncomeBase(applicantType, true) *
              (parseFloat(this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage) * PERCENTAGE)
            ).toFixed(0)
          );
        }

        return 0;
      }

      if (this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage) {
        if (coveragePercentage === 0) {
          return parseInt(
            (
              this.getIncomeBase(applicantType, true) *
              (parseFloat(this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage) * PERCENTAGE)
            ).toFixed(0)
          );
        }

        if (coveragePercentage === COVERAGE_PERCENTAGE.HUNDRED) {
          return this.getIncomeBase(applicantType, true);
        }

        if (coveragePercentage === COVERAGE_PERCENTAGE.FIFTY) {
          return this.getIncomeBase(applicantType, true) * FiFTY_PERCENT;
        }

        return 0;
      }

      return 0;
    }

    return 0;
  }

  public getInsuranceBenefit(applicantType: string, coverageType: number): number {
    if (coverageType === COVERAGE_TYPE.DISABILITY) {
      if (applicantType !== SECONDARY) {
        if (
          this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage &&
          this.gapData.incomeForm?.B1_ProvinceOrTerritory
        ) {
          if (this.gapData.meetingDetailForm?.IsSecondaryApplicant && !this.isPrimarySelected(coverageType)) {
            return 0;
          }
          const calculatedPrimaryInsuranceBenefit =
            reduceTaxBand(
              parseInt(
                (
                  this.getIncomeBase(applicantType, true) *
                  (parseFloat(this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage) * PERCENTAGE)
                ).toFixed(0)
              ) * YEAR,
              this.gapData.incomeForm?.B1_ProvinceOrTerritory
            ) / YEAR;
          return parseInt(calculatedPrimaryInsuranceBenefit.toFixed(0));
        }

        return 0;
      }

      if (
        this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage &&
        this.gapData.incomeForm?.B2_ProvinceOrTerritory
      ) {
        if (this.isPrimarySelected(2)) {
          return 0;
        }
        return this.calculatestepSixAltInsuranceDisaValue();
      }
    } else if (coverageType === COVERAGE_TYPE.JOB_LOSS) {
      if (applicantType !== SECONDARY) {
        if (this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage) {
          if (this.gapData.meetingDetailForm?.IsSecondaryApplicant && !this.isPrimarySelected(coverageType)) {
            return 0;
          }
          return 0;
        }

        return 0;
      }

      if (this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage) {
        if (this.isPrimarySelected(coverageType)) {
          return 0;
        }
        return 0;
      }
    }

    return 0;
  }

  private getInsuranceBenefitByApplicant(applicantType: string, coveragePercentage?: number) {
    if (coveragePercentage === COVERAGE_PERCENTAGE.HUNDRED) {
      return parseInt(this.getIncomeBase(applicantType, true).toFixed(0));
    }

    if (coveragePercentage === COVERAGE_PERCENTAGE.FIFTY) {
      return parseInt((this.getIncomeBase(applicantType, true) * 0.5).toFixed(0));
    }

    return 0;
  }

  public getInsuranceValueMonthly(
    coverageType: number = 2,
    coveragePercentage?: number,
    applicantSelected?: string,
    excludeSelection: boolean = false
  ): number {
    if (applicantSelected === undefined) {
      if (this.isPrimarySelected(coverageType)) {
        return this.getInsuranceValueByApplicant(PRIMARY, coverageType, coveragePercentage, excludeSelection);
      }
      return this.getInsuranceValueByApplicant(SECONDARY, coverageType, coveragePercentage, excludeSelection);
    }
    return this.getInsuranceValueByApplicant(applicantSelected, coverageType, coveragePercentage, excludeSelection);
  }

  private getInsuranceValueByApplicant(
    applicantSelected: string,
    coverageType: number,
    contentNumber?: number,
    excludeSelection: boolean = false
  ) {
    let taxBand = 0;

    if (coverageType !== COVERAGE_TYPE.JOB_LOSS || !excludeSelection) {
      taxBand = parseInt((this.getTaxValue(SECONDARY) / YEAR + this.getTaxValue(PRIMARY) / YEAR).toFixed(0));
    }

    if (coverageType === COVERAGE_TYPE.JOB_LOSS) {
      taxBand = parseInt(
        (
          this.getTaxValueByCheckedApplicant(SECONDARY, coverageType) +
          this.getTaxValueByCheckedApplicant(PRIMARY, coverageType)
        ).toFixed(0)
      );
    }

    if ((coverageType === COVERAGE_TYPE.DISABILITY || coverageType === COVERAGE_TYPE.JOB_LOSS) && excludeSelection) {
      if (applicantSelected === PRIMARY) {
        taxBand = parseInt((this.getTaxValue(SECONDARY, excludeSelection) / YEAR).toFixed(0));
      } else {
        taxBand = parseInt((this.getTaxValue(PRIMARY, excludeSelection) / YEAR).toFixed(0));
      }
    }

    //applicantSelected === PRIMARY
    if (this.isPrimarySelected(coverageType) && !excludeSelection) {
      if (coverageType === COVERAGE_TYPE.DISABILITY) {
        return parseInt(
          (
            AddNumbers([
              this.getInsuranceBenefitReduced(PRIMARY),
              this.getInsuranceBenefitReduced(SECONDARY),
              this.getIncomeBase(SECONDARY, excludeSelection, coverageType),
              this.getIncomeBonuses(SECONDARY, coverageType),
              this.getIncomeInvestment(SECONDARY),
              this.getIncomeInvestment(PRIMARY),
            ]) - taxBand
          ).toFixed(0)
        );
      }

      return parseInt(
        (
          AddNumbers([
            this.getInsuranceBenefit(PRIMARY, coverageType),
            this.getInsuranceBenefit(SECONDARY, coverageType),
            this.getIncomeBase(SECONDARY, excludeSelection, coverageType),
            this.getIncomeBonuses(SECONDARY, coverageType),
            this.getIncomeInvestment(SECONDARY),
            this.getIncomeInvestment(PRIMARY),
          ]) - taxBand
        ).toFixed(0)
      );
    }

    if (!this.isPrimarySelected(coverageType) && !excludeSelection) {
      if (coverageType === COVERAGE_TYPE.DISABILITY) {
        // Borrower 2
        return parseInt(
          (
            AddNumbers([
              this.getIncomeBase(PRIMARY, excludeSelection, coverageType),
              this.getIncomeBonuses(PRIMARY, coverageType),
              this.getIncomeInvestment(SECONDARY),
              this.getInsuranceBenefitReduced(SECONDARY),
              this.getIncomeInvestment(PRIMARY),
            ]) - taxBand
          ).toFixed(0)
        );
      }

      // This is for coverageType === 3 ---> JobLoss and Borrower 2
      return parseInt(
        (
          AddNumbers([
            this.getIncomeBase(PRIMARY, excludeSelection, coverageType),
            this.getIncomeBonuses(PRIMARY, coverageType),
            this.getIncomeInvestment(SECONDARY),
            this.getIncomeInvestment(PRIMARY),
          ]) - taxBand
        ).toFixed(0)
      );
    }

    if (coverageType === COVERAGE_TYPE.DISABILITY && excludeSelection) {
      if (applicantSelected === PRIMARY) {
        return parseInt(
          (
            AddNumbers([
              this.getIncomeBase(SECONDARY, excludeSelection, coverageType),
              this.getIncomeBonuses(SECONDARY, coverageType, true),
              this.getIncomeInvestment(PRIMARY),
              this.getIncomeInvestment(SECONDARY),
              this.getInsuranceBenefitNoSelection(coverageType, PRIMARY),
            ]) - taxBand
          ).toFixed(0)
        );
      }

      return parseInt(
        (
          AddNumbers([
            this.getIncomeBase(PRIMARY, excludeSelection, coverageType),
            this.getIncomeBonuses(PRIMARY, coverageType, true),
            this.getIncomeInvestment(PRIMARY),
            this.getInsuranceBenefitNoSelection(coverageType, SECONDARY),
            this.getIncomeInvestment(SECONDARY),
          ]) - taxBand
        ).toFixed(0)
      );
    }

    if (coverageType === COVERAGE_TYPE.JOB_LOSS && excludeSelection) {
      if (applicantSelected === PRIMARY) {
        return parseInt(
          (
            AddNumbers([
              this.getIncomeBase(SECONDARY, excludeSelection, coverageType),
              this.getIncomeBonuses(SECONDARY, coverageType, excludeSelection),
              this.getIncomeInvestment(SECONDARY),
              this.getIncomeInvestment(PRIMARY),
            ]) - taxBand
          ).toFixed(0)
        );
      }

      return parseInt(
        (
          AddNumbers([
            this.getIncomeBase(PRIMARY, excludeSelection, coverageType),
            this.getIncomeBonuses(PRIMARY, coverageType, excludeSelection),
            this.getIncomeInvestment(PRIMARY),
            this.getIncomeInvestment(SECONDARY),
          ]) - taxBand
        ).toFixed(0)
      );
    }

    return parseInt(
      (
        AddNumbers([
          this.getIncomeBase(PRIMARY, excludeSelection, coverageType),
          this.getIncomeBonuses(PRIMARY, coverageType),
          this.getIncomeInvestment(PRIMARY),
          this.getInsuranceBenefit(PRIMARY, coverageType),
          this.getInsuranceBenefit(SECONDARY, coverageType),
          this.getIncomeInvestment(SECONDARY),
        ]) - taxBand
      ).toFixed(0)
    );
  }

  public getTaxByTokenName(applicantType: string, tokenName: string): number {
    if (
      applicantType === PRIMARY &&
      this.gapData.incomeForm?.['B1_GrossMonthlyRentals'] !== undefined &&
      this.gapData.incomeForm?.B1_ProvinceOrTerritory
    ) {
      return parseInt(
        reduceTaxBand(
          parseInt(this.gapData.incomeForm?.['B1_GrossMonthlyRentals']?.toString()) * YEAR,
          this.gapData.incomeForm?.B1_ProvinceOrTerritory,
          true
        ).toFixed(0)
      );
    }

    if (
      applicantType === SECONDARY &&
      this.gapData.incomeForm?.['B2_GrossMonthlyRentals'] !== undefined &&
      this.gapData.incomeForm?.B2_ProvinceOrTerritory
    ) {
      return parseInt(
        reduceTaxBand(
          parseInt(this.gapData.incomeForm?.['B2_GrossMonthlyRentals']?.toString()) * YEAR,
          this.gapData.incomeForm?.B2_ProvinceOrTerritory,
          true
        ).toFixed(0)
      );
    }

    return 0;
  }

  public getTaxValueByCheckedApplicant(applicantType: string, coverageType: number) {
    if (applicantType === PRIMARY && this.isPrimarySelected(coverageType)) {
      return 0;
    }

    if (applicantType === PRIMARY && !this.isPrimarySelected(coverageType)) {
      if (this.gapData.incomeForm?.B1_ProvinceOrTerritory) {
        return parseInt(
          (
            reduceTaxBand(
              AddNumbers([
                this.getIncomeBase(applicantType, true, coverageType) * YEAR,
                this.getIncomeBonuses(applicantType, coverageType, true) * YEAR,
              ]),
              this.gapData.incomeForm?.B1_ProvinceOrTerritory,
              true
            ) / YEAR
          ).toFixed(0)
        );
      }
      return 0;
    }

    if (applicantType === SECONDARY && !this.isPrimarySelected(coverageType)) {
      return 0;
    }

    if (this.gapData.incomeForm?.B2_ProvinceOrTerritory) {
      return parseInt(
        (
          reduceTaxBand(
            AddNumbers([
              this.getIncomeBase(applicantType, true, coverageType) * YEAR,
              this.getIncomeBonuses(applicantType, coverageType, true) * YEAR,
            ]),
            this.gapData.incomeForm?.B2_ProvinceOrTerritory,
            true
          ) / YEAR
        ).toFixed(0)
      );
    }

    return 0;
  }

  public getTaxValue(
    applicantType: string,
    excludeSelection: boolean = false,
    coverageType: number = COVERAGE_TYPE.DISABILITY
  ) {
    if (applicantType === PRIMARY) {
      if (this.gapData.incomeForm?.B1_ProvinceOrTerritory) {
        return parseInt(
          reduceTaxBand(
            AddNumbers([
              this.getIncomeBase(applicantType, excludeSelection) * YEAR,
              this.getIncomeBonuses(applicantType, coverageType, excludeSelection) * YEAR,
            ]),
            this.gapData.incomeForm?.B1_ProvinceOrTerritory,
            true
          ).toFixed(0)
        );
      }
      return 0;
    }

    if (this.gapData.incomeForm?.B2_ProvinceOrTerritory) {
      return parseInt(
        reduceTaxBand(
          AddNumbers([
            this.getIncomeBase(applicantType, excludeSelection) * YEAR,
            this.getIncomeBonuses(applicantType, coverageType, excludeSelection) * YEAR,
          ]),
          this.gapData.incomeForm?.B2_ProvinceOrTerritory,
          true
        ).toFixed(0)
      );
    }

    return 0;
  }

  public getTax(borrowerType: string): number {
    let borrowerOneTax = 0;
    let borrowerTwoTax = 0;
    const borrowerOneMonthlyIncomeAfterTax: number = parseInt(
      this.gapData.incomeForm?.B1_EstimatedMonthlyIncomeAfterTax || '0'
    );
    const borrowerOneBaseSalary: number = parseInt(this.gapData.incomeForm?.B1_GrossMonthlyBaseSalary || '0');
    const borrowerOneBonuses: number = parseInt(this.gapData.incomeForm?.B1_GrossMonthlyBonuses || '0');
    const borrowerOneRentals: number = parseInt(this.gapData.incomeForm?.B1_GrossMonthlyRentals || '0');

    borrowerOneTax = borrowerOneBaseSalary + borrowerOneBonuses + borrowerOneRentals - borrowerOneMonthlyIncomeAfterTax;

    if (this.gapData.meetingDetailForm?.IsSecondaryApplicant) {
      const borrowerOneMonthlyIncomeAfterTax: number = parseInt(
        this.gapData.incomeForm?.B2_EstimatedMonthlyIncomeAfterTax || '0'
      );
      const borrowerOneBaseSalary: number = parseInt(this.gapData.incomeForm?.B2_GrossMonthlyBaseSalary || '0');
      const borrowerOneBonuses: number = parseInt(this.gapData.incomeForm?.B2_GrossMonthlyBonuses || '0');
      const borrowerOneRentals: number = parseInt(this.gapData.incomeForm?.B2_GrossMonthlyRentals || '0');

      borrowerTwoTax =
        borrowerOneBaseSalary + borrowerOneBonuses + borrowerOneRentals - borrowerOneMonthlyIncomeAfterTax;
    }

    if (borrowerType == BORROWER_TYPE.ONE) {
      return borrowerOneTax;
    } else {
      return borrowerTwoTax;
    }
  }

  private isPrimarySelected(coverageType: number) {
    if (
      this.applicantSelected.filter((applicant) => applicant.coverageType === coverageType)[0].applicantSelected ===
      PRIMARY
    ) {
      return true;
    }

    return false;
  }

  public getNewDebt(): number {
    return this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== undefined &&
      this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== null
      ? parseInt(parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment).toFixed(0))
      : 0;
  }

  public getRepayments() {
    return AddNumbers([this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments]);
  }

  public getLivingExpenses() {
    return parseInt(AddNumbers([this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber]).toFixed(0));
  }

  public getMonthlyExpensesTotal() {
    return AddNumbers([this.getNewDebt(), this.getRepayments(), this.getLivingExpenses()]);
  }

  public onPercentageChange() {
    this.isIncomeReduce = true;
  }

  public getInsuranceBenefitReduced(applicantType: string): number {
    if (
      this.incomeForm.get('incomeReduce')?.value !== null &&
      this.incomeForm.get('incomeReduce')?.value !== undefined &&
      parseFloat(this.incomeForm.get('incomeReduce')?.value) >= 0
    ) {
      const multiplyBy = parseFloat(this.incomeForm.get('incomeReduce')?.value) * PERCENTAGE;

      if (applicantType === PRIMARY && this.gapData.incomeForm?.B1_ProvinceOrTerritory) {
        if (!this.isPrimarySelected(2)) {
          return 0;
        }

        const calculatedPrimaryInsuranceBenefitReduced =
          reduceTaxBand(
            this.getIncomeBase(applicantType, true) * multiplyBy * YEAR,
            this.gapData.incomeForm?.B1_ProvinceOrTerritory
          ) / YEAR;
        return parseInt(calculatedPrimaryInsuranceBenefitReduced.toFixed(0));
      }

      if (applicantType === SECONDARY && this.gapData.incomeForm?.B2_ProvinceOrTerritory) {
        if (this.isPrimarySelected(2)) {
          return 0;
        }
        const calculatedSecondaryInsuranceBenefitReduced =
          reduceTaxBand(
            this.getIncomeBase(applicantType, true) * multiplyBy * YEAR,
            this.gapData.incomeForm?.B2_ProvinceOrTerritory
          ) / YEAR;
        return parseInt(calculatedSecondaryInsuranceBenefitReduced.toFixed(0));
      }
    }

    return this.getInsuranceBenefit(applicantType, 2);
  }

  public getNetMonthlyIncome(): number {
    let netMonthlyIncome = 0;
    if (this.gapData.monthlyExpensesForm?.NetMonthlyIncome) {
      const formattedIncome = this.gapData.monthlyExpensesForm.NetMonthlyIncome.replace(/[^0-9.-]+/g, '');
      netMonthlyIncome = parseFloat(formattedIncome);
    }
    return netMonthlyIncome;
  }

  calculatestepSixAltInsuranceDisaValue(applicantType = SECONDARY): number {
    if (
      this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage &&
      this.gapData.incomeForm?.B2_ProvinceOrTerritory
    ) {
      let calculatedSecondaryInsuranceBenefit =
        reduceTaxBand(
          parseInt(
            (
              this.getIncomeBase(applicantType, true) *
              (parseFloat(this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage) * PERCENTAGE)
            ).toFixed(0)
          ) * YEAR,
          this.gapData.incomeForm?.B2_ProvinceOrTerritory
        ) / YEAR;
      return parseInt(calculatedSecondaryInsuranceBenefit.toFixed(0));
    } else return 0;
  }

  getNewMortgageLoanBalanceValue(): number {
    if (this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue) {
      return parseInt(this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue);
    }
    return 0;
  }

  getExistingLiabilitiesDebtBalanceValue(): number {
    if (this.gapData.liabilitiesForm?.ExistingLiabilitiesDebtBalance) {
      return parseInt(this.gapData.liabilitiesForm?.ExistingLiabilitiesDebtBalance);
    }
    return 0;
  }

  getTotalOutstandingLiabilitiesDebtBalanceValue(): number {
    if (this.gapData.liabilitiesForm?.TotalOutstandingLiabilitiesDebtBalance) {
      return parseInt(this.gapData.liabilitiesForm?.TotalOutstandingLiabilitiesDebtBalance);
    }
    return 0;
  }

  openUrlInNewTab() {
    window.open('https://www.bmo.com/oab/start?_lang=en', '_blank');
  }
}
