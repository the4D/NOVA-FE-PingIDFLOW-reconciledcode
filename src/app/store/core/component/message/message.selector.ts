import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ErrorMessageState } from './message.state';
export const ERROR_MESSAGE_STATE_NAME = 'errorMessage';

export const selectErrorMessageState =
  createFeatureSelector<ErrorMessageState>(ERROR_MESSAGE_STATE_NAME);

export const selectErrorMessage = createSelector(selectErrorMessageState, (state) => {
  return state.status;
});
