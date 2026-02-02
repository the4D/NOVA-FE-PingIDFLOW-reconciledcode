export interface ApplicationForm {
  id: string;
  applicationId: string;
  formId: string;
  formImage: string;
}
export interface ApplicationForms {
  applicationId: number;
  formType: string;
  formSigningDate: string;
  fileNumberCancelled: string | null;
}
export interface FormMetadata1 {
  loanIdentifier: string;
  applicationForms: ApplicationForms[];
}
