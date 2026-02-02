import { Applicant } from './applicant.model';
import { ApplicationPadFull } from './application-pad-full.model';
import { Loan } from './loan.model';

export interface ApplicationFull {
  id: string;
  tenantId: string;
  branchId: string;
  userId: string;
  applicationIdentifier: string;
  applicationSegmentType: number;
  applicationCreditType: number;
  applicationOwnerId: string;
  applicationOpenDate: Date;
  applyDate: Date;
  formSigningCity: string;
  formSigningDate: Date;
  formSigningStatus: number;
  docuSignEnvelopeId: string;
  isThirdPartyCredit: boolean;
  purposeDescription: string;
  paymentSourceId: string;
  channelType: number;
  channelId: string;
  applicationStatus: number;
  applicationStage: number;
  reviewReason: number;
  reviewReasonDescription: string;
  insuranceCarrierType: number;
  isPendingInsuranceRequired: boolean;
  sourceApplicationType: number | string;
  sourceApplicationId: string;
  createdOn: Date;
  applicants?: Applicant[];
  applicationPAD?: ApplicationPadFull;
  loan?: Loan;
}
