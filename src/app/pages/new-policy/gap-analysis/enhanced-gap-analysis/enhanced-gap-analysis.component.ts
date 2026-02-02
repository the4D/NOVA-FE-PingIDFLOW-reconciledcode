import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Component } from '@angular/core';
import { StepCommunicationService } from 'src/app/core/services/step-communication/step-communication.service';
import { TranslateModule } from '@ngx-translate/core';
import { ResultsComponent } from './results/results.component';
import { ExistingCoveragesComponent } from './existing-coverages/existing-coverages.component';
import { MonthlyExpensesComponent } from './monthly-expenses/monthly-expenses.component';
import { ReloadComponentDirective } from '../../../../core/directives/reload-component/reload-component.directive';
import { AssetsLiabilitiesComponent } from './assets-liabilities/assets-liabilities.component';
import { IncomeComponent } from './income/income.component';
import { MeetingDetailsComponent } from './meeting-details/meeting-details.component';
import { MatStepperModule } from '@angular/material/stepper';
@Component({
    selector: 'app-enhanced-gap-analysis',
    templateUrl: './enhanced-gap-analysis.component.html',
    styleUrls: ['./enhanced-gap-analysis.component.scss'],
    standalone: true,
    imports: [
        MatStepperModule,
        MeetingDetailsComponent,
        IncomeComponent,
        AssetsLiabilitiesComponent,
        ReloadComponentDirective,
        MonthlyExpensesComponent,
        ExistingCoveragesComponent,
        ResultsComponent,
        TranslateModule,
    ],
})
export class EnhancedGapAnalysisComponent {
  constructor(private stepCommunicationService: StepCommunicationService) { }
  public recivedStep6SelectedDropdownState: any;
  public reloadComponentBack: number = 0;

  public onComingBackAgain() {
    this.reloadComponentBack = this.reloadComponentBack * -1 + 1;
  }

  stepClicked(stepper: StepperSelectionEvent) {
    this.stepCommunicationService.stepChangeNotification(
      stepper.previouslySelectedIndex,
      stepper.selectedIndex)
  }

  storeSelectedDropdownState(event: any) {
    this.recivedStep6SelectedDropdownState = event;
  }
}