import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface Event {
  event: any;
  targetOrigin: string;
}

const initialState = (): Event => ({
  event: [],
  targetOrigin: '',
});

@Injectable({
  providedIn: 'root',
})
export class CommunicationService {
  private _event: BehaviorSubject<Event> = new BehaviorSubject(initialState());

  get eventContent$() {
    return this._event.asObservable();
  }

  set eventContent(eventContent: Event) {
    this._event.next(eventContent);
  }

  get eventContent() {
    return this._event.value;
  }
}
