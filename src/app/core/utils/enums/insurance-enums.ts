// !CONSTANTS
export const DIS_TITLE_QUESTIONS: string = 'Life and Disability Health Questionnaire';
export const CI_TITLE_QUESTIONS: string = 'Critical Illness Health Questionnaire';
export const QQ_LOAN_IDENTIFIER: string = '12&4$78OQQ';
export const NOT_APPLICABLE = 'N/A';
export const CARRIER_LOAN_TYPES = 'CarrierLoanTypes';
export const CONSENT_MARKETING_TERMS = 'MarketingTerms';
export const CONSENT_APPLICATION_TERMS = 'ApplicationTerms';
export const GUID_EMPTY = '00000000-0000-0000-0000-000000000000';

// !ENUMS
export enum LOAN_TYPE {
  LOAN = 'PLN',
  MORTGAGE = 'PMTG',
  LINE_OF_CREDIT = 'PLOC',
}

export enum PAYMENT_TYPE {
  BLENDED = 'Blended',
  INTEREST_ONLY = 'InterestOnly',
}
export enum WORK_HOUR {
  MIN_WORK_HOURS_PER_WEEK = 20,
}

export enum APPLICANT_TYPE {
  PRIMARY = 'Primary',
  SECONDARY = 'Secondary',
  TERTIARY = 'Tertiary',
  QUATERNARY = 'Quaternary',
}

export enum APPLICATION_STATUS {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  SUBMITTED = 'Submitted',
}

export enum APPLICATION_TYPE {
  NOVA = 'Nova',
  LOS = 'LOS',
}

export enum INSURANCE_TYPE {
  SINGLE_PREMIUM = 'SP',
  MORTGAGE = 'MO',
  LINE_OF_CREDIT = 'LC',
  OUTSTANDING_BALANCE = 'OB',
}

export enum CREDIT_TYPE {
  Mortgage = 'Mtg',
  Loan = 'LN',
  LOC = 'LOC',
}

export enum SEVERITY_ERROR {
  Error = 'Error',
  Warning = 'Warning',
  Info = 'Info',
}

export enum FORM_STATUS {
  VALID = 'VALID',
  INVALID = 'INVALID',
  PENDING = 'PENDING',
  DISABLED = 'DISABLED',
}

export enum USER_ROLE {
  ADMINISTRATOR = 'Administrator',
  MANAGER = 'Manager',
  USER = 'User',
}

export enum COVERAGE_TYPE {
  LIFE = 'LIFE',
  DIS = 'DIS',
  IUI = 'IUI',
  CI = 'CI',
}

export const STEP_LIST = [
  {
    title: 'Loan Info',
    description: 'Details of loan',
  },
  {
    title: 'Applicant Info',
    description: 'Personal details of applicant',
  },
  {
    title: 'Pricing & Coverages',
    description: 'Pricing information and coverage types',
  },
  {
    title: 'Applicant Questions',
    description: 'Accessing the additional information of applicant',
  },
  {
    title: 'Additional Info',
    description: 'An overview of insurance application',
  },
  {
    title: 'Summary',
    description: 'Download and complete a copy of paperwork.',
  },
];

// !ENUM FUNCTIONS
export const getSmokerTypeList = () => [
  { id: true, description: "Yes, I'm a smoker" },
  { id: false, description: "No, I don't smoke" },
];

export const getEmployedTypeList = () => [
  { id: true, description: "Yes, I'm self-employed" },
  { id: false, description: "No, I'm not self-employed" },
];

export const HUNDRED_VALUE: number = 100;
