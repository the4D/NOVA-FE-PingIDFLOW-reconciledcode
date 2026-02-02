import { ApplicantAddress } from './applicant-address.model';
import { ApplicantConsent } from './applicant-consent.model';
import { ApplicantEmail } from './applicant-email.model';
import { ApplicantPhone } from './applicant-phone.model';
import { Applicant } from './applicant.model';
import { Coverage } from './coverage.model';

export interface ApplicantFormGroup {
  personalInfoForm?: Applicant | undefined;
  emailForm?: ApplicantEmail | undefined;
  homePhoneForm?: ApplicantPhone | undefined;
  workPhoneForm?: ApplicantPhone | undefined;
  addressForm?: ApplicantAddress | undefined;
  consentForm?: ApplicantConsent | undefined;
  coverageForm?: Coverage[] | undefined;
  applicantSequence?: number;
}

export const applicantFormGroupInitialState = (): ApplicantFormGroup[] => [];
