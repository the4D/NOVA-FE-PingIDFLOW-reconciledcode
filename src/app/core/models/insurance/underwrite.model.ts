import { Application } from './application.model';

export interface UnderwriteResponse {
  fileNumber: string;
  returnCode: number;
  errorMessage: string;
  validationErrors: ValidationError[];
}

export interface ValidationError {
  type: string;
  field: string;
  description: string;
}

export interface Underwrite {
  applicationIdentifier: string;
  formSigningDate: string;
  fileNumber: string;
  applicationStatus: string;
}
export interface SubmissionRequest {
  loanIdentifier: string;
  applyDate: string;
}
export interface SubmissionResponse {
  returnCode: number;
  errorMessage: string;
  applications?: Application[];
  validations?: ValidationErrorRes[];
}

export interface ValidationErrorRes {
  attemptedValue: string;
  customState: string;
  errorCode: string;
  errorMessage: string;
  formattedMessagePlaceholderValues: string;
  propertyName: string;
  severity: string;
}
