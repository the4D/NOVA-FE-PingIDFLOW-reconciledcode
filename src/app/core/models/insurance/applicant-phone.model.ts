export interface ApplicantPhone {
  id?: string;
  applicantId?: string;
  number: string;
  extension: string;
  phoneType: string;
  isPrimary: boolean;
}

export const applicantPhonesInitialState = (): ApplicantPhone => ({
  number: '',
  extension: '',
  phoneType: '',
  isPrimary: false,
});
