import { AsyncPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { LanguageService } from '@core/services/language/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyOptionPipe as CurrencyOptionPipe_1 } from '@core/utils/pipes/currency-option/currency-option.pipe';

@Component({
  selector: 'app-monthly-income-applicant',
  templateUrl: './monthly-income-applicant.component.html',
  styleUrls: ['./monthly-income-applicant.component.scss'],
  standalone: true,
  imports: [AsyncPipe, TranslateModule, CurrencyOptionPipe_1],
})
export class MonthlyIncomeApplicantComponent {
  templateId = input.required<number>();
  isContainerCollapse = input.required<boolean>();
  isIncomeReduce = input.required<boolean>();
  applicantType = input.required<string>();
  incomeBase = input.required<number>();
  incomeBonuses = input.required<number>();
  incomeInvestment = input.required<number>();
  taxValueByCheckedApplicant = input.required<number>();
  insuranceBenefit = input.required<number>();
  insuranceBenefitReduced = input.required<number>();

  languageService = inject(LanguageService);
}
