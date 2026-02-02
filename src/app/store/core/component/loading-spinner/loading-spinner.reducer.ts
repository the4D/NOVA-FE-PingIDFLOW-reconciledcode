import { setLoadingSpinner } from './loading-spinner.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { initialState, LoadingSpinnerState } from './loading-spinner.state';

export const loadingSpinnerFeatureKey = 'loadingSpinner';

const _loadingSpinnerReducer = createReducer(
  initialState,
  on(setLoadingSpinner, (state, action) => {
    return {
      ...state,
      showLoading: action.status,
    };
  })
);

export function loadingSpinnerReducer(state: LoadingSpinnerState | undefined, action: Action) {
  return _loadingSpinnerReducer(state, action);
}
