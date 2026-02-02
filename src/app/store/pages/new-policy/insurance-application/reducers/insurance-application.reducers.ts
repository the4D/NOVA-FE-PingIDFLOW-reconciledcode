import { EnumService } from './../../../../../core/services/insurance/enum.service';
import { createReducer, on } from '@ngrx/store';
import { InitialInsuranceApplicationState, InsuranceApplicationState } from '../insurance-application.state';
import {
  applicationFullPad,
  deleteFormGroupMember,
  initializeInsuranceApplication,
  loadExistingLoanApplication,
  quoteInsuranceTypeApplication,
  quoteInsuranceTypeQuickQuote,
  regroupingApplicants,
  setApplicantFormGroupDeleted,
  setApplicationIdentifierEmpty,
  setApplicationLoading,
  setInsuranceApplicationPad,
  setInsuranceApplicationSubmitResponse,
  setInsuranceTypeQuickQuoteResponse,
  setInsuranceTypeResponse,
  setLoanApplicationLoaded,
  setLoanToInsuranceApplication,
  updateInsuranceApplicationStatus,
  updateLoanUserBranch,
  upsertLoanApplication,
} from '../actions/insurance-application.actions';
import { Application } from 'src/app/core/models/insurance/application.model';
import { ApplicationPADs } from 'src/app/core/models/insurance/application-pad-full.model';
import { APPLICATION_STATUS, WORK_HOUR } from 'src/app/core/utils/enums/insurance-enums';
import { getApplicantTypeList } from 'src/app/core/utils/enums/system-enums';
import { DatePipe } from '@angular/common';
import { ApplicantFormGroup } from 'src/app/core/models/insurance/applicant-formGroup.model';
import { Applicant } from 'src/app/core/models/insurance/applicant.model';

export const insuranceApplicationReducer = createReducer(
  InitialInsuranceApplicationState,
  on(initializeInsuranceApplication, (state) => {
    return {
      ...state,
      loan: InitialInsuranceApplicationState.loan,
      applicationPadsFull: InitialInsuranceApplicationState.applicationPadsFull,
      applicantFormGroup: InitialInsuranceApplicationState.applicantFormGroup,
      quoteInsuranceTypeResponse: InitialInsuranceApplicationState.quoteInsuranceTypeResponse,
    };
  }),
  on(setLoanToInsuranceApplication, (state, action) => {
    return {
      ...state,
      loan: {
        ...action.loan,
        monthlyPaymentAmount: state.loan.monthlyPaymentAmount,
      },
    };
  }),
  on(setLoanApplicationLoaded, (state, action) => {
    let stateObject = {
      ...state,
      loading: false,
      loan: {
        ...state.loan,
        loanIdentifier: action.response.loan.loanIdentifier,
        sourceType: action.response.loan.sourceType,
        loanType: action.response.loan.loanType,
        insuranceType: action.response.loan.insuranceType,
        paymentType: action.response.loan.paymentType,
        fundingDate: action.response.loan.fundingDate,
        firstPaymentDate: action.response.loan.firstPaymentDate,
        issueDate: action.response.loan.issueDate,
        effectiveDate: action.response.loan.effectiveDate,
        loanAmount: action.response.loan.loanAmount,
        paymentAmount: action.response.loan.paymentAmount,
        monthlyPaymentAmount: action.response.loan.monthlyPaymentAmount,
        paymentFrequency: action.response.loan.paymentFrequency,
        interestRate: action.response.loan.interestRate,
        loanTerm: action.response.loan.loanTerm,
        amortization: action.response.loan.amortization,
        loanCoverageLimit: action.response.loan.loanCoverageLimit,
        paymentCoverageLimit: action.response.loan.paymentCoverageLimit,
        segmentType: action.response.loan.segmentType,
        creditType: action.response.loan.creditType,
        channelType: action.response.loan.channelType,
        branch: action.response.loan.branch ? action.response.loan.branch : state.loan.branch,
        user: action.response.loan.user ? action.response.loan.user : state.loan.user,
        applications: action.response.applications ? action.response.applications : action.response.loan.applications,
        // applications: action.response.loan.applications
        //   ? action.response.loan.applications
        //   : state.loan.applications,
        branchId: action.response.loan.branchId,
        userId: action.response.loan.userId,
      },
      applicantFormGroup: action.response.applicantFormGroup,
      validations: action.response.validations,
    };

    if (action.response.loan.applications) {
      const applicationPADs: ApplicationPADs[] = action.response.loan.applications.map((application: Application) => ({
        applicationId: application.id ? application.id : 0,
        applicationPAD: application.applicationPAD,
      }));

      stateObject = {
        ...stateObject,
        applicationPadsFull: {
          ...state.applicationPadsFull,
          loanIdentifier: action.response.loan.loanIdentifier,
          applicationPADs: applicationPADs,
        },
      };
    }

    return stateObject;
  }),
  on(loadExistingLoanApplication, (state) => {
    return {
      ...state,
      loading: true,
    };
  }),
  on(upsertLoanApplication, (state) => {
    return {
      ...state,
      loading: true,
    };
  }),
  on(quoteInsuranceTypeApplication, (state) => {
    return {
      ...state,
      loading: true,
    };
  }),
  on(setApplicationLoading, (state, action) => {
    return {
      ...state,
      loading: action.status,
    };
  }),
  on(regroupingApplicants, (state) => {
    return {
      ...state,
      loading: true,
    };
  }),
  on(applicationFullPad, (state) => {
    return {
      ...state,
      loading: true,
    };
  }),
  on(setInsuranceTypeResponse, (state, action) => {
    if (state.loan.applications === undefined && state.quoteInsuranceTypeResponse.applications.length > 0) {
      return {
        ...state,
        loading: false,
        loan: {
          ...state.loan,
          applications: state.quoteInsuranceTypeResponse.applications,
        },
      };
    } else {
      return {
        ...state,
        loading: false,
        quoteInsuranceTypeResponse: {
          ...state.quoteInsuranceTypeResponse,
          applications: action.response.applications,
          insuranceType: action.response.insuranceType,
          loanId: action.response.loanId,
          loanCoverageLimit: action.response.loanCoverageLimit,
          paymentCoverageLimit: action.response.paymentCoverageLimit,
          healthQuestions: action.response.healthQuestions,
        },
      };
    }
  }),
  on(setInsuranceApplicationPad, (state, action) => {
    return {
      ...state,
      loading: false,
      applicationPadsFull: {
        ...state.applicationPadsFull,
        loanIdentifier: action.object.loanIdentifier,
        applicationPADs: action.object.applicationPADs,
      },
    };
  }),
  on(updateInsuranceApplicationStatus, (state, action) => {
    const applicationsTemp: Application[] = [];
    if (action.response === 'Draft') {
      state.loan.applications?.forEach((application: Application) => {
        applicationsTemp.push({
          ...application,
          applicationStatus: APPLICATION_STATUS.DRAFT,
        });
      });
    } else if (action.requestFrom === 'commitInsurance') {
      state.loan.applications?.forEach((application: Application) => {
        applicationsTemp.push({
          ...application,
          applicationStatus: APPLICATION_STATUS.SUBMITTED,
        });
      });
    } else if (action.requestFrom === APPLICATION_STATUS.DRAFT) {
      state.loan.applications?.forEach((application: Application) => {
        applicationsTemp.push({
          ...application,
          applicationStatus:
            application.id?.toString() === action.applicationId?.toString()
              ? APPLICATION_STATUS.DRAFT
              : application.applicationStatus,
          formSigningDate:
            application.id?.toString() === action.applicationId?.toString()
              ? action.formSigningDate
                ? new DatePipe('en-US').transform(action.formSigningDate, 'yyyy-MM-dd HH:mm:ss')
                : application.formSigningDate
              : application.formSigningDate,
        });
      });
    } else {
      state.loan.applications?.forEach((application: Application) => {
        applicationsTemp.push({
          ...application,
          applicationStatus:
            application.id?.toString() === action.applicationId?.toString() &&
            application.applicationStatus != APPLICATION_STATUS.SUBMITTED
              ? APPLICATION_STATUS.PENDING
              : application.applicationStatus,
          formSigningDate:
            application.id?.toString() === action.applicationId?.toString() &&
            application.applicationStatus != APPLICATION_STATUS.SUBMITTED
              ? action.formSigningDate
                ? new DatePipe('en-US').transform(action.formSigningDate, 'yyyy-MM-dd HH:mm:ss')
                : application.formSigningDate
              : application.formSigningDate,
        });
      });
    }
    return {
      ...state,
      loading: false,
      loan: {
        ...state.loan,
        applications: applicationsTemp,
      },
    };
  }),
  on(setInsuranceApplicationSubmitResponse, (state, action) => {
    return {
      ...state,
    };
  }),
  on(updateLoanUserBranch, (state, action) => {
    return {
      ...state,
      loan: {
        ...state.loan,
        branchId: action.loan.branchId,
        userId: action.loan.userId,
      },
    };
  }),
  on(setInsuranceTypeQuickQuoteResponse, (state, action) => {
    return {
      ...state,
      loading: false,
      quoteInsuranceTypeResponse: action.response,
    };
  }),
  on(quoteInsuranceTypeQuickQuote, (state) => {
    return {
      ...state,
      loading: true,
    };
  }),
  on(setApplicationIdentifierEmpty, (state: InsuranceApplicationState) => {
    const applications = state.loan.applications?.map(
      (application) =>
        (application = {
          ...application,
          id: undefined,
        })
    );

    const forms: ApplicantFormGroup[] = [];
    const service = new EnumService();
    state.applicantFormGroup.forEach((appFormGroup: ApplicantFormGroup) => {
      let formGroup: Applicant | undefined = appFormGroup.personalInfoForm;

      const applicantType = service.getAbbreviation(getApplicantTypeList(), formGroup?.applicantSequence);

      formGroup = {
        ...formGroup,
        applicationId: undefined,
        applicantType: applicantType,
        firstName: formGroup?.firstName ? formGroup.firstName : '',
        middleName: formGroup?.middleName ? formGroup.middleName : '',
        lastName: formGroup?.lastName ? formGroup.lastName : '',
        placeOfBirth: formGroup?.placeOfBirth ? formGroup.placeOfBirth : '',
        birthDate: formGroup?.birthDate ? formGroup.birthDate : '',
        gender: formGroup?.gender ? formGroup.gender : '',
        isSmoker: formGroup?.isSmoker ? formGroup.isSmoker : false,
        language: 'en',
        selfEmployed: formGroup?.selfEmployed ? formGroup.selfEmployed : false,
        workHours: formGroup?.workHours ? formGroup.workHours : WORK_HOUR.MIN_WORK_HOURS_PER_WEEK,
        occupation: formGroup?.occupation ? formGroup.occupation : '',
        applicantAddresses: formGroup?.applicantAddresses ? formGroup?.applicantAddresses : [],
        applicantPhones: formGroup?.applicantPhones ? formGroup?.applicantPhones : [],
        applicantEmails: formGroup?.applicantEmails ? formGroup?.applicantEmails : [],
        applicantConsents: formGroup?.applicantConsents ? formGroup?.applicantConsents : [],
      };

      forms.push(
        (appFormGroup = {
          ...appFormGroup,
          personalInfoForm: formGroup,
        })
      );
    });

    return {
      ...state,
      loan: {
        ...state.loan,
        applications: applications,
      },
      applicantFormGroup: forms,
    };
  }),
  on(setApplicantFormGroupDeleted, (state, action) => {
    return {
      ...state,
      applicantFormGroup: action.response,
      loading: false,
    };
  })
);
