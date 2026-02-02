import { inject, Injectable } from '@angular/core';
import { ApplicationService } from './application.service';
import { FormGroup, FormControl } from '@angular/forms';
import { Loan } from '@core/models/insurance/loan.model';

@Injectable({
  providedIn: 'root',
})
export class MultiApplicantService {
  private applicationService = inject(ApplicationService);

  public applicationStatus: number = 1;
  public loanInfoSession!: Loan;

  public setReadOnly = (form: FormGroup | FormControl): boolean => {
    let currentApplicationStatus = this.applicationService.applicationValue?.applicationStatus
      ? this.applicationService.applicationValue?.applicationStatus
      : this.applicationStatus;
    if (currentApplicationStatus !== 1 && currentApplicationStatus !== 'Draft') {
      form.disable();
      return true;
    }

    if (currentApplicationStatus === 1 || currentApplicationStatus === 'Draft') {
      form.enable();
      return false;
    }

    return false;
  };

  public setReadOnly1 = (form: FormGroup | FormControl, applicationStatus: string): boolean => {
    if (applicationStatus !== 'Draft') {
      form?.disable();
      return true;
    }

    if (applicationStatus === 'Draft') {
      form?.enable();
      return false;
    }

    return false;
  };
}
