import { JsonFormControls } from '../../app/core/models/dynamic-form.interface';
import { RoleEnum } from '../../app/core/models/tenant/user.model';



// Convert

export const InviteUserFormsDataSection1: {
  firstName: JsonFormControls;
  lastName: JsonFormControls;
  emailAddress: JsonFormControls;
  employeeId: JsonFormControls;
  branchId: JsonFormControls;
  role: JsonFormControls;
} = {
  firstName: {
    order: 1,
    name: 'firstName',
    label: 'First Name',
    placeholder: 'Enter first name',
    value: '',
    type: 'text',
    disabled: false,
    validators: {
      required: true,
    },
  },
  lastName: {
    order: 2,
    name: 'lastName',
    label: 'Last Name',
    placeholder: 'Enter last name',
    value: '',
    type: 'text',
    disabled: false,
    validators: {
      required: true,
    },
  },
  emailAddress: {
    order: 3,
    name: 'emailAddress',
    label: 'Email',
    placeholder: 'Enter email address',
    value: '',
    type: 'text',
    disabled: false,
    validators: {
        required: true,
        email: true
    },
  },
  employeeId: {
    order: 4,
    name: 'employeeId',
    label: 'Employee ID Number',
    placeholder: 'Enter ID number',
    value: '',
      type: 'text',
    disabled: false,
    validators: {
      required: true,
    },
  },
  branchId: {
    order: 5,
    name: 'branchId',
    label: 'Branch',
    value: '',
    type: 'dropdown',
    disabled: false,
    validators: {
      required: true,
    },
    dropdownOptions: [],
  },
  role: {
    order: 6,
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
        value: RoleEnum.Administrator,
      },

      {
        name: 'Manager',
          value: RoleEnum.Manager,
      },
      {
        name: 'User',
          value: RoleEnum.User,
      },
    ],
  },
};
