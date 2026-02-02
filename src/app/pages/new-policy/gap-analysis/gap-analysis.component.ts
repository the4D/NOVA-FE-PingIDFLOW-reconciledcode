import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { delay, distinctUntilChanged } from 'rxjs';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import GapAnalysisFormsData from 'src/assets/forms/gap-analysis-forms';
import { DynamicFormService } from '@core/services/dynamic-form.service';
import { GapAnalysisService } from '@core/services/insurance/gap-analysis.service';
import { JsonFormData, JsonFormControls } from '@core/models/dynamic-form.interface';
import { FormGroup, UntypedFormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

export enum InsuranceTypeEnum {
  DISABILITY = 'disability',
  LIFE = 'life',
}

class Title {
  constructor(
    public title: string,
    public description: string
  ) {}
}

@Component({
  selector: 'app-gap-analysis',
  templateUrl: './gap-analysis.component.html',
  styleUrls: ['./gap-analysis.component.scss'],
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
  imports: [RouterLink],
})
export class GapAnalysisComponent implements OnInit {
  public displayTitles: Title[] = [
    new Title('Income Information', "Confirm the member's income"),
    new Title('Assets & Liabilities', "Confirm the member's total assets and liabilities"),
    new Title(
      'Monthly Expenses',
      "Confirm the member's total monthly expenses such as essential living expenditures and recurring bill payments."
    ),
    new Title('Coverages', 'Confirm the member’s existing insurance coverages.'),
    new Title('Results', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
  ];

  private formService = inject(DynamicFormService);
  public router = inject(Router);

  @ViewChild('mainStepper') mainStepper!: MatStepper;
  @ViewChild('titleStepper') titleStepper!: MatStepper;

  public formInputData: JsonFormData[] = [];
  public formGroups: FormGroup[] = [];
  public totalDebts = 0;
  public totalAssets = 0;
  public baseExpenses = 0;
  public additionalExpenses = 0;
  public totalCoverage = 0;
  public monthlyIncome = 0;
  public annualIncome = 0;
  public disabilityTotalCoverage = 0;
  public formTitles = ['Income', 'Assets & Liabilities', 'Expenses', 'Coverages'];

  public insuranceTypeLife = InsuranceTypeEnum.LIFE;
  public insuranceTypeDisability = InsuranceTypeEnum.DISABILITY;

  ngOnInit(): void {
    GapAnalysisFormsData.forEach((data: JsonFormControls[]) => {
      this.formInputData.push({ controls: data });
      this.formGroups.push(this.formService.createForm(data));
    });
    this.formChange();
  }

  public gapAnalysisEnhanced() {
    this.router.navigate(['gap-analysis/enhanced']);
  }

  public formChange(): void {
    this.formGroups[0].valueChanges.pipe(distinctUntilChanged(), delay(1000)).subscribe(() => {
      let v = this.formGroups[0].value;
      v.employmentType == 'annual'
        ? (this.annualIncome = v.additionalIncome + v.annualIncome)
        : (this.annualIncome = v.hourlyPay * v.workHours * 52 + v.additionalIncome);
      this.monthlyIncome = this.annualIncome / 12;
    });

    this.formGroups[1].valueChanges.pipe(distinctUntilChanged(), delay(1000)).subscribe(() => {
      this.totalAssets = 0;
      Object.keys(this.formGroups[1].controls).forEach((key) => {
        this.totalAssets += Number(this.formGroups[1].get(key)?.value);
      });
    });
    this.formGroups[2].valueChanges.pipe(distinctUntilChanged(), delay(1000)).subscribe(() => {
      this.totalDebts = 0;
      Object.keys(this.formGroups[2].controls).forEach((key) => {
        this.totalDebts += Number(this.formGroups[2].get(key)?.value);
      });
    });
    this.formGroups[3].valueChanges.pipe(distinctUntilChanged(), delay(1000)).subscribe(() => {
      this.baseExpenses = 0;
      Object.keys(this.formGroups[3].controls).forEach((key) => {
        this.baseExpenses += Number(this.formGroups[3].get(key)?.value);
      });
    });
    this.formGroups[4].valueChanges.pipe(distinctUntilChanged(), delay(1000)).subscribe(() => {
      this.additionalExpenses = 0;
      Object.keys(this.formGroups[4].controls).forEach((key) => {
        this.additionalExpenses += Number(this.formGroups[4].get(key)?.value);
      });
    });
    // Coverages
    this.formGroups[5].valueChanges.pipe(distinctUntilChanged(), delay(1000)).subscribe(() => {
      this.totalCoverage = 0;
      Object.keys(this.formGroups[5].controls).forEach((key) => {
        if (key != 'incomeReplacementCoverage' && key != 'coverageAmount') {
          this.totalCoverage += Number(this.formGroups[5].get(key)?.value);
        }
      });

      if (this.formGroups[5].value.incomeReplacementCoverage === 'true') {
        this.disabilityTotalCoverage = +this.formGroups[5].get('coverageAmount')?.value;
      } else {
        this.disabilityTotalCoverage = 0;
      }
    });
  }

  public downloadAsPDF() {
    window.print();
  }

  public calcMonthlyGap() {
    return this.monthlyIncome * (this.disabilityTotalCoverage / 100) > this.additionalExpenses + this.baseExpenses
      ? 0
      : this.additionalExpenses + this.baseExpenses - this.monthlyIncome * (this.disabilityTotalCoverage / 100);
  }

  public calcUnprotectedCoverage() {
    return this.monthlyIncome * (this.disabilityTotalCoverage / 100) > this.additionalExpenses + this.baseExpenses
      ? 0
      : this.additionalExpenses + this.baseExpenses - this.monthlyIncome * (this.disabilityTotalCoverage / 100);
  }

  onSubmit() {
    // this.downloadAsPDF();
    // if (this.formGroups.every((f) => f.valid)) {
    //     this.gapService.Create(this.formGroups);
    // }
  }
}
