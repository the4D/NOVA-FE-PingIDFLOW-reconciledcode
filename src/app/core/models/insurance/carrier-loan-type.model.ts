export interface CarrierLoanType {
  name: string;
  value: string;
  insuranceTypes: InsuranceType[];
  contractType: ContractType | undefined;
}

export interface InsuranceType {
  type: string;
  description: string;
  category: string;
  categoryDescription: string;
  canBeTakenPartially: boolean;
  displayHorizontally: boolean;
  sequence: number;
  coverages: InsuranceTypeCoverage[];
  isSelectable: boolean;
}

export interface InsuranceTypeCoverage {
  coverageType: string;
  coverageDescription: string;
  sequence: number;
}

export interface ContractType {
  type: number;
  minimumPayment: number;
  paymentPercent: number;
}

export const carrierLoanTypesInitialState = (): CarrierLoanType[] => ([]);