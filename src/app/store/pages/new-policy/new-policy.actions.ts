import { createAction } from "@ngrx/store";

export const INITIALIZE_NEW_POLICY = '[NEW POLICY ACTION] Initialize New Policy Store';
export const initializeNewPolicy = createAction(INITIALIZE_NEW_POLICY);