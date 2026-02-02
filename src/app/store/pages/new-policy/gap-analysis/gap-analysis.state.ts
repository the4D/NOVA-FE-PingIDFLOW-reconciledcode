import { AssetLiability, Coverages, Expenses, GapAnalysisBlob, Income, assetLiabilityInitialState, coverageInitialState, expenseInitialState, incomeInitialState, initialValueBlob } from "src/app/core/models/gap-analysis/gap-analysis.model";

export interface GapAnalysisState {
  loading: boolean;
  income: Income;
  assetLiability: AssetLiability;
  expenses: Expenses;
  coverage: Coverages;
  gapAnalysisBlob: GapAnalysisBlob;
};

export const InitialGapAnalysisState: GapAnalysisState = {
  loading: false,
  income: incomeInitialState(),
  assetLiability: assetLiabilityInitialState(),
  expenses: expenseInitialState(),
  coverage: coverageInitialState(),
  gapAnalysisBlob: initialValueBlob()
};

