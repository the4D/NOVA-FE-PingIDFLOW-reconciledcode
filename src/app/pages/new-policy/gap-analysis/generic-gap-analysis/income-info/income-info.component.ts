import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators, FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { delay, distinctUntilChanged } from 'rxjs';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { MatInputModule } from '@angular/material/input';
import { CurrencyPipe } from '@angular/common';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { EmploymentType, Income } from '@core/models/gap-analysis/gap-analysis.model';
import { GapAnalysisFacade } from '@store/pages/new-policy/gap-analysis/facades/gap-analysis.facades';
import { BaseComponent } from '../base-component.component';

@Component({
  selector: 'app-income-info',
  templateUrl: './income-info.component.html',
  styleUrls: ['./income-info.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    CurrencyMaskModule,
    CurrencyPipe,
  ],
})
export class IncomeInfoComponent extends BaseComponent implements OnInit, AfterViewInit {
  public employmentList: EmploymentType[] = [];
  public annualIncome = 0;
  public incomeForm: FormGroup = this.fb.group({
    employmentType: [null, [Validators.required]],
    workHours: [null],
    hourlyPay: [null],
    annualIncome: [null],
    additionalIncome: [null],
  });

  constructor(
    public override fb: FormBuilder,
    private storeFacade: GapAnalysisFacade,
    public override stepService: SharedStepService,
    private cd: ChangeDetectorRef
  ) {
    super(fb, stepService);
    this.employmentList = this.getEmploymentTypeList();
  }

  ngOnInit(): void {
    this.formChange();
    this.nextButtonLabel = this.stepList()[this.stepper().selectedIndex + 1].title;

    this.stepService.currentStateInfo.subscribe((step) => {
      if (step.currentStep === 1 && step.readOnlyBehavior) {
        this.incomeForm.disable();
      }
    });
  }
  public formChange(): void {
    this.incomeForm.valueChanges.pipe(distinctUntilChanged(), delay(1000)).subscribe(() => {
      let v = this.incomeForm.value;
      this.annualIncome = 0;
      v.employmentType == 'annual'
        ? (this.annualIncome = v.additionalIncome + v.annualIncome)
        : (this.annualIncome = v.hourlyPay * v.workHours * 52 + v.additionalIncome);
      this.monthlyIncome = this.annualIncome / 12;
    });
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  public createApplication() {
    this.stepService.currentState = {
      ...this.stepService.currentStateValue,
      currentStep: 2,
    };
    this.stepper().next();
    this.storeFacade.updateLoader(true);
    this.setIncomeDispatch();
  }

  private setIncomeDispatch() {
    let income: Income = this.incomeForm.getRawValue();

    if (income) {
      income.estimatedMonthlyIncome = Number(this.monthlyIncome.toFixed(2));
      income.estimatedAnnualIncome = Number(this.annualIncome.toFixed(2));
    }

    if (income.employmentType === 'hourly') {
      income.annualIncome = 0;
    }

    if (this.stepService.currentStateValue.currentStep === 1) {
      this.stepService.currentState = {
        ...this.stepService.currentStateValue,
        currentStep: 2,
      };
    }
    this.storeFacade.updateLoader(true);
    this.storeFacade.updateIncome(income);
    this.storeFacade.updateLoader(false);
  }
}
