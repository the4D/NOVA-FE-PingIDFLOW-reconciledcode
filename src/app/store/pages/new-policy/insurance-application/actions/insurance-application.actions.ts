import { createAction, props } from '@ngrx/store';
import { Loan, LoanRequest } from '@core/models/insurance/loan.model';
import {
  QuoteInsuranceTypeRequest,
  QuoteInsuranceTypeResponse,
} from '@core/models/insurance/quote-insurance-type.model';
import { RegroupQuoteApplication } from '@core/models/insurance/regroup-applicant.model';
import {
  GET_LOAN_INSURANCE_APPLICATION,
  INITIALIZE_INSURANCE_APPLICATION,
  QUOTE_INSURANCE_TYPE_APPLICATION,
  REGROUPING_APPLICANTS_APPLICATION,
  SET_INSURANCE_TYPE_RESPONSE,
  SET_LOAN_APPLICATION_LOADED,
  SET_LOAN_INSURANCE_APPLICATION,
  UPSERT_LOAN_INSURANCE_APPLICATION,
  GET_FULL_RESPONSE_TYPE_APPLICATION,
  APPLICATION_FULL_PAD,
  SET_INSURANCE_APPLICATION_PAD,
  SET_INSURANCE_APPLICATION_STATUS,
  UPDATE_APPLICATION_STATUS,
  COMMIT_INSURANCE_APPLICATION,
  SET_INSURANCE_APPLICATION_COMMIT_RESPONSE,
  GENERATE_PAPER_WORK,
  SET_PAPER_WORK_RESPONSE,
  SET_APPLICATION_LOADING,
  UPDATE_LOAN_USER_BRANCH,
  QUOTE_INSURANCE_TYPE_QUICK_QUOTE,
  SET_INSURANCE_TYPE_QUICK_QUOTE_RESPONSE,
  SET_APPLICATION_ID_EMPTY,
  DELETE_APPLICANT_FORM_GROUP,
  SET_DELETE_APPLICANT_FORM_GROUP,
} from './insurance-application.actions.enums';
import { ApplicationPADDtoFull } from '@core/models/insurance/application-pad-full.model';
import { SubmissionResponse } from '@core/models/insurance/underwrite.model';
import { FormMetadata1 } from '@core/models/insurance/application-form.model';
import { ApplicationFormBlob } from '@core/models/insurance/application-form-blob.model';
import { ApplicantFormGroup } from '@core/models/insurance/applicant-formGroup.model';
import { DeleteApplicantEffect } from '@core/models/insurance/applicant-delete-effect.model';

export const initializeInsuranceApplication = createAction(INITIALIZE_INSURANCE_APPLICATION);

// Actions to load Objects
export const loadExistingLoanApplication = createAction(
  GET_LOAN_INSURANCE_APPLICATION,
  props<{ loanIdentifier: string }>()
);

export const upsertLoanApplication = createAction(UPSERT_LOAN_INSURANCE_APPLICATION, props<{ request: LoanRequest }>());

export const quoteInsuranceTypeApplication = createAction(
  QUOTE_INSURANCE_TYPE_APPLICATION,
  props<{ request: QuoteInsuranceTypeRequest }>()
);

export const regroupingApplicants = createAction(
  REGROUPING_APPLICANTS_APPLICATION,
  props<{ request: RegroupQuoteApplication }>()
);

export const getFullResponseTypeApplication = createAction(
  GET_FULL_RESPONSE_TYPE_APPLICATION,
  props<{ loanIdentifier: string }>()
);

export const applicationFullPad = createAction(APPLICATION_FULL_PAD, props<{ request: ApplicationPADDtoFull }>());

export const applicationStatus = createAction(UPDATE_APPLICATION_STATUS, props<{ loanIdentifier: string }>());

export const commitInsuranceApplication = createAction(
  COMMIT_INSURANCE_APPLICATION,
  props<{ loanIdentifier: string }>()
);

export const generatePaperWork = createAction(GENERATE_PAPER_WORK, props<{ searchOptions: FormMetadata1 }>());

// Actions to set Objects
export const setLoanToInsuranceApplication = createAction(SET_LOAN_INSURANCE_APPLICATION, props<{ loan: Loan }>());

export const setLoanApplicationLoaded = createAction(SET_LOAN_APPLICATION_LOADED, props<{ response: any }>());

export const setInsuranceTypeResponse = createAction(
  SET_INSURANCE_TYPE_RESPONSE,
  props<{ response: QuoteInsuranceTypeResponse }>()
);

export const setInsuranceApplicationPad = createAction(
  SET_INSURANCE_APPLICATION_PAD,
  props<{ object: ApplicationPADDtoFull }>()
);

export const updateInsuranceApplicationStatus = createAction(
  SET_INSURANCE_APPLICATION_STATUS,
  props<{ applicationId?: number; formSigningDate?: any; requestFrom: string; response?: string }>()
);

export const setInsuranceApplicationSubmitResponse = createAction(
  SET_INSURANCE_APPLICATION_COMMIT_RESPONSE,
  props<{ response: SubmissionResponse }>()
);

export const setPaperWork = createAction(SET_PAPER_WORK_RESPONSE, props<{ response: ApplicationFormBlob[] }>());

export const setApplicationLoading = createAction(SET_APPLICATION_LOADING, props<{ status: boolean }>());

export const updateLoanUserBranch = createAction(UPDATE_LOAN_USER_BRANCH, props<{ loan: Loan }>());

export const quoteInsuranceTypeQuickQuote = createAction(
  QUOTE_INSURANCE_TYPE_QUICK_QUOTE,
  props<{ request: QuoteInsuranceTypeRequest }>()
);

export const setInsuranceTypeQuickQuoteResponse = createAction(
  SET_INSURANCE_TYPE_QUICK_QUOTE_RESPONSE,
  props<{ response: QuoteInsuranceTypeResponse }>()
);

export const setApplicationIdentifierEmpty = createAction(SET_APPLICATION_ID_EMPTY);

export const deleteFormGroupMember = createAction(
  DELETE_APPLICANT_FORM_GROUP,
  props<{ object: DeleteApplicantEffect }>()
);
export const setApplicantFormGroupDeleted = createAction(SET_DELETE_APPLICANT_FORM_GROUP, props<{ response: any }>());
