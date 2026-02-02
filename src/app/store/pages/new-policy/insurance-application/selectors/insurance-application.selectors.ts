import { createSelector } from "@ngrx/store";
import { InsuranceApplicationState } from "../insurance-application.state";
import { AppState } from "src/app/store";

export const selectInsuranceApplication = (state: AppState) => state.loanInsurance;

export const loadingInformationSelector = createSelector(
  selectInsuranceApplication,
  (state: InsuranceApplicationState) => state.loading
)

export const insuranceApplicationSelector = createSelector(
  selectInsuranceApplication,
  (state: InsuranceApplicationState) => state
);

export const insuranceApplicationLoanSelector = createSelector(
  selectInsuranceApplication,
  (state: InsuranceApplicationState) => state.loan
);

export const insuranceApplicationApplicantFormGroupSelector = createSelector(
  selectInsuranceApplication,
  (state: InsuranceApplicationState) => state.applicantFormGroup
);

export const quoteInsuranceTypeResponseSelector = createSelector(
  selectInsuranceApplication,
  (state: InsuranceApplicationState) => state.quoteInsuranceTypeResponse
)

export const insuranceApplicationPADSelector = createSelector(
  selectInsuranceApplication,
  (state: InsuranceApplicationState) => state.applicationPadsFull
)