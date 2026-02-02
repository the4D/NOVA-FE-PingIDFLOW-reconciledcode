import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs';
import { FullLoan, Loan, LoanRequest, loanInitialState } from '@core/models/insurance/loan.model';
import { SubmissionRequest, SubmissionResponse } from '@core/models/insurance/underwrite.model';

const BASE_URL = 'INSURANCE_API/';
const LOAN = `${BASE_URL}Loan/`;
const FULL = `Full/`;
const LOAN_UPSERT = `${LOAN}Upsert`;
const LOAN_RESPONSE = `${LOAN}Response/`;
const LOAN_SUBMISSION = `${LOAN}Submit/`;

@Injectable({
  providedIn: 'root',
})
export class LoanService {
  private _loan: BehaviorSubject<Loan> = new BehaviorSubject(loanInitialState());
  public loan$ = this._loan.asObservable();

  public set loan(loan: Loan) {
    this._loan.next(loan);
  }

  public get loanValue(): Loan {
    return this._loan.value;
  }

  destroySession() {
    this._loan.next(loanInitialState());
  }

  constructor(private httpClient: HttpClient) {}

  public getLoan(loanIdentifier: string): Observable<FullLoan> {
    return this.httpClient.get<FullLoan>(`${LOAN}${FULL}${loanIdentifier}`).pipe(shareReplay());
  }

  public loanUpsert(loanInfo: LoanRequest): Observable<any> {
    return this.httpClient.post<any>(`${LOAN_UPSERT}`, loanInfo).pipe(shareReplay());
  }

  public getLoanResponse(loanIdentifier: string): Observable<FullLoan> {
    return this.httpClient.get<FullLoan>(`${LOAN_RESPONSE}${loanIdentifier}`).pipe(shareReplay());
  }

  public submitSPLoan(submitRequest: SubmissionRequest): Observable<SubmissionResponse> {
    return this.httpClient.post<SubmissionResponse>(`${LOAN_SUBMISSION}`, submitRequest).pipe(shareReplay());
  }
}
