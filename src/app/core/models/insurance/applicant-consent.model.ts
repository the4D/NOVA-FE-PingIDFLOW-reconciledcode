export interface ApplicantConsent {
  id?: string;
  applicantId?: string;
  consentType: string;
  hasConsented: boolean;
}
