import { Coverage } from './coverage.model';
import { HealthQuestion } from './health-question.model';

export interface ApplicantQuote {
  applicationIdentifier: string;
  applicantIdentifier: string;
  fullName: string;
  applicantType: string;
  coverages: Coverage[];
  applicantTotalPremiumWithTaxIncluded: number;
}

export interface MultiApplicantQuote {
  totalPremiumWithTaxIncluded: number;
  quoteList: ApplicantQuote[];
  tabList: IApplicantTab[];
}

export class IApplicantTab {
  title!: string;
  valid!: boolean;
  applicantIdentifier?: string;
  success?: boolean;
  questions!: HealthQuestion[];
}