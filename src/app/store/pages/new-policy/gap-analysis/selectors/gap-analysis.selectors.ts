import { createSelector } from "@ngrx/store";

import { AppState } from "src/app/store";
import { GapAnalysisState } from "../gap-analysis.state";

export const selectGapAnalysisApplication = (state: AppState) => state.gapAnalysis;

export const loadingInformationSelector = createSelector(
  selectGapAnalysisApplication,
  (state: GapAnalysisState) => state.loading
)

export const gapAnalysisIncomeSelector = createSelector(
  selectGapAnalysisApplication,
  (state: GapAnalysisState) => state.income
);
export const gapAnalysisAssetLiabilitySelector = createSelector(
  selectGapAnalysisApplication,
  (state: GapAnalysisState) => state.assetLiability
);
export const gapAnalysisExpenseSelector = createSelector(
  selectGapAnalysisApplication,
  (state: GapAnalysisState) => state.expenses
);
export const gapAnalysisCoverageSelector = createSelector(
  selectGapAnalysisApplication,
  (state: GapAnalysisState) => state.coverage
);
export const gapAnalysisBlobSelector = createSelector(
  selectGapAnalysisApplication,
  (state: GapAnalysisState) => state.gapAnalysisBlob
);
