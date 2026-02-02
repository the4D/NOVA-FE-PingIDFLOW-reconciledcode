export interface Income {
  B1_GrossMonthlyBaseSalary: string | undefined;
  B1_ProvinceOrTerritory: string | undefined;
  B1_GrossMonthlyBonuses: string | undefined;
  B1_GrossMonthlyRentals: string | undefined;
  B1_EstimatedAnnualIncomeAfterTax: string | undefined;
  B1_EstimatedMonthlyIncomeAfterTax: string | undefined;
  B1_IncomeType: string | undefined;

  B2_GrossMonthlyBaseSalary: string | undefined;
  B2_ProvinceOrTerritory: string | undefined;
  B2_GrossMonthlyBonuses: string | undefined;
  B2_GrossMonthlyRentals: string | undefined;
  B2_EstimatedAnnualIncomeAfterTax: string | undefined;
  B2_EstimatedMonthlyIncomeAfterTax: string | undefined;
  B2_IncomeType: string | undefined;

  CombinedEstimatedAnnualIncomeAfterTax: string | undefined;
  CombinedEstimatedMonthlyIncomeAfterTax: string | undefined;
}
