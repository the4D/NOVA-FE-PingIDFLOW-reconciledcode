import { QueryList } from '@angular/core';
import { ApplicantFormComponent } from './applicant-form/applicant-form.component';
import { Applicant } from 'src/app/core/models/insurance/applicant.model';
import { ApplicantEmail } from 'src/app/core/models/insurance/applicationDto.model';
import { ApplicantPhone } from 'src/app/core/models/insurance/applicant-phone.model';
import {
  APPLICATION_TYPE,
  CONSENT_APPLICATION_TERMS,
  CONSENT_MARKETING_TERMS,
  INSURANCE_TYPE,
} from 'src/app/core/utils/enums/insurance-enums';
import { getApplicantTypeList, getLoanTypeList } from 'src/app/core/utils/enums/system-enums';
import { EnumService } from 'src/app/core/services/insurance/enum.service';
import { Loan, LoanRequest } from 'src/app/core/models/insurance/loan.model';
import { formatDate } from '@angular/common';
import { ApplicationRequest } from '@core/models/insurance/application.model';

const enumService: EnumService = new EnumService();

export const createApplicantList = (
  applicantForms: QueryList<ApplicantFormComponent>,
  sourceType: string
): Applicant[] => {
  const applicantsList: Applicant[] = [];
  applicantForms.forEach((applicantInfo, index) => {
    let values = applicantInfo.applicantForm.getRawValue();
    const applicantEmail: ApplicantEmail[] = [];
    if (values.emailForm.emailAddress != null && values.emailForm.emailAddress !== '') {
      applicantEmail.push({
        emailAddress: values.emailForm.emailAddress,
        emailType: values.emailForm.emailType,
        isPrimary: values.emailForm.isPrimary,
      });
    }
    const applicantPhoneNumbers: ApplicantPhone[] = [
      {
        number: values.homePhoneForm.number,
        extension: '',
        phoneType: values.homePhoneForm.phoneType,
        isPrimary: values.homePhoneForm.isPrimary,
      },
    ];
    if (values.workPhoneForm.number !== null && values.workPhoneForm.number !== '') {
      applicantPhoneNumbers.push({
        number: values.workPhoneForm.number,
        extension: '',
        phoneType: values.workPhoneForm.phoneType,
        isPrimary: values.workPhoneForm.isPrimary,
      });
    }

    let applicant: Applicant = {
      applicantIdentifier: values.personalInfoForm.applicantIdentifier,
      applicantType: getApplicantType(
        values.personalInfoForm.applicationId,
        values.personalInfoForm.applicantType,
        index,
        sourceType,
        values.personalInfoForm.applicantSequence
      ),
      applicantSequence: values.personalInfoForm.applicantSequence ? values.personalInfoForm.applicantSequence : -1,
      firstName: values.personalInfoForm.firstName,
      middleName: values.personalInfoForm.middleName,
      lastName: values.personalInfoForm.lastName,
      placeOfBirth: values.personalInfoForm.placeOfBirth,
      birthDate: values.personalInfoForm.birthDate,
      gender: values.personalInfoForm.gender,
      isSmoker: values.personalInfoForm.isSmoker,
      language: values.personalInfoForm.language,
      selfEmployed: values.personalInfoForm.selfEmployed,
      workHours: values.personalInfoForm.workHours == true ? 0 : 20,
      occupation: values.personalInfoForm.occupation,
      applicationSignedDate: values.personalInfoForm.applicationSignedDate,
      applicantAddresses: [
        {
          streetNumber: values.addressForm.streetNumber,
          unitNumber: values.addressForm.unitNumber,
          street: values.addressForm.street,
          city: values.addressForm.city,
          province: values.addressForm.province,
          postalCode: values.addressForm.postalCode,
          country: 'CA',
          addressType: 'Mailing',
          addressStructureType: 'Civic',
          addressStatus: 'Own',
          isPrimary: values.addressForm.isPrimary,
          moveInDate: null,
          markForReview: false,
        },
      ],
      applicantPhones: applicantPhoneNumbers,
      applicantEmails: applicantEmail,
      applicantConsents: [
        {
          consentType: CONSENT_MARKETING_TERMS,
          hasConsented: values.consentForm.hasConsented,
        },
        {
          consentType: CONSENT_APPLICATION_TERMS,
          hasConsented: true,
        },
      ],
    };

    if (values.personalInfoForm.applicationId !== null && sourceType !== APPLICATION_TYPE.LOS) {
      applicant = {
        ...applicant,
        applicationId: values.personalInfoForm.applicationId,
        applicantSequence: values.personalInfoForm.applicantSequence,
      };
    }

    applicantsList.push(applicant);
  });

  return applicantsList;
};

const getApplicantType = (
  applicationId: number,
  applicantType: string,
  index: number,
  sourceType: string,
  applicantSequence: number
) => {
  if (sourceType === APPLICATION_TYPE.LOS) {
    return enumService.getAbbreviation(getApplicantTypeList(), applicantSequence);
  } else {
    return applicationId !== null ? applicantType : enumService.getAbbreviation(getApplicantTypeList(), index + 1);
  }
};

export const deleteApplicant = (
  applicantForms: QueryList<ApplicantFormComponent>,
  sourceType: string,
  applicantIdentifier: string,
  insuranceType: string
) => {
  const applicantList: Applicant[] = createApplicantList(applicantForms, sourceType);
  if (insuranceType === INSURANCE_TYPE.SINGLE_PREMIUM) {
    return fixApplicantsOrder(
      applicantList.filter((applicant: Applicant) => applicant.applicantIdentifier !== applicantIdentifier)
    );
  }
  return fixApplicantsOrderNotSP(
    applicantList.filter((applicant: Applicant) => applicant.applicantIdentifier !== applicantIdentifier)
  );
};

const fixApplicantsOrderNotSP = (applicantsCleared: Applicant[]) => {
  return applicantsCleared.map((applicant, index) => ({
    applicantSequence: index + 1,
    applicantType: enumService.getAbbreviation(getApplicantTypeList(), index + 1),
    applicantIdentifier: applicant.applicantIdentifier,
    firstName: applicant.firstName,
    middleName: applicant.middleName,
    lastName: applicant.lastName,
    placeOfBirth: applicant.placeOfBirth,
    birthDate: applicant.birthDate,
    gender: applicant.gender,
    isSmoker: applicant.isSmoker,
    language: applicant.language,
    selfEmployed: applicant.selfEmployed,
    workHours: applicant.workHours,
    occupation: applicant.occupation,
    applicationSignedDate: applicant.applicationSignedDate,
    applicantAddresses: applicant.applicantAddresses,
    applicantPhones: applicant.applicantPhones,
    applicantEmails: applicant.applicantEmails,
    applicantConsents: applicant.applicantConsents,
    applicationId: applicant.applicationId,
  }));
};

const fixApplicantsOrder = (applicantsCleared: Applicant[]) => {
  return applicantsCleared.map((applicant, index) => ({
    applicantType: enumService.getAbbreviation(getApplicantTypeList(), index + 1),
    applicantIdentifier: applicant.applicantIdentifier,
    firstName: applicant.firstName,
    middleName: applicant.middleName,
    lastName: applicant.lastName,
    placeOfBirth: applicant.placeOfBirth,
    birthDate: applicant.birthDate,
    gender: applicant.gender,
    isSmoker: applicant.isSmoker,
    language: applicant.language,
    selfEmployed: applicant.selfEmployed,
    workHours: applicant.workHours,
    occupation: applicant.occupation,
    applicationSignedDate: applicant.applicationSignedDate,
    applicantAddresses: applicant.applicantAddresses,
    applicantPhones: applicant.applicantPhones,
    applicantEmails: applicant.applicantEmails,
    applicantConsents: applicant.applicantConsents,
  }));
};

export const createLoanRequestObject = (applications: ApplicationRequest[], loan: Loan) => {
  const loanDto: LoanRequest = {
    loan: {
      loanIdentifier: loan.loanIdentifier,
      branchId: loan.branchId,
      userId: loan.userId,
      sourceType: loan.sourceType,
      loanType: loan.loanType,
      insuranceType: enumService.getSystemValue(getLoanTypeList(), loan.loanType),
      paymentType: loan.paymentType,
      fundingDate: loan.fundingDate,
      firstPaymentDate: loan.firstPaymentDate,
      issueDate: formatDate(loan.issueDate, 'yyyy-MM-dd', 'en-US'),
      effectiveDate: loan.effectiveDate,
      loanAmount: loan.loanAmount,
      paymentAmount: loan.paymentAmount,
      monthlyPaymentAmount: loan.monthlyPaymentAmount,
      paymentFrequency: loan.paymentFrequency,
      interestRate: loan.interestRate,
      loanTerm: loan.loanTerm,
      amortization: loan.amortization,
    },
    applications: applications,
  };

  return loanDto;
};
