import { ApplicantAddress } from './applicant-address.model';
import { ApplicantConsent } from './applicant-consent.model';
import { ApplicantEmail } from './applicant-email.model';
import { ApplicantPhone } from './applicant-phone.model';
import { Application } from './application.model';
import { InsuranceType } from './carrier-loan-type.model';
import { Coverage } from './coverage.model';

export interface QuoteInsuranceTypeRequest {
  loanId: string;
  loanType: string | number;
  insuranceType: string;
  paymentType: string;
  fundingDate: string;
  firstPaymentDate: string;
  loanAmount: number;
  paymentAmount: number;
  monthlyPaymentAmount: number;
  paymentFrequency: string;
  interestRate: number;
  loanTerm: number;
  amortization: number;
  applications: InsuranceTypeApplicationRequest[];
  branchId?: string;
  lenderId?: string;
}

export interface InsuranceTypeApplicationRequest {
  id: number;
  loanAmountCovered: number;
  loanPaymentAmountCovered: number;
  amortization: number;
  applicants: InsuranceTypeApplicantRequest[];
}

export interface InsuranceTypeLoanRequest {
  applicationId: string;
  insuranceType: string;
  loanType: string;
  paymentType: string;
  fundingDate: string;
  firstPaymentDate: string;
  loanAmount: number;
  paymentAmount: number;
  insuredAmount: number;
  monthlyPaymentAmount: number;
  monthlyInsuredAmount: number;
  frequency: string;
  interestRate: number;
  loanTerm: number;
  amortization: number;
  insuranceTypeList?: InsuranceType[];
}

export interface InsuranceTypeApplicantRequest {
  applicantSequence?: number;
  applicantIdentifier?: string;
  firstName?: string;
  lastName?: string;
  applicantType: string;
  birthDate: string;
  isSmoker: boolean;
  selfEmployed: boolean;
  workHours: number;
  province: string;
  coverages: InsuranceTypeCoverageRequest[];
  gender: string;
  applicantEmails: ApplicantEmail[];
  applicantPhones: ApplicantPhone[];
  applicantAddresses: ApplicantAddress[];
  applicantConsents: ApplicantConsent[];
}

export interface InsuranceTypeCoverageRequest {
  coverageType: string;
  coverageCode: string;
  coveragePercent: number;
  insuredAmount?: number;
  healthQuestionAnswers: InsuranceTypeHealthQuestionRequest[];
}

export interface InsuranceTypeHealthQuestionRequest {
  healthQuestionIdentifier: string;
  answer: string;
}

export interface QuoteInsuranceTypeResponse {
  applications: Application[];
  loanId: string;
  insuranceType: string;
  loanCoverageLimit: number;
  paymentCoverageLimit: number;
  healthQuestions: InsuranceTypeHealthQuestionResponse[];
}

export interface InsuranceTypeLoanResponse {
  insuranceType: string;
  insuredAmount: number;
  monthlyInsuredAmount: number;
  amortization: number;
}

export interface InsuranceTypeHealthQuestionResponse {
  healthQuestionIdentifier: string;
  question: string;
  sequence: number;
}

export interface InsuranceTypeCoverageResponse {
  coverageType: string;
  coverageCode: string;
  coveragePercent: number;
  insuredAmount: number;
  premiumAmount: number;
  premiumTaxAmount: number;
  nemAmount: number;
  premiumRate: number;
  premiumTaxRate: number;
  costOfInsurancePerDay: number;
  costOfInsurancePerPayment: number;
  isOptionalCoverage: boolean;
  returnCode: number;
  returnMessage: string;
}

export interface InsuranceTypeApplicantResponse {
  applicantType: string;
  firstName: string;
  middleName: string;
  lastName: string;
  applicantCoverages: InsuranceTypeApplicantCoverageResponse[];
}

export interface InsuranceTypeApplicantCoverageResponse {
  coverageCode: number;
  coverageType: string;
  healthQuestionAnswers: InsuranceTypeHealthQuestionRequest[];
  healthQuestionConfigurations: InsuranceTypeHealthQuestionConfigurationResponse[];
}

export interface InsuranceTypeHealthQuestionConfigurationResponse {
  healthQuestionIdentifier: string;
  autoWaive: boolean;
}

export const quoteInsuranceTypeRequestInitialState = (): QuoteInsuranceTypeRequest => ({
  loanId: '',
  loanType: '',
  insuranceType: '',
  paymentType: '',
  fundingDate: '',
  firstPaymentDate: '',
  loanAmount: 0,
  paymentAmount: 0,
  monthlyPaymentAmount: 0,
  paymentFrequency: '',
  interestRate: 0,
  loanTerm: 0,
  amortization: 0,
  applications: [],
});

export const quoteInsuranceTypeResponseInitialState = (): QuoteInsuranceTypeResponse => ({
  applications: [],
  loanId: '',
  insuranceType: '',
  loanCoverageLimit: 0,
  paymentCoverageLimit: 0,
  healthQuestions: [],
});

export const insuranceTypeCoveragesInitialState = (
  coverages: Coverage[] | undefined
): InsuranceTypeCoverageRequest[] => {
  let coveragesToOffer: InsuranceTypeCoverageRequest[] = [];

  coverages?.map((cover) => {
    switch (cover.coverageType) {
      case 'LIFE':
        coveragesToOffer.push({
          coverageType: 'LIFE',
          coverageCode: '100',
          coveragePercent: 100.0,
          healthQuestionAnswers: [],
        });
        break;
      case 'DIS':
        coveragesToOffer.push({
          coverageType: 'DIS',
          coverageCode: '200',
          coveragePercent: 100.0,
          healthQuestionAnswers: [],
        });
        break;
      case 'ADB':
        coveragesToOffer.push({
          coverageType: 'ADB',
          coverageCode: '300',
          coveragePercent: 100.0,
          healthQuestionAnswers: [],
        });
        break;
      case 'CI':
        coveragesToOffer.push({
          coverageType: 'CI',
          coverageCode: '400',
          coveragePercent: 100.0,
          healthQuestionAnswers: [],
        });
        break;
      case 'IUI':
        coveragesToOffer.push({
          coverageType: 'IUI',
          coverageCode: '500',
          coveragePercent: 100.0,
          healthQuestionAnswers: [],
        });
        break;

      default:
        break;
    }
  });

  return coveragesToOffer;
};

export interface FullQuoteApplication {
  applicationResponse: QuoteInsuranceTypeResponse;
  insuranceTypeRequest: QuoteInsuranceTypeRequest;
}

export const applicantCoveragesQQ = (): InsuranceTypeCoverageRequest[] => [
  {
    coverageType: 'LIFE',
    coverageCode: '100',
    coveragePercent: 100,
    healthQuestionAnswers: [],
  },
  {
    coverageType: 'DIS',
    coverageCode: '200',
    coveragePercent: 100,
    healthQuestionAnswers: [],
  },
  {
    coverageType: 'CI',
    coverageCode: '400',
    coveragePercent: 100,
    healthQuestionAnswers: [],
  },
  {
    coverageType: 'IUI',
    coverageCode: '500',
    coveragePercent: 100,
    healthQuestionAnswers: [],
  },
];
