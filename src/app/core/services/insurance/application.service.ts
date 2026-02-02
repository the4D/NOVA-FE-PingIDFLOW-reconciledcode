import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs';
import { BlobFile } from '@core/models/insurance/blob.model';
import { ICarrierRequestSubmitClaim } from '@core/models/insurance/carrier-request-submit-claim.model';
import { ApplicationFormBlob, FormMetadata } from '@core/models/insurance/application-form-blob.model';
import { IApplicationDto } from '@core/models/insurance/applicationDto.model';
import { Loan, loanInitialState } from '@core/models/insurance/loan.model';
import { applicationPadInitialState } from '@core/models/insurance/application-pad-full.model';
import { ApplicationForm, FormMetadata1 } from '@core/models/insurance/application-form.model';
import { ApplicationFull } from '@core/models/insurance/application-full.model';
import { ApplicationPad } from '@core/models/insurance/application-pad.model';
import {
  ApplicationResourceParams,
  PaginatedApplication,
  ApplicationsSummaryByStatus,
  SubmitApplicationDto,
  applicationInitialState,
  ApplicationsByCriteria,
  Application,
} from '@core/models/insurance/application.model';
import { UnderwriteResponse } from '@core/models/insurance/underwrite.model';
import { LoanService } from './loan.service';
import { ApplicationPadService } from './application-pad.service';
import { ApplicantResult } from '@core/models/insurance/applicant.model';

const BASE_URL: string = 'INSURANCE_API/';
const APPLICATION_URL: string = BASE_URL + 'Application/';
const UPDATEFILENUMBERBULK_URL: string = BASE_URL + 'Application/' + 'UpdateFileNumberCancelled';
const APPLICATIONS_BY_CRITERIA_URL: string = BASE_URL + 'Application/Criteria?';
const APPLICATIONS_SUMMARY_BY_STATUS_URL: string = BASE_URL + 'Application/Summary?';
const APPLICATION_SEARCH_URL: string = BASE_URL + 'Applicant/search/';
const LOAN_URL: string = BASE_URL + 'Loan/';
const APPLICATION_PAD_URL: string = BASE_URL + 'ApplicationPAD/';
const APPLICATION_FORM_URL: string = BASE_URL + 'ApplicationForm/';
const APPLICATION_FORM_GENERATE_URL: string = BASE_URL + 'ApplicationForm/Generate';
const UPLOAD_CLAIM_URL: string = BASE_URL + 'CarrierRequest/UploadClaim/';
const SUBMIT_CLAIM_URL: string = BASE_URL + 'CarrierRequest/SubmitClaim/';
const SUBMIT_APPLICATION_URL: string = BASE_URL + 'Application/Submit';
const APPLICATION_DRAFT_URL: string = BASE_URL + 'Loan/Draft';
const FULL: string = 'Full';

const APPLICATION_CURRENT_STEP: string = '__application_current_step__';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private httpClient = inject(HttpClient);
  private loanService = inject(LoanService);
  private applicationPadService = inject(ApplicationPadService);

  private _application: BehaviorSubject<Application> = new BehaviorSubject(applicationInitialState());

  public application$ = this._application.asObservable();

  get applicationValue() {
    return this._application.value;
  }

  set application(application: Application) {
    this._application.next(application);
  }

  private applicationStep: BehaviorSubject<number> = new BehaviorSubject(
    JSON.parse(sessionStorage.getItem(APPLICATION_CURRENT_STEP)!) || undefined
  );
  public applicationStep$ = this.applicationStep.asObservable();

  destroySession(): void {
    sessionStorage.removeItem(APPLICATION_CURRENT_STEP);

    this.application = applicationInitialState();
    this.loanService.loan = loanInitialState();
    this.applicationStep.next(JSON.parse(sessionStorage.getItem(APPLICATION_CURRENT_STEP)!) || undefined);
    this.applicationPadService.applicationPad = applicationPadInitialState();
  }

  setApplicationStep(currentStep: number) {
    this.applicationStep.next(currentStep);
    sessionStorage.setItem(APPLICATION_CURRENT_STEP, JSON.stringify(currentStep));
  }

  public createApplication(application: Application): Observable<string> {
    return this.httpClient.post<string>(APPLICATION_URL, {
      applicationDto: application,
    });
  }

  public createFullApplication(applicationDto: IApplicationDto): Observable<any> {
    return this.httpClient.post<string>(`${APPLICATION_URL}${FULL}`, { applicationDto });
  }

  public getFullApplication(applicationIdentifier: string): Observable<any> {
    return this.httpClient.get<string>(`${APPLICATION_URL}${FULL}/${applicationIdentifier}`).pipe(shareReplay());
  }

  public updateApplication(application: Application): Observable<string> {
    return this.httpClient.put<string>(APPLICATION_URL, {
      applicationDto: application,
    });
  }
  public draftApplication(loanIdentifier: string): Observable<string> {
    return this.httpClient.post<string>(`${APPLICATION_DRAFT_URL}/${loanIdentifier}`, {
      draftApplicationDto: loanIdentifier,
    });
  }

  public DraftAnApplication(loanIdentifier: string, applicationIdentifier: string): Observable<string> {
    return this.httpClient.post<string>(`${APPLICATION_DRAFT_URL}/${loanIdentifier}/${applicationIdentifier}`, null);
  }

  public createLoan(loan: Loan): Observable<string> {
    return this.httpClient.post<string>(LOAN_URL, { loanDto: loan });
  }

  public updateLoan(loan: Loan): Observable<void> {
    return this.httpClient.put<void>(LOAN_URL, { loanDto: loan });
  }

  public createApplicationPad(applicationPad: ApplicationPad): Observable<string> {
    return this.httpClient.post<string>(APPLICATION_PAD_URL, { applicationPADDto: applicationPad });
  }

  public updateApplicationPad(applicationPad: ApplicationPad): Observable<string> {
    return this.httpClient.put<string>(APPLICATION_PAD_URL, { applicationPADDto: applicationPad });
  }

  public submitClaim(submitClaim: ICarrierRequestSubmitClaim): Observable<string> {
    return this.httpClient.post<string>(SUBMIT_CLAIM_URL, { ...submitClaim });
  }

  public uploadClaim(blobDto: BlobFile): Observable<string> {
    return this.httpClient.post<string>(UPLOAD_CLAIM_URL, { blobDto });
  }

  public getApplicationForm(applicationIdentifier: string, formIdentifier: string): Observable<ApplicationForm> {
    return this.httpClient.get<ApplicationForm>(APPLICATION_FORM_URL + applicationIdentifier + '/' + formIdentifier);
  }

  public retrieveApplicationForm(applicationIdentifier: string): Observable<ApplicationForm[]> {
    return this.httpClient.get<ApplicationForm[]>(APPLICATION_FORM_URL + applicationIdentifier);
  }

  public generatePaperwork(searchOptions: FormMetadata1): Observable<ApplicationFormBlob[]> {
    return this.httpClient.post<ApplicationFormBlob[]>(APPLICATION_FORM_GENERATE_URL, searchOptions, {
      headers: new HttpHeaders({
        Accept: 'application/json',
      }),
    });
  }
  public getPaperwork(applicationIdentifier: string, fileType: number): Observable<FormMetadata[]> {
    return this.httpClient.get<FormMetadata[]>(`${APPLICATION_FORM_URL}${applicationIdentifier}/Generate/${fileType}`);
  }
  public getPaperwork1(loanIdentifier: string, fileType: string): Observable<FormMetadata[]> {
    return this.httpClient.get<FormMetadata[]>(`${APPLICATION_FORM_URL}Generate/${loanIdentifier}/${fileType}`);
  }
  public getApplicationByApplicationIdentifier(applicationIdentifier: string): Observable<ApplicationFull> {
    return this.httpClient.get<any>(APPLICATION_URL + applicationIdentifier).pipe(shareReplay());
  }

  public getApplicationsByStatus(searchOptions: ApplicationResourceParams): Observable<ApplicationsSummaryByStatus[]> {
    let params = JSON.parse(JSON.stringify(searchOptions));
    return this.httpClient.get<ApplicationsSummaryByStatus[]>(APPLICATIONS_SUMMARY_BY_STATUS_URL, {
      params: params,
    });
  }

  public getApplications(searchOptions: ApplicationResourceParams): Observable<PaginatedApplication[]> {
    let params = JSON.parse(JSON.stringify(searchOptions));
    return this.httpClient.get<PaginatedApplication[]>(APPLICATIONS_BY_CRITERIA_URL, {
      headers: new HttpHeaders({
        Accept: 'application/json',
      }),
      params: params,
    });
  }

  public getApplicationsByCriteria(searchOptions: ApplicationResourceParams): Observable<ApplicationsByCriteria> {
    let params = JSON.parse(JSON.stringify(searchOptions));
    return this.httpClient.get<ApplicationsByCriteria>(APPLICATIONS_BY_CRITERIA_URL, {
      headers: new HttpHeaders({
        Accept: 'application/vnd.securian.application.continuousscrolling.hateoas+json',
      }),
      params: params,
    });
  }

    public getApplicants(searchValue: string): Observable<ApplicantResult[]> {
    // Ensure only path variable is sent, no query param
    const url = APPLICATION_SEARCH_URL + encodeURIComponent(searchValue);
    return this.httpClient.get<ApplicantResult[]>(url, {
      headers: new HttpHeaders({
        Accept: 'application/vnd.securian.application.continuousscrolling.hateoas+json',
      })
    });
  }
  public submitApplication(submitApplication: SubmitApplicationDto): Observable<UnderwriteResponse> {
    return this.httpClient.post<UnderwriteResponse>(SUBMIT_APPLICATION_URL, {
      submitApplicationDto: submitApplication,
    });
  }

  public updateFileNumbersBulk(request: FileNumbersUpdateRequest): Observable<any> {
    const requestPayload: FileNumbersUpdatePayload = {
      applicationDto: {
        loanIdentifier: request.loanIdentifier,
        applications: request.applications
      }
    };
    return this.httpClient.patch<any>(UPDATEFILENUMBERBULK_URL, requestPayload);
  }
}

interface FileNumbersUpdateRequest {
  loanIdentifier: string;
  applications: Array<{
    id: string;
    fileNumberCancelled: string | null;
  }>;
}

export interface FileNumbersUpdatePayload {
  applicationDto: FileNumbersUpdateRequest;
}
