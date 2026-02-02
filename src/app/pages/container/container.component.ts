import { Component, OnInit, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { Container } from '@core/models/container/container.model';
import { SystemService } from '@core/services/system/system.service';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { APPLICATION_TYPE, INSURANCE_TYPE, LOAN_TYPE } from '@core/utils/enums/insurance-enums';
import { getLoanTypeList } from '@core/utils/enums/system-enums';
import { CarrierLoanType } from '@core/models/insurance/carrier-loan-type.model';
import { ProductService } from '@core/services/tenant/product.service';
import { CommunicationService } from '@core/services/insurance/communication.service';
import { UserService } from '@core/services/tenant/user.service';
import { Loan, LoanRequest, UpsertResponse } from '@core/models/insurance/loan.model';
import { LoanService } from '@core/services/insurance/loan.service';
import { SubmissionRequest, SubmissionResponse } from '@core/models/insurance/underwrite.model';
import { UnderwriteService } from '@core/services/insurance/underwrite.service';
import { loadExistingLoanApplication } from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import {
  insuranceApplicationLoanSelector,
  loadingInformationSelector,
} from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { AppState } from '@store';
import { EnumService } from '@core/services/insurance/enum.service';

interface IRequestResponseApplication {
  command: string;
  loanIdentifier: string;
}

@Component({
  selector: 'app-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss'],
  standalone: true,
  imports: [],
})
export class ContainerComponent implements OnInit {
  private systemService = inject(SystemService);
  private loanService = inject(LoanService);
  private router = inject(Router);
  private store = inject(Store<AppState>);
  private productService = inject(ProductService);
  private communication = inject(CommunicationService);
  private useService = inject(UserService);
  private underwriteService = inject(UnderwriteService);
  private enumService = inject(EnumService);

  public event!: any;

  @HostListener('window:message', ['$event'])
  onMessage(event: any) {
    if (event.origin !== window.origin) {
      this.event = event;
      this.communication.eventContent = {
        event: event,
        targetOrigin: event.origin,
      };
      this.formatData(event.data);
    }
  }

  public containerDto!: Container;
  public containerReqRespDto!: IRequestResponseApplication;
  public containerSubmissionRequest!: SubmissionRequest;
  public message: string = 'Waiting for an application';
  public canAccess: boolean = true;
  public errorMessage: string = '';
  public loanTypeList: CarrierLoanType[] = [];
  public loanIdentifier: string = '';
  public readyMsg = {
    command: 'readyToReceive',
    content: '',
  };
  public closeMsg = {
    command: 'readyToClose',
    content: '',
  };
  public alreadySendIt!: boolean;

  constructor() {
    this.systemService.sourceApplicationType = '2';
    this.alreadySendIt = false;
  }

  ngOnInit() {
    this.productService.carrierLoanTypes$.subscribe({
      next: (config: CarrierLoanType[]) => {
        config.forEach((element: CarrierLoanType) => {
          this.loanTypeList.push({
            name: element.name,
            value: element.value.toString(),
            insuranceTypes: element.insuranceTypes,
            contractType: element.contractType,
          });
        });
        if (config.length > 0) this.sendReady();
      },
      error: (error) => {
        this.message = 'An error has occurred while configuring the loan types.';
        console.error('Error: ', error);
      },
    });
  }

  private sendReady() {
    const returnMsg = JSON.stringify(this.readyMsg);
    window.opener.postMessage(returnMsg, '*');
  }

  public hasAccess(): boolean {
    if (this.canAccess) {
      return true;
    }

    return false;
  }

  public returnToLOS() {
    if (this.loanIdentifier) {
      this.getResponseApplication(this.loanIdentifier);
    } else {
      window.self.close();
    }
  }

  private formatData(data: any) {
    try {
      let contentDto = JSON.parse(data);

      if (contentDto) {
        switch (contentDto.command) {
          case 'CreateApplication':
            this.store.dispatch(setLoadingSpinner({ status: true }));
            this.containerDto = contentDto;
            this.setLoanBranchId();
            this.setInsuranceType();
            this.containerDto.applicationDto.loan.sourceType = APPLICATION_TYPE.LOS;
            this.message = 'Processing application';

            // NEW IMPLEMENTATION
            if (this.containerDto.applicationDto.loan.loanIdentifier) {
              this.store.dispatch(
                loadExistingLoanApplication({
                  loanIdentifier: this.containerDto.applicationDto.loan.loanIdentifier,
                })
              );

              this.store.select(loadingInformationSelector).subscribe((loading) => {
                if (!loading && !this.alreadySendIt) {
                  this.store
                    .select(insuranceApplicationLoanSelector)
                    .pipe(take(1))
                    .subscribe((loan: Loan) => {
                      if (!this.alreadySendIt) {
                        this.alreadySendIt = true;
                        if (loan.loanIdentifier === null || loan.loanIdentifier === '') {
                          this.containerDto.applicationDto.applications.forEach((application) => {
                            application.applicants
                              .filter((applicant) => applicant.workHours === undefined)
                              .forEach((applicant) => (applicant.workHours = 20));
                          });
                          this.upsertLoanApplication();
                        } else {
                          this.reOrganizeSequences(loan);
                        }
                      }
                    });
                }
              });
            }

            break;

          case 'ResponseApplication':
            this.containerReqRespDto = contentDto;
            this.store.dispatch(setLoadingSpinner({ status: true }));
            this.getResponseApplication();
            this.loanIdentifier = this.containerReqRespDto.loanIdentifier;
            break;

          case 'SubmitMPApplication':
            this.containerSubmissionRequest = contentDto;
            this.submitMPApplication();
            this.loanIdentifier = this.containerSubmissionRequest.loanIdentifier;
            break;

          case 'SubmitSPApplication':
            this.containerSubmissionRequest = contentDto;
            this.submitSPApplication();
            this.loanIdentifier = this.containerSubmissionRequest.loanIdentifier;
            break;

          default:
            const msg = `The command ${contentDto.command} does not exist.`;
            this.message = msg;
            this.errorMessage = msg;
            this.loanIdentifier = contentDto.loanIdentifier;
            this.canAccess = false;
            break;
        }
      }
    } catch (err) {
      console.log('Json is not valid yet:::: ', data, ' - ', err);
    }
  }

  private reOrganizeSequences(loan: Loan | undefined) {
    this.containerDto.applicationDto.loan.insuranceType = loan?.insuranceType;
    this.containerDto.applicationDto.applications.forEach((application) => {
      application.applicants.forEach((applicant) => {
        const applicantValue = loan?.applications
          ?.map(
            ({ applicants }) =>
              applicants.filter(({ applicantIdentifier }) => applicantIdentifier === applicant.applicantIdentifier)[0]
          )
          .filter((value) => value !== undefined)[0];

        applicant.applicantSequence = applicantValue?.applicantSequence;

        if (loan?.insuranceType === INSURANCE_TYPE.SINGLE_PREMIUM) {
          applicant.applicantType = applicantValue?.applicantType
            ? applicantValue?.applicantType
            : applicant.applicantType;
        }

        if (
          (applicant.workHours === null || applicant.workHours === undefined) &&
          applicantValue?.workHours !== undefined
        ) {
          applicant.workHours = applicantValue?.workHours;
        }
      });
    });

    if (this.containerDto.applicationDto.loan.loanType === LOAN_TYPE.LINE_OF_CREDIT) {
      this.containerDto.applicationDto.loan.paymentAmount = loan?.paymentAmount
        ? loan?.paymentAmount
        : this.containerDto.applicationDto.loan.paymentAmount;
    }

    this.upsertLoanApplication();
  }

  private upsertLoanApplication() {
    this.containerDto.applicationDto.applications.forEach((application) => {
      application.applicants.forEach((applicant) => {
        applicant.applicantAddresses.forEach((address) => {
          address.markForReview = false;
        });
      });
    });

    setTimeout(() => {
      if (this.containerDto.applicationDto.loan.branchId !== '') {
        this.alreadySendIt = true;
        this.saveApplication(this.containerDto.applicationDto);
      }
    }, 1500);

    this.loanIdentifier = this.containerDto.applicationDto.loan.loanIdentifier
      ? this.containerDto.applicationDto.loan.loanIdentifier
      : '';
  }

  private submitMPApplication() {
    this.underwriteService
      .putUnderwrite(this.containerSubmissionRequest)
      .pipe(take(1))
      .subscribe({
        next: (response: SubmissionResponse) => {
          if (response.validations && response.validations.length > 0) {
            this.canAccess = false;
            this.errorMessage = response.validations[0].errorMessage;
          } else {
            this.getResponseApplication(this.containerSubmissionRequest.loanIdentifier);
          }
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
        error: (err) => {
          console.error('ERROR: ', err);
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
      });
  }

  private submitSPApplication() {
    this.loanService
      .submitSPLoan(this.containerSubmissionRequest)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response.validations && response.validations.length > 0) {
            this.canAccess = false;
            this.errorMessage = response.validations[0].errorMessage;
          } else {
            this.getResponseApplication(this.containerSubmissionRequest.loanIdentifier);
          }
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
        error: (err) => {
          console.error('ERROR: ', err);
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
      });
  }

  private setLoanBranchId() {
    setTimeout(() => {
      if (this.useService.userValue.branchId !== '') {
        this.containerDto.applicationDto.loan.branchId = this.useService.userValue.branchId;
      }
    }, 1000);
  }

  private getResponseApplication(loanIdentifier: string | undefined = undefined) {
    this.loanService
      .getLoanResponse(loanIdentifier !== undefined ? loanIdentifier : this.containerReqRespDto.loanIdentifier)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const closeMsg = {
            command: 'readyToClose',
            content: response,
          };
          let responseApplication = JSON.stringify(closeMsg);
          this.event.source.postMessage(responseApplication, this.event.origin);
          this.message = 'Application Response Sent Back';
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
        error: (error) => {
          this.message = 'An error Ocurred Trying to Get Application Response';
          let errorResponse = {
            message: 'An error ocurred trying to get application response',
            status: 500,
          };
          this.event.source.postMessage(JSON.stringify(errorResponse), this.event.origin);
          this.store.dispatch(setLoadingSpinner({ status: false }));
          window.self.close();
        },
        complete: () => {
          window.self.close();
        },
      });
  }
  private setInsuranceType() {
    const loanType = this.containerDto.applicationDto.loan.loanType;
    this.containerDto.applicationDto.loan.insuranceType = this.enumService.getSystemValue(getLoanTypeList(), loanType);
  }

  private saveApplication(loanRequest: LoanRequest): boolean {
    this.loanService
      .loanUpsert(loanRequest)
      .pipe(take(1))
      .subscribe({
        next: (value: UpsertResponse) => {
          if (value) {
            if (value.errors && value?.errors['UpsertFullLoanRequest']) {
              this.canAccess = false;
              this.errorMessage = value?.errors['Upsert'][0];
              this.errorMessage = this.errorMessage
                .replace('A stand-alone', 'An')
                .replace('exists', 'already exists')
                .replace('process,', 'process, please');
            } else {
              this.message = 'Application saved';
              this.router.navigate([`/new-policy/insurance-application/${loanRequest.loan.loanIdentifier}/2`]);
            }
            this.store.dispatch(setLoadingSpinner({ status: false }));
          }
        },
        error: (err) => {
          this.message = 'One or More Validation Errors Occurred';
          this.store.dispatch(setLoadingSpinner({ status: false }));
          console.error('Error: ', err);
        },
        complete: () => {
          this.store.dispatch(setLoadingSpinner({ status: false }));
        },
      });

    return false;
  }
}
