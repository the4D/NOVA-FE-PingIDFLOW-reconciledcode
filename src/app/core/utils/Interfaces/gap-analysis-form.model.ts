import { ExistingCoverages } from './forms/existing-coverage.interface';
import { Income } from './forms/income.interface';
import { Liabilities } from './forms/liabilities.interface';
import { MeetingDetails } from './forms/meeting-details.interface';
import { MonthlyExpenses } from './forms/monthly-expenses.interface';

export interface GapAnalysisForm {
  meetingDetailForm: MeetingDetails | undefined;
  incomeForm: Income | undefined;
  liabilitiesForm: Liabilities | undefined;
  monthlyExpensesForm: MonthlyExpenses | undefined;
  existingCoveragesForm: ExistingCoverages | undefined;
}

export const InitialGapAnalysisForm: GapAnalysisForm = {
  meetingDetailForm: {
    Name: undefined,
    Email: undefined,
    Phone: undefined,
    MeetingDate: undefined,
    IsSecondaryApplicant: undefined,
    PrimaryName: undefined,
    SecondaryName: undefined,
  },
  incomeForm: {
    B1_GrossMonthlyBaseSalary: undefined,
    B1_ProvinceOrTerritory: undefined,
    B1_GrossMonthlyBonuses: undefined,
    B1_GrossMonthlyRentals: undefined,
    B1_EstimatedAnnualIncomeAfterTax: undefined,
    B1_EstimatedMonthlyIncomeAfterTax: undefined,
    B1_IncomeType: undefined,
    B2_GrossMonthlyBaseSalary: undefined,
    B2_ProvinceOrTerritory: undefined,
    B2_GrossMonthlyBonuses: undefined,
    B2_GrossMonthlyRentals: undefined,
    B2_EstimatedAnnualIncomeAfterTax: undefined,
    B2_EstimatedMonthlyIncomeAfterTax: undefined,
    B2_IncomeType: undefined,
    CombinedEstimatedAnnualIncomeAfterTax: undefined,
    CombinedEstimatedMonthlyIncomeAfterTax: undefined,
  },
  liabilitiesForm: {
    NewMortgageLoanBalanceValue: undefined,
    ExistingLiabilitiesDebtBalance: undefined,
    TotalOutstandingLiabilitiesDebtBalance: undefined,
  },
  monthlyExpensesForm: {
    NewMonthlyMortgageLoanPayment: undefined,
    ExistingMonthlyLiabilityDebtPayments: undefined,
    OtherMonthlyExpensesInPercentage: undefined,
    OtherMonthlyExpensesInNumber: undefined,
    TotalMonthlyIncome: undefined,
    TotalMonthlyExpenses: undefined,
    NetMonthlyIncome: undefined,
  },
  existingCoveragesForm: {
    B1_ExistingLifeInsurance: undefined,
    B1_DisabilityInsuranceInPercentage: undefined,
    B1_ExistingCriticalIllnessInsurance: undefined,
    B2_ExistingLifeInsurance: undefined,
    B2_DisabilityInsuranceInPercentage: undefined,
    B2_ExistingCriticalIllnessInsurance: undefined,
  },
};
