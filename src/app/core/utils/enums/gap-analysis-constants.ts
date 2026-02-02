export const PRIMARY: string = 'primary';
export const SECONDARY: string = 'secondary';
export const GENERAL: string = 'general';
export const SALARY: string = 'Salary';
export const HOURLY: string = 'Hourly';
export const YEAR: number = 12;
export const HOURS_WEEK: number = 40;
export const WEEKS_YEAR: number = 52;
export const PERCENTAGE: number = 0.01;
export const FEDERAL: string = 'FD';
export const HUNDRED: number = 100;
export const FiFTY_PERCENT: number = 0.5;
export const LIFE_INSURANCE_MAX: number = 750000;
export const CRITICAL_ILLNESS_MAX: number = 450000;
export const MAX_INSURED_AMOUNT: number = 3000;

// This enum represent the big card containers
// TemplateId or CardId or CardNumber
export enum COVERAGE_TYPE {
  LIFE = 1,
  DISABILITY = 2,
  JOB_LOSS = 3,
  CRITICAL_ILLNESS = 4,
}

// This enum represent the small cards with the respective coverage
// ContentNumber
export enum COVERAGE_PERCENTAGE {
  HUNDRED = 1,
  FIFTY = 2,
  ZERO = 3,
}

export interface ExpandDetails {
  general: boolean;
  primary: boolean;
  secondary: boolean;
}

export const initialStateDetails = (): ExpandDetails => ({
  general: false,
  primary: false,
  secondary: false,
});

export enum APPLICANT_TYPE {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
}
export enum BORROWER {
  ONE = 1,
  TWO = 2,
}

export enum NEW_COVERAGE_TYPE {
  OPTIONAL_LIFE = 'OPTIONAL_LIFE',
  OPTIONAL_DISABILITY = 'OPTIONAL_DISABILITY',
  OPTIONAL_JOB_LOSS = 'OPTIONAL_JOB_LOSS',
  OPTIONAL_CRITICAL_ILLNESS = 'OPTIONAL_CRITICAL_ILLNESS',
}

export enum BORROWER_TYPE {
  ONE = 'ONE',
  TWO = 'TWO',
}

export enum SUMMARY_DESCRIPTION {
  B1_HEADER = 'B1_HEADER',
  B1_POINT_B = 'B1_POINT_B',
  B2_HEADER = 'B2_HEADER',
  B2_POINT_B = 'B3_POINT_B',
}
