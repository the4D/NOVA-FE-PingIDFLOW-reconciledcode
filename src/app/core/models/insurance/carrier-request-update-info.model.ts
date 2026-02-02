export interface CarrierRequestUpdateInfo {
  certificateNumber: string;
  name: string;

  // Banking Details
  institutionNo: string;
  transitNo: string;
  accountNo: string;

  // Member Info
  firstName: string;
  lastName: string;
  phoneType: string;
  phoneNumber: string;
  email: string;
  address: string;
  unitNo: string;
  city: string;
  province: string;
  postalCode: string;

  // Loan ID
  newCertificateNo: string;

  // Coverage Reinstatement
  reinstatementReason: string;
}
