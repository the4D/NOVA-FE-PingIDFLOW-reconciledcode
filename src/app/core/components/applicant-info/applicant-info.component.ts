import { AfterViewInit, Component, inject, input, output, viewChild, viewChildren } from '@angular/core';
import { MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';

import { ApplicantFormGroup, applicantFormGroupInitialState } from '@core/models/insurance/applicant-formGroup.model';
import { APPLICANT_TYPE } from '@core/utils/enums/insurance-enums';
import { getApplicantTypeList } from '@core/utils/enums/system-enums';
import { ApplicantFormComponent } from './applicant-form/applicant-form.component';
import { EnumService } from '@core/services/insurance/enum.service';
import { ApplicantEmail } from '../../models/insurance/applicant-email.model';
import { ApplicantAddress } from '../../models/insurance/applicant-address.model';
import { ApplicantConsent } from '../../models/insurance/applicant-consent.model';
import { ApplicantPhone } from '@core/models/insurance/applicant-phone.model';
export interface ApplicantEmitter {
  id?: string;
  applicationId?: number;
  firstName: string;
  lastName: string;
  applicantType: string;
  birthDate: string;
  province: string;
  isSmoker: boolean;
  selfEmployed: boolean;
  workHours: number;
  gender: string;
  applicantEmails: ApplicantEmail[];
  applicantPhones: ApplicantPhone[];
  applicantAddresses: ApplicantAddress[];
  applicantConsents: ApplicantConsent[];
}

@Component({
  selector: 'applicant-info',
  templateUrl: './applicant-info.component.html',
  styleUrls: ['./applicant-info.component.scss'],
  standalone: true,
  imports: [ApplicantFormComponent, MatTabsModule],
})
export class ApplicantInfoComponent implements AfterViewInit {
  applicantForms = viewChildren<ApplicantFormComponent>('applicantForm');
  applicantFormComponent = viewChild.required<ApplicantFormComponent | undefined>('applicantForm');
  matTabGroup = viewChild.required<MatTabGroup>('tabs');
  title = input<string>();
  description = input<string>();
  applicantAdded = false;

  applicantFormInfoEvent = output<ApplicantEmitter[]>();
  isFormValidEvent = output<boolean>();
  isReQuoteRequiredEvent = output<boolean>();
  applicantListLength = output<number>();

  public applicantList: ApplicantFormGroup[] = applicantFormGroupInitialState();
  public isApplicantFormValid: boolean = false;

  private enumService = inject(EnumService);
  private lastApplicantIndex: number = 0;
  private currentTab: number = 0;


  ngAfterViewInit(): void {
    this.initializeApplicantList();
    this.isFormValidEvent.emit(this.isApplicantFormValid);
    this.applicantInfoValues();
    this.matTabGroup().selectedIndex = 1;
  }

  public formValidation() {
    // this.loanForm.statusChanges.subscribe((status) => {
    //   console.log('THIS IS THE LOAN FORM:::: ', this.loanForm);
    //   if (status === 'INVALID') {
    //     this.isFormValidEvent.emit(false);
    //   } else if (status === 'VALID') {
    //     this.isFormValidEvent.emit(true);
    //   }
    // });
  }

  private initializeApplicantList() {
    this.applicantList[0] = {
      ...this.applicantList[0],
      personalInfoForm: {
        firstName: 'Applicant',
        lastName: '1',
        applicantType: APPLICANT_TYPE.PRIMARY,
        middleName: '',
        placeOfBirth: '',
        birthDate: '',
        gender: '',
        isSmoker: false,
        language: '',
        selfEmployed: false,
        workHours: 20,
        occupation: '',
        applicantAddresses: [],
        applicantPhones: [],
        applicantEmails: [],
        applicantConsents: [],
      },
    };
  }

  something(event: MatTabChangeEvent) {
    if (event.index === this.applicantList.length && !this.applicantAdded) {
      this.applicantAdded = true;
      this.addApplicantClick(event.index);
      setTimeout(() => {
        this.applicantAdded = false;
      }, 2000);
    }
  }

  public onClickTab(event: number) {

    this.currentTab = event;

    if ((event === this.applicantList.length) === !this.applicantAdded) {
      this.applicantAdded = true;
      this.addApplicantClick(event);
      setTimeout(() => {
        this.applicantAdded = false;
      }, 100);
    }
  }

  public canAddMoreApplicants() {
    if (this.matTabGroup() !== null && this.matTabGroup()?.selectedIndex !== undefined) {
      const selectedIndex = this.matTabGroup().selectedIndex !== null ? this.matTabGroup().selectedIndex : 0;

      if (selectedIndex !== null && selectedIndex < 3 && this.applicantList.length <= 3) {
        return true;
      }
      return false;
    }
    return true;
  }

  public addTab() {
    let applicantIndex = 0;
    if (this.matTabGroup() !== null && this.matTabGroup().selectedIndex !== null) {

      if (this.lastApplicantIndex == 0) {
        this.lastApplicantIndex = this.applicantList.length + 1;
      } else if (this.lastApplicantIndex > 0) {
        ++this.lastApplicantIndex;
      }

      if (applicantIndex <= 4) {
        const applicantType = this.enumService.getAbbreviation(getApplicantTypeList(), applicantIndex);

        this.applicantList.push({
          personalInfoForm: {
            firstName: 'Applicant',
            lastName: this.lastApplicantIndex.toString(),
            applicantType: applicantType,
            birthDate: '',
            middleName: '',
            placeOfBirth: '',
            gender: '',
            isSmoker: false,
            language: '',
            selfEmployed: false,
            workHours: 0,
            occupation: '',
            applicantAddresses: [],
            applicantPhones: [],
            applicantEmails: [],
            applicantConsents: [],
          },
        });

        const indexTab: number = this.applicantList.length - 1;
        this.applicantListLength.emit(this.applicantList.length);
        setTimeout(() => {
          this.matTabGroup().selectedIndex = indexTab;
        }, 1000);
      }

      this.applicantFormValid(false);
    }
  }

  public applicantFormValid(isValid: boolean) {
    if (this.isApplicantFormValid !== isValid) {
      this.isApplicantFormValid = isValid;
      this.isFormValidEvent.emit(isValid);
    }
  }

  public applicantInfoValues() {
    let values: ApplicantEmitter[] = [];
    this.applicantForms().forEach((form, index) => {
     
      if (!form || !form.applicantForm) {
        return; 
      }

      let formValues = form.applicantForm.getRawValue();

      // Check if we have a next form for getting values
      if (this.applicantForms().length > index + 1 && this.applicantForms()[index + 1]?.applicantForm) {
        formValues = this.applicantForms()[index + 1].applicantForm.getRawValue();
      }

   
        form?.applicantForm?.setValue(
          {
            birthDate: formValues?.birthDate,
            province: formValues?.province,
            smoking: formValues?.smoking,
            selfEmployed: formValues?.selfEmployed,
            workingHours: formValues?.workingHours,
          });
      
        values.push({
          firstName: 'Applicant',
          lastName: (index + 1).toString(),
          applicantType: this.enumService.getAbbreviation(getApplicantTypeList(), index + 1),
          birthDate: formValues?.birthDate,
          province: formValues?.province,
          isSmoker: formValues?.smoking,
          selfEmployed: formValues?.selfEmployed,
          workHours: formValues?.workingHours ? 0 : 20,
          gender: formValues?.gender,
          applicantEmails: formValues?.applicantEmails,
          applicantPhones: formValues?.applicantPhones,
          applicantAddresses: formValues?.applicantAddresses,
          applicantConsents: formValues?.applicantConsents,
        });
    //  }
    });

    this.applicantFormInfoEvent.emit(values);
  }

  public removeApplicant(tabIndex: number) {


    this.applicantList.splice(this.currentTab, 1);

    if (this.matTabGroup() !== null && this.matTabGroup().selectedIndex !== null) {
      if (tabIndex >= 1 && tabIndex <= this.applicantList.length) {
        this.applicantForms().forEach((form, index) => {
          // Check if form exists and has applicantForm
          if (!form || !form.applicantForm) {
            return; // Skip this iteration if form is undefined or has no applicantForm
          }

          if (index >= this.currentTab) {
            let formValues = form.applicantForm.getRawValue();
            // Check if we have a next form for getting values
            if (this.applicantForms().length > index + 1 && this.applicantForms()[index + 1]?.applicantForm) {
              formValues = this.applicantForms()[index + 1].applicantForm.getRawValue();
            }
            form.applicantForm.setValue(
              {
                
                birthDate: formValues.birthDate,
                province: formValues.province,
                smoking: formValues.smoking,
                selfEmployed: formValues.selfEmployed,
                workingHours: formValues.workingHours,
              })
          }
        })
      }

      if (this.matTabGroup().selectedIndex !== 0) {
        this.matTabGroup().selectedIndex = tabIndex - 1;
      }
      this.applicantListLength.emit(this.applicantList.length);

      if (tabIndex >= 1 && tabIndex < this.applicantList.length) {
        this.lastApplicantIndex = this.applicantList.length;
      }
    }

  }

  public clearForm() {
    this.applicantForms().forEach((form, index) => {
      // Check if form exists and has applicantForm
      if (!form || !form.applicantForm) {
        return; // Skip this iteration if form is undefined or has no applicantForm
      }

      if (index > 0) {
        this.removeApplicant(index);
      }
      form.applicantForm.reset();
    });
    this.matTabGroup().selectedIndex = 0;
    this.applicantFormComponent()?.applicantForm.reset();
  }

  public reQuote() {
    this.isReQuoteRequiredEvent.emit(true);
  }

  public addApplicantClick(tab: number) {
    if (tab === this.applicantList.length && !this.applicantFormComponent()?.isReadOnly) {
      this.isReQuoteRequiredEvent.emit(true);
      this.addTab();
    }
  }
}
