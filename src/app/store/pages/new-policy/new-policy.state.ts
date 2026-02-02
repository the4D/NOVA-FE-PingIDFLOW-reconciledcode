import { InitialInsuranceApplicationState, InsuranceApplicationState } from "./insurance-application/insurance-application.state";

export interface NewPolicy {
     insuranceApplication: InsuranceApplicationState | null
}


export const InitialNewPolicyState: NewPolicy = {
     insuranceApplication: InitialInsuranceApplicationState
}