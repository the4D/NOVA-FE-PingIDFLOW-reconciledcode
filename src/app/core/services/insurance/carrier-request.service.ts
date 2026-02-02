import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CarrierRequestCancelCoverage } from '@core/models/insurance/carrier-request-cancel-coverage.model';
import { ICarrierRequestSubmitClaim } from '@core/models/insurance/carrier-request-submit-claim.model';
import { CarrierRequestUpdateInfo } from '@core/models/insurance/carrier-request-update-info.model';
import {
  CarrierRequestsByCriteria,
  CarrierRequestResourceParams,
  PaginatedCarrierRequest,
} from '@core/models/insurance/carrier-request.model';

const BASE_URL: string = 'INSURANCE_API/';
const CANCEL_COVERAGE_URL: string = BASE_URL + 'CarrierRequest/CancelCoverage/';
const CARRIER_REQUEST_BY_ID: string = BASE_URL + 'CarrierRequest/';
const SUBMIT_CLAIM_URL: string = BASE_URL + 'CarrierRequest/SubmitClaim/';
const UPDATE_INFO_URL: string = BASE_URL + 'CarrierRequest/UpdateInfo/';
const CARRIER_REQUEST_BY_CRITERIA_URL: string = BASE_URL + 'CarrierRequest/Criteria?';

@Injectable({ providedIn: 'root' })
export class CarrierRequestService {
  private httpClient = inject(HttpClient);

  public getCarrierRequests(searchOptions: CarrierRequestResourceParams): Observable<PaginatedCarrierRequest[]> {
    let params = JSON.parse(JSON.stringify(searchOptions));
    return this.httpClient.get<PaginatedCarrierRequest[]>(CARRIER_REQUEST_BY_CRITERIA_URL, {
      headers: new HttpHeaders({
        Accept: 'application/json',
      }),
      params: params,
    });
  }

  public getCarrierRequestsByCriteria(
    searchOptions: CarrierRequestResourceParams
  ): Observable<CarrierRequestsByCriteria> {
    let params = JSON.parse(JSON.stringify(searchOptions));
    return this.httpClient.get<CarrierRequestsByCriteria>(CARRIER_REQUEST_BY_CRITERIA_URL, {
      headers: new HttpHeaders({
        Accept: 'application/vnd.securian.application.continuousscrolling.hateoas+json',
      }),
      params: params,
    });
  }

  public getCarrierRequestById(id: string): Observable<any> {
    return this.httpClient.get<any>(CARRIER_REQUEST_BY_ID + id);
  }

  public cancelCoverage(cancelCoverage: CarrierRequestCancelCoverage): Observable<string> {
    return this.httpClient.post<string>(CANCEL_COVERAGE_URL, { CancelCoverageDto: cancelCoverage });
  }

  public updateInfo(updateInfo: CarrierRequestUpdateInfo): Observable<string> {
    return this.httpClient.post<string>(UPDATE_INFO_URL, { UpdateInfoDto: updateInfo });
  }

  public submitClaim(submitClaim: ICarrierRequestSubmitClaim): Observable<string> {
    return this.httpClient.post<string>(SUBMIT_CLAIM_URL, { ...submitClaim });
  }
}
