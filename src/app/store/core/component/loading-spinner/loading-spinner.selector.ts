import { LoadingSpinnerState } from './loading-spinner.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';

export const LOADING_SPINNER_STATE_NAME = 'loadingSpinner';

const getLoadingSpinnerState = createFeatureSelector<LoadingSpinnerState>(
  LOADING_SPINNER_STATE_NAME
);

export const getLoading = createSelector(getLoadingSpinnerState, (state) => {
  return state?.showLoading;
});
