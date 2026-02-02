import { JsonFormControls } from '../../app/core/models/dynamic-form.interface';
export const ClaimCancellationFormsData: JsonFormControls[][] = [
  [
    {
      name: 'nameOfInsured',
      label: 'Name of Insured',
      placeholder: 'Enter Name of Insured',
      value: '',
      type: 'text',
      disabled: false,
      validators: {
        required: true,
      },
    },
    {
      name: 'applicationIdentifier',
      label: 'Certificate ID',
      placeholder: 'Enter Certificate ID',
      value: '',
      type: 'text',
      disabled: false,
      validators: {
        required: true,
      },
    },
  ],
  [
    {
      name: 'directDebitInformation',
      label: 'Check to use the direct debit information on record for the insured or provide new instructions below.',
      value: false,
      type: 'checkbox',
      disabled: false,
      validators: {
        required: false,
      },
    },
    {
      name: 'institutionNum',
      label: 'Institution Number',
      placeholder: 'Enter Institution Number',
      value: '',
      type: 'number',
      disabled: false,
      validators: {
        max: 999,
        required: true,
      },
    },

    {
      name: 'transitNum',
      label: 'Transit Number',
      placeholder: 'Enter Transit Number',
      value: '',
      type: 'number',
      disabled: false,
      validators: {
        max: 99999,
        required: true,
      },
    },
    {
      name: 'accountNum',
      label: 'Account Number',
      placeholder: 'Enter Account Number',
      value: '',
      type: 'number',
      disabled: false,
      validators: {
        maxLength: 999999999999,
        required: true,
      },
    },
  ],
  [
    {
      name: 'cancellationDate',
      label: 'Effective Date of Cancellation',
      placeholder: 'dd/MM/yyyy',
      value: '',
      type: 'date',
      disabled: false,
      validators: {
        required: true,
      },
      date: new Date(),
    },
    {
      name: 'terminationReason',
      label: 'Reason for Cancellation',
      value: '',
      type: 'dropdown',
      disabled: false,
      validators: {
        required: true,
      },
      dropdownOptions: [
        {
          name: 'Closed Account',
          value: 'Closed Account',
        },
        {
          name: 'Early Payout',
          value: 'Early Payout',
        },
        {
          name: 'Have Other Insurance',
          value: 'Have Other Insurance',
        },
        {
          name: 'Maximum Age',
          value: 'Maximum Age',
        },
        {
          name: 'Misunderstood',
          value: 'Misunderstood',
        },
        {
          name: 'Too Expensive/Cost',
          value: 'Too Expensive/Cost',
        },
        {
          name: 'Loan in Arrears',
          value: 'Loan in Arrears',
        },
        {
          name: 'Other',
          value: 'Other',
        },
      ],
    },
  ],
];

export const ClaimCancellationFormSection1: {
  nameOfInsured: JsonFormControls;
  applicationIdentifier: JsonFormControls;
} = {
  nameOfInsured: {
    name: 'nameOfInsured',
    label: 'Name of Insured',
    placeholder: 'Enter Name of Insured',

    value: '',
    type: 'text',
    disabled: false,
    validators: {
      required: true,
    },
  },
  applicationIdentifier: {
    name: 'applicationIdentifier',
    label: 'Certificate ID',
    placeholder: 'Enter Certificate ID',

    value: '',
    type: 'text',
    tooltip: '* ID # of certificate associated with loan',
    disabled: false,
    validators: {
      required: true,
    },
  },
};

export const ClaimCancellationFormSection2: {
  institutionNum: JsonFormControls;
  transitNum: JsonFormControls;
  accountNum: JsonFormControls;
} = {
  institutionNum: {
    name: 'institutionNum',
    label: 'Institution Number',
    placeholder: 'Enter Institution Number',

    value: '',
    type: 'number',
    disabled: false,
    validators: {
      max: 999,
      required: true,
    },
  },

  transitNum: {
    name: 'transitNum',
    label: 'Transit Number',
    placeholder: 'Enter Transit Number',

    value: '',
    type: 'number',
    disabled: false,
    validators: {
      max: 99999,
      required: true,
    },
  },
  accountNum: {
    name: 'accountNum',
    label: 'Account Number',
    placeholder: 'Enter Account Number',
    value: '',
    type: 'number',
    disabled: false,
    validators: {
      maxLength: 999999999999,
      required: true,
    },
  },
};

export const ClaimCancellationFormSection3: {
  cancellationDate: JsonFormControls;
  terminationReason: JsonFormControls;
} = {
  cancellationDate: {
    name: 'cancellationDate',
    label: 'Effective Date of Cancellation',
    placeholder: 'dd/MM/yyyy',
    value: '',
    type: 'date',
    disabled: false,
    validators: {
      required: true,
    },
    date: new Date(),
  },
  terminationReason: {
    name: 'terminationReason',
    label: 'Reason for Cancellation',
    value: '',
    type: 'dropdown',
    disabled: false,
    validators: {
      required: true,
    },
    dropdownOptions: [
      {
        name: 'Closed Account',
        value: 'closed',
      },
      {
        name: 'Early Pay out',
        value: 'early',
      },
      {
        name: 'Have other insurance',
        value: 'otherInsurance',
      },
      {
        name: 'Max age',
        value: 'max',
      },
      {
        name: 'Misunderstood',
        value: 'misunderstood',
      },
      {
        name: 'Too expensive/cost',
        value: 'expensive',
      },
      {
        name: 'Loan in arrears',
        value: 'arrears',
      },
      {
        name: 'Other',
        value: 'other',
      },
    ],
  },
};

export const ClaimCancellationForm: {
  nameOfInsured: JsonFormControls;
  applicationIdentifier: JsonFormControls;
  directDebitInformation: JsonFormControls;
  institutionNum: JsonFormControls;
  transitNum: JsonFormControls;
  accountNum: JsonFormControls;
  cancellationDate: JsonFormControls;
  terminationReason: JsonFormControls;
} = {
  nameOfInsured: {
    name: 'nameOfInsured',
    label: 'Name of Insured',
    placeholder: 'Enter Name of Insured',
    value: '',
    type: 'text',
    disabled: false,
    validators: {
      required: true,
    },
  },
  applicationIdentifier: {
    name: 'applicationIdentifier',
    label: 'Certificate ID',
    placeholder: 'Enter Certificate ID',
    tooltip: '* ID # of certificate associated with loan',
    value: '',
    type: 'text',
    disabled: false,
    validators: {
      required: true,
    },
  },
  directDebitInformation: {
    name: 'directDebitInformation',
    label: 'Check to use the direct debit information on record for the insured or provide new instructions below.',
    value: false,
    type: 'checkbox',
    disabled: false,
    validators: {
      required: false,
    },
  },

  institutionNum: {
    name: 'institutionNum',
    label: 'Institution Number',
    placeholder: 'Enter Institution Number',
    value: '',
    type: 'number',
    disabled: false,
    validators: {
      max: 999,
      required: true,
    },
  },

  transitNum: {
    name: 'transitNum',
    label: 'Transit Number',
    placeholder: 'Enter Transit Number',
    value: '',
    type: 'number',
    disabled: false,
    validators: {
      max: 99999,
      required: true,
    },
  },
  accountNum: {
    name: 'accountNum',
    label: 'Account Number',
    placeholder: 'Enter Account Number',
    value: '',
    type: 'number',
    disabled: false,
    validators: {
      maxLength: 999999999999,
      required: true,
    },
  },

  cancellationDate: {
    name: 'cancellationDate',
    label: 'Effective Date for Cancellation',
    placeholder: 'dd/MM/yyyy',
    value: '',
    type: 'date',
    disabled: false,
    validators: {
      required: true,
    },
    date: new Date(),
  },
  terminationReason: {
    name: 'terminationReason',
    label: 'Reason for Cancellation',
    value: '',
    type: 'dropdown',
    disabled: false,
    validators: {
      required: true,
    },
    dropdownOptions: [
        {
          name: 'Closed Account',
          value: 'Closed Account',
        },
        {
          name: 'Early Payout',
          value: 'Early Payout',
        },
        {
          name: 'Have Other Insurance',
          value: 'Have Other Insurance',
        },
        {
          name: 'Maximum Age',
          value: 'Maximum Age',
        },
        {
          name: 'Misunderstood',
          value: 'Misunderstood',
        },
        {
          name: 'Too Expensive/Cost',
          value: 'Too Expensive/Cost',
        },
        {
          name: 'Loan in Arrears',
          value: 'Loan in Arrears',
        },
        {
          name: 'Other',
          value: 'Other',
        }
    ],
  },
};
