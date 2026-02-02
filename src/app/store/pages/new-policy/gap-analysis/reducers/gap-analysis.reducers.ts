import { createReducer, on } from '@ngrx/store';
import { InitialGapAnalysisState } from '../gap-analysis.state';
import { initializeGapAnalysisApplication, setAssetLiabilityToGapAnalysis, setCoveragesToGapAnalysis, setExpensesToGapAnalysis, setGapAnalysisBlobToGapAnalysis, setIncomeToGapAnalysis } from '../actions/gap-analysis.actions';

export const gapAnalysisReducer = createReducer(
  InitialGapAnalysisState,
  on(initializeGapAnalysisApplication, (state) => {
    return {
      ...state,
      income: InitialGapAnalysisState.income,
      assetLiability: InitialGapAnalysisState.assetLiability
    };
  }),
  on(setIncomeToGapAnalysis, (state, action) => {
    return {
      ...state,
      income: {
        ...action.income
      },
    };
  }),
  on(setAssetLiabilityToGapAnalysis, (state, action) => {
    return {
      ...state,
      assetLiability: {
        ...action.assetLiability
      },
    };
  }),
  on(setExpensesToGapAnalysis, (state, action) => {
    return {
      ...state,
      expenses: {
        ...action.expenses
      },
    };
  }),
  on(setCoveragesToGapAnalysis, (state, action) => {
    return {
      ...state,
      coverage: {
        ...action.coverages
      },
    };
  }),
  on(setGapAnalysisBlobToGapAnalysis, (state, action) => {
    return {
      ...state,
      gapAnalysisBlob: {
        ...action.gapAnalysisBlob,
        resultsDisabilityExistingCoverageInt: Number(action.gapAnalysisBlob.resultsDisabilityExistingCoverage),
        resultsDisabilityMonthlyIncomeGapInt: Number(action.gapAnalysisBlob.resultsDisabilityMonthlyIncomeGap) > 0 ? Number(action.gapAnalysisBlob.resultsDisabilityMonthlyIncomeGap) : 0,
        resultsCalculatedUnprotectedCoveragesInt: Number(action.gapAnalysisBlob.resultsCalculatedUnprotectedCoverages)
      },
    };
  })
);
