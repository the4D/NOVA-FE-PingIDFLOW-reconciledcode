import { Branch } from '../tenant/branch.model';
import { Tenant } from '../tenant/tenant.model';
import { User2 } from '../tenant/user.model';
import { ApplicantFormGroup } from './applicant-formGroup.model';
import { Applicant } from './applicant.model';
import { Application, ApplicationRequest } from './application.model';
import { QuoteInsuranceTypeResponse } from './quote-insurance-type.model';

export interface Loan {
  id?: string;
  carrierId?: string;
  tenantId?: string;
  branchId: string;
  userId: string;
  loanIdentifier: string;
  loanType: string;
  sourceType: string;
  insuranceType: string;
  paymentType: string;
  channelType?: string;
  fundingDate: string;
  firstPaymentDate: string;
  issueDate: string;
  effectiveDate: string;
  loanAmount: number;
  paymentAmount: number;
  monthlyPaymentAmount: number;
  paymentFrequency: string;
  interestRate: number;
  loanTerm: number;
  loanCoverageLimit?: number;
  paymentCoverageLimit?: number;
  segmentType?: any;
  creditType?: any;
  applications?: Application[];
  tenant?: Tenant;
  branch?: Branch;
  user?: User2;
  amortization: number;
}

export const loanInitialState = (): Loan => ({
  branchId: '',
  userId: '',
  loanIdentifier: '',
  loanType: '',
  sourceType: '',
  insuranceType: '',
  paymentType: '',
  channelType: '',
  fundingDate: '',
  firstPaymentDate: '',
  issueDate: '',
  effectiveDate: '',
  loanAmount: 0,
  paymentAmount: 0,
  monthlyPaymentAmount: 0,
  paymentFrequency: '',
  interestRate: 0,
  loanTerm: 0,
  creditType: '',
  amortization: 0,
});

export interface LoanRequest {
  loan: LoanReq;
  applications: ApplicationRequest[];
}
interface LoanReq {
  loanIdentifier?: string;
  branchId: string;
  userId: string;
  sourceType: string;
  loanType: string;
  insuranceType?: string;
  paymentType: string;
  channelType?: string;
  fundingDate: Date | string;
  firstPaymentDate: Date | string;
  issueDate: Date | string;
  effectiveDate: Date | string;
  loanAmount: number;
  paymentAmount: number;
  monthlyPaymentAmount: number;
  paymentFrequency: string;
  interestRate: number;
  loanTerm: number;
  amortization: number;
}

export interface FullLoan {
  loan: Loan;
  applicantFormGroup: ApplicantFormGroup[];
  validations: any[];
}

export interface UpsertResponse {
  loanIdentifier: string;
  quote: QuoteInsuranceTypeResponse;
  validations: [];
  errors: Record<string, string[]>;
}
