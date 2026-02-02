import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Step } from '@core/utils/enums/gap-analysis-enums';

@Injectable({
  providedIn: 'root',
})
export class StepCommunicationService {
  private selectedIndexSubject = new BehaviorSubject<{
    previouslySelectedIndex: Step;
    selectedIndex: Step;
  }>({ previouslySelectedIndex: Step.MEETING_DETAILS, selectedIndex: Step.MEETING_DETAILS });

  selectedIndex$ = this.selectedIndexSubject.asObservable();

  stepChangeNotification(previouslySelectedIndex: Step, selectedIndex: Step) {
    this.selectedIndexSubject.next({
      previouslySelectedIndex: previouslySelectedIndex,
      selectedIndex: selectedIndex,
    });
  }
}
