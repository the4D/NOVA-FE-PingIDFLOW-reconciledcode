import { ApplicantAddress } from './applicant-address.model';
import { Applicant } from './applicant.model';

export interface ApplicationPad {
  id?: string;
  applicationIdentifier: string;
  applicantIdentifier: string;
  applicantAddressType: string;
  institution: string;
  transitNumber: string;
  accountNumber: string;
  bankNumber: string;
  accountHolder: string;
  applicantAddress?: ApplicantAddress;
}

export interface ApplicationPad2 {
  id: string;
  applicationId: number;
  applicantId: string;
  applicantAddressId: string;
  institutionNumber: string;
  institutionName: string;
  accountNumber: string;
  transitNumber: string;
  withdrawalDay: number;
  applicant: Applicant | null;
  applicantAddress: ApplicantAddress | null;
}

export const applicationPadInitialState2 = (): ApplicationPad2 => ({
  id: '',
  applicationId: 0,
  applicantId: '',
  applicantAddressId: '',
  institutionNumber: '',
  institutionName: '',
  accountNumber: '',
  transitNumber: '',
  withdrawalDay: 0,
  applicant: null,
  applicantAddress: null,
});
