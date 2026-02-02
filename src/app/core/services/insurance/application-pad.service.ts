import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  ApplicationPADDtoFull,
  ApplicationPADsResponse,
  ApplicationPadFull,
  applicationPadInitialState,
} from '../../models/insurance/application-pad-full.model';
import { HttpClient } from '@angular/common/http';

const BASE_URL: string = 'INSURANCE_API/';
const APPLICATION_PAD_FULL_URL: string = BASE_URL + 'ApplicationPAD/Full';

@Injectable({
  providedIn: 'root',
})
export class ApplicationPadService {
  private httpClient = inject(HttpClient);

  private _applicationPad: BehaviorSubject<ApplicationPadFull> = new BehaviorSubject(applicationPadInitialState());
  public applicationPad$ = this._applicationPad.asObservable();

  set applicationPad(applicationPad: ApplicationPadFull) {
    this._applicationPad.next(applicationPad);
  }

  destroySession() {
    this._applicationPad.next(applicationPadInitialState());
  }

  public createApplicationPadFull(applicationPadFull: ApplicationPADDtoFull): Observable<ApplicationPADsResponse> {
    return this.httpClient.post<ApplicationPADsResponse>(APPLICATION_PAD_FULL_URL, applicationPadFull);
  }
}
