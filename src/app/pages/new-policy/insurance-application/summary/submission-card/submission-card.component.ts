import { Component, inject, input, OnInit, output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { TooltipDirective } from '@core/directives/tooltip/tooltip.directive';
import { SignatureDate } from '../models/signature.model';
import { FileDownload } from '../models/file-download.model';
import { Application } from '@core/models/insurance/application.model';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-submission-card',
  templateUrl: './submission-card.component.html',
  styleUrls: ['./submission-card.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TooltipDirective,
    MatIconModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInput,
    MatButtonModule,
  ],
})
export class SubmissionCardComponent implements OnInit {
  insuranceType = input.required<string>();
  isReadOnly = input.required<boolean>();
  enableDownloadFile = input.required<boolean>();
  showSupportingPaperwork = input.required<boolean>();
  applicationIndex = input.required<number>();
  application = input.required<Application>();
  formSignedDate = input.required<string>();
  applicationStatus = input.required<string>();

  fileToDownload = output<FileDownload>();
  signatureDate = output<SignatureDate>();

  private formBuilder = inject(FormBuilder);

  public applicationForm: FormGroup = this.formBuilder.group({});
  public enableCursorLocal = false;

  ngOnInit() {
    this.addControl();
  }

  private enabledCursorToDownload() {
    if (
      this.applicationForm.get(`signDate_${this.application().id}`) !== null &&
      this.applicationForm.get(`signDate_${this.application().id}`)?.value !== undefined &&
      this.applicationForm.get(`signDate_${this.application().id}`)?.value !== ''
    ) {
      this.enableCursorLocal = true;
    } else {
      this.enableCursorLocal = false;
    }
  }

  private addControl() {
    if (this.formSignedDate() !== '' && this.applicationForm.get(`signDate_${this.application().id}`) === null) {
      this.applicationForm.addControl(
        `signDate_${this.application().id}`,
        new FormControl({ value: this.formSignedDate(), disabled: this.isReadOnly() }, Validators.required)
      );
    } else {
      if (this.applicationForm.get(`signDate_${this.application().id}`) === null) {
        this.applicationForm.addControl(
          `signDate_${this.application().id}`,
          new FormControl(null, Validators.required)
        );
      }
    }

    this.enabledCursorToDownload();
  }

  public updateFormsSignatureDate(dateValue: any, applicationId?: string) {
    const signedDate = `${dateValue._i.month + 1}/${dateValue._i.date}/${dateValue._i.year}`;
    this.enableCursorLocal = true;
    this.signatureDate.emit({
      signatureDate: signedDate,
      applicationId: applicationId ? applicationId : '0',
    });
  }

  public downloadFile(fileType: string, download: boolean) {
    let applicationId: string = '0';
    if (
      this.application() !== null &&
      this.application() !== undefined &&
      this.application().id !== undefined &&
      this.application().id?.toString() !== undefined
    ) {
      applicationId = '' + this.application().id;
    }

    this.fileToDownload.emit({
      fileType,
      applicationId: applicationId,
      download,
      SignatureDate: this.applicationForm.get(`signDate_${applicationId}`)?.value,
    });
  }
}
