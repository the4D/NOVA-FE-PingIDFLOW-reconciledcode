export interface RegroupQuoteApplication {
  loanIdentifier: string;
  applicants: ApplicantGroup[];
}

export interface ApplicantGroup {
  applicationId: number;
  applicantIdentifier: string;
  applicantType: string;
}
