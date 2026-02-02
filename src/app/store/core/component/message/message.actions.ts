import { createAction, props } from '@ngrx/store';
export const SET_ERROR_ACTION = '[SHOW ERROR MESSAGE] SHOW ERROR MESSAGE';

export const setErrorMessage = createAction(SET_ERROR_ACTION, props<{ status: boolean }>());
