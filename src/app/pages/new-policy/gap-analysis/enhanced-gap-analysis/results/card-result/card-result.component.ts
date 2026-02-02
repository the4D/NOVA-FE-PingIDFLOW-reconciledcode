import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { LanguageService } from '@core/services/language/language.service';
import {
  CurrencyOptionPipe,
  CurrencyOptionPipe as CurrencyOptionPipe_1,
} from '@core/utils/pipes/currency-option/currency-option.pipe';
import { MonthlyIncomeApplicantComponent } from '../monthly-income-applicant/monthly-income-applicant.component';
import { CalculationService } from '../services/calculation.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-card-result',
  templateUrl: './card-result.component.html',
  styleUrls: ['./card-result.component.scss'],
  providers: [CurrencyOptionPipe, DatePipe],
  standalone: true,
  imports: [AsyncPipe, MatIcon, CurrencyOptionPipe_1, MonthlyIncomeApplicantComponent, TranslateModule, NgClass],
})
export class CardResultComponent {
  title = input.required<string>();
  titleInsurance = input.required<string>();
  subTitleInsurance = input.required<string>();
  templateNumber = input.required<number>();
  incomeCard = input.required<boolean>();
  isContainerCollapse = input.required<boolean>();
  insuranceValueMonthly = input.required<number>();
  insuranceValue = input.required<number>();
  isSecondaryApplicant = input<boolean | undefined>(false);
  incomeReduce = input<number | null | undefined>();
  isIncomeReduce = input.required<boolean>();
  titleLiabilities = input.required<string>();
  titleCoverage = input.required<string>();
  contentNumber = input.required<number>();
  cardNumber = input.required<number>();

  collapseCard = output<number>();

  languageService = inject(LanguageService);
  calculationService = inject(CalculationService);

  public collapseContainer(templateNumber: number) {
    this.collapseCard.emit(templateNumber);
  }

  public getIncomeBase(applicantType: string, excludedCalculation: boolean, CoverageType: number) {
    return this.calculationService.getIncomeBase(applicantType, excludedCalculation, CoverageType);
  }

  public getIncomeBonuses(applicantType: string, coverageType: number, excludeSelection: boolean) {
    return this.calculationService.getIncomeBonuses(applicantType, coverageType, excludeSelection);
  }

  public getIncomeInvestment(applicantType: string) {
    return this.calculationService.getIncomeInvestment(applicantType);
  }

  public getTaxValueByCheckedApplicant(applicantType: string, coverageType: number) {
    return this.calculationService.getTaxValueByCheckedApplicant(applicantType, coverageType);
  }

  public getInsuranceBenefit(applicantType: string, coverageType: number) {
    return this.calculationService.getInsuranceBenefit(applicantType, coverageType);
  }

  public getInsuranceBenefitReduced(applicantType: string) {
    return this.calculationService.getInsuranceBenefitReduced(applicantType, this.incomeReduce());
  }

  public getTotalOutstandingLiabilitiesDebtBalanceValue() {
    return this.calculationService.getTotalOutstandingLiabilitiesDebtBalanceValue();
  }

  public getMonthlyExpensesTotal() {
    return this.calculationService.getMonthlyExpensesTotal();
  }

  public getNewMortgageLoanBalanceValue() {
    return this.calculationService.getNewMortgageLoanBalanceValue();
  }

  public getExistingLiabilitiesDebtBalanceValue() {
    return this.calculationService.getExistingLiabilitiesDebtBalanceValue();
  }

  public getNewDebt() {
    return this.calculationService.getNewDebt();
  }

  public getRepayments() {
    return this.calculationService.getRepayments();
  }

  public getLivingExpenses() {
    return this.calculationService.getLivingExpenses();
  }

  public getTotalCriticalIllness(coveragePercentage: number, coverageType: number) {
    return this.calculationService.getTotalCriticalIllness(coveragePercentage, coverageType);
  }

  public getTotalCoverage(contentNumber: number, cardNumber: number) {
    return this.calculationService.getTotalCoverage(contentNumber, cardNumber);
  }

  public getInsuredAmount(coverageType: number, contentNumber: number) {
    return this.calculationService.getInsuredAmount(coverageType, contentNumber);
  }

  public getTotalShortage(coverageType: number, templateId: number) {
    return this.calculationService.getTotalShortage(coverageType, templateId, this.incomeReduce());
  }
}
