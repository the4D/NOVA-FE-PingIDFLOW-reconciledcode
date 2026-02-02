export interface ApplicationPadFull {
  applicationIdentifier: string;
  applicantIdentifier: string;
  institutionNumber: string;
  institutionName: string;
  accountNumber: string;
  transitNumber: string;
  withdrawalDay: number;
  applicantAddress: ApplicantPadAddress;
}

interface ApplicantPadAddress {
  streetNumber: null | string;
  unitNumber: null | string;
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

export const applicationPadInitialState = (): ApplicationPadFull => ({
  applicationIdentifier: '',
  applicantIdentifier: '',
  institutionNumber: '',
  institutionName: '',
  accountNumber: '',
  transitNumber: '',
  withdrawalDay: 0,
  applicantAddress: {
    streetNumber: null,
    unitNumber: null,
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    addressType: '',
    addressStructureType: '',
    status: '',
    isPrimary: false,
    markForReview: false,
  },
});

export interface ApplicationPADResponse {
  loanIdentifier: string;
  applicationPADs: ApplicationPADsResponse[];
}

export interface ApplicationPADsResponse {
  applicationId: number;
  applicationPADId: string;
  validations: [];
}

export interface ApplicationPADDtoFull {
  loanIdentifier: string;
  applicationPADs: ApplicationPADs[];
}

export interface ApplicationPADs {
  applicationId: number;
  applicationPAD: ApplicationPAD;
}

export interface ApplicationPAD {
  applicantIdentifier: string;
  applicantAddressType?: string;
  institutionNumber: string;
  institutionName: string;
  accountNumber: string;
  transitNumber: string;
  withdrawalDay: number;
  applicationId?: number;
  applicantAddress: ApplicantPADAddress;
}

export const applicationPADInitialState2 = (): ApplicationPAD => ({
  applicantIdentifier: '',
  institutionNumber: '',
  institutionName: '',
  accountNumber: '',
  transitNumber: '',
  withdrawalDay: 0,
  applicationId: 0,
  applicantAddress: applicantPADAddressInitialState(),
});

export interface ApplicantPADAddress {
  streetNumber: string;
  unitNumber: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  addressType: string;
  addressStructureType: string;
  addressStatus: string;
  isPrimary: boolean;
  moveInDate?: string;
  markForReview: boolean;
}

export const applicantPADAddressInitialState = (): ApplicantPADAddress => ({
  streetNumber: '',
  unitNumber: '',
  street: '',
  city: '',
  province: '',
  postalCode: '',
  country: '',
  addressType: '',
  addressStructureType: '',
  addressStatus: '',
  isPrimary: false,
  markForReview: false,
});

export const applicationPADInitialState = (): ApplicationPADDtoFull => ({
  loanIdentifier: '',
  applicationPADs: [],
});
