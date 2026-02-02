import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs';
import {
  quoteInsuranceTypeRequestInitialState,
  FullQuoteApplication,
  QuoteInsuranceTypeRequest,
  QuoteInsuranceTypeResponse,
  quoteInsuranceTypeResponseInitialState,
} from '@core/models/insurance/quote-insurance-type.model';

const BASE_URL: string = 'INSURANCE_API/';
const QUOTE_INSURANCE_TYPE_URL: string = `${BASE_URL}Quote/QuoteInsuranceType`;
const FULL: string = `${BASE_URL}Quote/Full/`;
const RESPONSE: string = `${BASE_URL}Quote/Response/`;

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private httpClient = inject(HttpClient);

  private _quoteInsuranceTypeRequest: BehaviorSubject<QuoteInsuranceTypeRequest> = new BehaviorSubject(
    quoteInsuranceTypeRequestInitialState()
  );

  destroySession() {
    this._quoteInsuranceTypeRequest.next(quoteInsuranceTypeRequestInitialState());
    this._quoteApplicationResponse.next(quoteInsuranceTypeResponseInitialState());
  }

  get quoteInsuranceTypeRequest$() {
    return this._quoteInsuranceTypeRequest.asObservable();
  }

  get quoteInsuranceTypeRequestValue() {
    return this._quoteInsuranceTypeRequest.value;
  }

  set quoteInsuranceTypeRequest(quoteRequest: QuoteInsuranceTypeRequest) {
    this._quoteInsuranceTypeRequest.next(quoteRequest);
  }

  // QuoteApplicationResponse
  private _quoteApplicationResponse: BehaviorSubject<QuoteInsuranceTypeResponse> = new BehaviorSubject(
    quoteInsuranceTypeResponseInitialState()
  );

  get quoteApplicationResponse$() {
    return this._quoteApplicationResponse.asObservable();
  }

  get quoteApplicationResponseValue() {
    return this._quoteApplicationResponse.value;
  }

  set quoteApplicationResponse(quoteResponse: QuoteInsuranceTypeResponse) {
    this._quoteApplicationResponse.next(quoteResponse);
  }

  public quoteInsuranceType(quoteTypeRequest: QuoteInsuranceTypeRequest): Observable<QuoteInsuranceTypeResponse> {
    return this.httpClient
      .post<QuoteInsuranceTypeResponse>(QUOTE_INSURANCE_TYPE_URL, quoteTypeRequest)
      .pipe(shareReplay());
  }

  public getFullQuoteReqRes(applicationIdentifier: string): Observable<FullQuoteApplication> {
    return this.httpClient.get<FullQuoteApplication>(`${FULL}${applicationIdentifier}`).pipe(shareReplay());
  }

  public getFullQuoteResponse(loanIdentifier: string): Observable<FullQuoteApplication> {
    return this.httpClient.get<FullQuoteApplication>(`${RESPONSE}${loanIdentifier}`).pipe(shareReplay());
  }
}
