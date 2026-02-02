import {
  QuoteInsuranceTypeResponse,
  quoteInsuranceTypeResponseInitialState,
} from '../../../../core/models/insurance/quote-insurance-type.model';
import {
  ApplicantFormGroup,
  applicantFormGroupInitialState,
} from '../../../../core/models/insurance/applicant-formGroup.model';
import { Loan, loanInitialState } from '../../../../core/models/insurance/loan.model';
import {
  ApplicationPADDtoFull,
  applicationPADInitialState,
} from 'src/app/core/models/insurance/application-pad-full.model';
import {
  Application,
  applicationInitialState,
} from 'src/app/core/models/insurance/application.model';

export interface InsuranceApplicationState {
  loading: boolean;
  loan: Loan;
  applicationPadsFull: ApplicationPADDtoFull;
  applicantFormGroup: ApplicantFormGroup[];
  quoteInsuranceTypeResponse: QuoteInsuranceTypeResponse;
}

export const InitialInsuranceApplicationState: InsuranceApplicationState = {
  loading: false,
  loan: loanInitialState(),
  applicationPadsFull: applicationPADInitialState(),
  applicantFormGroup: applicantFormGroupInitialState(),
  quoteInsuranceTypeResponse: quoteInsuranceTypeResponseInitialState(),
};
