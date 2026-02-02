import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BreadCrumbService {
  private _title: BehaviorSubject<string> = new BehaviorSubject('');

  get titleContent$() {
    return this._title.asObservable();
  }

  set titleContent(title: string) {
    this._title.next(title);
  }

  get titleContent() {
    return this._title.value;
  }
}
