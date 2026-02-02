import { createApplicantList } from './applicant-utility';
import { AfterViewInit, Component, inject, input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { Store } from '@ngrx/store';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { ApplicationEvent, ApplicationRequest } from '@core/models/insurance/application.model';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { PricingCoverageComponent } from '../pricing-coverage/pricing-coverage.component';
import { ApplicantFormComponent } from './applicant-form/applicant-form.component';
import { SystemService } from '@core/services/system/system.service';
import { MessageComponent } from '@core/components/message/message.component';
import { SharedStep, SharedStepService } from '@core/services/insurance/shared-step.service';
import { ApplicationService } from '@core/services/insurance/application.service';
import { insuranceApplicationApplicantFormGroupSelector } from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { AppState } from '@store';
import { APPLICATION_TYPE } from '@core/utils/enums/insurance-enums';
import { ApplicantFormGroup } from '@core/models/insurance/applicant-formGroup.model';
import { MatButtonModule } from '@angular/material/button';
import { NgClass } from '@angular/common';
import { deleteFormGroupMember } from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import { take } from 'rxjs';
import { Applicant } from '@core/models/insurance/applicant.model';

class ApplicantTab {
  title!: string;
  valid!: boolean;
  applicantIdentifier!: string;
  applicationIdentifier!: number;
  success?: boolean;
}
@Component({
  selector: 'app-applicant-info',
  templateUrl: './applicant-info.component.html',
  styleUrls: ['./applicant-info.component.scss'],
  standalone: true,
  imports: [MatTabsModule, NgClass, ApplicantFormComponent, MatButtonModule],
})
export class ApplicantInfoComponent implements OnInit, AfterViewInit {
  @ViewChildren(ApplicantFormComponent) applicantForms!: QueryList<ApplicantFormComponent>;
  @ViewChild('applicantForm', { static: false }) applicantFormComponent: ApplicantFormComponent | undefined;
  @ViewChild('tabs') matTabGroup!: MatTabGroup;

  public stepper = input.required<MatStepper>();
  public stepList = input.required<any[]>();
  public pcComponent = input<PricingCoverageComponent>();

  private store = inject(Store<AppState>);
  private systemService = inject(SystemService);
  private dialog = inject(MatDialog);
  private stepService = inject(SharedStepService);
  private applicationService = inject(ApplicationService);

  public showTabErrors = false;
  public title!: string;
  public description!: string;
  public nextButtonLabel!: string;
  public isFormValid: boolean = false;
  private disabledButton: boolean = false;

  public selectedTabIndex = 0;
  public tabList: Array<ApplicantTab> = [
    { title: 'Applicant 1', valid: false, applicantIdentifier: '', applicationIdentifier: 0 },
  ];
  public sourceApplicationType: string = '';
  public applicationType: number = 0;
  public applicantsLength: number = 0;
  public stepInfo!: SharedStep;
  public wasApplicantRemoved: string = '';
  public applicantAdded: boolean = false;

  ngAfterViewInit(): void {
    this.checkFormsValid();
  }

  ngOnInit(): void {
    this.title = 'Applicant Information';
    this.description = this.stepList()[this.stepper().selectedIndex].description;
    this.nextButtonLabel = this.stepList()[this.stepper().selectedIndex + 1].title;
    this.loadTabsFromSession();
    this.systemService.sourceApplicationType$.subscribe((param: string) => {
      this.sourceApplicationType = param !== undefined ? param : '1';
    });
    this.stepService.currentStateInfo.subscribe((step) => {
      if (step.currentStep === 2 && step.readOnlyBehavior) {
        this.disabledButton = false;
      }
      this.stepInfo = step;
    });
  }

  onFormValid(event: any, index: number) {
    if (this.tabList[index] !== undefined) {
      this.tabList[index].valid = event;
      this.isFormValid = event;
    }
  }

  onNameChanged(event: { fName: string, lName: string }, index: number) {
    this.tabList[index].title = event.fName + ' ' + event.lName;
    if (event.fName && event.fName.length > 12) {
      this.tabList[index].title = event.fName + '\n' + event.lName;
    }

    if (event.fName && event.fName.length > 12) {
      this.tabList[index].title = event.fName + '\n' + event.lName;
    }
    if (event.fName && event.fName.length > 15) {
      this.tabList[index].title = event.fName.substring(0, 15) + '... ' + event.lName;
    }

  }

  onApplicationTypeChange(event: number, index: number) {
    if (index === 0) {
      this.applicationType = event;
    }
  }

  public messageDialog(message: string): MatDialogRef<MessageComponent> {
    return this.dialog.open(MessageComponent, {
      width: '500px',
      data: {
        type: 'warning',
        message,
      },
    });
  }

  /**
   * This is the functionality to do the quoting.
   */
  public onSendApplicant(event: ApplicationEvent) {
    if (this.stepService.currentStateValue.currentStep === 2 && this.stepService.currentStateValue.readOnlyBehavior) {
      this.stepService.currentState = {
        ...this.stepService.currentStateValue,
        currentStep: 3,
      };
      this.stepper().next();
    } else if (
      this.stepService.currentStateValue.currentStep === 2 &&
      this.applicationService.applicationValue.sourceApplicationId === 2
    ) {
      if (this.stepService.currentStateValue.currentStep === 2) {
        this.stepService.currentState = {
          ...this.stepService.currentStateValue,
          currentStep: 3,
        };
      }
      this.stepper().next();
      this.store.dispatch(setLoadingSpinner({ status: false }));
    } else if (event.pass) {
      if (this.stepService.currentStateValue.currentStep === 2) {
        this.stepService.currentState = {
          ...this.stepService.currentStateValue,
          currentStep: 3,
        };
      }

      setTimeout(() => {
        this.disabledButton = false;
      }, 2000);

      this.stepper().next();
    }
  }

  public onTabChange(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
  }

  public addTab() {
    this.tabList.push({
      title: `Applicant ${this.tabList.length + 1}`,
      valid: true,
      applicantIdentifier: '',
      applicationIdentifier: 0,
    });
    this.matTabGroup.selectedIndex = this.tabList.length - 1;

    const applicantList: QueryList<ApplicantFormComponent> = this.applicantForms;
    if (
      applicantList.get(this.matTabGroup.selectedIndex)?.applicantForm.get('personalInfoForm')?.get('applicationId')
        ?.value !== null &&
      applicantList
        .get(this.matTabGroup.selectedIndex)
        ?.applicantForm.get('personalInfoForm')
        ?.get('applicantIdentifier')?.value
    ) {
      this.applicantAdded = true;
    }

    if (this.applicantFormComponent?.loan.insuranceType !== 'OB') {
      this.applicantsLength = this.tabList.length;
    }
  }

  public canAddMoreApplicants() {
    if (this.tabList.length > 0 && this.tabList.length < 4) {
      return true;
    }

    return false;
  }

  public disableAddRemoveApplicant() {
    if (
      this.sourceApplicationType === '2' ||
      this.applicationType === 2 ||
      this.stepService.currentStateValue.readOnlyBehavior
    ) {
      return false;
    } else {
      return true;
    }
  }

  public saveApplicantInfo = () => {
    this.applicantForms.forEach((form, index) => {
      if (this.sourceApplicationType === '2' || this.applicationType === 2) {
        this.tabList[index].valid = true;
      } else {
        this.tabList[index].valid = form.applicantForm.valid;
      }
    });

    let formsValid = this.tabList.every((tab) => tab.valid);
    if (formsValid || this.stepService.currentStateValue.readOnlyBehavior) {
      if (this.applicantForms.length >= 1) {
        this.applicantForms.get(0)?.send(this.applicantForms);
        this.disabledButton = true;
      }
      this.showTabErrors = false;
    } else {
      this.applicantForms.get(this.selectedTabIndex)?.showErrors();
      this.showTabErrors = true;
    }

    if (this.pcComponent() !== undefined) {
      this.pcComponent()?.getLoanFromSession();
    }
  };

  public removeApplicant(tabIndex: number) {
    const currentTab = this.matTabGroup.selectedIndex || 0;
    this.onDeleteTab(tabIndex, currentTab);
  }

  private onDeleteTab = (index: number, currentTab: number) => {
    let applicantIdentifier = this.applicantForms
      .get(index)
      ?.applicantForm.get('personalInfoForm')
      ?.get('applicantIdentifier')?.value;


    if (!applicantIdentifier) {
      this.tabList.splice(currentTab, 1);
      if (currentTab < this.applicantForms.length -1 ) {
        this.applicantForms.forEach((element, index) => {
          applicantIdentifier = element
            ?.applicantForm.get('personalInfoForm')
            ?.get('applicantIdentifier')?.value;
          if (!applicantIdentifier) {
            element?.applicantForm.patchValue(this.applicantForms.get(index + 1)?.applicantForm.getRawValue());
          }
        });
      }
      
      this.applicantFormComponent = undefined;
      if (this.matTabGroup.selectedIndex) {
        this.matTabGroup.selectedIndex = this.matTabGroup.selectedIndex - 1;
      }

    } else {
      this.wasApplicantRemoved = APPLICATION_TYPE.NOVA;
      this.store
        .select(insuranceApplicationApplicantFormGroupSelector)
        .pipe(take(1))
        .subscribe({
          next: (groups: ApplicantFormGroup[]) => {

            const values = this.applicantForms.get(0)?.createApplicantList(this.applicantForms, APPLICATION_TYPE.NOVA);
            const formsGroups: ApplicantFormGroup[] = [];
            if (values) {
              values.forEach((iteration) =>
                iteration.applicants.forEach((applicant: Applicant) => {
                  formsGroups.push({
                    personalInfoForm: applicant,
                    homePhoneForm: applicant.applicantPhones[0],
                    addressForm: applicant.applicantAddresses[0],
                    consentForm: applicant.applicantConsents[0],
                    coverageForm: applicant.coverages,
                  });
                })
              );

            }
            if (applicantIdentifier !== null && applicantIdentifier) {
              this.store.dispatch(
                deleteFormGroupMember({
                  object: {
                    applicantIdentifier: applicantIdentifier,
                    applicantFormGroups: formsGroups,
                  },
                })
              );
            }

          },
          error: (err) => {
            console.error('Error deleting applicant ::: ', err);
          },
          complete: () => {
            this.loadTabsFromSession();
          },
        });

      if (currentTab < index) {
        setTimeout(() => {
          this.matTabGroup.selectedIndex = currentTab;
        }, 0.0000001);
      } else if (currentTab > index) {
        setTimeout(() => {
          this.matTabGroup.selectedIndex = currentTab - 1;
        }, 0.0000001);
      } else {
        this.matTabGroup.selectedIndex = index - 1;
      }

      if (this.applicantFormComponent?.loan.insuranceType !== 'OB') {
        this.applicantsLength = this.tabList.length;
      }
    }
  };

  public back = () => {
    this.stepService.currentState = {
      ...this.stepService.currentStateValue,
      currentStep: 1,
    };
    this.stepper().previous();
  };

  private loadTabsFromSession = () => {
    this.store
      .select(insuranceApplicationApplicantFormGroupSelector)
      .subscribe((applicantList: ApplicantFormGroup[]) => {
        if (applicantList && applicantList.length > 0) {
          this.tabList = new Array<ApplicantTab>();

          applicantList.forEach((applicant, index) => {
            let tab = new ApplicantTab();
            tab.valid = false;
            const firstName = applicant.personalInfoForm?.firstName ? applicant.personalInfoForm?.firstName : 'Applicant';
            const lastName = applicant.personalInfoForm?.lastName ? applicant.personalInfoForm?.lastName : index;

            tab.title = firstName + ' ' + lastName;
            if (firstName && firstName.length > 12) {
              tab.title = firstName + '\n' + lastName;
            }

            if (firstName && firstName.length > 15) {
              tab.title = firstName.substring(0, 15) + '... ' + lastName;
            }

            tab.applicantIdentifier = applicant.personalInfoForm?.applicantIdentifier
              ? applicant.personalInfoForm?.applicantIdentifier
              : '';
            tab.applicationIdentifier = applicant.personalInfoForm?.applicationId
              ? applicant.personalInfoForm?.applicationId
              : 0;

            this.tabList.push(tab);
          });
          this.applicantsLength = this.tabList.length;
          // this.selectedTabIndex = applicantList.length - 1;
          this.selectedTabIndex = 0;
        }
      });
  };

  public isButtonDisabled(): boolean {
    if (this.disabledButton) {
      return true;
    }

    if (this.stepService.currentStateValue.currentStep === 2 && this.stepService.currentStateValue.readOnlyBehavior) {
      return false;
    }

    if (
      this.isFormValid !== undefined &&
      this.applicantFormComponent?.isReadOnly !== undefined &&
      !this.isFormValid &&
      !this.applicantFormComponent?.isReadOnly &&
      this.sourceApplicationType !== '2' &&
      this.applicationType !== 2
    ) {
      return true;
    }

    return false;
  }

  private checkFormsValid() {
    this.applicantForms.get(this.selectedTabIndex)?.applicantForm.valueChanges.subscribe(() => {
      let statusWasInvalid = false;
      this.applicantForms.forEach((form) => {
        Object.keys(form.applicantForm.value).forEach((formName) => {
          const formGroup = form.applicantForm.get(formName);

          Object.keys(formGroup?.value).every((controlName) => {
            const control = formGroup?.get(controlName);

            // if (control?.touched) {
            const status = formGroup?.status;
            if (status === 'INVALID' && !statusWasInvalid) {
              this.showTabErrors = true;
              statusWasInvalid = true;
              return;
            }

            if (status === 'VALID' && !statusWasInvalid) {
              this.showTabErrors = false;
            }
            // }
          });
        });
      });
    });
  }

  public onClickTab(event: number) {
    if (this.tabList[event] !== undefined) {
      this.selectedTabIndex = event;
      this.checkFormsValid();

      if (this.applicantFormComponent) {
        this.applicantFormComponent.checkCurrentAddressStatus();
      }

      const formsValid: boolean = this.tabList.every((tab) => tab.valid);
      if (!formsValid) {
        this.showTabErrors = true;
        this.applicantForms.get(this.selectedTabIndex)?.showErrors();
      } else {
        this.showTabErrors = false;
      }
    } else {
      this.matTabGroup.selectedIndex = this.tabList.length - 1;
    }
  }
}
