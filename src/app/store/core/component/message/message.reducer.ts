import { Action, createReducer, on, State } from '@ngrx/store';
import { setErrorMessage } from './message.actions';
import { ErrorMessageState, initialState } from './message.state';
export const errorMessageFeatureKey = 'errorMessage';

const _errorMessageReducer = createReducer(
  initialState,
  on(setErrorMessage, (state, action): ErrorMessageState => {
    return {
      ...state,
      status: action.status,
    };
  })
);

export function errorMessageReducer(state: ErrorMessageState | undefined, action: Action) {
  return _errorMessageReducer(state, action);
}
