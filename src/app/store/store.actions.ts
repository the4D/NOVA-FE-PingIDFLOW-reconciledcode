import { createAction } from '@ngrx/store';

export const INITIALIZE_APP_STORE = '[APP STORE ACTION] Initialize App Store';

export const initializeAppStore = createAction(INITIALIZE_APP_STORE);