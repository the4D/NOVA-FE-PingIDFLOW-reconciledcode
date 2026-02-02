import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FormToken } from '@core/utils/Interfaces/form-token.model';

@Injectable({
  providedIn: 'root',
})
export class EnhancedGapAnalysisFormDataService {
  public _gapAnalysisData: BehaviorSubject<FormToken> = new BehaviorSubject({});

  get gapAnalysisData$() {
    return this._gapAnalysisData.asObservable();
  }

  get gapAnalysisDataObj() {
    return this._gapAnalysisData.getValue();
  }

  set gapAnalysisData(analysisData: FormToken) {
    this._gapAnalysisData.next(analysisData);
  }

  constructor() {
    this._gapAnalysisData.subscribe({
      next: (data) => {},
    });
  }
}
