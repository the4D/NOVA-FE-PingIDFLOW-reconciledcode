export interface ApplicationFormBlob {
  applicationId: string;
  formImage: string;
  formType: number;
  id: string;
  printedBy: string;
  printedOn: string;
  referenceNumber: string;
  signedFormUrl: string | null;
}

export interface FormMetadata {
  formIdentifier: string;
  templateName: string;
  formData: string;
}