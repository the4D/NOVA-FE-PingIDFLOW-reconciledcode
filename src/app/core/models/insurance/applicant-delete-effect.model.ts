import { ApplicantFormGroup } from './applicant-formGroup.model';

export interface DeleteApplicantEffect {
  applicantIdentifier: string;
  applicantFormGroups: ApplicantFormGroup[];
}
