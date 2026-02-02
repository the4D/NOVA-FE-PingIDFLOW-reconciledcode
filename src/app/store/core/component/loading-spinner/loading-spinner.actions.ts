import { createAction, props } from '@ngrx/store';
export const SET_LOADING_ACTION = '[LOADING SPINNER] SET LOADING SPINNER';

export const setLoadingSpinner = createAction(SET_LOADING_ACTION, props<{ status: boolean }>());