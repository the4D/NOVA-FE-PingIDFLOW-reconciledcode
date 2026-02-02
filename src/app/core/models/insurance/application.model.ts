import { Link } from '../system/link.model';
import { ApplicantFormGroup } from './applicant-formGroup.model';
import { Applicant } from './applicant.model';
import { ApplicationPAD, applicationPADInitialState2 } from './application-pad-full.model';
import { InsuranceTypeCoverageResponse, QuoteInsuranceTypeRequest } from './quote-insurance-type.model';
import { ValidationErrorRes } from './underwrite.model';

export interface Application {
  id?: number;
  loanId: string;
  applicationStatus: string;
  loanAmountEligible: number;
  loanPaymentAmountEligible: number;
  loanAmountCovered: number;
  loanAmountWaived: number;
  loanPaymentAmountCovered: number;
  loanPaymentAmountWaived: number;
  amortization: number;
  numberOfPayments: number;
  applyDate: any;
  formSigningDate: any;
  formSigningCity: any;
  formSigningStatus: any;
  docuSignEnvelopeId: any;
  fileNumber: any;
  fileNumberCancelled: any;
  sourceApplicationId: any;
  statusChangedBy: string;
  statusChangedOn: string;
  applicants: Applicant[];
  applicationPAD: ApplicationPAD;
  applicationForms: ApplicantFormGroup[];
  coverages?: InsuranceTypeCoverageResponse[];
  validations?: ValidationErrorRes[];
}

export interface DraftApplication {
  loanIdentifier: string;
}

export interface ApplicationsByCriteria {
  value: PaginatedApplication[];
  links: Link[];
  recordCount: number;
}

export interface ApplicationRequest {
  id?: number;
  amortization?: number;
  applicants: Applicant[];
  // validations?: ValidationErrorRes[]; // do we need validations here ?? revisit -- Vinitha
}

export interface PaginatedApplication {
  id: string;
  loanIdentifier: string;
  applicationStatus?: number;
  applicationStatusEW?: string;
  applicationStatusExcel?: string;
  applicants?: ApplicantsByCriteriaDto[];
  loanType?: number;
  loanAmount?: number;
  paymentAmount?: number;
  createdOn?: Date;
  sourceType?: number | string;
  loanId?: string;
  uWResponseCode?: string;
  creditUnion?: string;
  insuranceType?: number;
  insuranceTypeStr?: string;
  branchID?: string;
  carrierId?: string;
  createdBy?: string;
}

export interface ApplicationResourceParams {
  id?: string | undefined;
  loanIdentifier?: string | undefined;
  applicationStatus?: string | undefined;
  applicants?: ApplicantsByCriteriaDto[];
  loanType?: string | undefined;
  loanAmount?: string | undefined;
  paymentAmount?: string | undefined;
  createdOn?: string | undefined;
  fields?: string | undefined;
  orderBy?: string | undefined;
  pageSize?: number | undefined;
  pageNumber?: number | undefined;
  sourceType?: number | string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
}

export interface ApplicantsByCriteriaDto {
  applicantSequence: number;
  applicantIdentifier: string;
  applicantType: number;
  name: string;
}

export interface ApplicationsSummaryByStatus {
  applicationStatus?: number;
  applicationCount?: number;
}

export interface ApplicationEvent {
  pass: boolean;
  quoteRequest?: QuoteInsuranceTypeRequest;
}

export interface SubmitApplicationDto {
  applicationIdentifier: string;
  formSigningDate: string;
  fileNumberCancelled?: string;
}

export const applicationInitialState = (): Application => ({
  id: 0,
  loanId: '',
  applicationStatus: 'Draft',
  loanAmountEligible: 0,
  loanPaymentAmountEligible: 0,
  loanAmountCovered: 0,
  loanAmountWaived: 0,
  loanPaymentAmountCovered: 0,
  loanPaymentAmountWaived: 0,
  amortization: 0,
  numberOfPayments: 0,
  applyDate: null,
  formSigningDate: null,
  formSigningCity: null,
  formSigningStatus: null,
  docuSignEnvelopeId: null,
  fileNumber: null,
  fileNumberCancelled: null,
  sourceApplicationId: null,
  statusChangedBy: '',
  statusChangedOn: '',
  applicants: [],
  applicationPAD: applicationPADInitialState2(),
  applicationForms: [],
});
