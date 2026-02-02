export interface Income {
  employmentType: string;
  annualIncome: number;
  workHours: number;
  hourlyPay: number;
  additionalIncome: number;
  estimatedMonthlyIncome: number;
  estimatedAnnualIncome: number;
};

export interface Asset {
  realEstate: number;
  investments: number;
  savings: number;
  others: number;
  totalAsset: number;
};

export interface AssetLiability {
  asset: Asset;
  liability: Liability;
};

export interface Liability {
  mortgage: number;
  lineOfCredit: number;
  loans: number;
  newDebt: number;
  totalLiability: number;
  creditCards: number;
};

export interface Expenses {
  housing: number;
  propertyTaxes: number;
  utilities: number;
  children: number;
  transportation: number;
  groceries: number;
  insurance: number;
  otherExpenses: number;
  loans: number;
  creditCards: number;
  lineOfCredit: number;
  newDebt: number;
  totalExpenses: number;
};

export const expenseInitialState = (): Expenses => ({
  housing: 0,
  propertyTaxes: 0,
  utilities: 0,
  children: 0,
  transportation: 0,
  groceries: 0,
  insurance: 0,
  otherExpenses: 0,
  loans: 0,
  creditCards: 0,
  lineOfCredit: 0,
  newDebt: 0,
  totalExpenses: 0
});

export interface Coverages {
  lifeInsurance: number;
  groupLifeInsurance: number;
  creditProtection: number;
  incomeReplacementCoverage: boolean;
  totalCoverageAmount: number;
  coverageAmount: number;
};

export const coverageInitialState = (): Coverages => ({
  lifeInsurance: 0,
  groupLifeInsurance: 0,
  creditProtection: 0,
  incomeReplacementCoverage: false,
  totalCoverageAmount: 0,
  coverageAmount: 0
});

export interface EmploymentType {
  value: string;
  description: string;
}

export const incomeInitialState = (): Income => ({
  employmentType: '',
  annualIncome: 0,
  hourlyPay: 0,
  workHours: 0,
  additionalIncome: 0,
  estimatedMonthlyIncome: 0,
  estimatedAnnualIncome: 0
});

export const assetInitialState = (): Asset => ({
  realEstate: 0,
  investments: 0,
  savings: 0,
  others: 0,
  totalAsset: 0
});

export const liabilityInitialState = (): Liability => ({
  mortgage: 0,
  lineOfCredit: 0,
  loans: 0,
  newDebt: 0,
  totalLiability: 0,
  creditCards: 0
});

export const assetLiabilityInitialState = (): AssetLiability => ({
  asset: assetInitialState(),
  liability: liabilityInitialState()
});

export interface LenderInfo {
  lender: string;
  branch: string;
  userEmail: string;
  phoneNumber: string;
};

export interface FormMetadataDto {
  formType: string;
  formIdentifier: string;
  templateName: string;
  formData: string;
};

export interface GapAnalysisBlob {
  todayDate: string;
  lendingOfficer: string;
  email: string;
  branch: string;
  phone: string;
  incomeInformationEmploymentType: string;
  incomeInformationGrossAnnualIncome: string;
  incomeInformationEstimatedMonthlyIncome: string;
  incomeInformationAverageHoursPerWeek: string;
  incomeInformationHourlyPay: string;
  incomeInformationAdditionalAnnualIncome: string;
  assetsRealEstate: string;
  assetsInvestments: string;
  assetsSavings: string;
  assetsOtherAssets: string;
  assetsTotalAssets: string;
  liabilitiesExistingMortgage: string;
  liabilitiesExistingLineOfCredit: string;
  liabilitiesExistingLoans: string;
  liabilitiesExistingCreditCards: string;
  liabilitiesNewDebt: string;
  liabilitiesTotalLiabilities: string;
  monthlyExpensesHousing: string;
  monthlyExpensesPropertyTaxes: string;
  monthlyExpensesUtilities: string;
  monthlyExpensesChildrenAndEducation: string;
  monthlyExpensesTransportation: string;
  monthlyExpensesGroceries: string;
  monthlyExpensesHouseInsurance: string;
  monthlyExpensesOtherExpenses: string;
  monthlyExpensesLoans: string;
  monthlyExpensesCreditCards: string;
  monthlyExpensesLineOfCredit: string;
  monthlyExpensesNewDebt: string;
  monthlyExpensesTotalMonthlyExpenses: string;
  coveragesLifeInsurance: string;
  coveragesGroupLifeInsurance: string;
  coveragesCreditProtection: string;
  coveragesCoveragePercentage: string;
  incomeInformationEstimatedAnnualIncome: string,
  resultsLifeTotalRequirement: string;
  resultsLifeExistingCoverage: string;
  resultsLifeUnprotectedCoverage: string;
  resultsDisabilityCurrentMonthlyObligation: string;
  resultsDisabilityExistingCoverage: string;
  resultsDisabilityMonthlyIncomeGap: string;
  resultsCalculatedMonthlyGap: string;
  resultsCalculatedUnprotectedCoverages: string;
  resultsDisabilityExistingCoverageInt: number;
  resultsDisabilityMonthlyIncomeGapInt: number;
  resultsCalculatedUnprotectedCoveragesInt: number;
};

export const initialValueBlob = (): GapAnalysisBlob => ({
  todayDate: '',
  lendingOfficer: '',
  email: '',
  branch: '',
  phone: '',
  incomeInformationEmploymentType: '',
  incomeInformationGrossAnnualIncome: '',
  incomeInformationEstimatedMonthlyIncome: '',
  incomeInformationAverageHoursPerWeek: '',
  incomeInformationHourlyPay: '',
  incomeInformationAdditionalAnnualIncome: '',
  assetsRealEstate: '',
  assetsInvestments: '',
  assetsSavings: '',
  assetsOtherAssets: '',
  assetsTotalAssets: '',
  liabilitiesExistingMortgage: '',
  liabilitiesExistingLineOfCredit: '',
  liabilitiesExistingLoans: '',
  liabilitiesExistingCreditCards: '',
  liabilitiesNewDebt: '',
  liabilitiesTotalLiabilities: '',
  monthlyExpensesHousing: '',
  monthlyExpensesPropertyTaxes: '',
  monthlyExpensesUtilities: '',
  monthlyExpensesChildrenAndEducation: '',
  monthlyExpensesTransportation: '',
  monthlyExpensesGroceries: '',
  monthlyExpensesHouseInsurance: '',
  monthlyExpensesOtherExpenses: '',
  monthlyExpensesLoans: '',
  monthlyExpensesCreditCards: '',
  monthlyExpensesLineOfCredit: '',
  monthlyExpensesNewDebt: '',
  monthlyExpensesTotalMonthlyExpenses: '',
  coveragesLifeInsurance: '',
  coveragesGroupLifeInsurance: '',
  coveragesCreditProtection: '',
  coveragesCoveragePercentage: '',
  incomeInformationEstimatedAnnualIncome: '',
  resultsLifeTotalRequirement: '',
  resultsLifeExistingCoverage: '',
  resultsLifeUnprotectedCoverage: '',
  resultsDisabilityCurrentMonthlyObligation: '',
  resultsDisabilityExistingCoverage: '',
  resultsDisabilityMonthlyIncomeGap: '',
  resultsCalculatedMonthlyGap: '',
  resultsCalculatedUnprotectedCoverages: '',
  resultsDisabilityExistingCoverageInt: 0,
  resultsDisabilityMonthlyIncomeGapInt: 0,
  resultsCalculatedUnprotectedCoveragesInt: 0
});

export interface GapAnalysisPDFResponse {
  insuranceForms: string[];
  referenceNumber: string;
  responseCodes: FormResponseCode[];
}

export interface FormResponseCode {
  isError: boolean;
  code: string;
  message: string;
}

export interface Taxes {
  type: string
  abbreviation: string
  lowerLimit: number
  upperLimit?: number
  rate: number
}