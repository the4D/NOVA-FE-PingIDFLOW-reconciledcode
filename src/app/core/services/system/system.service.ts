import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SystemService {
  private _sourceApplicationType: BehaviorSubject<string> = new BehaviorSubject('-1');

  get sourceApplicationType$() {
    return this._sourceApplicationType.asObservable();
  }

  set sourceApplicationType(sourceType: string) {
    this._sourceApplicationType.next(sourceType);
  }

  get sourceApplicationValue() {
    return this._sourceApplicationType.value;
  }
}
