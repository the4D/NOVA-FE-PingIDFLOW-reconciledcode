import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { StepperMessage, initialMessageState } from '@core/models/insurance/stepper-message.model';

@Injectable({
  providedIn: 'root',
})
export class StepperMessageService {
  private _messageContent: BehaviorSubject<StepperMessage> = new BehaviorSubject(initialMessageState());

  get messageContent$() {
    return this._messageContent.asObservable();
  }

  set messageContent(messageContent: StepperMessage) {
    this._messageContent.next(messageContent);
  }

  get messageContent() {
    return this._messageContent.value;
  }
}
