import { JsonFormControls } from '../../app/core/models/dynamic-form.interface';
import { RoleEnum } from '../../app/core/models/tenant/user.model';

export const EditUserFormsDataSection1: {
  isActive: JsonFormControls;
  firstName: JsonFormControls;
  lastName: JsonFormControls;
  emailAddress: JsonFormControls;
  employeeId: JsonFormControls;
  branchId: JsonFormControls;
  role: JsonFormControls;
} = {
  isActive: {
    order: 0,
    name: 'isActive',
    label: 'Account Status',
    value: '',
    type: 'dropdown',
    disabled: false,
    validators: {
      required: true,
    },
    dropdownOptions: [
      {
        name: 'Enabled',
        value: true,
      },
      {
        name: 'Disabled',
        value: false,
      },
    ],
    },
  firstName: {
    order: 2,
    name: 'firstName',
    label: 'First Name',
    placeholder: 'Enter first name',
    value: '',
    type: 'text',
    disabled: true,
    validators: {
      required: true,
    },
  },
  lastName: {
    order: 3,
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
  
  emailAddress: {
    order: 4,
    name: 'email',
    label: 'Email',
    placeholder: 'Enter email address',
    value: '',
    type: 'text',
    disabled: true,
    validators: {
        required: true,
        email: true
    },
  },
  employeeId: {
    order: 5,
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
  branchId: {
    order: 6,
    name: 'branchId',
    label: 'Branch',
    value: '',
    type: 'dropdown',
    disabled: true,
    validators: {
      required: true,
    },
    dropdownOptions: [],
  },

  role: {
    order: 7,
    name: 'role',
    label: 'Role',
    value: 'Default',
    type: 'dropdown',
    disabled: false,
    validators: {
      required: true,
    },
    dropdownOptions: [
      {
        name: 'Administrator',
        value: 'Administrator',
        //value: RoleEnum.Administrator,
      },
      {
        name: 'Manager',
        value: 'Manager',
        //value: RoleEnum.Manager,
      },
      {
        name: 'User',
        value: 'User',
        //value: RoleEnum.User,
      },
    ],
  },
};
