import { Injectable } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { JsonFormControls } from '../models/dynamic-form.interface';

@Injectable({
  providedIn: 'root',
})
export class DynamicFormService {
  constructor(private fb: UntypedFormBuilder) {}

  public createFormFromObj(controls: { [key: string]: JsonFormControls }) {
    let myForm: UntypedFormGroup = this.fb.group({});

    for (const control of Object.values(controls)) {
      const validatorsToAdd = [];
      for (const [key, value] of Object.entries(control.validators)) {
        switch (key) {
          case 'min':
            validatorsToAdd.push(Validators.min(value));
            break;
          case 'max':
            validatorsToAdd.push(Validators.max(value));
            break;
          case 'required':
            if (value) {
              validatorsToAdd.push(Validators.required);
            }
            break;
          case 'requiredTrue':
            if (value) {
              validatorsToAdd.push(Validators.requiredTrue);
            }
            break;
          case 'email':
            if (value) {
              validatorsToAdd.push(Validators.email);
            }
            break;
          case 'minLength':
            validatorsToAdd.push(Validators.minLength(value));
            break;
          case 'maxLength':
            validatorsToAdd.push(Validators.maxLength(value));
            break;
          case 'pattern':
            validatorsToAdd.push(Validators.pattern(value));
            break;
          case 'nullValidator':
            if (value) {
              validatorsToAdd.push(Validators.nullValidator);
            }
            break;
          default:
            break;
        }
      }
      if (control.type === 'date' && typeof control.value !== 'boolean') {
        myForm.addControl(control.name, this.fb.control(new Date(control.value), validatorsToAdd), {
          emitEvent: false,
        });
      } else {
        myForm.addControl(control.name, this.fb.control(control.value, validatorsToAdd), {
          emitEvent: false,
        });
      }
      control.disabled
        ? myForm.controls[control.name].disable()
        : myForm.controls[control.name].enable();
    }

    return myForm;
  }

  public createForm(controls: JsonFormControls[]) {
    let myForm: UntypedFormGroup = this.fb.group({});

    for (const control of controls) {
      const validatorsToAdd = [];
      for (const [key, value] of Object.entries(control.validators)) {
        switch (key) {
          case 'min':
            validatorsToAdd.push(Validators.min(value));
            break;
          case 'max':
            validatorsToAdd.push(Validators.max(value));
            break;
          case 'required':
            if (value) {
              validatorsToAdd.push(Validators.required);
            }
            break;
          case 'requiredTrue':
            if (value) {
              validatorsToAdd.push(Validators.requiredTrue);
            }
            break;
          case 'email':
            if (value) {
              validatorsToAdd.push(Validators.email);
            }
            break;
          case 'minLength':
            validatorsToAdd.push(Validators.minLength(value));
            break;
          case 'maxLength':
            validatorsToAdd.push(Validators.maxLength(value));
            break;
          case 'pattern':
            validatorsToAdd.push(Validators.pattern(value));
            break;
          case 'nullValidator':
            if (value) {
              validatorsToAdd.push(Validators.nullValidator);
            }
            break;
          default:
            break;
        }
      }
      if (control.type === 'date' && typeof control.value !== 'boolean') {
        myForm.addControl(control.name, this.fb.control(new Date(control.value), validatorsToAdd), {
          emitEvent: false,
        });
      } else {
        myForm.addControl(control.name, this.fb.control(control.value, validatorsToAdd), {
          emitEvent: false,
        });
      }
      control.disabled
        ? myForm.controls[control.name].disable()
        : myForm.controls[control.name].enable();
    }

    return myForm;
  }
}
