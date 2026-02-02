import { Component, inject, OnInit } from '@angular/core';
import { Validators, FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { take } from 'rxjs';
import { Store } from '@ngrx/store';
import { ActivatedRoute } from '@angular/router';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { NgxMaskModule } from 'ngx-mask';
import { CarrierRequestService } from '@core/services/insurance/carrier-request.service';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { EnumService } from '@core/services/insurance/enum.service';
import { getPhoneTypeList, getProvinceList, getReinstatementReasonList } from '@core/utils/enums/system-enums';
import { AllCapsDirective } from '@core/directives/all-caps/all-caps.directive';
import { SuccessPageComponent } from '@core/components/success-page/success-page.component';

@Component({
  selector: 'app-update-info',
  templateUrl: './update-info.component.html',
  styleUrls: ['./update-info.component.scss'],
  standalone: true,
  imports: [
    SuccessPageComponent,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatCheckboxModule,
    NgxMaskModule,
    MatSelectModule,
    MatOptionModule,
    AllCapsDirective,
  ],
})
export class UpdateInfoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private carrierRequestService = inject(CarrierRequestService);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private enumService = inject(EnumService);

  public showBankingDetails: boolean = false;
  public showMemberDetails: boolean = false;
  public showLoanIdDetails: boolean = false;
  public showReinstatementReason: boolean = false;
  public bankingDetailsChecked: boolean = false;
  public memberInfoChecked: boolean = false;
  public newLoanIdChecked: boolean = false;
  public reinstatementReasonChecked: boolean = false;
  public bankingDetailsDisabled: boolean = false;
  public memberInfoDisabled: boolean = false;
  public newLoanIdDisabled: boolean = false;
  public reinstatementReasonDisabled: boolean = false;
  public submitted: boolean = false;
  public success: boolean = false;
  public error: boolean = false;

  public toolTip: any = {
    CertificateID: 'ID # of certificate associated with loan',
    NewLoanId: 'New loan identification # within banking platform',
  };
  public updateInfoForm: FormGroup = this.fb.group({
    certificateNumber: [null, [Validators.required]],
    name: [null, [Validators.required]],

    // Banking Details
    institutionNo: [null],
    transitNo: [null],
    accountNo: [null],

    // Member Info
    firstName: null,
    lastName: null,
    phoneType: null,
    phoneNumber: null,
    email: [null, [Validators.email]],
    address: null,
    unitNo: null,
    city: null,
    province: null,
    postalCode: [null],

    // Loan ID
    newCertificateNo: null,

    // Coverage Reinstatement
    reinstatementReason: null,
  });
  public itemId: string | null = null;

  ngOnInit(): void {
    this.itemId = this.route.snapshot.paramMap.get('id');
    if (this.itemId) {
      this.carrierRequestService
        .getCarrierRequestById(this.itemId)
        .pipe(take(1))
        .subscribe((res) => {
          if (res.carrierRequestUpdateInfo?.phoneType) {
            res.carrierRequestUpdateInfo.phoneType = this.enumService.getAbbreviation(
              getPhoneTypeList(),
              Number(res.carrierRequestUpdateInfo?.phoneType)
            );
          }
          if (res.carrierRequestUpdateInfo?.province) {
            res.carrierRequestUpdateInfo.province = this.enumService.getAbbreviation(
              getProvinceList(),
              Number(res.carrierRequestUpdateInfo?.province)
            );
          }
          if (res.carrierRequestUpdateInfo?.reinstatementReason) {
            res.carrierRequestUpdateInfo.reinstatementReason = this.enumService.getAbbreviation(
              getReinstatementReasonList(),
              Number(res.carrierRequestUpdateInfo?.reinstatementReason)
            );
          }

          this.updateInfoForm.patchValue(res);
          this.updateInfoForm.patchValue(res.carrierRequestUpdateInfo);
          this.updateInfoForm.disable();

          if (this.bankingDetailsEntered()) {
            this.bankingDetailsChecked = true;
            this.showBankingDetails = true;
          }
          if (this.memberInfoEntered()) {
            this.memberInfoChecked = true;
            this.showMemberDetails = true;
          }
          if (this.newLoanIdEntered()) {
            this.newLoanIdChecked = true;
            this.showLoanIdDetails = true;
          }
          if (this.reinstatementReasonEntered()) {
            this.reinstatementReasonChecked = true;
            this.showReinstatementReason = true;
          }
        });
    }
    this.bankingDetailsDisabled = this.itemId ? true : false;
    this.memberInfoDisabled = this.itemId ? true : false;
    this.newLoanIdDisabled = this.itemId ? true : false;
    this.reinstatementReasonDisabled = this.itemId ? true : false;
  }

  bankingDetailsEntered = (): boolean =>
    !!this.updateInfoForm.controls['institutionNo'].value ||
    !!this.updateInfoForm.controls['transitNo'].value ||
    !!this.updateInfoForm.controls['accountNo'].value;

  memberInfoEntered = (): boolean =>
    !!this.updateInfoForm.controls['firstName'].value ||
    !!this.updateInfoForm.controls['lastName'].value ||
    !!this.updateInfoForm.controls['phoneType'].value ||
    !!this.updateInfoForm.controls['phoneNumber'].value ||
    !!this.updateInfoForm.controls['email'].value ||
    !!this.updateInfoForm.controls['address'].value ||
    !!this.updateInfoForm.controls['unitNo'].value ||
    !!this.updateInfoForm.controls['city'].value ||
    !!this.updateInfoForm.controls['province'].value ||
    !!this.updateInfoForm.controls['postalCode'].value;

  newLoanIdEntered = (): boolean => !!this.updateInfoForm.controls['newCertificateNo'].value;

  reinstatementReasonEntered = (): boolean => !!this.updateInfoForm.controls['reinstatementReason'].value;

  bankingDetailsClicked(): void {
    if (!this.bankingDetailsDisabled) {
      this.showBankingDetails = !this.showBankingDetails;
    }
    if (!this.showBankingDetails) {
      this.updateInfoForm.controls['institutionNo'].reset();
      this.updateInfoForm.controls['transitNo'].reset();
      this.updateInfoForm.controls['accountNo'].reset();
    }
  }

  memberInfoClicked(): void {
    if (!this.memberInfoDisabled) {
      this.showMemberDetails = !this.showMemberDetails;
    }
    if (!this.showMemberDetails) {
      this.updateInfoForm.controls['firstName'].reset();
      this.updateInfoForm.controls['lastName'].reset();
      this.updateInfoForm.controls['phoneType'].reset();
      this.updateInfoForm.controls['phoneNumber'].reset();
      this.updateInfoForm.controls['email'].reset();
      this.updateInfoForm.controls['address'].reset();
      this.updateInfoForm.controls['unitNo'].reset();
      this.updateInfoForm.controls['city'].reset();
      this.updateInfoForm.controls['province'].reset();
      this.updateInfoForm.controls['postalCode'].reset();
    }
  }

  newLoanIdClicked(): void {
    if (!this.newLoanIdDisabled) {
      this.showLoanIdDetails = !this.showLoanIdDetails;
    }
    if (!this.showLoanIdDetails) {
      this.updateInfoForm.controls['newCertificateNo'].reset();
    }
  }

  reinstatementReasonClicked(event: boolean): void {
    if (!this.reinstatementReasonDisabled) {
      this.showReinstatementReason = !this.showReinstatementReason;
    }
    if (!event) {
      this.updateInfoForm.controls['reinstatementReason'].reset();
    }
  }

  onSubmit(): void {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    const updateInfo = { ...this.updateInfoForm.value };

    this.carrierRequestService
      .updateInfo(updateInfo)
      .pipe(take(1))
      .subscribe((res) => {
        typeof res === 'object' ? (this.error = true) : (this.success = true);
        this.submitted = true;
        this.store.dispatch(setLoadingSpinner({ status: false }));
      });
  }

  retry(): void {
    this.success = false;
    this.error = false;
    this.submitted = false;
  }
}
