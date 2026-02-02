import { JsonFormControls } from '../../app/core/models/dynamic-form.interface';
let UserProfileFormsData: JsonFormControls[][] = [
  [
    {
      name: 'isActive',
      label: 'Account Status',
      value: '',
      type: 'dropdown',
      disabled: true,
      validators: {},
      dropdownOptions: [
        {
          name: 'Active',
          value: true,
        },
        {
          name: 'Inactive',
          value: false,
        },
      ],
    },
  ],

  [
    {
      name: 'firstName',
      label: 'First Name',
      placeholder: 'Enter first name',
      value: '',
      type: 'text',
      disabled: true,
      validators: {},
    },
    {
      name: 'lastName',
      label: 'Last Name',
      placeholder: 'Enter last name',
      value: '',
      type: 'text',
      disabled: true,
      validators: {
        required: true,
      },
    },
    {
      name: 'emailAddress',
      label: 'Email',
      placeholder: 'Enter email address',
      value: '',
      type: 'text',
      disabled: true,
      validators: {
        required: true,
      },
    },
    {
      name: 'employeeId',
      label: 'Employee ID Number',
      placeholder: 'Enter ID number',
      value: '',
      type: 'text',
      disabled: true,
      validators: {
        required: true,
      },
    },
    {
      name: 'branchId',
      label: 'Branch',
      value: '',
      type: 'dropdown',
      disabled: true,
      validators: {
        required: true,
      },
      dropdownOptions: [
        {
          name: 'Corporate Office (St. Catharines)',
          value: '3B260AE2-CF5C-4A54-DFA4-08DAA87A48C4',
        },
        {
          name: 'Ridley Plaza',
          value: 'C82FA75D-509C-443B-DFA5-08DAA87A48C4'.toLowerCase(),
        },
      ],
    },
  ],
  [
    {
      name: 'role',
      label: 'Role',
      value: 'Default',
      type: 'dropdown',
      disabled: true,
      validators: {
        required: true,
      },
      dropdownOptions: [
        {
          name: 'Administrator',
          value: 'Administrator',
        },
        {
          name: 'Manager',
          value: 'Manager',
        },
        {
          name: 'User',
          value: 'User',
        },
      ],
    },
    {
      name: 'createdBy',
      label: 'Added By',
      placeholder: 'Added By',
      value: '',
      type: 'text',
      disabled: true,
      validators: {},
    },
  ],
];
export default UserProfileFormsData;
