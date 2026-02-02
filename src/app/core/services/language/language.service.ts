import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private _languageSelected: BehaviorSubject<string> = new BehaviorSubject('en-US');

  get languageSelected$() {
    return this._languageSelected.asObservable();
  }

  get languageSelectedStr() {
    return this._languageSelected.getValue();
  }

  set languageSelected(language: string) {
    this._languageSelected.next(language);
  }
}
