import { createAction, props } from '@ngrx/store';

import {
  INITIALIZE_GAPANALYSIS_APPLICATION,
  SET_ASSETLIABILITY_GAPANALYSIS_APPLICATION,
  SET_BLOB_TO_APPLICATION,
  SET_COVERAGES_TO_APPLICATION,
  SET_EXPENSES_TO_APPLICATION,
  SET_INCOME_GAPANALYSIS_APPLICATION
} from './gap-analysis.actions.enums';

import { AssetLiability, Coverages, Expenses, GapAnalysisBlob, Income } from 'src/app/core/models/gap-analysis/gap-analysis.model';

export const initializeGapAnalysisApplication = createAction(INITIALIZE_GAPANALYSIS_APPLICATION);

// Actions to set Object income to state
export const setIncomeToGapAnalysis = createAction(
  SET_INCOME_GAPANALYSIS_APPLICATION,
  props<{ income: Income }>()
);

// Actions to set Object Asset & Liabilities to the state 
export const setAssetLiabilityToGapAnalysis = createAction(
  SET_ASSETLIABILITY_GAPANALYSIS_APPLICATION,
  props<{ assetLiability: AssetLiability }>()
);

// Actions to set Object Expense to the state 
export const setExpensesToGapAnalysis = createAction(
  SET_EXPENSES_TO_APPLICATION,
  props<{ expenses: Expenses }>()
);

// Actions to set Object Coverages to the state 
export const setCoveragesToGapAnalysis = createAction(
  SET_COVERAGES_TO_APPLICATION,
  props<{ coverages: Coverages }>()
);

// Actions to set Object Coverages to the state 
export const setGapAnalysisBlobToGapAnalysis = createAction(
  SET_BLOB_TO_APPLICATION,
  props<{ gapAnalysisBlob: GapAnalysisBlob }>()
);


