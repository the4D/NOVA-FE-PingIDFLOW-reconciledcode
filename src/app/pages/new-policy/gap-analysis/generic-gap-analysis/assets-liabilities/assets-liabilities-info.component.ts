import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { delay, distinctUntilChanged } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { Asset, AssetLiability, Liability } from '@core/models/gap-analysis/gap-analysis.model';
import { GapAnalysisFacade } from '@store/pages/new-policy/gap-analysis/facades/gap-analysis.facades';
import { BaseComponent } from '../base-component.component';

@Component({
  selector: 'app-assetLiability-info',
  templateUrl: './assets-liabilities-info.component.html',
  styleUrls: ['./assets-liabilities-info.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    CurrencyMaskModule,
    MatIconModule,
    MatTooltipModule,
    CurrencyPipe,
  ],
})
export class AssetsLiabilitiesInfoComponent extends BaseComponent implements OnInit {
  public totalAssets: number = 0;
  public totalLiabilities: number = 0;
  public assetPart!: Asset;
  public liabilitiesPart!: Liability;
  public assetLiabilityForm: FormGroup = this.fb.group({
    realEstate: [null],
    investments: [null],
    savings: [null],
    others: [null],
    mortgage: [null],
    lineOfCredit: [null],
    loans: [null],
    newDebt: [null],
    totalLiability: [null],
    creditCards: [null],
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

  public formChange(): void {
    this.assetLiabilityForm.valueChanges.pipe(distinctUntilChanged(), delay(1000)).subscribe(() => {
      const { realEstate, investments, savings, others } = this.assetLiabilityForm.getRawValue();
      this.assetPart = { realEstate, investments, savings, others, totalAsset: 0 };
      this.totalAssets = Object.values(this.assetPart).reduce((a, b) => a + b, 0);
      const { mortgage, lineOfCredit, loans, newDebt, creditCards } = this.assetLiabilityForm.getRawValue();
      this.liabilitiesPart = {
        mortgage,
        lineOfCredit,
        loans,
        newDebt,
        creditCards,
        totalLiability: 0,
      };
      this.totalLiabilities = Object.values(this.liabilitiesPart).reduce((a, b) => a + b, 0);
      this.assetPart.totalAsset = this.totalAssets;
      this.liabilitiesPart.totalLiability = this.totalLiabilities;
    });
  }

  public back = () => {
    this.stepService.currentState = {
      ...this.stepService.currentStateValue,
      currentStep: 2,
    };
    this.stepper().previous();
  };

  public moveNextToExpense() {
    this.stepService.currentState = {
      ...this.stepService.currentStateValue,
      currentStep: 3,
    };
    this.stepper().next();
    this.storeFacade.updateLoader(true);
    this.setAssetLiabilityDispatch();
  }

  private setAssetLiabilityDispatch() {
    let assetLiability: AssetLiability;
    assetLiability = {
      asset: this.assetPart,
      liability: this.liabilitiesPart,
    };
    this.storeFacade.updateLoader(true);
    this.storeFacade.updateAssetLiability(assetLiability);
    this.storeFacade.updateLoader(false);
  }
}
