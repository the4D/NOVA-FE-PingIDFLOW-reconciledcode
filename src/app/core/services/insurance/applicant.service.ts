import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApplicantAddress } from '@core/models/insurance/applicant-address.model';
import { ApplicantConsent } from '@core/models/insurance/applicant-consent.model';
import { ApplicantEmail } from '@core/models/insurance/applicant-email.model';
import { ApplicantFormGroup, applicantFormGroupInitialState } from '@core/models/insurance/applicant-formGroup.model';
import { ApplicantPhone } from '@core/models/insurance/applicant-phone.model';
import { Applicant } from '@core/models/insurance/applicant.model';
import { RegroupQuoteApplication } from '@core/models/insurance/regroup-applicant.model';

const BASE_URL: string = 'INSURANCE_API/';
const APPLICANT_URL: string = 'Applicant/';
const APPLICANT_ADDRESS_URL: string = 'ApplicantAddress/';
const APPLICANT_PHONE_URL: string = 'ApplicantPhone/';
const APPLICANT_CONSENT_URL: string = 'ApplicantConsent/';
const APPLICANT_EMAIL_URL: string = 'ApplicantEmail/';
const FULL: string = 'Full';
const REGROUP: string = 'Regroup';

@Injectable({ providedIn: 'root' })
export class ApplicantService {
  private httpClient = inject(HttpClient);

  private _applicantFormGroups: BehaviorSubject<ApplicantFormGroup[]> = new BehaviorSubject(
    applicantFormGroupInitialState()
  );

  get applicantFormGroups$() {
    return this._applicantFormGroups.asObservable();
  }

  destroySession(): void {
    this._applicantFormGroups.next([]);
  }

  get applicantFormGroupsValue() {
    return this._applicantFormGroups.value;
  }

  set applicantFormGroups(applicantFormGroupsValue: ApplicantFormGroup[] | null) {
    if (applicantFormGroupsValue === null) {
      this.destroySession();
      return;
    }
    this._applicantFormGroups.next(applicantFormGroupsValue);
  }

  public createApplicant(applicant: Applicant): Observable<string> {
    return this.httpClient.post<string>(BASE_URL + APPLICANT_URL, {
      applicantDto: applicant,
    });
  }

  public updateApplicant(applicant: Applicant): Observable<void> {
    return this.httpClient.put<void>(BASE_URL + APPLICANT_URL, {
      applicantDto: applicant,
    });
  }

  public createApplicantAddress(applicantAddress: ApplicantAddress): Observable<string> {
    return this.httpClient.post<string>(BASE_URL + APPLICANT_ADDRESS_URL, {
      applicantAddressDto: applicantAddress,
    });
  }

  public updateApplicantAddress(applicantAddress: ApplicantAddress): Observable<void> {
    return this.httpClient.put<void>(BASE_URL + APPLICANT_ADDRESS_URL, {
      applicantAddressDto: applicantAddress,
    });
  }

  public createApplicantPhone(applicantPhone: ApplicantPhone): Observable<string> {
    return this.httpClient.post<string>(BASE_URL + APPLICANT_PHONE_URL, {
      applicantPhoneDto: applicantPhone,
    });
  }

  public updateApplicantPhone(applicantPhone: ApplicantPhone): Observable<void> {
    return this.httpClient.put<void>(BASE_URL + APPLICANT_PHONE_URL, {
      applicantPhoneDto: applicantPhone,
    });
  }

  public createApplicantEmail(applicantEmail: ApplicantEmail): Observable<string> {
    return this.httpClient.post<string>(BASE_URL + APPLICANT_EMAIL_URL, {
      applicantEmailDto: applicantEmail,
    });
  }

  public updateApplicantEmail(applicantEmail: ApplicantEmail): Observable<void> {
    return this.httpClient.put<void>(BASE_URL + APPLICANT_EMAIL_URL, {
      applicantEmailDto: applicantEmail,
    });
  }

  public createApplicantConsent(applicantConsent: ApplicantConsent): Observable<string> {
    return this.httpClient.post<string>(`${BASE_URL}${APPLICANT_CONSENT_URL}${FULL}`, applicantConsent);
  }

  public updateApplicantConsent(applicantConsent: ApplicantConsent): Observable<string> {
    return this.httpClient.put<string>(BASE_URL + APPLICANT_CONSENT_URL, {
      applicantConsentDto: applicantConsent,
    });
  }

  public getApplicantConsent(applicantId: string, consentType: string): Observable<ApplicantConsent> {
    return this.httpClient.get<ApplicantConsent>(`${BASE_URL}${APPLICANT_CONSENT_URL}${applicantId}/${consentType}`);
  }

  public getApplicantConsentByIdentifiers(
    applicationIdentifier: string,
    applicantIdentifier: string,
    consentType: string
  ): Observable<any> {
    return this.httpClient.get<any>(
      `${BASE_URL}${APPLICANT_CONSENT_URL}${applicationIdentifier}/${applicantIdentifier}/${consentType}`
    );
  }

  public deleteApplicant(
    applicationIdentifier: string | number,
    applicantIdentifier: string
  ): Observable<ApplicantConsent> {
    return this.httpClient.delete<ApplicantConsent>(
      `${BASE_URL}${APPLICANT_URL}${applicationIdentifier}/${applicantIdentifier}`
    );
  }

  public regroupApplicants(regroupApplication: RegroupQuoteApplication): Observable<any> {
    return this.httpClient.post<any>(`${BASE_URL}${APPLICANT_URL}${REGROUP}`, regroupApplication);
  }
}
