import { Component } from '@angular/core';
import { Validators, FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { delay, distinctUntilChanged } from 'rxjs';
import { NgIf, CurrencyPipe } from '@angular/common';
import { MatRadioModule } from '@angular/material/radio';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { GapAnalysisFacade } from '@store/pages/new-policy/gap-analysis/facades/gap-analysis.facades';
import { Coverages, GapAnalysisBlob } from '@core/models/gap-analysis/gap-analysis.model';
import { BaseComponent } from '../base-component.component';

@Component({
  selector: 'app-coverages-info',
  templateUrl: './coverages-info.component.html',
  styleUrls: ['./coverages-info.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    CurrencyMaskModule,
    MatRadioModule,
    NgIf,
    CurrencyPipe,
  ],
})
export class CoveragesInfoComponent extends BaseComponent {
  public coverages!: Coverages;
  public totalCoverages: number = 0;
  public coveragesForm: FormGroup = this.fb.group({
    lifeInsurance: [null],
    groupLifeInsurance: [null],
    creditProtection: [null],
    incomeReplacementCoverage: [false],
    coverageAmount: [null, [Validators.min(3), Validators.max(100)]],
  });

  constructor(
    public override fb: FormBuilder,
    private storeFacade: GapAnalysisFacade,
    public override stepService: SharedStepService
  ) {
    super(fb, stepService);
  }

  ngOnInit(): void {
    this.formChange();
    this.nextButtonLabel = this.stepList()[this.stepper().selectedIndex + 1].title;
  }

  public numericOnly(event: KeyboardEvent): boolean {
    const pattern = /^([0-9])$/;
    const result = pattern.test(event.key);

    return result;
  }

  public formChange(): void {
    this.coveragesForm.valueChanges.pipe(distinctUntilChanged(), delay(1000)).subscribe(() => {
      this.totalCoverages = 0;
      this.coverages = this.coveragesForm.getRawValue();
      Object.keys(this.coverages).forEach((key) => {
        if (key != 'incomeReplacementCoverage' && key != 'coverageAmount') {
          this.totalCoverages += this.coveragesForm.get(key)?.value;
        }
      });
      this.coverages.totalCoverageAmount = this.totalCoverages;
    });
  }

  public back = () => {
    this.stepService.currentState = {
      ...this.stepService.currentStateValue,
      currentStep: 4,
    };
    this.stepper().previous();
  };

  public moveNextToResults() {
    this.setCoveragesDispatch();
  }

  private async setCoveragesDispatch() {
    try {
      this.storeFacade.updateLoader(true);
      this.storeFacade.updateCoverages(this.coverages);
      this.refreshDataFromStore(this.storeFacade);
      const getCalculateData: GapAnalysisBlob = this.getAllDataFromStore();

      await this.storeFacade.getCalculateData(getCalculateData).subscribe({
        next: (result: GapAnalysisBlob) => {
          this.storeFacade.updateGapAnalysisBlob(result);
          setTimeout(() => {
            this.stepService.currentState = {
              ...this.stepService.currentStateValue,
              currentStep: 5,
            };
            this.stepper().next();
            this.storeFacade.updateLoader(false);
          }, 2000);
        },
        error: () => {
          this.storeFacade.updateLoader(false);
        },
      });
    } catch (ex) {
      this.storeFacade.updateLoader(false);
    }
  }
}
