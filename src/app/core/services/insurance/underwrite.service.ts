import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  SubmissionRequest,
  SubmissionResponse,
  UnderwriteResponse,
  ValidationErrorRes,
} from '@core/models/insurance/underwrite.model';

const BASE_URL: string = 'INSURANCE_API/';
const UNDERWRITE_URL: string = `${BASE_URL}Underwrite`;
const SUBMIT_APPLICATIONS_URL: string = `${BASE_URL}Loan/Submit`;
const UNDERWRITE: string = '__underwrite_storage__';

@Injectable({ providedIn: 'root' })
export class UnderwriteService {
  private underwrite: BehaviorSubject<UnderwriteResponse> = new BehaviorSubject(
    JSON.parse(sessionStorage.getItem(UNDERWRITE)!) || undefined
  );

  public underwrite$ = this.underwrite.asObservable();

  public destroySession(): void {
    sessionStorage.removeItem(UNDERWRITE);
    this.underwrite.next(JSON.parse(sessionStorage.getItem(UNDERWRITE)!) || undefined);
  }

  constructor(private httpClient: HttpClient) {}

  public setUnderwrite(underwriteValue: UnderwriteResponse) {
    this.underwrite.next(underwriteValue);
    sessionStorage.setItem(UNDERWRITE, JSON.stringify(underwriteValue));
  }

  public putUnderwrite(SubmissionRequest: SubmissionRequest): Observable<SubmissionResponse> {
    return this.httpClient.post<SubmissionResponse>(UNDERWRITE_URL, SubmissionRequest, {
      headers: new HttpHeaders({
        Accept: 'application/json',
      }),
    });
  }

  public putSubmitApplications(SubmissionRequest: SubmissionRequest): Observable<SubmissionResponse> {
    return this.httpClient.post<SubmissionResponse>(SUBMIT_APPLICATIONS_URL, SubmissionRequest, {
      headers: new HttpHeaders({
        Accept: 'application/json',
      }),
    });
  }
}
