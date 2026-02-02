export interface ApplicantEmail {
  id?: string;
  applicantId?: string;
  emailAddress: string;
  isPrimary: boolean;
  emailType: string;
}

export const applicantEmailsInitialState2 = (): ApplicantEmail => ({
  emailAddress: '',
  isPrimary: false,
  emailType: '',
});
