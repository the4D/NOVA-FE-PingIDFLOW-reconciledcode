export interface ApplicantAddress {
  id?: string;
  applicantId?: string;
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
  moveInDate: any | null;
  markForReview: boolean;
}

export const applicantAddressInitialState = (): ApplicantAddress => ({
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
  moveInDate: null,
  markForReview: false,
});
