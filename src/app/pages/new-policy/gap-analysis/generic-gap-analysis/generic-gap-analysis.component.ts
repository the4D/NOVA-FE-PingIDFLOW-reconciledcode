import { Component, OnDestroy, OnInit } from '@angular/core';

import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { FormBuilder } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MessageType } from '@core/models/insurance/stepper-message.model';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { StepperMessageService } from '@core/services/insurance/stepper-message.service';
import { GapAnalysisFacade } from '@store/pages/new-policy/gap-analysis/facades/gap-analysis.facades';
import { BaseComponent } from './base-component.component';
import { ResultsInfoComponent } from './results/results-info.component';
import { CoveragesInfoComponent } from './coverage/coverages-info.component';
import { ExpensesInfoComponent } from './expenses/expenses-info.component';
import { AssetsLiabilitiesInfoComponent } from './assets-liabilities/assets-liabilities-info.component';
import { IncomeInfoComponent } from './income-info/income-info.component';

@Component({
  selector: 'app-generic-gap-analysis',
  templateUrl: './generic-gap-analysis.component.html',
  styleUrls: ['./generic-gap-analysis.component.scss'],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false },
    },
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true },
    },
  ],
  standalone: true,
  imports: [
    MatStepperModule,
    IncomeInfoComponent,
    AssetsLiabilitiesInfoComponent,
    ExpensesInfoComponent,
    CoveragesInfoComponent,
    ResultsInfoComponent,
  ],
})
export class GenericGapAnalysisComponent extends BaseComponent implements OnInit, OnDestroy {
  constructor(
    private storeFacade: GapAnalysisFacade,
    private stepperMessage: StepperMessageService,
    public override fb: FormBuilder,
    public override stepService: SharedStepService
  ) {
    super(fb, stepService);
    this.storeFacade.initializeApplication();
  }

  ngOnDestroy(): void {
    this.stepService.destroySession();
    this.stepperMessage.messageContent = {
      message: '',
      type: MessageType.WARNING,
      showIt: false,
    };
  }

  ngOnInit(): void {
    window.focus();
  }
}
