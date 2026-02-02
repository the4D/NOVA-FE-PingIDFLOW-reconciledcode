import { InitialNewPolicyState, NewPolicy } from "./new-policy/new-policy.state";

export interface PageState {
    newPolicy: NewPolicy | null
}

export const InitialPageState: PageState = {
    newPolicy: InitialNewPolicyState
}