import { applicantFormGroupInitialState } from './../../../../../core/models/insurance/applicant-formGroup.model';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, catchError, map, mergeMap, shareReplay, switchMap, take, filter, of } from 'rxjs';
import { LoanService } from 'src/app/core/services/insurance/loan.service';
import { EnumService } from 'src/app/core/services/insurance/enum.service';
import {
  APPLICANT_TYPE,
  APPLICATION_STATUS,
  APPLICATION_TYPE,
  QQ_LOAN_IDENTIFIER,
  SEVERITY_ERROR,
} from 'src/app/core/utils/enums/insurance-enums';
import {
  getAddressTypeList,
  getConsentTypeList,
  getEmailTypeList,
  getPhoneTypeList,
} from 'src/app/core/utils/enums/system-enums';
import { ApplicantFormGroup } from 'src/app/core/models/insurance/applicant-formGroup.model';
import { FullLoan, Loan, loanInitialState } from 'src/app/core/models/insurance/loan.model';
import { Application, ApplicationRequest } from 'src/app/core/models/insurance/application.model';
import { QuoteService } from 'src/app/core/services/insurance/quote.service';
import { ApplicantService } from 'src/app/core/services/insurance/applicant.service';
import {
  APPLICATION_FULL_PAD,
  COMMIT_INSURANCE_APPLICATION,
  DELETE_APPLICANT_FORM_GROUP,
  GENERATE_PAPER_WORK,
  GET_FULL_RESPONSE_TYPE_APPLICATION,
  GET_LOAN_INSURANCE_APPLICATION,
  QUOTE_INSURANCE_TYPE_APPLICATION,
  QUOTE_INSURANCE_TYPE_QUICK_QUOTE,
  REGROUPING_APPLICANTS_APPLICATION,
  SET_DELETE_APPLICANT_FORM_GROUP,
  SET_INSURANCE_APPLICATION_PAD,
  SET_INSURANCE_APPLICATION_STATUS,
  SET_INSURANCE_TYPE_QUICK_QUOTE_RESPONSE,
  SET_INSURANCE_TYPE_RESPONSE,
  SET_LOAN_APPLICATION_LOADED,
  SET_PAPER_WORK_RESPONSE,
  SET_QUOTE_TYPE_RESPONSE,
  UPDATE_APPLICATION_STATUS,
  UPSERT_LOAN_INSURANCE_APPLICATION,
} from '../actions/insurance-application.actions.enums';
import {
  SET_LOADING_ACTION,
  setLoadingSpinner,
} from 'src/app/store/core/component/loading-spinner/loading-spinner.actions';
import { ApplicationPadService } from 'src/app/core/services/insurance/application-pad.service';
import { ApplicationService } from 'src/app/core/services/insurance/application.service';
import { UnderwriteService } from 'src/app/core/services/insurance/underwrite.service';
import { AppState } from 'src/app/store';
import { Store } from '@ngrx/store';
import { Applicant } from 'src/app/core/models/insurance/applicant.model';
import { ApplicantAddress } from 'src/app/core/models/insurance/applicant-address.model';
import moment from 'moment';
import {
  insuranceApplicationApplicantFormGroupSelector,
  loadingInformationSelector,
} from '../selectors/insurance-application.selectors';
import { DeleteApplicantEffect } from '@core/models/insurance/applicant-delete-effect.model';

@Injectable()
export class ApplicationEffects {
  constructor(
    private actions$: Actions,
    private loanService: LoanService,
    private quoteService: QuoteService,
    private applicantService: ApplicantService,
    private applicationPadService: ApplicationPadService,
    private applicationService: ApplicationService,
    private underwriteService: UnderwriteService,
    private store: Store<AppState>,
    private enumService: EnumService
  ) {}

  loadLoanInfo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GET_LOAN_INSURANCE_APPLICATION),
      mergeMap((prop: any) =>
        this.loanService.getLoan(prop.loanIdentifier).pipe(
          map((objectResponse) => {
            let applicantFormGroupList: ApplicantFormGroup[] = objectResponse.loan
              ? this.getFormGroupsByApplications(objectResponse.loan.applications)
              : applicantFormGroupInitialState();



            const applications: Array<{ id: string, fileNumberCancelled: string }> = [];

            if (objectResponse.loan?.applications) {
              objectResponse.loan.applications.forEach((applicantion) => {
                 sessionStorage.setItem("APPLICATIONSTATUS", applicantion.applicationStatus);
                if (applicantion.fileNumberCancelled !== null && applicantion.fileNumberCancelled !== undefined) {
                  applications.push({
                    id: applicantion.id ? applicantion.id.toString() : '',
                    fileNumberCancelled: applicantion.fileNumberCancelled ? applicantion.fileNumberCancelled : '',
                  });
                }
              });
              if (applications.length > 0) {
                sessionStorage.setItem("APPLICATIONCANCELLEDFILENUMBERMAP", JSON.stringify(applications));
              } else {
                sessionStorage.removeItem("APPLICATIONCANCELLEDFILENUMBERMAP");
              }
            }

            let objectWithForms: FullLoan;

            if (objectResponse.loan === null) {
              const loan = loanInitialState();
              objectWithForms = {
                ...objectResponse,
                loan: loan,
                applicantFormGroup: applicantFormGroupList,
              };
            } else {
              objectWithForms = {
                ...objectResponse,
                applicantFormGroup: applicantFormGroupList,
              };
            }

            return { type: SET_LOAN_APPLICATION_LOADED, response: objectWithForms };
          }),
          catchError((error) => {
            console.error('Error on effect ', GET_LOAN_INSURANCE_APPLICATION, ': ', error);
            return EMPTY;
          })
        )
      )
    )
  );

  loadLoanInfoAfterCommit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(COMMIT_INSURANCE_APPLICATION),
      mergeMap((prop: any) =>
        this.underwriteService.putUnderwrite(prop.loanIdentifier).pipe(
          map((response) => {
            return { type: SET_LOAN_APPLICATION_LOADED, response };
          }),
          catchError((error) => {
            console.error('Error on effect ', SET_LOAN_APPLICATION_LOADED, ': ', error);
            return EMPTY;
          })
        )
      )
    )
  );

  generatePaperWork$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GENERATE_PAPER_WORK),
      mergeMap((props: any) =>
        this.applicationService.generatePaperwork(props.searchOptions).pipe(
          map((response) => {
            return { type: SET_PAPER_WORK_RESPONSE, response: response };
          }),
          catchError((error) => {
            console.error('Error on effect ', SET_PAPER_WORK_RESPONSE, ':', error);
            return EMPTY;
          })
        )
      )
    )
  );

  quoteInsuranceTypeRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GET_FULL_RESPONSE_TYPE_APPLICATION),
      mergeMap((prop: any) =>
        this.quoteService.getFullQuoteResponse(prop.loanIdentifier).pipe(
          map((response) => {
            return { type: SET_INSURANCE_TYPE_RESPONSE, response };
          }),
          catchError((error) => {
            console.error('Error on effect ', SET_QUOTE_TYPE_RESPONSE, ': ', error);
            return EMPTY;
          })
        )
      )
    )
  );

  quoteInsuranceTypeApplication$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QUOTE_INSURANCE_TYPE_APPLICATION),
      mergeMap((props: any) =>
        this.quoteService.quoteInsuranceType(props.request).pipe(
          map((response) => {
            return { type: SET_INSURANCE_TYPE_RESPONSE, response };
          }),
          catchError((error) => {
            console.error('Error on effect ', QUOTE_INSURANCE_TYPE_APPLICATION, ': ', error);
            return EMPTY;
          })
        )
      )
    )
  );

  upsertLoanApplication$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UPSERT_LOAN_INSURANCE_APPLICATION),
      mergeMap((prop: any) =>
        this.loanService.loanUpsert(prop.request).pipe(
          take(1),
          shareReplay(),
          switchMap((objectResponse) => {
            const appValidations = objectResponse.quote.applications.filter(
              (application: any) => application.validations?.length > 0
            );

            if (
              appValidations.length === 0 ||
              appValidations.filter((validation: any) => validation.severity === SEVERITY_ERROR.Error).length === 0
            ) {
              let applicantFormGroupList: ApplicantFormGroup[] = [];
              prop.request.applications?.forEach((application: ApplicationRequest) => {
                this.getFormGroupsByApplicants(application.applicants, objectResponse.quote.applications).forEach(
                  (group) => {
                    applicantFormGroupList.push(group);
                  }
                );
              });
              const fullLoan = {
                loan: prop.request.loan,
                applications: objectResponse.quote.applications,
                applicantFormGroup: applicantFormGroupList,
                validations: [],
              };

              return [
                { type: SET_LOADING_ACTION, status: true },
                { type: SET_LOAN_APPLICATION_LOADED, response: fullLoan },
                { type: SET_INSURANCE_TYPE_RESPONSE, response: objectResponse.quote },
              ];
            } else {
              return [{ type: SET_LOADING_ACTION, status: false }];
            }
          }),
          catchError((error) => {
            console.error('Error on effect', UPSERT_LOAN_INSURANCE_APPLICATION, ': ', error);
            this.store.dispatch(setLoadingSpinner({ status: false }));
            return EMPTY;
          })
        )
      )
    )
  );

  regroupingApplicants$ = createEffect(() =>
    this.actions$.pipe(
      ofType(REGROUPING_APPLICANTS_APPLICATION),
      mergeMap((props: any) =>
        this.applicantService.regroupApplicants(props.request).pipe(
          map((response) => {
            return { type: SET_INSURANCE_TYPE_RESPONSE, response };
          })
        )
      )
    )
  );

  applicationStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UPDATE_APPLICATION_STATUS),
      mergeMap((props: any) =>
        this.applicationService.draftApplication(props.loanIdentifier).pipe(
          map((response) => {
            return { type: SET_INSURANCE_APPLICATION_STATUS, response: APPLICATION_STATUS.DRAFT };
          }),
          catchError((error) => {
            console.error('ERROR ON applicationStatus Effect: ', error);
            return EMPTY;
          })
        )
      )
    )
  );

  deleteApplicantFromGroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DELETE_APPLICANT_FORM_GROUP),
      mergeMap(({ object }: any) => {
        return of(object.applicantFormGroups).pipe(
          map((response) => {
            const applicantList = response?.filter(
              (formGroup: ApplicantFormGroup) =>
                formGroup.personalInfoForm?.applicantIdentifier !== object.applicantIdentifier
            );
            return { type: SET_DELETE_APPLICANT_FORM_GROUP, response: applicantList };
          })
        );
      })
    )
  );

  applicationFullPAD$ = createEffect(() =>
    this.actions$.pipe(
      ofType(APPLICATION_FULL_PAD),
      mergeMap((props: any) =>
        this.applicationPadService.createApplicationPadFull(props.request).pipe(
          map((response) => {
            return { type: SET_INSURANCE_APPLICATION_PAD, object: props.request };
          }),
          catchError((error) => {
            console.error('ERROR ON applicationFullPAD Effect: ', error);
            return EMPTY;
          })
        )
      )
    )
  );

  /***************************************************************************/
  /*************************  Quick Quote Effects ****************************/
  /***************************************************************************/

  quoteInsuranceTypeQuickQuote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QUOTE_INSURANCE_TYPE_QUICK_QUOTE),
      mergeMap((props: any) => {
        return this.quoteService.quoteInsuranceType(props.request).pipe(
          switchMap((response) => {
            let loan: Loan = {
              id: props.request.loanId,
              branchId: props.request.branchId,
              userId: props.request.lenderId,
              // loanIdentifier: props.request.loanIdentifier,
              loanIdentifier: QQ_LOAN_IDENTIFIER,
              loanType: props.request.loanType,
              sourceType: APPLICATION_TYPE.NOVA,
              insuranceType: props.request.insuranceType,
              paymentType: props.request.paymentType,
              channelType: props.request.channelType,
              fundingDate: props.request.fundingDate,
              firstPaymentDate: props.request.firstPaymentDate,
              issueDate: '',
              effectiveDate: '',
              loanAmount: props.request.loanAmount,
              paymentAmount: props.request.paymentAmount,
              monthlyPaymentAmount: props.request.monthlyPaymentAmount,
              paymentFrequency: props.request.paymentFrequency,
              interestRate: props.request.interestRate,
              loanTerm: props.request.loanTerm,
              loanCoverageLimit: props.request.loanCoverageLimit,
              paymentCoverageLimit: props.request.paymentCoverageLimit,
              amortization: props.request.amortization,
            };

            const applicants: Applicant[] = [];
            props.request.applications.forEach((application: Application) => {
              application.applicants.forEach((applicant: Applicant | any) => {
                const applicantAddress: ApplicantAddress[] = [
                  {
                    applicantId: applicant.id,
                    streetNumber: '',
                    unitNumber: '',
                    street: '',
                    city: '',
                    province: applicant.province,
                    postalCode: '',
                    country: '',
                    addressType: '',
                    addressStructureType: '',
                    addressStatus: '',
                    isPrimary: true,
                    moveInDate: null,
                    markForReview: false,
                  },
                ];

                applicant = {
                  ...applicant,
                  applicantIdentifier: applicant.applicantIdentifier,
                  birthDate: moment(applicant.birthDate).format('YYYY-MM-DD'),
                  workHours: applicant.workHours,
                  applicantAddresses: applicantAddress,
                };
                applicants.push(applicant);
              });
            });

            const applications: Application[] = [];
            response.applications.forEach((application: Application) => {
              application = {
                ...application,
                applicationStatus: APPLICATION_STATUS.DRAFT,
              };
              const applicantsTemp: Applicant[] = application.applicants.map((applicant: Applicant) => {
                const applicantInfo: Applicant = props.request.applications
                  .find((applicationF: Application) => applicationF.id === application.id)
                  .applicants.find((app: Applicant) => app.applicantType === applicant.applicantType);

                return (applicant = {
                  ...applicant,
                  applicantSequence: props.request.applications
                    .find((applicationF: Application) => applicationF.id === application.id)
                    .applicants.find((app: Applicant) => app.applicantType === applicant.applicantType)
                    .applicantSequence,
                  firstName: applicantInfo.firstName,
                  lastName: applicantInfo.lastName,
                  applicantIdentifier: applicantInfo.applicantIdentifier,
                  birthDate: moment(applicantInfo.birthDate).format('YYYY-MM-DD'),
                  workHours: applicantInfo.workHours,
                });
              });

              applications.push({ ...application, applicants: applicantsTemp });
            });

            response = {
              ...response,
              applications: applications,
            };

            loan = {
              ...loan,
              applications: response.applications,
            };

            const applicantFormGroup = this.getFormGroupsByApplicants(applicants, applications);

            const fullLoan = {
              loan: loan,
              applications: response.applications,
              applicantFormGroup: applicantFormGroup,
              validations: [],
            };

            return [
              { type: SET_LOADING_ACTION, status: false },
              { type: SET_LOAN_APPLICATION_LOADED, response: fullLoan },
              { type: SET_INSURANCE_TYPE_QUICK_QUOTE_RESPONSE, response: response },
            ];
          }),
          catchError((error) => {
            console.error('Error on effect ', QUOTE_INSURANCE_TYPE_APPLICATION, ': ', error);
            return EMPTY;
          })
        );
      })
    )
  );

  private getFormGroupsByApplications(applications: Application[] | undefined) {
    let applicantFormGroupList: ApplicantFormGroup[] = [];
    applications?.forEach((application) => {
      this.getFormGroupsByApplicants(application.applicants, applications).forEach((group) => {
        applicantFormGroupList.push(group);
      });
    });
    return applicantFormGroupList;
  }

  private getApplicationIdByApplicantIdentifier(
    applicantIdentifier: string | undefined,
    applications: ApplicationRequest[] | undefined
  ) {
    let applicationId = 0;
    applications?.forEach((application) =>
      application.applicants.forEach((applicant) => {
        if (applicant.applicantIdentifier === applicantIdentifier) {
          applicationId = applicant.applicationId ? applicant.applicationId : 0;
        }
      })
    );

    return applicationId;
  }

  private getFormGroupsByApplicants(applicants: Applicant[], applicationsResponse?: ApplicationRequest[]) {
    let applicantFormGroupList: ApplicantFormGroup[] = [];
    applicants.forEach((applicant: Applicant) => {
      let applicantTemp: Applicant = applicant;
      const applicationId = this.getApplicationIdByApplicantIdentifier(
        applicant.applicantIdentifier,
        applicationsResponse
      );

      if (applicationId !== 0) {
        applicantTemp = {
          ...applicantTemp,
          applicationId: applicationId,
        };
      }

      if (applicationsResponse) {
        const applicantFilter = applicationsResponse
          .map((application) =>
            application.applicants.find(
              ({ applicantIdentifier }) => applicantIdentifier === applicant.applicantIdentifier
            )
          )
          .find((application) => application !== undefined);

        const finalType =
          applicantFilter?.applicantType !== undefined ? applicantFilter?.applicantType : APPLICANT_TYPE.PRIMARY;

        applicantTemp = {
          ...applicantTemp,
          applicantType: finalType,
        };
      }

      let applicantFormGroup: ApplicantFormGroup = {
        personalInfoForm: applicantTemp,
        homePhoneForm: applicant.applicantPhones?.filter(
          (phone) => phone.phoneType === this.enumService.getAbbreviation(getPhoneTypeList(), 1)
        )[0],
        workPhoneForm: applicant.applicantPhones?.filter(
          (phone) => phone.phoneType === this.enumService.getAbbreviation(getPhoneTypeList(), 2)
        )[0],
        emailForm: applicant.applicantEmails?.filter(
          (email) => email.emailType === this.enumService.getAbbreviation(getEmailTypeList(), 1)
        )[0],
        addressForm: applicant.applicantAddresses?.filter(
          (address) => address.addressType === this.enumService.getAbbreviation(getAddressTypeList(), 4)
        )[0],
        consentForm: applicant.applicantConsents?.filter(
          (consent) => consent.consentType === this.enumService.getAbbreviation(getConsentTypeList(), 2)
        )[0],
        coverageForm: applicant.coverages,
      };
      applicantFormGroupList.push(applicantFormGroup);
    });

    return applicantFormGroupList;
  }
}
