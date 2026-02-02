export interface IApplicationDto {
  application: ApplicationDto;
  loan: Loan;
  applicants: Applicant[];
}

export interface ApplicationDto {
  applicationIdentifier: string;
  applicationSegmentType: string;
  applicationCreditType: string;
  branchId?: null | string;
  applicationOwnerId?: null | string;
  applicationOpenDate: string;
  applyDate?: any;
  formSigningCity?: any;
  formSigningDate?: any;
  formSigningStatus?: any;
  docuSignEnvelopeId?: any;
  isThirdPartyCredit?: any;
  purposeDescription?: any;
  paymentSourceId?: any;
  channelType: string;
  channelId?: any;
  applicationStatus: string;
  applicationStage?: any;
  reviewReason: string;
  reviewReasonDescription?: any;
  statusChangedBy?: null | string;
  statusChangedOn?: null | string;
  insuranceCarrierType: string;
  isPendingInsuranceRequired?: any;
  sourceApplicationType: number | string;
  sourceApplicationId?: any;
}

export interface Loan {
  insuranceType: string;
  loanType: string;
  paymentType: string;
  fundingDate: string;
  firstPaymentDate: string;
  issueDate: string;
  effectiveDate: string;
  loanAmount: number;
  paymentAmount: number;
  insuredAmount: number;
  monthlyPaymentAmount: number;
  monthlyInsuredAmount: number;
  frequency: string;
  interestRate: number;
  loanTerm: number;
  amortization: number;
}

export interface Applicant {
  applicantIdentifier: string;
  applicantType: string;
  firstName: string;
  middleName: string;
  lastName: string;
  placeOfBirth: string;
  birthDate: string;
  gender: string;
  isSmoker: boolean;
  language: string;
  selfEmployed: boolean;
  workHours: number;
  occupation: string;
  applicationSignedDate: string;
  applicantAddresses: ApplicantAddress[];
  applicantPhones: ApplicantPhone[];
  applicantEmails: ApplicantEmail[];
  applicantConsents: ApplicantConsent[];
}

export interface ApplicantAddress {
  streetNumber: string;
  unitNumber: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  addressType: string;
  addressStructureType: string;
  status: string;
  isPrimary: boolean;
  markForReview: boolean;
}

export interface ApplicantPhone {
  number: string;
  extension: string;
  phoneType: string;
  isPrimary: boolean;
}

export interface ApplicantEmail {
  emailAddress: string;
  emailType: string;
  isPrimary: boolean;
}

export interface ApplicantConsent {
  consentType: string;
  hasConsented: boolean;
}

export interface IApplicationResponseDto {
  applicationId: string;
  errors: Record<string, string[]>;
}
