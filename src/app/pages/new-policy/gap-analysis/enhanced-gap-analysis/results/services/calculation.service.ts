import { inject, Injectable } from '@angular/core';
import { EnhancedGapAnalysisFormService } from '@core/services/enhanced-gap-analysis-form/enhanced-gap-analysis-form.service';
import {
  COVERAGE_PERCENTAGE,
  COVERAGE_TYPE,
  CRITICAL_ILLNESS_MAX,
  FiFTY_PERCENT,
  LIFE_INSURANCE_MAX,
  MAX_INSURED_AMOUNT,
  PERCENTAGE,
  PRIMARY,
  SECONDARY,
  YEAR,
} from '@core/utils/enums/gap-analysis-constants';
import { AddNumbers } from '@core/utils/functions/numericOperations';
import { ApplicantSelected } from '@core/utils/Interfaces/form-token.model';
import { GapAnalysisForm } from '@core/utils/Interfaces/gap-analysis-form.model';
import { applicantInitialState, reduceTaxBand } from '@pages/new-policy/gap-analysis/util/gap-analysis-util';

@Injectable({
  providedIn: 'root',
})
export class CalculationService {
  enhancedGapAnalysisFormService = inject(EnhancedGapAnalysisFormService);

  public gapData!: GapAnalysisForm;
  public applicantSelected: ApplicantSelected[] = applicantInitialState();

  constructor() {
    this.fillData();
  }

  public fillData() {
    this.enhancedGapAnalysisFormService.gapAnalysisForm$.subscribe((data: GapAnalysisForm) => {
      this.gapData = data;
    });
  }

  public getIncomeBase(
    applicantType: string,
    excludeSelection: boolean = false,
    coverageType: number = COVERAGE_TYPE.DISABILITY
  ): number {
    if (applicantType === PRIMARY) {
      if (!excludeSelection && this.isPrimarySelected(coverageType)) {
        return 0;
      }
      return this.gapData.incomeForm?.B1_GrossMonthlyBaseSalary !== null &&
        this.gapData.incomeForm?.B1_GrossMonthlyBaseSalary !== undefined
        ? parseInt(parseFloat(this.gapData.incomeForm?.B1_GrossMonthlyBaseSalary).toFixed(0))
        : 0;
    }

    if (!excludeSelection && !this.isPrimarySelected(coverageType)) {
      return 0;
    }

    return this.gapData.incomeForm?.B2_GrossMonthlyBaseSalary !== null &&
      this.gapData.incomeForm?.B2_GrossMonthlyBaseSalary !== undefined
      ? parseInt(parseFloat(this.gapData.incomeForm?.B2_GrossMonthlyBaseSalary).toFixed(0))
      : 0;
  }

  private isPrimarySelected(coverageType: number) {
    if (
      this.applicantSelected.filter((applicant) => applicant.coverageType === coverageType)[0].applicantSelected ===
      PRIMARY
    ) {
      return true;
    }

    return false;
  }

  public getIncomeBonuses(
    applicantType: string,
    coverageType: number = COVERAGE_TYPE.DISABILITY,
    excludeSelection: boolean = false
  ): number {
    if (applicantType === PRIMARY) {
      if (this.isPrimarySelected(coverageType) && !excludeSelection) {
        return 0;
      }
      return this.gapData.incomeForm?.B1_GrossMonthlyBonuses !== null &&
        this.gapData.incomeForm?.B1_GrossMonthlyBonuses !== undefined
        ? parseFloat(this.gapData.incomeForm?.B1_GrossMonthlyBonuses)
        : 0;
    }

    if (!this.isPrimarySelected(coverageType) && !excludeSelection) {
      return 0;
    }

    return this.gapData.incomeForm?.B2_GrossMonthlyBonuses !== null &&
      this.gapData.incomeForm?.B2_GrossMonthlyBonuses !== undefined
      ? parseFloat(this.gapData.incomeForm?.B2_GrossMonthlyBonuses)
      : 0;
  }

  public getIncomeInvestment(applicantType: string): number {
    if (applicantType === PRIMARY) {
      return this.gapData.incomeForm?.B1_GrossMonthlyRentals !== null &&
        this.gapData.incomeForm?.B1_GrossMonthlyRentals !== undefined
        ? parseInt(parseFloat(this.gapData.incomeForm?.B1_GrossMonthlyRentals).toFixed(0))
        : 0;
    }

    return this.gapData.incomeForm?.B2_GrossMonthlyRentals !== null &&
      this.gapData.incomeForm?.B2_GrossMonthlyRentals !== undefined
      ? parseInt(parseFloat(this.gapData.incomeForm?.B2_GrossMonthlyRentals).toFixed(0))
      : 0;
  }

  public getTaxValueByCheckedApplicant(applicantType: string, coverageType: number) {
    if (applicantType === PRIMARY && this.isPrimarySelected(coverageType)) {
      return 0;
    }

    if (applicantType === PRIMARY && !this.isPrimarySelected(coverageType)) {
      if (this.gapData.incomeForm?.B1_ProvinceOrTerritory) {
        return parseInt(
          (
            reduceTaxBand(
              AddNumbers([
                this.getIncomeBase(applicantType, true, coverageType) * YEAR,
                this.getIncomeBonuses(applicantType, coverageType, true) * YEAR,
              ]),
              this.gapData.incomeForm?.B1_ProvinceOrTerritory,
              true
            ) / YEAR
          ).toFixed(0)
        );
      }
      return 0;
    }

    if (applicantType === SECONDARY && !this.isPrimarySelected(coverageType)) {
      return 0;
    }

    if (this.gapData.incomeForm?.B2_ProvinceOrTerritory) {
      return parseInt(
        (
          reduceTaxBand(
            AddNumbers([
              this.getIncomeBase(applicantType, true, coverageType) * YEAR,
              this.getIncomeBonuses(applicantType, coverageType, true) * YEAR,
            ]),
            this.gapData.incomeForm?.B2_ProvinceOrTerritory,
            true
          ) / YEAR
        ).toFixed(0)
      );
    }

    return 0;
  }

  public getInsuranceBenefit(applicantType: string, coverageType: number): number {
    if (coverageType === COVERAGE_TYPE.DISABILITY) {
      if (applicantType !== SECONDARY) {
        if (
          this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage &&
          this.gapData.incomeForm?.B1_ProvinceOrTerritory
        ) {
          if (this.gapData.meetingDetailForm?.IsSecondaryApplicant && !this.isPrimarySelected(coverageType)) {
            return 0;
          }
          const calculatedPrimaryInsuranceBenefit =
            reduceTaxBand(
              parseInt(
                (
                  this.getIncomeBase(applicantType, true) *
                  (parseFloat(this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage) * PERCENTAGE)
                ).toFixed(0)
              ) * YEAR,
              this.gapData.incomeForm?.B1_ProvinceOrTerritory
            ) / YEAR;
          return parseInt(calculatedPrimaryInsuranceBenefit.toFixed(0));
        }

        return 0;
      }

      if (
        this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage &&
        this.gapData.incomeForm?.B2_ProvinceOrTerritory
      ) {
        if (this.isPrimarySelected(2)) {
          return 0;
        }
        return this.calculateStepSixAltInsuranceDisValue();
      }
    } else if (coverageType === COVERAGE_TYPE.JOB_LOSS) {
      if (applicantType !== SECONDARY) {
        if (this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage) {
          if (this.gapData.meetingDetailForm?.IsSecondaryApplicant && !this.isPrimarySelected(coverageType)) {
            return 0;
          }
          return 0;
        }

        return 0;
      }

      if (this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage) {
        if (this.isPrimarySelected(coverageType)) {
          return 0;
        }
        return 0;
      }
    }

    return 0;
  }

  private calculateStepSixAltInsuranceDisValue(applicantType = SECONDARY): number {
    if (
      this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage &&
      this.gapData.incomeForm?.B2_ProvinceOrTerritory
    ) {
      let calculatedSecondaryInsuranceBenefit =
        reduceTaxBand(
          parseInt(
            (
              this.getIncomeBase(applicantType, true) *
              (parseFloat(this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage) * PERCENTAGE)
            ).toFixed(0)
          ) * YEAR,
          this.gapData.incomeForm?.B2_ProvinceOrTerritory
        ) / YEAR;
      return parseInt(calculatedSecondaryInsuranceBenefit.toFixed(0));
    } else return 0;
  }

  public getInsuranceBenefitReduced(applicantType: string, incomeReduce: number | null | undefined): number {
    if (incomeReduce !== null && incomeReduce !== undefined && parseFloat(incomeReduce.toString()) >= 0) {
      const multiplyBy = parseFloat(incomeReduce.toString()) * PERCENTAGE;

      if (applicantType === PRIMARY && this.gapData.incomeForm?.B1_ProvinceOrTerritory) {
        if (!this.isPrimarySelected(2)) {
          return 0;
        }

        const calculatedPrimaryInsuranceBenefitReduced =
          reduceTaxBand(
            this.getIncomeBase(applicantType, true) * multiplyBy * YEAR,
            this.gapData.incomeForm?.B1_ProvinceOrTerritory
          ) / YEAR;
        return parseInt(calculatedPrimaryInsuranceBenefitReduced.toFixed(0));
      }

      if (applicantType === SECONDARY && this.gapData.incomeForm?.B2_ProvinceOrTerritory) {
        if (this.isPrimarySelected(2)) {
          return 0;
        }
        const calculatedSecondaryInsuranceBenefitReduced =
          reduceTaxBand(
            this.getIncomeBase(applicantType, true) * multiplyBy * YEAR,
            this.gapData.incomeForm?.B2_ProvinceOrTerritory
          ) / YEAR;
        return parseInt(calculatedSecondaryInsuranceBenefitReduced.toFixed(0));
      }
    }

    return this.getInsuranceBenefit(applicantType, 2);
  }

  public getTotalOutstandingLiabilitiesDebtBalanceValue(): number {
    if (this.gapData.liabilitiesForm?.TotalOutstandingLiabilitiesDebtBalance) {
      return parseInt(this.gapData.liabilitiesForm?.TotalOutstandingLiabilitiesDebtBalance);
    }
    return 0;
  }

  public getNewDebt(): number {
    return this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== undefined &&
      this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== null
      ? parseInt(parseInt(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment).toFixed(0))
      : 0;
  }

  public getRepayments() {
    return AddNumbers([this.gapData.monthlyExpensesForm?.ExistingMonthlyLiabilityDebtPayments]);
  }

  public getLivingExpenses() {
    return parseInt(AddNumbers([this.gapData.monthlyExpensesForm?.OtherMonthlyExpensesInNumber]).toFixed(0));
  }

  public getMonthlyExpensesTotal() {
    return AddNumbers([this.getNewDebt(), this.getRepayments(), this.getLivingExpenses()]);
  }

  public getNewMortgageLoanBalanceValue(): number {
    if (this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue) {
      return parseInt(this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue);
    }
    return 0;
  }

  public getExistingLiabilitiesDebtBalanceValue(): number {
    if (this.gapData.liabilitiesForm?.ExistingLiabilitiesDebtBalance) {
      return parseInt(this.gapData.liabilitiesForm?.ExistingLiabilitiesDebtBalance);
    }
    return 0;
  }

  public getTotalCriticalIllness(coveragePercentage: number, coverageType: number, applicantSelected?: string) {
    let result = 0;
    if (applicantSelected === undefined) {
      result =
        parseFloat(this.getInsuranceValue(coverageType).toString()) +
        parseFloat(this.getInsuredAmount(coverageType, coveragePercentage).toString()) -
        this.getTotalOutstandingLiabilitiesDebtBalanceValue();
    } else {
      result =
        parseFloat(this.getInsuranceValue(coverageType, applicantSelected).toString()) +
        parseFloat(this.getInsuredAmount(coverageType, coveragePercentage).toString()) -
        this.getTotalOutstandingLiabilitiesDebtBalanceValue();
    }

    return result === undefined ? 0 : result;
  }

  public getInsuranceValue(coverageType: number, applicantSelected?: string) {
    let value: number = 0;
    if (coverageType === COVERAGE_TYPE.LIFE) {
      if (applicantSelected !== undefined) {
        value =
          applicantSelected === PRIMARY
            ? this.getValueOf(this.gapData.existingCoveragesForm?.B1_ExistingLifeInsurance)
            : this.getValueOf(this.gapData.existingCoveragesForm?.B2_ExistingLifeInsurance);
      } else {
        value =
          this.applicantSelected.filter((applicant) => applicant.coverageType === coverageType)[0].applicantSelected ===
          PRIMARY
            ? this.getValueOf(this.gapData.existingCoveragesForm?.B1_ExistingLifeInsurance)
            : this.getValueOf(this.gapData.existingCoveragesForm?.B2_ExistingLifeInsurance);
      }
    } else {
      if (applicantSelected === undefined) {
        value =
          this.applicantSelected.filter((applicant) => applicant.coverageType === coverageType)[0].applicantSelected ===
          PRIMARY
            ? this.getValueOf(this.gapData.existingCoveragesForm?.B1_ExistingCriticalIllnessInsurance)
            : this.getValueOf(this.gapData.existingCoveragesForm?.B2_ExistingCriticalIllnessInsurance);
      } else {
        value =
          applicantSelected === PRIMARY
            ? this.getValueOf(this.gapData.existingCoveragesForm?.B1_ExistingCriticalIllnessInsurance)
            : this.getValueOf(this.gapData.existingCoveragesForm?.B2_ExistingCriticalIllnessInsurance);
      }
    }

    return value === null || value === undefined ? 0 : value;
  }

  public getInsuredAmount(coverageType: number, coveragePercentage: number) {
    switch (coveragePercentage) {
      case COVERAGE_PERCENTAGE.HUNDRED:
        if (coverageType === COVERAGE_TYPE.LIFE) {
          return this.validateMaxValue(this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue, LIFE_INSURANCE_MAX);
        }

        if (coverageType === COVERAGE_TYPE.DISABILITY) {
          if (
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== null &&
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== undefined &&
            this.gapData.incomeForm?.B1_ProvinceOrTerritory !== undefined
          ) {
            let insuredAmount = parseFloat(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment);
            return insuredAmount > MAX_INSURED_AMOUNT ? MAX_INSURED_AMOUNT : parseInt(insuredAmount.toFixed(0));
          }
        }

        if (coverageType === COVERAGE_TYPE.JOB_LOSS) {
          if (
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== null &&
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== undefined &&
            this.gapData.incomeForm?.B1_ProvinceOrTerritory !== undefined
          ) {
            let insuredAmount = parseFloat(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment);
            return insuredAmount > MAX_INSURED_AMOUNT ? MAX_INSURED_AMOUNT : parseInt(insuredAmount.toFixed(0));
          }
        }

        if (coverageType === COVERAGE_TYPE.CRITICAL_ILLNESS) {
          return this.validateMaxValue(this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue, CRITICAL_ILLNESS_MAX);
        }

        return this.getNewDebt();
      case COVERAGE_PERCENTAGE.FIFTY:
        if (coverageType === COVERAGE_TYPE.LIFE) {
          if (
            this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue !== null &&
            this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue !== undefined
          ) {
            return this.validateMaxValue(
              (parseFloat(this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue) / 2).toString(),
              LIFE_INSURANCE_MAX
            );
          }
        }

        if (coverageType === COVERAGE_TYPE.DISABILITY) {
          if (
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== null &&
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== undefined &&
            this.gapData.incomeForm?.B1_ProvinceOrTerritory !== undefined
          ) {
            let insuredAmount = parseFloat(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment) / 2;
            return insuredAmount > MAX_INSURED_AMOUNT ? MAX_INSURED_AMOUNT : parseInt(insuredAmount.toFixed(0));
          }
        }

        if (coverageType === COVERAGE_TYPE.JOB_LOSS) {
          if (
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== null &&
            this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment !== undefined &&
            this.gapData.incomeForm?.B1_ProvinceOrTerritory !== undefined
          ) {
            let insuredAmount = parseFloat(this.gapData.monthlyExpensesForm?.NewMonthlyMortgageLoanPayment) / 2;
            return insuredAmount > MAX_INSURED_AMOUNT ? MAX_INSURED_AMOUNT : parseInt(insuredAmount.toFixed(0));
          }
        }

        if (coverageType === COVERAGE_TYPE.CRITICAL_ILLNESS) {
          if (
            this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue !== null &&
            this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue !== undefined
          ) {
            return this.validateMaxValue(
              (parseFloat(this.gapData.liabilitiesForm?.NewMortgageLoanBalanceValue) / 2).toString(),
              CRITICAL_ILLNESS_MAX
            );
          }
        }

        return parseInt((parseFloat(this.getNewDebt().toString()) * 0.5).toFixed(0));

      default:
        if (coverageType === COVERAGE_TYPE.LIFE) {
          return 0;
        }
        return 0;
    }
  }

  private validateMaxValue(amountValue: string | undefined, maxValue: number) {
    if (amountValue !== null && amountValue !== undefined) {
      if (parseInt(amountValue) > maxValue) {
        return maxValue;
      }
      return parseInt(amountValue);
    }
    return 0;
  }

  public getValueOf(value: string | undefined): number {
    if (value !== undefined && value !== null) {
      return parseInt(value);
    }

    return 0;
  }

  public getTotalCoverage(coveragePercentage: number, coverageType: number, applicantSelected?: string): number {
    let totalCoverage = 0;
    if (applicantSelected !== undefined) {
      totalCoverage =
        parseFloat(this.getInsuranceValue(coverageType, applicantSelected).toString()) -
        this.getTotalOutstandingLiabilitiesDebtBalanceValue() +
        parseFloat(this.getInsuredAmount(coverageType, coveragePercentage).toString());
    } else {
      totalCoverage =
        parseFloat(this.getInsuranceValue(coverageType).toString()) -
        this.getTotalOutstandingLiabilitiesDebtBalanceValue() +
        parseFloat(this.getInsuredAmount(coverageType, coveragePercentage).toString());
    }
    return totalCoverage === undefined ? 0 : totalCoverage;
  }

  public getTotalShortage(
    coveragePercentage: number,
    coverageType: number = COVERAGE_TYPE.DISABILITY,
    incomeReduce: number | null | undefined,
    applicantType: string = PRIMARY,
    excludeSelection: boolean = false
  ) {
    if (coverageType === COVERAGE_TYPE.JOB_LOSS) {
      return (
        this.getInsuranceValueMonthly(coverageType, incomeReduce, coveragePercentage, applicantType, excludeSelection) -
        this.getMonthlyExpensesTotal() +
        this.getInsuredAmount(coverageType, coveragePercentage)
      );
    } else {
      if (excludeSelection) {
        return (
          this.getInsuranceValueMonthly(
            coverageType,
            incomeReduce,
            coveragePercentage,
            applicantType,
            excludeSelection
          ) +
          parseFloat(this.getInsuredAmount(2, coveragePercentage).toString()) -
          this.getMonthlyExpensesTotal()
        );
      }

      return (
        this.getInsuranceValueMonthly(2, incomeReduce) -
        this.getMonthlyExpensesTotal() +
        parseFloat(this.getInsuredAmount(2, coveragePercentage).toString())
      );
    }
  }

  public getInsuranceValueMonthly(
    coverageType: number = 2,
    incomeReduce: number | null | undefined,
    coveragePercentage?: number,
    applicantSelected?: string,
    excludeSelection: boolean = false
  ): number {
    if (applicantSelected === undefined) {
      if (this.isPrimarySelected(coverageType)) {
        return this.getInsuranceValueByApplicant(
          PRIMARY,
          coverageType,
          incomeReduce,
          coveragePercentage,
          excludeSelection
        );
      }
      return this.getInsuranceValueByApplicant(
        SECONDARY,
        coverageType,
        incomeReduce,
        coveragePercentage,
        excludeSelection
      );
    }
    return this.getInsuranceValueByApplicant(
      applicantSelected,
      coverageType,
      incomeReduce,
      coveragePercentage,
      excludeSelection
    );
  }

  private getInsuranceValueByApplicant(
    applicantSelected: string,
    coverageType: number,
    incomeReduce: number | null | undefined,
    contentNumber?: number,
    excludeSelection: boolean = false
  ) {
    let taxBand = 0;

    if (coverageType !== COVERAGE_TYPE.JOB_LOSS || !excludeSelection) {
      taxBand = parseInt((this.getTaxValue(SECONDARY) / YEAR + this.getTaxValue(PRIMARY) / YEAR).toFixed(0));
    }

    if (coverageType === COVERAGE_TYPE.JOB_LOSS) {
      taxBand = parseInt(
        (
          this.getTaxValueByCheckedApplicant(SECONDARY, coverageType) +
          this.getTaxValueByCheckedApplicant(PRIMARY, coverageType)
        ).toFixed(0)
      );
    }

    if ((coverageType === COVERAGE_TYPE.DISABILITY || coverageType === COVERAGE_TYPE.JOB_LOSS) && excludeSelection) {
      if (applicantSelected === PRIMARY) {
        taxBand = parseInt((this.getTaxValue(SECONDARY, excludeSelection) / YEAR).toFixed(0));
      } else {
        taxBand = parseInt((this.getTaxValue(PRIMARY, excludeSelection) / YEAR).toFixed(0));
      }
    }

    //applicantSelected === PRIMARY
    if (this.isPrimarySelected(coverageType) && !excludeSelection) {
      if (coverageType === COVERAGE_TYPE.DISABILITY) {
        return parseInt(
          (
            AddNumbers([
              this.getInsuranceBenefitReduced(PRIMARY, incomeReduce),
              this.getInsuranceBenefitReduced(SECONDARY, incomeReduce),
              this.getIncomeBase(SECONDARY, excludeSelection, coverageType),
              this.getIncomeBonuses(SECONDARY, coverageType),
              this.getIncomeInvestment(SECONDARY),
              this.getIncomeInvestment(PRIMARY),
            ]) - taxBand
          ).toFixed(0)
        );
      }

      return parseInt(
        (
          AddNumbers([
            this.getInsuranceBenefit(PRIMARY, coverageType),
            this.getInsuranceBenefit(SECONDARY, coverageType),
            this.getIncomeBase(SECONDARY, excludeSelection, coverageType),
            this.getIncomeBonuses(SECONDARY, coverageType),
            this.getIncomeInvestment(SECONDARY),
            this.getIncomeInvestment(PRIMARY),
          ]) - taxBand
        ).toFixed(0)
      );
    }

    if (!this.isPrimarySelected(coverageType) && !excludeSelection) {
      if (coverageType === COVERAGE_TYPE.DISABILITY) {
        // Borrower 2
        return parseInt(
          (
            AddNumbers([
              this.getIncomeBase(PRIMARY, excludeSelection, coverageType),
              this.getIncomeBonuses(PRIMARY, coverageType),
              this.getIncomeInvestment(SECONDARY),
              this.getInsuranceBenefitReduced(SECONDARY, incomeReduce),
              this.getIncomeInvestment(PRIMARY),
            ]) - taxBand
          ).toFixed(0)
        );
      }

      // This is for coverageType === 3 ---> JobLoss and Borrower 2
      return parseInt(
        (
          AddNumbers([
            this.getIncomeBase(PRIMARY, excludeSelection, coverageType),
            this.getIncomeBonuses(PRIMARY, coverageType),
            this.getIncomeInvestment(SECONDARY),
            this.getIncomeInvestment(PRIMARY),
          ]) - taxBand
        ).toFixed(0)
      );
    }

    if (coverageType === COVERAGE_TYPE.DISABILITY && excludeSelection) {
      if (applicantSelected === PRIMARY) {
        return parseInt(
          (
            AddNumbers([
              this.getIncomeBase(SECONDARY, excludeSelection, coverageType),
              this.getIncomeBonuses(SECONDARY, coverageType, true),
              this.getIncomeInvestment(PRIMARY),
              this.getIncomeInvestment(SECONDARY),
              this.getInsuranceBenefitNoSelection(coverageType, PRIMARY),
            ]) - taxBand
          ).toFixed(0)
        );
      }

      return parseInt(
        (
          AddNumbers([
            this.getIncomeBase(PRIMARY, excludeSelection, coverageType),
            this.getIncomeBonuses(PRIMARY, coverageType, true),
            this.getIncomeInvestment(PRIMARY),
            this.getInsuranceBenefitNoSelection(coverageType, SECONDARY),
            this.getIncomeInvestment(SECONDARY),
          ]) - taxBand
        ).toFixed(0)
      );
    }

    if (coverageType === COVERAGE_TYPE.JOB_LOSS && excludeSelection) {
      if (applicantSelected === PRIMARY) {
        return parseInt(
          (
            AddNumbers([
              this.getIncomeBase(SECONDARY, excludeSelection, coverageType),
              this.getIncomeBonuses(SECONDARY, coverageType, excludeSelection),
              this.getIncomeInvestment(SECONDARY),
              this.getIncomeInvestment(PRIMARY),
            ]) - taxBand
          ).toFixed(0)
        );
      }

      return parseInt(
        (
          AddNumbers([
            this.getIncomeBase(PRIMARY, excludeSelection, coverageType),
            this.getIncomeBonuses(PRIMARY, coverageType, excludeSelection),
            this.getIncomeInvestment(PRIMARY),
            this.getIncomeInvestment(SECONDARY),
          ]) - taxBand
        ).toFixed(0)
      );
    }

    return parseInt(
      (
        AddNumbers([
          this.getIncomeBase(PRIMARY, excludeSelection, coverageType),
          this.getIncomeBonuses(PRIMARY, coverageType),
          this.getIncomeInvestment(PRIMARY),
          this.getInsuranceBenefit(PRIMARY, coverageType),
          this.getInsuranceBenefit(SECONDARY, coverageType),
          this.getIncomeInvestment(SECONDARY),
        ]) - taxBand
      ).toFixed(0)
    );
  }

  private getInsuranceBenefitNoSelection(coverageType: number, applicantType: string, coveragePercentage: number = 0) {
    if (coverageType === COVERAGE_TYPE.DISABILITY) {
      if (applicantType === PRIMARY) {
        if (
          this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage &&
          this.gapData.incomeForm?.B1_ProvinceOrTerritory
        ) {
          const primaryInsuranceBenefitPDF =
            reduceTaxBand(
              parseInt(
                (
                  this.getIncomeBase(applicantType, true) *
                  (parseFloat(this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage) * PERCENTAGE)
                ).toFixed(0)
              ) * YEAR,
              this.gapData.incomeForm?.B1_ProvinceOrTerritory
            ) / YEAR;
          return parseInt(primaryInsuranceBenefitPDF.toFixed(0));
        }

        return 0;
      }

      if (
        this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage &&
        this.gapData.incomeForm?.B2_ProvinceOrTerritory
      ) {
        const secondaryInsuranceBenefitPDF =
          reduceTaxBand(
            parseInt(
              (
                this.getIncomeBase(applicantType, true) *
                (parseFloat(this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage) * PERCENTAGE)
              ).toFixed(0)
            ) * YEAR,
            this.gapData.incomeForm?.B2_ProvinceOrTerritory
          ) / YEAR;
        return parseInt(secondaryInsuranceBenefitPDF.toFixed(0));
      }

      return 0;
    } else if (coverageType === COVERAGE_TYPE.JOB_LOSS) {
      if (applicantType === PRIMARY) {
        if (this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage) {
          return parseInt(
            (
              this.getIncomeBase(applicantType, true) *
              (parseFloat(this.gapData.existingCoveragesForm?.B1_DisabilityInsuranceInPercentage) * PERCENTAGE)
            ).toFixed(0)
          );
        }

        return 0;
      }

      if (this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage) {
        if (coveragePercentage === 0) {
          return parseInt(
            (
              this.getIncomeBase(applicantType, true) *
              (parseFloat(this.gapData.existingCoveragesForm?.B2_DisabilityInsuranceInPercentage) * PERCENTAGE)
            ).toFixed(0)
          );
        }

        if (coveragePercentage === COVERAGE_PERCENTAGE.HUNDRED) {
          return this.getIncomeBase(applicantType, true);
        }

        if (coveragePercentage === COVERAGE_PERCENTAGE.FIFTY) {
          return this.getIncomeBase(applicantType, true) * FiFTY_PERCENT;
        }

        return 0;
      }

      return 0;
    }

    return 0;
  }

  public getTaxValue(
    applicantType: string,
    excludeSelection: boolean = false,
    coverageType: number = COVERAGE_TYPE.DISABILITY
  ) {
    if (applicantType === PRIMARY) {
      if (this.gapData.incomeForm?.B1_ProvinceOrTerritory) {
        return parseInt(
          reduceTaxBand(
            AddNumbers([
              this.getIncomeBase(applicantType, excludeSelection) * YEAR,
              this.getIncomeBonuses(applicantType, coverageType, excludeSelection) * YEAR,
            ]),
            this.gapData.incomeForm?.B1_ProvinceOrTerritory,
            true
          ).toFixed(0)
        );
      }
      return 0;
    }

    if (this.gapData.incomeForm?.B2_ProvinceOrTerritory) {
      return parseInt(
        reduceTaxBand(
          AddNumbers([
            this.getIncomeBase(applicantType, excludeSelection) * YEAR,
            this.getIncomeBonuses(applicantType, coverageType, excludeSelection) * YEAR,
          ]),
          this.gapData.incomeForm?.B2_ProvinceOrTerritory,
          true
        ).toFixed(0)
      );
    }

    return 0;
  }
}
