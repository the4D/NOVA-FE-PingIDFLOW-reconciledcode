import { Component, inject, input, OnInit, output } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { TooltipDirective } from '@core/directives/tooltip/tooltip.directive';
import { SignatureDate } from '../models/signature.model';
import { FileDownload } from '../models/file-download.model';
import { Application } from '@core/models/insurance/application.model';
import { MatButtonModule } from '@angular/material/button';

export function conditionalRequiredValidator(condition: boolean, validator: ValidatorFn): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (condition) {
      return validator(control);
    }
    return null;
  };
}

function atLeastOneCertificateNumberValidator(control: AbstractControl): { [key: string]: any } | null {
  const form = control as FormGroup;
  const controls = Object.keys(form.controls)
    .filter(key => key.startsWith('certificateNumber_'))
    .map(key => form.get(key));
  const filled = controls.filter(ctrl => ctrl && ctrl.value && ctrl.value.trim() !== '');

  const isCancellation = (form as any).isInsuranceCancellation && typeof (form as any).isInsuranceCancellation === 'function'
    ? (form as any).isInsuranceCancellation() : false;
  if (isCancellation && filled.length === 0) {
    return { atLeastOneCertificateNumberRequired: true };
  }
  return null;
}

@Component({
  selector: 'app-insurance-cancellation',
  templateUrl: './insurance-cancellation.component.html',
  styleUrls: ['./insurance-cancellation.component.scss'], standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TooltipDirective,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class InsuranceCancellationComponent implements OnInit {
  insuranceType = input.required<string>();

  application = input.required<Application>();
  isInsuranceCancellation = input.required<boolean>();

  certificateNumber = output<{ applicationId: string, certificateNumber: string |  null }>();

  private formBuilder = inject(FormBuilder);

  public applicationForm: FormGroup = this.formBuilder.group({});
  public enableCursorLocal = false;
 public applicationStatus: string = '';

  ngOnInit() {
    this.applicationStatus = (sessionStorage.getItem("APPLICATIONSTATUS") || '').toUpperCase();

    this.addControl();
    this.applicationForm.setValidators(atLeastOneCertificateNumberValidator);
  }



  private addControl() {


    // Create the certificateNumber control if it doesn't exist
    if (this.applicationForm.get(`certificateNumber_${this.application().id}`) === null) {

      const applicationCancelledFillenumberArrayStr: string = sessionStorage.getItem("APPLICATIONCANCELLEDFILENUMBERMAP")!;

      const applicationCancelledFillenumberArray: Array<{ id: string, fileNumberCancelled: string }> = applicationCancelledFillenumberArrayStr ? JSON.parse(applicationCancelledFillenumberArrayStr) : [];

      const fileNumberCancelled = applicationCancelledFillenumberArray?.filter(app => app.id === this.application().id?.toString())[0]?.fileNumberCancelled || '';


      this.applicationForm.addControl(
        `certificateNumber_${this.application().id}`,
        new FormControl(
          { value: fileNumberCancelled !== null ? fileNumberCancelled : '', disabled: this.applicationStatus === 'SUBMITTED' }
        )
      );
      if(fileNumberCancelled !== null && fileNumberCancelled.trim() !== '') {
        this.emitCertificateNumber(fileNumberCancelled);
      }
    }

    // Add value changes listener to emit certificate number when it changes
    this.applicationForm.get(`certificateNumber_${this.application().id}`)?.valueChanges.subscribe(value => {
      if(value == undefined || value === null || value.trim() === '') {
        this.emitCertificateNumber(null); 
      }
      if (value !== undefined && value !== null && value.trim() !== '') {
        this.emitCertificateNumber(value);
      }
    });
  }
  /**
   * Emit the certificate number value when it changes
   */
  public onCertificateNumberChange() {
   
    const certificateNumberControl = this.applicationForm.get(`certificateNumber_${this.application().id}`);
    if (certificateNumberControl && (certificateNumberControl.value === undefined || certificateNumberControl.value === null || certificateNumberControl.value.trim() === '')) {
      this.emitCertificateNumber(null);
    }
    if (certificateNumberControl) {
      this.emitCertificateNumber(certificateNumberControl.value);
    }
  }

  /**
   * Emit the certificate number with the application ID
   */
  private emitCertificateNumber(certificateNumber: string | null) {
    const applicationId = this.application().id?.toString() || '0';

      if(certificateNumber === null || certificateNumber === undefined || certificateNumber.trim() === '') {
        this.certificateNumber.emit({
          applicationId: applicationId,
          certificateNumber: null
        });
      }
    this.certificateNumber.emit({
      applicationId: applicationId,
      certificateNumber: certificateNumber
    });


  }




}
