import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../environments/environment';
import { loadingSpinnerFeatureKey, loadingSpinnerReducer, } from './core/component/loading-spinner/loading-spinner.reducer';
import { LoadingSpinnerState } from './core/component/loading-spinner/loading-spinner.state';
import { errorMessageFeatureKey, errorMessageReducer } from './core/component/message/message.reducer';
import { ErrorMessageState } from './core/component/message/message.state';
import { InsuranceApplicationState } from './pages/new-policy/insurance-application/insurance-application.state';
import { insuranceApplicationReducer } from './pages/new-policy/insurance-application/reducers/insurance-application.reducers';
import { GapAnalysisState } from './pages/new-policy/gap-analysis/gap-analysis.state';
import { gapAnalysisReducer } from './pages/new-policy/gap-analysis/reducers/gap-analysis.reducers';

export interface AppState {
  [loadingSpinnerFeatureKey]: LoadingSpinnerState;
  [errorMessageFeatureKey]: ErrorMessageState;
  loanInsurance: InsuranceApplicationState;
  gapAnalysis: GapAnalysisState;
}

export const reducers: ActionReducerMap<AppState> = {
  [loadingSpinnerFeatureKey]: loadingSpinnerReducer,
  [errorMessageFeatureKey]: errorMessageReducer,
  loanInsurance: insuranceApplicationReducer,
  gapAnalysis: gapAnalysisReducer
};

export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];
