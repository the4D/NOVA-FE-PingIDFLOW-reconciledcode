import { JsonFormControls } from '../../app/core/models/dynamic-form.interface';
let GapAnalysisFormsData: JsonFormControls[][] = [
  [
    {
      name: 'employmentType',
      label: 'Employment Type',
      value: '',
      type: 'dropdown',
      disabled: false,
      validators: {
        required: false,
      },
      dropdownOptions: [
        {
          name: 'Annual Salary',
          value: 'annual',
        },
        {
          name: 'Hourly Pay',
          value: 'hourly',
        },
      ],
    },
    {
      name: 'annualIncome',
      label: 'Gross Annual Income',
      value: '',
      type: 'amount',
      disabled: false,
      placeholder: 'Enter Annual Income Before Tax',
      validators: {
        required: false,
      },
    },
    {
      name: 'hourlyPay',
      label: 'Hourly Pay',
      value: '',
      type: 'amount',
      disabled: false,
      placeholder: 'Enter Hourly Pay Before Tax',
      validators: {
        required: false,
      },
    },
    {
      name: 'workHours',
      label: 'Average Hours Per Week',
      value: '',
      type: 'number',
      suffix: 'hours',
      disabled: false,
      placeholder: 'Work Hours',
      validators: {
        required: false,
      },
    },
    {
      name: 'additionalIncome',
      label: 'Additional Annual Income (If Applicable)',
      value: '',
      type: 'amount',
      disabled: false,
      placeholder: 'Enter Additional Income',
      validators: {},
    },
  ],
  [
    {
      name: 'realEstate',
      label: 'Real Estate',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'investments',
      label: 'Investments',
      value: '',
      type: 'amount',
      tooltip: 'Government & Corporate Bonds, Mutual Funds, Money Market Funds etc.',
      disabled: false,
      validators: {
        required: false,
      },
    },

    {
      name: 'savings',
      label: 'Cash Savings',
      value: '',
      type: 'amount',
      tooltip: 'Chequing and Savings',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'others',
      label: 'Other',
      value: '',
      tooltip: 'Recreational vehicles, valuable collections, etc.',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
  ],
  [
    {
      name: 'mortgage',
      label: 'Existing Mortgage',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'lineOfCredit',
      label: 'Existing Line of Credit',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'loans',
      label: 'Existing Loans',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'creditCards',
      label: 'Existing Credit Cards',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'newLoan',
      label: 'New Debt',
      value: '',
      tooltip: 'New loan, line of credit or mortgage being applied for today.',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
  ],
  [
    {
      name: 'housing',
      label: 'Housing',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'propertyTaxes',
      label: 'Property Taxes',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'utilities',
      label: 'Utilities',
      value: '',
      type: 'amount',
      tooltip: 'Water, Hydro, Gas',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'children',
      label: 'Childcare & Education',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'transportation',
      label: 'Transportation',
      value: '',
      type: 'amount',
      tooltip: 'Vehicle insurance, Transportation fare, cost of fuel, vehicle maintenance',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'groceries',
      label: 'Groceries',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'houseInsurance',
      label: 'House Insurance',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'otherExpenses',
      label: 'Other Monthly Expenses',
      value: '',
      tooltip: 'Cell phones,  kids sports or activities, gym memberships, subscriptions, cable, internet etc.',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
  ],
  [
    {
      name: 'loans',
      label: 'Existing Loans',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'creditCards',
      label: 'Credit Cards',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'lineOfCredit',
      label: 'Existing Line of Credit',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'newDebt',
      label: 'New Debt',
      value: '',
      tooltip: 'New loan, line of credit or mortgage being applied for today.',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
  ],
  [
    {
      name: 'lifeInsurance',
      label: 'Life Insurance',
      value: '',
      tooltip: 'Permanent, Whole, Term, Universal Life',
      type: 'amount',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'groupLifeInsurance',
      label: 'Group Life Insurance',
      value: '',
      type: 'amount',
      tooltip: 'Coverage at work, how much life insurance does the individual have through work?',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'creditProtection',
      label: 'Credit Protection',
      value: '',
      type: 'amount',
      tooltip: 'Loan, Line of Credit or Mortgage insurance already in place.',
      disabled: false,
      validators: {
        required: false,
      },
    },

    {
      name: 'incomeReplacementCoverage',
      label: 'Is the applicant’s income protected by an income replacement program through work?',
      value: '',
      type: 'radio',
      tooltip: 'Short term, Long term. Typically, between 50% - 65% of gross income.',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'coverageAmount',
      label: 'Coverage Percentage',
      value: '',
      type: 'number',
      disabled: false,
      placeholder: 'Income Replacement Coverage in %',
      validators: {
        required: false,
        max: 100,
        maxLength: 3,
      },
    },
  ],
];

export default GapAnalysisFormsData;
