import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SharedStep {
  currentStep: number;
  readOnlyBehavior: boolean;
  fistTimeArriving: boolean;
}

const initialState = (): SharedStep => {
  return {
    currentStep: 7,
    readOnlyBehavior: false,
    fistTimeArriving: false,
  };
};

@Injectable({
  providedIn: 'root',
})
export class SharedStepService {
  constructor() {}

  destroySession() {
    this._currentState.next(initialState());
  }

  private _currentState: BehaviorSubject<SharedStep> = new BehaviorSubject(initialState());

  public get currentStateInfo(): Observable<SharedStep> {
    return this._currentState;
  }

  public get currentStateValue() {
    return this._currentState.value;
  }

  public set currentState(step: SharedStep) {
    this._currentState.next(step);
  }
}
