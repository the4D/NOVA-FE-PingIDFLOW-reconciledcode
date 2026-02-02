import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { delay, distinctUntilChanged } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { GapAnalysisFacade } from '@store/pages/new-policy/gap-analysis/facades/gap-analysis.facades';
import { BaseComponent } from '../base-component.component';
import { Expenses } from '@core/models/gap-analysis/gap-analysis.model';

@Component({
  selector: 'app-expenses-info',
  templateUrl: './expenses-info.component.html',
  styleUrls: ['./expenses-info.component.scss'],
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
export class ExpensesInfoComponent extends BaseComponent {
  public expense!: Expenses;
  public totalExpenses = 0;
  public expensesForm: FormGroup = this.fb.group({
    housing: [null],
    propertyTaxes: [null],
    utilities: [null],
    children: [null],
    transportation: [null],
    groceries: [null],
    insurance: [null],
    otherExpenses: [null],
    loans: [null],
    lineOfCredit: [null],
    creditCards: [null],
    newDebt: [null],
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
    this.title = this.stepList()[this.stepper().selectedIndex].title;
    this.description = 'Enter the details of the assets and liabilities';
    this.nextButtonLabel = this.stepList()[this.stepper().selectedIndex + 1].title;
  }

  public formChange(): void {
    this.totalExpenses = 0;
    this.expensesForm.valueChanges.pipe(distinctUntilChanged(), delay(1000)).subscribe(() => {
      this.expense = this.expensesForm.getRawValue();
      this.totalExpenses = Object.values(this.expense).reduce((a, b) => a + b, 0);
      this.expense.totalExpenses = this.totalExpenses;
    });
  }

  public back = () => {
    this.stepService.currentState = {
      ...this.stepService.currentStateValue,
      currentStep: 3,
    };
    this.stepper().previous();
  };

  public moveNextToCoverage() {
    this.stepService.currentState = {
      ...this.stepService.currentStateValue,
      currentStep: 4,
    };
    this.stepper().next();
    this.storeFacade.updateLoader(true);
    this.setExpenseDispatch();
  }

  private setExpenseDispatch() {
    this.storeFacade.updateLoader(true);
    this.storeFacade.updateExpenses(this.expense);
    this.storeFacade.updateLoader(false);
  }
}
