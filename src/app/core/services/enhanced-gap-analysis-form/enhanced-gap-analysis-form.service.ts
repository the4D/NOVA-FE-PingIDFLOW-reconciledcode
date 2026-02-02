import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GapAnalysisForm } from '@core/utils/Interfaces/gap-analysis-form.model';
import { MeetingDetails } from '@core/utils/Interfaces/forms/meeting-details.interface';
import { Income } from '@core/utils/Interfaces/forms/income.interface';
import { Liabilities } from '@core/utils/Interfaces/forms/liabilities.interface';
import { MonthlyExpenses } from '@core/utils/Interfaces/forms/monthly-expenses.interface';
import { ExistingCoverages } from '@core/utils/Interfaces/forms/existing-coverage.interface';

@Injectable({
  providedIn: 'root',
})
export class EnhancedGapAnalysisFormService {
  private gapAnalysisFormSubject: BehaviorSubject<GapAnalysisForm> = new BehaviorSubject<GapAnalysisForm>({
    meetingDetailForm: undefined,
    incomeForm: undefined,
    liabilitiesForm: undefined,
    monthlyExpensesForm: undefined,
    existingCoveragesForm: undefined,
  });

  gapAnalysisForm$ = this.gapAnalysisFormSubject.asObservable();

  updateFormData(
    formName: keyof GapAnalysisForm,
    data: MeetingDetails | Income | Liabilities | MonthlyExpenses | ExistingCoverages
  ) {
    const currentForm = this.gapAnalysisFormSubject.getValue();
    this.gapAnalysisFormSubject.next({ ...currentForm, [formName]: data });
  }
  updateForm(formData: GapAnalysisForm) {
    this.gapAnalysisFormSubject.next(formData);
  }
}
