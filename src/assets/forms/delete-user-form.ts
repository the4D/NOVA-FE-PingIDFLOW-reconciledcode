import { JsonFormControls } from '../../app/core/models/dynamic-form.interface';
let DeleteUserFormsData: JsonFormControls[][] = [
  [
    {
      name: 'id',
      label: '',
      placeholder: '',
      value: '',
      type: 'text',
      disabled: true,
      validators: {},
    },
    {
      name: 'emailAddress',
      label: '',
      placeholder: '',
      value: '',
      type: 'text',
      disabled: true,
      validators: {},
    },
  ],
];

export default DeleteUserFormsData;

let forms: { email: JsonFormControls; password: JsonFormControls } = {
  email: {
    name: 'emailAddress',
    label: '',
    placeholder: '',
    value: '',
    type: 'text',
    disabled: true,
    validators: {},
  },
  password: {
    name: 'password',
    label: '',
    placeholder: '***',
    value: '',
    type: 'text',
    disabled: true,
    validators: {},
  },
};
