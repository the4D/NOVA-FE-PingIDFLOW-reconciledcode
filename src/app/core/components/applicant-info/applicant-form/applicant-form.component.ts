import { Component, inject, input, output } from '@angular/core';
import { Validators, FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { FORM_STATUS, getEmployedTypeList, getSmokerTypeList } from '@core/utils/enums/insurance-enums';
import { getProvinceList } from '@core/utils/enums/system-enums';
import { DateDirective } from '@core/directives/date-directive/date.directive';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

@Component({
  selector: 'applicant-form',
  templateUrl: './applicant-form.component.html',
  styleUrls: ['./applicant-form.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    DateDirective,
    MatDatepickerModule,
    MatMomentDateModule,
    MatRadioModule,
  ],
})
export class ApplicantFormComponent {
  tabIndex = input.required<number>();
  isFormValidEvent = output<boolean>();
  isReQuoteRequiredEvent = output<boolean>();

  public isReadOnly: boolean = false;
  public provinceList = getProvinceList();
  public smokerTypeList = getSmokerTypeList();
  public selfEmployedTypeList = getEmployedTypeList();

  private fb = inject(FormBuilder);

  public applicantForm: FormGroup = this.fb.group({
    birthDate: [null, [Validators.required]],
    province: [null, [Validators.required]],
    smoking: [null, [Validators.required]],
    selfEmployed: [null, [Validators.required]],
    workingHours: [false, [Validators.required]],
  });

  ngAfterViewInit(): void {
    this.formValidation();
  }

  public formValidation() {
    this.applicantForm.statusChanges.subscribe((status) => {
      if (status === FORM_STATUS.INVALID) {
        this.isFormValidEvent.emit(false);
      } else if (status === FORM_STATUS.VALID) {
        this.isFormValidEvent.emit(true);
      }
    });
    this.isReQuoteRequiredEvent.emit(true);
  }

  public onValueChanged(event: any) {
    this.isReQuoteRequiredEvent.emit(true);
  }
}
