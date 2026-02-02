import { WORK_HOUR } from 'src/app/core/utils/enums/insurance-enum';
import { JsonFormControls } from '../../app/core/models/dynamic-form.interface';

const QuickQuoteFormsData: JsonFormControls[][] = [
  [
    {
      name: 'loanType',
      label: 'Loan Type',
      value: '',
      type: 'dropdown',
      disabled: false,
      validators: {
        required: true,
      },
      dropdownOptions: [],
    },
    {
      name: 'loanAmount',
      label: 'Loan Amount',
      value: '',
      type: 'amount',
      disabled: false,
      validators: {
        required: true,
      },
    },
    {
      name: 'frequency',
      label: 'Payment Frequency',
      value: '',
      type: 'dropdown',
      disabled: false,
      validators: {
        required: true,
      },
      dropdownOptions: [],
    },
    {
      name: 'paymentAmount',
      label: 'Loan Payment Amount',
      disabled: false,
      value: '',
      type: 'amount',
      validators: {
        required: true,
      },
    },
  ],
  [
    {
      name: 'birthDate',
      label: 'Date of Birth',
      placeholder: 'Enter date of birth',
      disabled: false,
      date: new Date('2000-01-02'),
      value: '',
      type: 'date',
      validators: {
        required: true,
      },
    },
    {
      name: 'province',
      label: 'Residential Province',
      value: '',
      disabled: false,
      type: 'dropdown',
      validators: {
        required: true,
      },
      dropdownOptions: [
        {
          name: 'Alberta',
          value: 'AB',
        },
        {
          name: 'British Columbia',
          value: 'BC',
        },
        {
          name: 'Manitoba',
          value: 'MB',
        },
        {
          name: 'New Brunswick',
          value: 'NB',
        },
        {
          name: 'Newfoundland and Labrador',
          value: 'NL',
        },
        {
          name: 'Nova Scotia',
          value: 'NS',
        },
        {
          name: 'Northwest Territories',
          value: 'NT',
        },
        {
          name: 'Nunavut',
          value: 'NU',
        },
        {
          name: 'Ontario',
          value: 'ON',
        },
        {
          name: 'Prince Edward Island',
          value: 'PE',
        },
        {
          name: 'Quebec',
          value: 'QC',
        },
        {
          name: 'Saskatchewan',
          value: 'SK',
        },
        {
          name: 'Yukon',
          value: 'YT',
        },
      ],
    },
    {
      name: 'isSmoker',
      label: 'Are you a smoker?',
      value: '',
      disabled: false,
      type: 'dropdown',
      validators: {
        required: true,
      },
      dropdownOptions: [
        {
          name: "Yes, I'm a smoker",
          value: true,
        },
        {
          name: "No, I don't smoke",
          value: false,
        },
      ],
    },
    {
      name: 'selfEmployed',
      label: 'Self-employed',
      value: '',
      type: 'dropdown',
      disabled: false,
      validators: {
        required: true,
      },
      dropdownOptions: [
        {
          name: "Yes, I'm self-employed",
          value: true,
        },
        {
          name: "No, I'm not self-employed",
          value: false,
        },
      ],
    },
    {
      name: 'workHours',
      label: 'Are you working at least ' + WORK_HOUR.MIN_WORK_HOURS_PER_WEEK + ' hours per week?',
      value: '',
      type: 'dropdown',
      disabled: false,
      validators: {
        required: true,
      },
      dropdownOptions: [
        {
          name: 'Yes',
          value: true,
        },
        {
          name: 'No',
          value: false,
        },
      ],
    },
  ],
  [
    {
      name: 'life',
      label: 'Life',
      value: '',
      suffix: '',
      disabled: true,
      type: 'toggle-field',
      validators: {},
    },
    {
      name: 'disability',
      label: 'Disability',
      value: '',
      disabled: true,
      type: 'toggle-field',
      validators: {},
    },
    {
      name: 'illness',
      label: 'Critical Illness',
      value: '',
      disabled: true,
      type: 'toggle-field',
      validators: {},
    },
    {
      name: 'unemployment',
      label: 'Involuntary Unemployment',
      value: '',
      disabled: true,
      type: 'toggle-field',
      validators: {},
    },
  ],
  [
    {
      name: 'life',
      label: 'Life',
      value: true,
      suffix: '0',
      type: 'toggle-field',
      disabled: false,
      validators: {},
    },
    {
      name: 'disability',
      label: 'Disability',
      value: true,
      suffix: '0',
      type: 'toggle-field',
      validators: {},
      disabled: false,
    },
    {
      name: 'illness',
      label: 'Critical Illness',
      value: true,
      disabled: false,
      suffix: '0',
      type: 'toggle-field',
      validators: {},
    },
    {
      name: 'unemployment',
      label: 'Involuntary Unemployment',
      disabled: false,
      value: true,
      suffix: '0',
      type: 'toggle-field',
      validators: {},
    },
  ],
];

export default QuickQuoteFormsData;
