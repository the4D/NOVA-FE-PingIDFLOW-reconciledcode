export interface JsonFormValidators {
  min?: number;
  max?: number;
  required?: boolean;
  requiredTrue?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  nullValidator?: boolean;
}
export interface JsonFormControlOptions {
  min?: string;
  max?: string;
  step?: string;
}
export interface option {
  value: string | boolean | number;
  name: string;
  disabled?: boolean;
}
export interface JsonFormControls {
  order?: number;
  name: string;
  label: string;
  hint?: string;
  tooltip?: string;
  suffix?: string;
  icon?: string;
  value: string | boolean;
  valueBool?: boolean;

  type:
    | 'radio'
    | 'hidden'
    | 'dropdown'
    | 'text'
    | 'password'
    | 'email'
    | 'number'
    | 'search'
    | 'tel'
    | 'url'
    | 'date'
    | 'toggle-grid'
    | 'toggle-field'
    | 'checkbox_amount'
    | 'checkbox'
    | 'amount'
    | 'phone'
    | 'percent'
    | 'postal-code';

  options?: JsonFormControlOptions;
  disabled: boolean;
  validators: JsonFormValidators;

  dropdownOptions?: option[];
  date?: Date;
  placeholder?: string;
}
export interface JsonFormData {
  controls: JsonFormControls[];
}
