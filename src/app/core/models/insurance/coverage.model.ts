import { HealthQuestion } from './health-question.model';
import { InsuranceTypeHealthQuestionConfigurationResponse } from './quote-insurance-type.model';

export interface Coverage {
  coverageType: string;
  coveragePercent: number;
  coverageTerm: number;
  coverageAmountEligible: number;
  insuredAmount: number;
  insuredAmountWaived: number;
  premiumAmountEligible: number;
  premiumAmount: number;
  premiumAmountWaived: number;
  premiumTaxAmount: number;
  premiumRate: number;
  returnCode: number;
  returnMessage: string;
}

export interface ApplicantCoverage {
  coverageType: string;
  coverageCode: string;
  healthQuestionAnswers: HealthQuestion[];
  healthQuestionConfigurations: InsuranceTypeHealthQuestionConfigurationResponse[];
}
