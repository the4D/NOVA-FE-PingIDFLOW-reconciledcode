import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';
import { Store } from '@ngrx/store';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { BlobFile } from '@core/models/insurance/blob.model';
import { CarrierRequestService } from '@core/services/insurance/carrier-request.service';
import {
  CarrierRequestSubmitClaim,
  ICarrierRequestSubmitClaim,
} from '@core/models/insurance/carrier-request-submit-claim.model';
import { ProductService } from '@core/services/tenant/product.service';
import { option } from '@core/models/dynamic-form.interface';
import { MessageComponent } from '@core/components/message/message.component';
import { getLoanTypeList } from '@core/utils/enums/system-enums';
import { EnumService } from '@core/services/insurance/enum.service';
import { SuccessPageComponent } from '@core/components/success-page/success-page.component';

@Component({
  selector: 'app-submit-claim',
  templateUrl: './submit-claim.component.html',
  styleUrls: ['./submit-claim.component.scss'],
  providers: [DatePipe],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    SuccessPageComponent,
    MatButtonModule,
  ],
})
export class SubmitClaimComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private datePipe = inject(DatePipe);
  private enumService = inject(EnumService);
  private carrierRequestService = inject(CarrierRequestService);
  private productService = inject(ProductService);
  private dialog = inject(MatDialog);

  public claimForm: FormGroup = this.fb.group({
    loanType: [null, [Validators.required]],
    nameInsured: [null, [Validators.required]],
    certificateId: [null, [Validators.required]],
    file: [null, [Validators.required]],
  });

  //public carrierRequestSubmitClaim = new CarrierRequestSubmitClaim();
  public loanTypeList: option[] = [];
  public message: string = '';

  public submitted: boolean = false;
  public success: boolean = false;
  public error: boolean = false;

  private noFile: string = 'No file chosen';
  public fileName: string = this.noFile;
  public fileList: Array<BlobFile> = [];
  public formList: Array<any> = [
    {
      name: 'Loan',
      url: '../../../../assets/submit-claim/PLN.pdf',
    },
    {
      name: 'Line of Credit',
      url: '../../../../assets/submit-claim/PLOC.pdf',
    },
    {
      name: 'Mortgage',
      url: '../../../../assets/submit-claim/PMTG.pdf',
    },
  ];
  public itemId: string | null = null;
  public toolTip: any = {
    CertificateID: 'ID # of certificate associated with loan',
  };

  ngOnInit() {
    this.productService.setProductConfigurations('CarrierLoanTypes', this.loanTypeList);
    this.itemId = this.route.snapshot.paramMap.get('id');
    if (this.itemId) {
      this.carrierRequestService
        .getCarrierRequestById(this.itemId)
        .pipe(take(1))
        .subscribe((res) => {
          // this.carrierRequestSubmitClaim = {
          //   certificateNumber: res.certificateNumber,
          //   name: res.name,
          //   date: res.createdOn,
          //   changedBy: res.changedBy,
          //   loanType: res.carrierRequestSubmitClaim.loanType,
          //   fileUrl: res.carrierRequestSubmitClaim.claimFormUrl,
          // };

          this.message = `The claim form was submitted on ${this.datePipe.transform(res.createdOn, 'short')} by ${res.changedBy}`;

          let loanType = this.enumService.getAbbreviation(
            getLoanTypeList(),
            Number(res.carrierRequestSubmitClaim?.loanType)
          );

          this.claimForm.setValue({
            loanType,
            nameInsured: res.name,
            certificateId: res.certificateNumber,
            file: null,
          });

          this.claimForm.disable();
        });
    }
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

  uploadFile = (event: any) => {
    let blobDto = new BlobFile();
    const fileReader = new FileReader();
    fileReader.readAsDataURL(event.target.files[0]);
    fileReader.onload = () => {
      if (event.target.files[0].type !== 'application/pdf') {
        this.messageDialog('This file format is not acceptable. Please upload a PDF file.');
        return;
      }

      if (event.target.files[0].size > 2097152) {
        this.messageDialog('File size should be less than 2MB.');
        return;
      }

      this.fileName = event.target.files[0].name;

      blobDto.documentName = event.target.files[0].name;
      blobDto.documentContent =
        fileReader.result?.toString().split(',').pop() == 'data:' ? '' : fileReader.result?.toString().split(',').pop();

      this.fileList.push(blobDto);
      this.fileName = this.noFile;
    };
  };

  deleteClaim = (file: BlobFile) => {
    this.fileList = this.fileList.filter((item) => item.documentName.toLowerCase() != file.documentName.toLowerCase());
    this.fileName = this.noFile;
    this.claimForm.get('file')?.reset();
  };

  submitClaim = () => {
    this.store.dispatch(setLoadingSpinner({ status: true }));

    let submitClaimDto = new CarrierRequestSubmitClaim();
    submitClaimDto.certificateNumber = this.claimForm.get('certificateId')?.value;
    submitClaimDto.name = this.claimForm.get('nameInsured')?.value;
    submitClaimDto.loanType = this.claimForm.get('loanType')?.value;
    submitClaimDto.date = new Date();

    let submitClaim: ICarrierRequestSubmitClaim = {
      submitClaimDto: submitClaimDto,
      blobDto: this.fileList[0],
    };

    this.carrierRequestService
      .submitClaim(submitClaim)
      .pipe(take(1))
      .subscribe((res) => {
        typeof res === 'object' ? (this.error = true) : (this.success = true);
        this.submitted = true;
        this.store.dispatch(setLoadingSpinner({ status: false }));
      });
  };

  retry(): void {
    this.success = false;
    this.error = false;
    this.submitted = false;
  }
}
