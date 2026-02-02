import { AfterViewInit, Component, inject, input, OnDestroy, OnInit } from '@angular/core';
import { Validators, FormsModule, ReactiveFormsModule, FormControl, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subject, Subscription, take, takeUntil } from 'rxjs';
import { DialogBoxComponent } from '@core/components/dialog-box/dialog-box.component';
import { MessageComponent } from '@core/components/message/message.component';
import { ApplicantQuote } from '@core/models/insurance/applicant-quote.model';
import { Application } from '@core/models/insurance/application.model';
import { BlobFile } from '@core/models/insurance/blob.model';
import {
  CarrierRequestSubmitClaim,
  ICarrierRequestSubmitClaim,
} from '@core/models/insurance/carrier-request-submit-claim.model';
import { UserResourceParams, UsersByCriteria } from '@core/models/tenant/user.model';
import { EnumValue } from '@core/models/insurance/enum.model';
import { Loan } from '@core/models/insurance/loan.model';
import { InsuranceType } from '@core/models/insurance/carrier-loan-type.model';
import { QuoteInsuranceTypeResponse } from '@core/models/insurance/quote-insurance-type.model';
import { WaiverReason } from '@core/models/insurance/waiverReason.model';
import { ApplicationService } from '@core/services/insurance/application.service';
import { EnumService } from '@core/services/insurance/enum.service';
import { MultiApplicantService } from '@core/services/insurance/multi-applicant.service';
import { QuoteService } from '@core/services/insurance/quote.service';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { UnderwriteService } from '@core/services/insurance/underwrite.service';
import { WaiverReasonService } from '@core/services/insurance/waiverReason.service';
import { SystemService } from '@core/services/system/system.service';
import { ProductService } from '@core/services/tenant/product.service';
import { APPLICATION_STATUS, APPLICATION_TYPE, INSURANCE_TYPE } from '@core/utils/enums/insurance-enums';
import {
  getCoverageTypeList,
  getPaymentFrequencyList,
  getInsuranceTypeList,
  getLoanTypeList,
} from '@core/utils/enums/system-enums';
import {
  applicationStatus,
  getFullResponseTypeApplication,
  updateInsuranceApplicationStatus,
  updateLoanUserBranch,
} from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { SubmissionRequest, Underwrite } from '@core/models/insurance/underwrite.model';
import { CommunicationService } from '@core/services/insurance/communication.service';
import { LoanService } from '@core/services/insurance/loan.service';
import { AppState } from '@store';
import {
  insuranceApplicationApplicantFormGroupSelector,
  insuranceApplicationLoanSelector,
  loadingInformationSelector,
  quoteInsuranceTypeResponseSelector,
} from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { ApplicationForms, FormMetadata1 } from '@core/models/insurance/application-form.model';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { UserService } from '@core/services/tenant/user.service';
import { User } from '@core/models/tenant/user.model';
import { BranchService } from '@core/services/tenant/branch.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { SummaryTitlesComponent } from './summary-titles/summary-titles.component';
import { SummaryCoveragesComponent } from './summary-coverages/summary-coverages.component';
import { SubmissionCardComponent } from './submission-card/submission-card.component';
import { SignatureDate } from './models/signature.model';
import { FileDownload } from './models/file-download.model';
import { MatRadioModule } from '@angular/material/radio';
import { InsuranceCancellationComponent } from './insurance-cancellation/insurance-cancellation.component';
import { CertificateNumberPopupComponent } from '@core/components/certificate-number-popup/certificate-number-popup.component';

const SUBMIT_BUTTON_LABEL = 'Commit Insurance';
const BACK_TO_LOS_BUTTON_LABEL = 'Back to LOS';
const WAIVE_BUTTON_LABEL = 'Waive & Return to Dashboard';
const SUCCESS_MESSAGE = 'You have successfully submitted your application!';

interface submissionSP {
  count: number;
  prev: string | undefined;
  actual: string | undefined;
}

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  standalone: true,
  imports: [
    MatTabsModule,
    MatDividerModule,
    MatExpansionModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    AsyncPipe,
    DecimalPipe,
    SummaryTitlesComponent,
    SummaryCoveragesComponent,
    SubmissionCardComponent,
    MatRadioModule,
    InsuranceCancellationComponent
  ],
})
export class SummaryComponent implements OnInit, OnDestroy, AfterViewInit {
  private noFile: string = 'No file chosen';
  private uploadFileDto!: ICarrierRequestSubmitClaim;
  private uploadBlobDto = new BlobFile();
  private loanType: string = '';
  private applicantFullName: string = '';

  stepper = input.required<MatStepper>();

  private formBuilder = inject(FormBuilder);
  private applicationService = inject(ApplicationService);
  private underwriteService = inject(UnderwriteService);
  private store = inject(Store<AppState>);
  public dialog = inject(MatDialog);
  private multiApplicantService = inject(MultiApplicantService);
  private router = inject(Router);
  private waiverReasonService = inject(WaiverReasonService);
  private enumService = inject(EnumService);
  private productService = inject(ProductService);
  private systemService = inject(SystemService);
  public quoteService = inject(QuoteService);
  public communication = inject(CommunicationService);
  private stepService = inject(SharedStepService);
  private loanService = inject(LoanService);
  private userService = inject(UserService);
  private branchService = inject(BranchService);

  private ngUnsubscribe$ = new Subject<void>();
  private criteriaSubscription$ = new Subscription();
  private loanSelectorSubscription$ = new Subscription();
  public loanIdentifier: string = '';
  public title!: string;
  public description!: string;
  public nextButtonLabel!: string;
  public fileList: Array<ICarrierRequestSubmitClaim> = [];
  public fileName: string = this.noFile;
  public file: any;
  public fileNumber!: string;
  public applicationForm: FormGroup = this.formBuilder.group({});
  public buttonLabel: string = SUBMIT_BUTTON_LABEL;
  public application!: Application;
  public isReadOnly: boolean = false;
  public downloadInsurancePaperwork: boolean = false;
  public doesSupplementalPaperExist = false;
  public paymentFrequency: string = '';
  public insuranceType: string = '';
  public loan!: Loan;
  public applicantList: Array<ApplicantQuote> = new Array<ApplicantQuote>();
  public coveragePercent: number | undefined;
  public coverageTypeList: EnumValue[] = getCoverageTypeList();
  public discountLimit: number = 250000;
  public waiverReasonsList!: WaiverReason[];
  public sourceApplicationType: string = '';
  public returnLabel: string = 'Return to Dashboard';
  public premiumWithTaxIncluded: number = 0;
  public carrierInsuranceType: InsuranceType | undefined;
  public quoteResponseData$: Observable<QuoteInsuranceTypeResponse> = this.store.select(
    quoteInsuranceTypeResponseSelector
  );
  public underwriteData!: Underwrite;
  public SubmissionRequest!: SubmissionRequest;
  public quoteInsuranceTypeResponse!: QuoteInsuranceTypeResponse;
  public subscriptionQuote$!: Subscription;
  public isAckChecked: boolean = false;
  public disableAcknowledgeCheckbox: boolean = true;
  public enableCursor: boolean[] = [];
  public isChecked = false;
  public loan$: Observable<Loan> = this.store.select(insuranceApplicationLoanSelector);
  public previousStatus: submissionSP = {
    count: 0,
    prev: undefined,
    actual: undefined,
  };
  public isEligibleForCoverage: boolean = false;
  public showKnowledgeCheck: boolean = true;
  public applicationIndex = 0;
  public showSupportingPaperwork: boolean[] = [];
  public disParams: string[] = ['DIS', 'IUI'];
  public isInsuranceCancellation: boolean = false;
  public isHavingCoverages: boolean = false;

  private certificateNumbersArray: Array<{ applicationId: string, certificateNumber: string | null }> = [];
  public applicationStatus: string = '';
  constructor() { }

  ngAfterViewInit(): void {

    this.applicationStatus = (sessionStorage.getItem("APPLICATIONSTATUS") || '').toUpperCase();

    this.store.dispatch(setLoadingSpinner({ status: false }));
    // Subscribe to the form control changes to keep isInsuranceCancellation in sync
    this.applicationForm.get('insuranceCancellation')?.valueChanges.subscribe(value => {
      this.isInsuranceCancellation = value === true;
    });
  }

  ngOnDestroy(): void {
    if (this.subscriptionQuote$) this.subscriptionQuote$.unsubscribe();
    if (this.criteriaSubscription$) this.criteriaSubscription$.unsubscribe();
    if (this.loanSelectorSubscription$) this.loanSelectorSubscription$.unsubscribe();
    this.stepService.destroySession();
    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();
  }
  ngOnInit(): void {

    const applicationCancelledFillenumberArrayStr: string = sessionStorage.getItem("APPLICATIONCANCELLEDFILENUMBERMAP")!;

    const applicationCancelledFillenumberArray: Array<{ id: string, fileNumberCancelled: string }> = applicationCancelledFillenumberArrayStr ? JSON.parse(applicationCancelledFillenumberArrayStr) : {};
    this.isInsuranceCancellation = applicationCancelledFillenumberArray.length > 0;

    this.isHavingCoverages = applicationCancelledFillenumberArray.length > 0;

    this.addAcknowledgeControl();
    this.addInsuranceCancellationControl();
    this.applicationForm.get('insuranceCancellation')?.setValue(this.isInsuranceCancellation);
    this.applicationForm.get('existingCoverages')?.setValue(this.isHavingCoverages);



    this.systemService.sourceApplicationType$.subscribe((param: string) => {
      this.sourceApplicationType = param === undefined ? '1' : param;
    });
    this.store.dispatch(setLoadingSpinner({ status: false }));
    this.getWaiverReasons();
    this.getUnderWriteFromSession();
    this.getLoanFromSession();
    this.getLoanInsuranceTypeFromSession();
    this.getApplicantName();
    this.onWaiverChange();
    this.getQuotesFromSession();

    this.stepService.currentState = {
      ...this.stepService.currentStateValue,
      fistTimeArriving: true,
    };

    this.stepService.currentStateInfo.pipe(takeUntil(this.ngUnsubscribe$)).subscribe((step) => {
      if (step.currentStep === 7 && step.fistTimeArriving && this.havePenSubApplications(this.loan.applications)) {
        this.stepService.currentState = {
          ...this.stepService.currentStateValue,
          currentStep: 6,
          fistTimeArriving: false,
        };
        this.fillReadOnlyObjectResponse(this.loan.loanIdentifier, false);
      } else if (step.currentStep === 6) {
        this.removeKnowledgeCheckbox();
        if (this.secondTimeLOSApplication()) {
          this.buttonLabel = SUBMIT_BUTTON_LABEL;
        } else {
          this.buttonLabel = BACK_TO_LOS_BUTTON_LABEL;
        }
      }
    });
    this.removeKnowledgeCheckbox();
    this.store.dispatch(setLoadingSpinner({ status: false }));
  }

  private addAcknowledgeControl() {
    this.applicationForm.addControl(
      `acknowledge`,
      new FormControl({ value: false, disabled: false }, Validators.required)
    );
  }

  private addInsuranceCancellationControl() {
    // Initialize the form control with a default value of false
    this.applicationForm.addControl(
      'existingCoverages',
      new FormControl(false)
    );
    this.applicationForm.addControl(
      'insuranceCancellation',
      new FormControl(false)
    );
  }

  public callNullifyAPI = () => {

    let applications: Array<{ id: string, fileNumberCancelled: string | null }> = [];

    const applicationCancelledFillenumberArrayStr: string = sessionStorage.getItem("APPLICATIONCANCELLEDFILENUMBERMAP")!;
    applications = applicationCancelledFillenumberArrayStr ? JSON.parse(applicationCancelledFillenumberArrayStr) : [];

    if (applications.length === 0 && this.certificateNumbersArray.length > 0) {
      this.certificateNumbersArray.forEach(cert => {
        applications.push({ id: cert.applicationId, fileNumberCancelled: cert.certificateNumber });
      });
    }
    
    applications = applications.map(app => {
      return {
        ...app,
        fileNumberCancelled: null
      };
    });

    this.certificateNumbersArray = this.certificateNumbersArray.map(app => {
      return {
        ...app,
        certificateNumber: null
      };
    });

   
    sessionStorage.setItem("APPLICATIONCANCELLEDFILENUMBERMAP", JSON.stringify(applications));

    const requestPayload = {
      loanIdentifier: this.loan.loanIdentifier,
      applications: applications
    };

    this.applicationService.updateFileNumbersBulk(requestPayload)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.store.dispatch(setLoadingSpinner({ status: false }));
          sessionStorage.removeItem("APPLICATIONSTATUS");
        },
        error: (error) => {
          //   console.error('Error updating file numbers:', error);     
          this.messageDialog('Failed to update certificate numbers. Please try again.').afterClosed().subscribe();
          this.store.dispatch(setLoadingSpinner({ status: false }));
        }
      });
  }
  public onRadioExistingCoverageValueChanged(event: any) {
    if (event && event.value !== undefined) {
      const newValue = event.value === true;
      this.isHavingCoverages = newValue;
      if (!newValue) {
        this.callNullifyAPI();
      }
    }
  }

  public onRadioValueChanged(event: any) {

    if (event && event.value !== undefined) {
      const newValue = event.value === true;
      this.isInsuranceCancellation = newValue;
      if (!newValue) {
        this.callNullifyAPI();
      }
    }
  }

  /**
   * This functionality is to know if any application is in PENDING or SUBMITTED status
   */
  private havePenSubApplications(applications: Application[] | undefined) {
    let isApplicationPenSub: boolean = false;
    applications?.every((application) => {
      if (application.applicationStatus !== APPLICATION_STATUS.DRAFT) {
        isApplicationPenSub = true;
        return false;
      }
      return true;
    });
    return isApplicationPenSub;
  }

  private fillReadOnlyObjectResponse(loanIdentifier: string, moveBack: boolean) {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.store.select(loadingInformationSelector).subscribe((loading) => {
      if (!loading) {
        this.store.dispatch(setLoadingSpinner({ status: false }));
      }
    });
    this.store.dispatch(getFullResponseTypeApplication({ loanIdentifier: loanIdentifier }));
    this.store.select(insuranceApplicationLoanSelector).subscribe((response) => {
      if (response) {
        this.downloadInsurancePaperwork = true;
        // this.applicationForm.addControl(
        //   `acknowledge`,
        //   new FormControl({ value: false, disabled: false }, Validators.required)
        // );

        if (this.anyPendingApplications()) {
          this.applicationForm.get('acknowledge')?.enable();
          this.applicationForm.get('acknowledge')?.setValue(false);
        } else {
          this.applicationForm.get('acknowledge')?.disable();
          this.applicationForm.get('acknowledge')?.setValue(true);
        }
        response.applications?.forEach((application) => {
          let controlList: any[] = [this.applicationForm.get('acknowledge')];
          this._setReadOnly(controlList, application.applicationStatus);
        });
      }
    });
  }
  public getQuotesFromSession() {
    this.quoteResponseData$ = this.store.select(quoteInsuranceTypeResponseSelector);

    this.quoteResponseData$.subscribe((quote) => {
      for (let i = 0; i < quote.applications.length; i++)
        this.showSupportingPaperwork[i] = this.atLeastOneCoverageIsInsured(quote.applications[i]);
    });
  }

  private getWaiverReasons() {
    this.waiverReasonService.waiverReasons$.pipe(take(1)).subscribe((waiverReasons: WaiverReason[]) => {
      this.waiverReasonsList = waiverReasons;
    });
  }

  public getReasonStatus(waiverReasonCode: number | string) {
    const reasonStatus = this.waiverReasonsList.filter((reason) => reason.waiverReasonCode === waiverReasonCode)[0]
      ?.waiverReasonStatus;

    return reasonStatus?.toString();
  }

  public getApplicantName() {
    this.store
      .select(insuranceApplicationApplicantFormGroupSelector)
      .pipe(take(1))
      .subscribe((applicantsGroup) => {
        const form = applicantsGroup[0];
        this.applicantFullName = `${form.personalInfoForm?.firstName} ${form.personalInfoForm?.middleName} ${form.personalInfoForm?.lastName}`;
      });
  }

  public openDialog(message: string, isWaive: boolean, documentId?: string) {
    this.dialog.open(DialogBoxComponent, {
      height: '359px',
      width: '440px',
      data: {
        id: documentId,
        message,
        isWaive,
      },
    });
  }

  private messageDialog(message: string): MatDialogRef<MessageComponent> {
    return this.dialog.open(MessageComponent, {
      width: '500px',
      data: {
        type: 'warning',
        message,
      },
    });
  }

  public getLoanInsuranceTypeFromSession() {
    this.productService.carrierLoanTypes$.subscribe((carrierLoanType) => {
      if (carrierLoanType) {
        this.carrierInsuranceType = carrierLoanType
          .find((c) => c.value === this.loanType)
          ?.insuranceTypes.find((i) => i.type == this.loan.insuranceType);
      }
    });
  }

  public getLoanTypeDescription(insuranceType: string, justDescription?: boolean): string {
    let category: string | undefined = '';
    this.productService.carrierLoanTypes$.subscribe((carrierLoanType) => {
      if (carrierLoanType) {
        let loanType = carrierLoanType
          .find((carrier) => carrier.value === this.loan.loanType)
          ?.insuranceTypes.find((insurance) => insurance.type === insuranceType);

        if (justDescription) {
          category = this.enumService.getDescription(getLoanTypeList(), this.loan.loanType);
        } else {
          category = loanType?.categoryDescription;
        }
      }
    });

    return category;
  }

  public getLoanFromSession() {
    this.loanSelectorSubscription$ = this.store.select(insuranceApplicationLoanSelector).subscribe((loan: Loan) => {
      if (loan) {
        if (
          (loan.insuranceType === INSURANCE_TYPE.SINGLE_PREMIUM ||
            loan.insuranceType === INSURANCE_TYPE.MORTGAGE ||
            loan.insuranceType === INSURANCE_TYPE.LINE_OF_CREDIT ||
            loan.insuranceType === INSURANCE_TYPE.OUTSTANDING_BALANCE) &&
          loan.applications
        ) {
          this.previousStatus = {
            ...this.previousStatus,
            count: this.previousStatus.count++,
            actual: loan.applications[0].applicationStatus,
          };
        }
        this.loan = loan;
        this.loanType = loan.loanType;
        this.paymentFrequency = this.enumService.getDescription(getPaymentFrequencyList(), loan.paymentFrequency);
        this.insuranceType = this.enumService.getDescription(getInsuranceTypeList(), loan.insuranceType);

        const applicationNotSubmitted = loan.applications?.filter(
          (application) => application.applicationStatus !== APPLICATION_STATUS.SUBMITTED
        )[0]?.id;

        if (applicationNotSubmitted && (loan.branchId === '' || loan.userId === '')) {
          this.userService.user$.subscribe((user: User) => {
            if (loan.user && loan.user.email === user.email) {
              this.loan = {
                ...this.loan,
                userId: user.id ? user.id : '',
              };
              this.setLoanBranchId(loan.branch?.code);
            } else {
              const searchOptions: UserResourceParams = {
                email: loan.user?.email,
              };
              this.criteriaSubscription$ = this.userService
                .getUsersByCriteria(searchOptions)
                .pipe(take(1))
                .subscribe((response: UsersByCriteria) => {
                  this.loan = {
                    ...this.loan,
                    userId: response.value[0].id ? response.value[0].id : '',
                  };
                  this.setLoanBranchId(loan.branch?.code);
                });
            }
          });
        }
      }
    });

    if (this.loan) {
      if (
        (this.loan.insuranceType === INSURANCE_TYPE.SINGLE_PREMIUM ||
          this.loan.insuranceType === INSURANCE_TYPE.MORTGAGE ||
          this.loan.insuranceType === INSURANCE_TYPE.LINE_OF_CREDIT ||
          this.loan.insuranceType === INSURANCE_TYPE.OUTSTANDING_BALANCE) &&
        this.loan.applications
      ) {
        this.previousStatus = {
          ...this.previousStatus,
          count: this.previousStatus.count++,
          actual: this.loan.applications[0].applicationStatus,
        };
      }
    }
  }

  private setLoanBranchId(branchCode: string | undefined) {
    this.loan = {
      ...this.loan,
      branchId: this.branchService.branchesValue.filter(({ code }) => code === branchCode)[0].id,
    };

    this.store.dispatch(updateLoanUserBranch({ loan: this.loan }));
  }

  public getTotalMonthlyPremiumWithTaxIncluded(application: Application): number {
    if (application && application.applicants.length > 0) {
      let applicantTotalPremiumWithTaxIncluded = 0;
      application.coverages?.forEach((coverage) => {
        applicantTotalPremiumWithTaxIncluded += coverage.premiumAmount + coverage.premiumTaxAmount;
      });
      return applicantTotalPremiumWithTaxIncluded;
    }
    return 0;
  }

  public getUnderWriteFromSession() {
    this.underwriteService.underwrite$.subscribe((underwrite) => {
      if (underwrite) {
        this.fileNumber = underwrite.fileNumber;
      } else {
        this.loanService.loan$.pipe(take(1)).subscribe((loan) => {
          if (loan) {
            this.fileNumber = loan.loanIdentifier;
          }
        });
      }
    });
  }

  private _setReadOnly(controlList: any[], applicationStatus: number | string) {
    if (applicationStatus === APPLICATION_STATUS.SUBMITTED) {
      controlList.forEach((control) => {
        this.isReadOnly = this.multiApplicantService.setReadOnly1(control, applicationStatus);
        this.manageAcknowledgeControl();
      });

      if (this.isReadOnly && this.sourceApplicationType === '2') {
        this.returnLabel = BACK_TO_LOS_BUTTON_LABEL;
      }
    }
  }

  public onBackToDashboard() {
    if (this.sourceApplicationType === '2') {
      this.stepService.currentState = {
        ...this.stepService.currentStateValue,
        currentStep: 8,
      };
      this.getResponseApplication();
    } else {
      this.router.navigate(['/new-policy']);
    }
  }

  public updateApplication(applicationStatus: string, isWaive: boolean, message: string) {
    this.application.applicationStatus = applicationStatus;
    this.applicationService
      .updateApplication(this.application)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.openDialog(message, isWaive);
        },
        error: (err) => {
          console.error('ERROR::: ', err);
        },
      });
  }

  public onApplicationSubmission() {
    this.updateApplication(APPLICATION_STATUS.SUBMITTED, false, SUCCESS_MESSAGE);
  }

  public submitPaperwork() {
    this.store.dispatch(setLoadingSpinner({ status: true }));

    this.applicationService
      .uploadClaim(this.uploadBlobDto)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.onApplicationSubmission();
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
        error: (error) => {
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
      });
  }

  public uploadFile(event: any) {
    let blobDto = new BlobFile();
    const fileReader = new FileReader();

    let submitClaimDto = new CarrierRequestSubmitClaim();

    fileReader.readAsDataURL(event.target.files[0]);

    if (event.target.files[0].type !== 'application/pdf') {
      this.messageDialog('This file format is not acceptable. Please upload a PDF file.');
      return;
    }

    if (event.target.files[0].size > 2097152) {
      this.messageDialog('File size should be less than 2MB.');
      return;
    }

    fileReader.onload = () => {
      this.fileName = event.target.files[0].name;

      submitClaimDto.certificateNumber = this.fileNumber;
      submitClaimDto.name = this.applicantFullName;
      submitClaimDto.loanType = this.loanType;
      submitClaimDto.date = new Date();

      blobDto.documentName = event.target.files[0].name;
      blobDto.documentContent =
        fileReader.result?.toString().split(',').pop() == 'data:' ? '' : fileReader.result?.toString().split(',').pop();
    };

    this.uploadFileDto = {
      submitClaimDto,
      blobDto,
    };

    this.fileList.push(this.uploadFileDto);
    this.fileName = this.noFile;
    this.uploadBlobDto = blobDto;
    this.file = event.target.files[0]; // double check it later.
  }

  public deleteFile(file: ICarrierRequestSubmitClaim) {
    this.fileList = this.fileList.filter(
      (item) => item.submitClaimDto.name.toLowerCase() != file.submitClaimDto.name.toLowerCase()
    );
    // this.correctInfoControl.reset();
  }

  private openPdfFile(
    referenceNumber: string,
    documentContent: string | undefined,
    download?: boolean,
    fileType?: string
  ) {
    var blob = this.b64toBlob(documentContent, 'application/pdf');
    var fileURL = URL.createObjectURL(blob);

    if (download) {
      const link = document.createElement('a');
      link.href = fileURL;
      // link.download = fileType === 1 ? 'insurancePaperWork.pdf' : 'supportPaperWork.pdf';
      link.download = referenceNumber;
      link.click();
    } else {
      window.open(fileURL);
    }
  }

  private b64toBlob(b64Data: any, contentType: string) {
    contentType = contentType || '';
    let sliceSize = 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  public updateFormsSignDate(signature: SignatureDate) {
    // this.applicationForm
    //   .get('signDate_' + signature.applicationId)
    //   ?.setValue(signature.signatureDate);
    this.applicationForm.get('acknowledge')?.enable;

    if (
      this.loan.applications?.filter((app) => app.id?.toString() === signature.applicationId.toString())[0]
        .applicationStatus !== APPLICATION_STATUS.DRAFT
    ) {
      this.store.dispatch(setLoadingSpinner({ status: true }));

      this.applicationService
        .DraftAnApplication(this.loan.loanIdentifier, signature.applicationId)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.store.dispatch(
              updateInsuranceApplicationStatus({
                applicationId: signature.applicationId ? parseInt(signature.applicationId) : 0,
                formSigningDate: signature.signatureDate,
                requestFrom: APPLICATION_STATUS.DRAFT,
              })
            );
          },
          error: (err) => {
            console.error('ERROR: ', err);
            this.store.dispatch(setLoadingSpinner({ status: false }));
          },
          complete: () => {
            this.store.dispatch(setLoadingSpinner({ status: false }));
          },
        });
    }

    this.enableDownloadFile(signature.applicationId, this.applicationIndex);
  }

  public downloadFile2(fileInfo: FileDownload) {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    // Find the certificate number from the array
    const certObj = this.certificateNumbersArray.find(item => item.applicationId === fileInfo.applicationId);
    let tempData: ApplicationForms = {
      applicationId: fileInfo.applicationId ? parseInt(fileInfo.applicationId) : 0,
      formType: fileInfo.fileType,
      formSigningDate: fileInfo.SignatureDate,
      fileNumberCancelled: certObj ? certObj.certificateNumber : null
    };
    let searchOptions: FormMetadata1 = {
      loanIdentifier: this.loan.loanIdentifier,
      applicationForms: [],
    };
    searchOptions.applicationForms.push(tempData);

    let previous = this.previousStatus.prev === undefined ? this.previousStatus.actual : this.previousStatus.prev;
    this.previousStatus = {
      ...this.previousStatus,
      count: this.previousStatus.count + 1,
      prev: previous,
    };

    this.applicationService
      .generatePaperwork(searchOptions)
      .pipe(take(1))
      .subscribe({
        next: (form) => {
          if (form != null && form.length > 0) {
            this.store.dispatch(setLoadingSpinner({ status: false }));
            this.store.dispatch(
              updateInsuranceApplicationStatus({
                applicationId: fileInfo.applicationId ? parseInt(fileInfo.applicationId) : 0,
                formSigningDate: fileInfo.SignatureDate,
                requestFrom: 'Download',
              })
            );
            this.previousStatus = {
              ...this.previousStatus,
              actual: APPLICATION_STATUS.PENDING,
            };
            this.checkButtonLabel();

            if (this.sourceApplicationType === '2') {
              this.openPdfFile(form[0].referenceNumber, form[0].formImage, true, fileInfo.fileType);
            } else {
              this.openPdfFile(form[0].referenceNumber, form[0].formImage, fileInfo.download, fileInfo.fileType);
            }
            this.removeKnowledgeCheckbox();
          }
        },
        error: (err) => {
          console.error('ERROR: ', err);
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
        complete: () => {
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
      });
  }

  private checkButtonLabel() {
    if (
      this.previousStatus.count <= 1 &&
      this.previousStatus.prev === APPLICATION_STATUS.PENDING &&
      // || this.previousStatus.prev === undefined
      this.previousStatus.actual === APPLICATION_STATUS.PENDING
    ) {
      this.buttonLabel = SUBMIT_BUTTON_LABEL;
    }
  }

  private updateAcknowledgeValue() {
    var keepGoing = true;
    this.loan.applications?.forEach((application) => {
      if (application.applicationStatus != 'Pending') {
        this.applicationForm.get('acknowledge')?.setValue(false);
        this.disableAcknowledgeCheckbox = true;
        keepGoing = false;
      } else {
        this.disableAcknowledgeCheckbox = false;
        this.applicationForm.get('acknowledge')?.setValue(true);
      }
    });
  }

  public onWaiverChange() {
    if (this.applicationForm.get('acknowledge')?.value) {
      this.buttonLabel = WAIVE_BUTTON_LABEL;
    } else {
      if (
        (this.sourceApplicationType === '2' || this.loan.sourceType === APPLICATION_TYPE.LOS) &&
        (this.loan.insuranceType === INSURANCE_TYPE.SINGLE_PREMIUM ||
          this.loan.insuranceType === INSURANCE_TYPE.MORTGAGE ||
          this.loan.insuranceType === INSURANCE_TYPE.LINE_OF_CREDIT ||
          this.loan.insuranceType === INSURANCE_TYPE.OUTSTANDING_BALANCE) &&
        (this.previousStatus.actual === undefined ||
          this.previousStatus.actual === APPLICATION_STATUS.DRAFT)
      ) {
        this.systemService.sourceApplicationValue;
        this.buttonLabel = BACK_TO_LOS_BUTTON_LABEL;
      } else {
        this.buttonLabel = SUBMIT_BUTTON_LABEL;
      }
    }
  }

  private anyPendingApplications() {
    var anyPendingApplication = false;
    var keepGoing = true;
    this.loan.applications?.forEach((application) => {
      if ((keepGoing = true)) {
        if (application.applicationStatus === APPLICATION_STATUS.PENDING) {
          anyPendingApplication = true;
          keepGoing = false;
        }
      }
    });
    return anyPendingApplication;
  }

  public back() {
    if (this.loan.applications && this.anyPendingApplications()) {
      this.store.dispatch(setLoadingSpinner({ status: true }));
      this.store.dispatch(applicationStatus({ loanIdentifier: this.loan.loanIdentifier }));
      this.store.select(quoteInsuranceTypeResponseSelector).subscribe((response) => {
        if (response && this.stepper().selectedIndex === 5) {
          this.stepService.currentState = {
            ...this.stepService.currentStateValue,
            currentStep: 5,
            readOnlyBehavior: false,
          };
          this.stepper().previous();
        }
      });
    } else {
      if (this.loan.applications && this.loan.applications[0].applicationStatus === APPLICATION_STATUS.SUBMITTED) {
        this.stepService.currentState = {
          ...this.stepService.currentStateValue,
          currentStep: 5,
          readOnlyBehavior: true,
        };
      } else {
        this.stepService.currentState = {
          ...this.stepService.currentStateValue,
          currentStep: 5,
          readOnlyBehavior: false,
        };
      }
      this.stepper().previous();
    }
  }

  public getCoverageName(type: string) {
    return this.coverageTypeList.find((t) => t.abbreviation === type)?.description;
  }

  private getResponseApplication() {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.loanService
      .getLoanResponse(this.loan.loanIdentifier)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const closeMsg = {
            command: 'readyToClose',
            content: response,
          };
          this.store.dispatch(setLoadingSpinner({ status: false }));
          this.communication.eventContent.event.source.postMessage(
            JSON.stringify(closeMsg),
            this.communication.eventContent.targetOrigin
          );
          window.self.close();
        },
        error: (error) => {
          console.error('An error Ocurred Trying to Get Application Response: ', error);
          let errorResponse = {
            message: 'An error ocurred trying to get application response',
            status: 500,
          };
          this.communication.eventContent.event.source.postMessage(
            JSON.stringify(errorResponse),
            this.communication.eventContent.targetOrigin
          );
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
      });
  }

  public commitInsurance() {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    if (this.loan.applications === undefined) {
      this.store.select(quoteInsuranceTypeResponseSelector).subscribe((response) => {
        this.SubmissionRequest = {
          loanIdentifier: this.loan.loanIdentifier,
          applyDate: this.applicationForm.get('signDate_' + response.applications?.[0].id)?.value,
        };
      });
    } else {
      this.SubmissionRequest = {
        loanIdentifier: this.loan.loanIdentifier,
        applyDate: new Date().toISOString(),
      };
    }

    if (
      this.loan.sourceType === APPLICATION_TYPE.NOVA ||
      (this.loan.sourceType === APPLICATION_TYPE.LOS &&
        this.loan.insuranceType !== INSURANCE_TYPE.SINGLE_PREMIUM &&
        this.loan.insuranceType !== INSURANCE_TYPE.MORTGAGE &&
        this.loan.insuranceType !== INSURANCE_TYPE.LINE_OF_CREDIT &&
        this.loan.insuranceType !== INSURANCE_TYPE.OUTSTANDING_BALANCE) ||
      (this.previousStatus.count <= 1 &&
        this.previousStatus.actual === APPLICATION_STATUS.PENDING &&
        (this.previousStatus.prev === undefined || this.previousStatus.prev === APPLICATION_STATUS.PENDING))
    ) {
      this.submitApplication(this.SubmissionRequest);
    } else {
      this.store.dispatch(setLoadingSpinner({ status: false }));
      this.onBackToDashboard();
    }
  }

  private secondTimeLOSApplication() {
    if (
      this.loan.sourceType === APPLICATION_TYPE.NOVA ||
      (this.loan.insuranceType !== INSURANCE_TYPE.SINGLE_PREMIUM &&
        this.loan.insuranceType !== INSURANCE_TYPE.MORTGAGE &&
        this.loan.insuranceType !== INSURANCE_TYPE.LINE_OF_CREDIT &&
        this.loan.insuranceType !== INSURANCE_TYPE.OUTSTANDING_BALANCE) ||
      (this.loan.sourceType === APPLICATION_TYPE.LOS &&
        (this.loan.insuranceType === INSURANCE_TYPE.SINGLE_PREMIUM ||
          this.loan.insuranceType === INSURANCE_TYPE.MORTGAGE ||
          this.loan.insuranceType === INSURANCE_TYPE.LINE_OF_CREDIT ||
          this.loan.insuranceType === INSURANCE_TYPE.OUTSTANDING_BALANCE) &&
        this.previousStatus.count <= 1 &&
        this.previousStatus.actual === APPLICATION_STATUS.PENDING &&
        (this.previousStatus.prev === undefined ||
          this.previousStatus.prev === APPLICATION_STATUS.PENDING))
    ) {
      return true;
    }

    return false;
  }

  public removeKnowledgeCheckbox() {
    // if (this.sourceApplicationType === '2') {
    this.showKnowledgeCheck = this.secondTimeLOSApplication();
    if (!this.showKnowledgeCheck) {
      this.applicationForm.get('acknowledge')?.removeValidators(Validators.required);
    }
    // }
  }

  private manageAcknowledgeControl() {
    if (this.isReadOnly) {
      this.applicationForm.get('acknowledge')?.disable();
    } else {
      this.applicationForm.get('acknowledge')?.enable();
    }
  }

  private submitApplication(submissionRequest: SubmissionRequest) {
    if (this.loan.insuranceType !== INSURANCE_TYPE.SINGLE_PREMIUM) {
      this.underwriteService
        .putUnderwrite(submissionRequest)
        .pipe(take(1))
        .subscribe({
          next: (response) => {
            this.store.dispatch(updateInsuranceApplicationStatus({ requestFrom: 'commitInsurance' }));
            let controlList: any[] = [];
            response.applications?.forEach((application) => {
              controlList.push(this.applicationForm.get('acknowledge'));
              controlList.push(this.applicationForm.get('signDate_' + application.id));
              this._setReadOnly(controlList, APPLICATION_STATUS.SUBMITTED);
            });
            this.multiApplicantService.applicationStatus = 3;
            this.stepService.currentState = {
              ...this.stepService.currentState,
              readOnlyBehavior: true,
            };

            this.store.dispatch(setLoadingSpinner({ status: false }));
          },
          error: (err) => {
            console.error('ERROR: ', err);
            this.store.dispatch(setLoadingSpinner({ status: false }));
          },
          complete: () => {
            this.isReadOnly = true;
            this.manageAcknowledgeControl();
          },
        });
    } else {
      this.loanService.submitSPLoan(submissionRequest).subscribe({
        next: (response) => {
          this.store.dispatch(updateInsuranceApplicationStatus({ requestFrom: 'commitInsurance' }));
          this.multiApplicantService.applicationStatus = 3;
          this.stepService.currentState = {
            ...this.stepService.currentState,
            readOnlyBehavior: true,
          };

          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
        error: (err) => {
          console.error('ERROR: ', err);
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
        complete: () => {
          this.isReadOnly = true;
          this.manageAcknowledgeControl();
        },
      });
    }
  }

  public enableDownloadFile(applicationId: string, index: number) {
    let enableDownloadLink: boolean = true;
    if (this.applicationForm.get('signDate_' + applicationId)?.value) {
      enableDownloadLink = false;
      this.enableCursor[index] = true;
    } else {
      enableDownloadLink = true;
      this.enableCursor[index] = false;
    }
    return enableDownloadLink;
  }

  public isAcknowledgeChecked() {
    var keepGoing = true;
    this.loan.applications?.forEach((application) => {
      if (keepGoing) {
        if (
          this.applicationForm.get(`signDate_${application.id ? application.id : application.id}`)?.value !== null &&
          application.applicationStatus !== APPLICATION_STATUS.DRAFT &&
          (this.isChecked || !this.secondTimeLOSApplication())
        ) {
          this.isAckChecked = true;
        } else {
          this.isAckChecked = false;
          keepGoing = false;
        }
      }
    });
    if (this.loan.applications === undefined) {
      this.isAckChecked = false;
    }

    return !this.isAckChecked;
  }

  onCheckboxChange = (isChecked: boolean) => {
    this.isChecked = isChecked;
  };

  public getPercentageCoverageType(applications: Application[], coverageType: string[]): number {
    if (applications.length > 0) {
      //applications.forEach((application) => {
      if (applications[this.applicationIndex].applicants.length > 0) {
        applications[this.applicationIndex].applicants.forEach((applicant) => {
          if (!this.isEligibleForCoverage) {
            applicant.applicantCoverages?.forEach((coverage) => {
              if (!this.isEligibleForCoverage) {
                if (+coverage.coverageCode % 100 === 0) {
                  this.isEligibleForCoverage = true;
                }
              }
            });
          }
        });
      }
      // });

      if (this.isEligibleForCoverage) {
        const filterValue = applications[this.applicationIndex].coverages?.filter(
          // (coverage) => coverage.coverageType === coverageType
          (coverage) => coverageType.includes(coverage.coverageType)
          // )[0].coveragePercent;
        );

        const coveragePercentage = filterValue?.find((coverage) => coverage.coveragePercent !== 0)?.coveragePercent;
        return coveragePercentage ? coveragePercentage : 0;
      }
    }

    return 0;
  }

  public getInsuredAmount(applications: Application[], params: string[]) {
    if (applications.length > 0) {
      //applications.forEach((application) => {
      if (applications[this.applicationIndex].applicants.length > 0) {
        applications[this.applicationIndex].applicants.forEach((applicant) => {
          if (!this.isEligibleForCoverage) {
            applicant.applicantCoverages?.forEach((coverage) => {
              if (!this.isEligibleForCoverage) {
                if (+coverage.coverageCode % 100 === 0) {
                  this.isEligibleForCoverage = true;
                }
              }
            });
          }
        });
      }
      // });

      if (this.isEligibleForCoverage) {
        const filterValue = applications[this.applicationIndex].coverages?.filter(
          // (coverage) => coverage.coverageType === coverageType
          (coverage) => params.includes(coverage.coverageType)
          // )[0].coveragePercent;
        );

        const insuredAmount = filterValue?.find((coverage) => coverage.insuredAmount !== 0)?.insuredAmount;
        return insuredAmount ? insuredAmount : 0;
      }
    }

    return 0;
  }

  public onClickTab(event: number) {
    this.applicationIndex = event;
  }

  public atLeastOneCoverageIsInsured(application: Application): boolean {
    var showSupportingPaperwork = false;
    application?.applicants.forEach((applicant) => {
      applicant.applicantCoverages?.forEach((applicantCoverages) => {
        if (this.getReasonStatus(applicantCoverages.coverageCode) == 'Insured') {
          showSupportingPaperwork = true;
        }
      });
    });
    return showSupportingPaperwork;
  }

  public onSaveFileNUmbers() {

    this.store.dispatch(setLoadingSpinner({ status: true }));
    let applications: Array<{ id: string, fileNumberCancelled: string | null }> = [];
    const applicationCancelledFillenumberArrayStr: string = sessionStorage.getItem("APPLICATIONCANCELLEDFILENUMBERMAP")!;
    applications = applicationCancelledFillenumberArrayStr ? JSON.parse(applicationCancelledFillenumberArrayStr) : [];
    this.certificateNumbersArray.forEach(({ applicationId, certificateNumber }) => {
      const idx = applications.findIndex(app => app.id === applicationId);
      if (idx !== -1) {
        applications[idx].fileNumberCancelled = certificateNumber;
      } else {
        applications.push({
          id: applicationId,
          fileNumberCancelled: certificateNumber
        });
      }
    });
    if (this.certificateNumbersArray.every(app => app.certificateNumber === null || app.certificateNumber.trim() === '' || app.certificateNumber === undefined)) {

      this.dialog.open(CertificateNumberPopupComponent, {
        width: '550px',
        panelClass: 'certificate-popup-panel'
      });
      this.store.dispatch(setLoadingSpinner({ status: false }));
      sessionStorage.removeItem("APPLICATIONCANCELLEDFILENUMBERMAP");
      return;
    }
    sessionStorage.setItem("APPLICATIONCANCELLEDFILENUMBERMAP", JSON.stringify(applications));
    const requestPayload = {
      loanIdentifier: this.loan.loanIdentifier,
      applications: applications
    };
    this.applicationService.updateFileNumbersBulk(requestPayload)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          //   this.messageDialog('Certificate numbers updated successfully').afterClosed().subscribe();
          this.store.dispatch(setLoadingSpinner({ status: false }));
          sessionStorage.removeItem("APPLICATIONSTATUS");
        },
        error: (error) => {
          console.error('Error updating file numbers:', error);
          this.messageDialog('Failed to update certificate numbers. Please try again.').afterClosed().subscribe();
          this.store.dispatch(setLoadingSpinner({ status: false }));
        }
      });
  }

  public updateCertificateNumber(event: { applicationId: string, certificateNumber: string | null }) {

    if (event.certificateNumber === null || event.certificateNumber.trim() === '' || event.certificateNumber === undefined) {
      event.certificateNumber === null
    }
    const idx = this.certificateNumbersArray.findIndex(item => item.applicationId === event.applicationId);
    if (idx !== -1) {
      this.certificateNumbersArray[idx].certificateNumber = event.certificateNumber;
    } else {
      this.certificateNumbersArray.push({
        applicationId: event.applicationId,
        certificateNumber: event.certificateNumber || null
      });
    }

  }

  public isAnyApplicationSubmitted(response: any): boolean {
    return response?.applications?.some((app: any) => app.applicationStatus === 'SUBMITTED');
  }

}
