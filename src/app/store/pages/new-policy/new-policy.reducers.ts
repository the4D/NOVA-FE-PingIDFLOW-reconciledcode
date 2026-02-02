import { createReducer } from "@ngrx/store";
import { InitialNewPolicyState } from "./new-policy.state";

export const newPolicyReducer = createReducer(InitialNewPolicyState);