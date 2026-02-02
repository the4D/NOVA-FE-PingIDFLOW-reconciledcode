import { ApplicantAddress } from './applicant-address.model';
import { ApplicantConsent } from './applicant-consent.model';
import { ApplicantEmail } from './applicant-email.model';
import { ApplicantPhone } from './applicant-phone.model';
import { ApplicantCoverage, Coverage } from './coverage.model';

export interface Applicant {
  id?: string;
  applicationId?: number;
  applicantSequence?: number;
  applicantIdentifier?: string;
  applicantType: string;
  firstName: string;
  middleName: any;
  lastName: string;
  placeOfBirth: string;
  birthDate: string;
  gender: string;
  isSmoker: boolean;
  language: string;
  selfEmployed: boolean;
  workHours: number;
  occupation: string;
  applicationSignedDate?: any;
  beneficiaryName?: any;
  beneficiaryRelationship?: any;
  beneficiaryBirthDate?: any;
  applicantAddresses: ApplicantAddress[];
  applicantPhones: ApplicantPhone[];
  applicantEmails: ApplicantEmail[];
  applicantConsents: ApplicantConsent[];
  coverages?: Coverage[];
  applicantCoverages?: ApplicantCoverage[];
}

export const applicantInitialState = (): Applicant => ({
  applicantType: '',
  firstName: '',
  middleName: '',
  lastName: '',
  placeOfBirth: '',
  birthDate: '',
  gender: '',
  isSmoker: false,
  language: '',
  selfEmployed: false,
  workHours: 0,
  occupation: '',
  applicationSignedDate: '',
  applicantAddresses: [],
  applicantPhones: [],
  applicantEmails: [],
  applicantConsents: [],
  // coverages?: Coverage[];
  // applicantCoverages?: ApplicantCoverage[];
});



// Interface for address
export interface ApplicantAddressForSearch {
  id: string;
  applicantId: string;
  streetNumber: string | null;
  unitNumber: string | null;
  street: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
  addressType: number;
  addressStructureType: number;
  addressStatus: number;
  isPrimary: boolean;
  moveInDate: string | null;
  markForReview: boolean;
}

// Interface for applicant result
export interface ApplicantResult {
  id: string;
  name?: string | '';
  formattedBirthDate:string | '';
  firstName: string;
  middleName: string | null;
  lastName: string;
  birthDate: string;
  applicantIdentifier: string;
  applicantAddresses: ApplicantAddressForSearch[];
  applicationId: number;
  applicantType: number;
}
