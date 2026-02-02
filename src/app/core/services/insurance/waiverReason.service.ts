import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap, first } from 'rxjs/operators';
import { WaiverReason, waiverReasonsInitialState } from '@core/models/insurance/waiverReason.model';

const BASE_URL: string = 'INSURANCE_API/';
const WAIVER_URL: string = `${BASE_URL}WaiverReason`;

@Injectable({
  providedIn: 'root',
})
export class WaiverReasonService {
  private _waiverReasons = new BehaviorSubject<WaiverReason[]>(waiverReasonsInitialState());

  get waiverReasons$() {
    return this._waiverReasons.asObservable();
  }

  set waiverReasons(waiverReasons: WaiverReason[]) {
    this._waiverReasons.next(waiverReasons);
  }

  get waiverReasonsValue() {
    return this._waiverReasons.value;
  }

  constructor(private httpClient: HttpClient) {}

  public getWaiverReasonList() {
    this.httpClient
      .get<WaiverReason[]>(WAIVER_URL)
      .pipe(
        tap((waiverReasons: WaiverReason[]) => {
          this.waiverReasons = waiverReasons;
        })
      )
      .pipe(first())
      .subscribe();
  }
}
