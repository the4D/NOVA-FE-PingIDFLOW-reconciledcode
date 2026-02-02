import { Component, inject, OnInit } from '@angular/core';
import { UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DynamicFormService } from '@core/services/dynamic-form.service';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';
import { ClaimCancellationForm } from 'src/assets/forms/cancel-policy-form';
import { CarrierRequestService } from '@core/services/insurance/carrier-request.service';
import { CarrierRequestCancelCoverage } from '@core/models/insurance/carrier-request-cancel-coverage.model';
import { EnumService } from '@core/services/insurance/enum.service';
import { getCancellationReasonList } from '@core/utils/enums/system-enums';
import { AppState } from '@store';
import { MatButtonModule } from '@angular/material/button';
import { SuccessPageComponent } from '@core/components/success-page/success-page.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
@Component({
  selector: 'app-cancel-policy',
  templateUrl: './cancel-policy.component.html',
  styleUrls: ['./cancel-policy.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatCheckboxModule,
    SuccessPageComponent,
    MatButtonModule,
  ],
})
export class CancelPolicyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private formService = inject(DynamicFormService);
  private store = inject(Store<AppState>);
  private enumService = inject(EnumService);
  private carrierRequestService = inject(CarrierRequestService);

  public submitted: boolean = false;
  public success: boolean = false;
  public error: boolean = false;
  public coverages: any[] = [];
  public itemId: string | null = null;
  public claimCancellationForm = ClaimCancellationForm;
  public claimCancelFormGroup!: UntypedFormGroup;

  ngOnInit() {
    this.claimCancelFormGroup = this.formService.createFormFromObj(this.claimCancellationForm);
    this.itemId = this.route.snapshot.paramMap.get('id');
    if (this.itemId) {
      this.carrierRequestService
        .getCarrierRequestById(this.itemId)
        .pipe(take(1))
        .subscribe((res) => {
          let cancellation = res.carrierRequestCancelCoverage;

          if (cancellation.terminationReason) {
            cancellation.terminationReason = this.enumService.getAbbreviation(
              getCancellationReasonList(),
              cancellation.terminationReason
            );
          }

          this.claimCancelFormGroup.patchValue({
            nameOfInsured: res.name,
            applicationIdentifier: res.certificateNumber,
            institutionNum: cancellation.institutionNo,
            transitNum: cancellation.transitNo,
            accountNum: cancellation.accountNo,
            cancellationDate: cancellation.cancellationDate,
            terminationReason: cancellation.terminationReason,
            directDebitInformation: !(cancellation.institutionNo && cancellation.transitNo && cancellation.accountNo),
          });
          this.claimCancelFormGroup.disable();
        });
    }
  }

  onCheck(isChecked: boolean) {
    if (isChecked) {
      this.claimCancelFormGroup.controls['institutionNum'].disable();
      this.claimCancelFormGroup.controls['transitNum'].disable();
      this.claimCancelFormGroup.controls['accountNum'].disable();
    } else {
      this.claimCancelFormGroup.controls['institutionNum'].enable();
      this.claimCancelFormGroup.controls['transitNum'].enable();
      this.claimCancelFormGroup.controls['accountNum'].enable();
    }
  }

  onSubmit() {
    if (this.claimCancelFormGroup.invalid) return this.claimCancelFormGroup.markAllAsTouched();

    let form = this.claimCancelFormGroup;
    let data: CarrierRequestCancelCoverage = {
      certificateNumber: form.value.applicationIdentifier,
      name: form.value.nameOfInsured,
      institutionNo: form.value.institutionNum ? form.value.institutionNum.toString() : '',
      transitNo: form.value.transitNum ? form.value.transitNum.toString() : '',
      accountNo: form.value.accountNum ? form.value.accountNum.toString() : '',
      cancellationDate: new Date(form.value.cancellationDate),
      terminationReason: form.value.terminationReason,
    };

    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.carrierRequestService
      .cancelCoverage(data)
      .pipe(take(1))
      .subscribe((res) => {
        typeof res === 'object' ? (this.error = true) : (this.success = true);
        this.submitted = true;
        this.store.dispatch(setLoadingSpinner({ status: false }));
      });
  }

  clearForm() {
    this.claimCancelFormGroup.reset();
  }

  retry(): void {
    this.success = false;
    this.error = false;
    this.submitted = false;
  }
}
