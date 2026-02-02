import { ApplicantSelected, FormToken, List } from '@core/utils/Interfaces/form-token.model';
import { Income } from '@core/utils/Interfaces/forms/income.interface';
import { COVERAGE_TYPE, PRIMARY, SECONDARY, YEAR } from '@core/utils/enums/gap-analysis-constants';
import { AddNumbers } from '@core/utils/functions/numericOperations';
import { Taxes } from '@core/models/gap-analysis/gap-analysis.model';
import { FEDERAL, PERCENTAGE } from '@core/utils/enums/gap-analysis-constants';
import { ENUM_TAXES } from '@core/utils/enums/gap-analysis-enums';

export const gapData: FormToken = {};

export const hasSecondaryApplicant = (): boolean => {
  if (gapData.IsSecondaryApplicant) {
    return true;
  }
  return false;
};

export const getApplicantList = (): List[] => {
  let applicantList: List[] = [
    {
      id: PRIMARY,
      description: gapData.PrimaryName,
    },
  ];

  if (gapData.IsSecondaryApplicant) {
    applicantList = [
      ...applicantList,
      {
        id: SECONDARY,
        description: gapData.SecondaryName,
      },
    ];
  }

  return applicantList;
};

export const applicantInitialState = (): ApplicantSelected[] => [
  {
    coverageType: COVERAGE_TYPE.LIFE,
    applicantSelected: PRIMARY,
  },
  {
    coverageType: COVERAGE_TYPE.DISABILITY,
    applicantSelected: PRIMARY,
  },
  {
    coverageType: COVERAGE_TYPE.JOB_LOSS,
    applicantSelected: PRIMARY,
  },
  {
    coverageType: COVERAGE_TYPE.CRITICAL_ILLNESS,
    applicantSelected: PRIMARY,
  },
];

export const resetApplicationState = (): ApplicantSelected[] => [
  {
    coverageType: COVERAGE_TYPE.LIFE,
    applicantSelected: PRIMARY,
  },
  {
    coverageType: COVERAGE_TYPE.DISABILITY,
    applicantSelected: PRIMARY,
  },
  {
    coverageType: COVERAGE_TYPE.JOB_LOSS,
    applicantSelected: PRIMARY,
  },
  {
    coverageType: COVERAGE_TYPE.CRITICAL_ILLNESS,
    applicantSelected: PRIMARY,
  },
];

export const getInsuranceValue = (
  coverageType: number,
  gapData: FormToken,
  applicantSelected: ApplicantSelected[],
  applicant?: string
) => {
  let value: number = 0;
  if (coverageType === COVERAGE_TYPE.LIFE) {
    if (applicant !== undefined) {
      value =
        applicant === PRIMARY
          ? getValueOf(gapData.B1_ExistingLifeInsurance)
          : getValueOf(gapData.B2_ExistingLifeInsurance);
    } else {
      value =
        applicantSelected.filter((applicant) => applicant.coverageType === coverageType)[0].applicantSelected ===
        PRIMARY
          ? getValueOf(gapData.B1_ExistingLifeInsurance)
          : getValueOf(gapData.B2_ExistingLifeInsurance);
    }
  } else {
    if (applicant === undefined) {
      value =
        applicantSelected.filter((applicant) => applicant.coverageType === coverageType)[0].applicantSelected ===
        PRIMARY
          ? getValueOf(gapData.B1_ExistingCriticalIllnessInsurance)
          : getValueOf(gapData.B2_ExistingCriticalIllnessInsurance);
    } else {
      value =
        applicant === PRIMARY
          ? getValueOf(gapData.B1_ExistingCriticalIllnessInsurance)
          : getValueOf(gapData.B2_ExistingCriticalIllnessInsurance);
    }
  }

  return value === null || value === undefined ? 0 : value;
};

export const getValueOf = (value: string | undefined): number => {
  if (value !== undefined && value !== null && value !== 'NaN') {
    return parseInt(value);
  }

  return 0;
};
export const newGetValueOf = (value: string | undefined): number => {
  if (value !== undefined && value !== null && value !== 'NaN') {
    return parseInt(value);
  }

  return 0;
};

export const getAnnualIncomeBeforeTax = (applicantType: string, values: FormToken) => {
  if (applicantType === PRIMARY) {
    if (values.B1_ProvinceOrTerritory !== null) {
      return AddNumbers([
        values.B1_GrossMonthlyBaseSalary,
        values.B1_GrossMonthlyBonuses,
        // values.B1_GrossMonthlyRentals
      ]);
    }
    return 0;
  }

  if (values.B2_ProvinceOrTerritory !== null && values.B2_ProvinceOrTerritory !== undefined) {
    return AddNumbers([
      values.B2_GrossMonthlyBaseSalary,
      values.B2_GrossMonthlyBonuses,
      // values.B2_GrossMonthlyRentals
    ]);
  }
  return 0;
};
export const newGetAnnualIncomeBeforeTax = (applicantType: string, values: Income) => {
  if (applicantType === PRIMARY) {
    if (values.B1_ProvinceOrTerritory !== null) {
      return AddNumbers([
        values.B1_GrossMonthlyBaseSalary,
        values.B1_GrossMonthlyBonuses,
        // values.B1_GrossMonthlyRentals
      ]);
    }
    return 0;
  }

  if (values.B1_ProvinceOrTerritory !== null && values.B2_ProvinceOrTerritory !== undefined) {
    return AddNumbers([
      values.B2_GrossMonthlyBaseSalary,
      values.B2_GrossMonthlyBonuses,
      // values.B2_GrossMonthlyRentals
    ]);
  }
  return 0;
};

export const getAnnualIncome = (applicantType: string, values: any): number => {
  if (applicantType === PRIMARY) {
    if (values.B1_ProvinceOrTerritory !== null) {
      return AddNumbers([
        reduceTaxBand(
          AddNumbers([
            getValueOf(values.B1_GrossMonthlyBaseSalary) * YEAR,
            getValueOf(values.B1_GrossMonthlyBonuses) * YEAR,
          ]),
          values.B1_ProvinceOrTerritory
        ),
        getValueOf(values.B1_GrossMonthlyRentals) * YEAR,
      ]);
    }
    return 0;
  }

  if (values.B2_ProvinceOrTerritory !== null && values.B2_ProvinceOrTerritory !== undefined) {
    return AddNumbers([
      reduceTaxBand(
        AddNumbers([
          getValueOf(values.B2_GrossMonthlyBaseSalary) * YEAR,
          getValueOf(values.B2_GrossMonthlyBonuses) * YEAR,
        ]),
        values.B2_ProvinceOrTerritory
      ),
      getValueOf(values.B2_GrossMonthlyRentals) * YEAR,
    ]);
  }
  return 0;
};

export const getMonthlyIncome = (applicantType: string, values: any) => {
  const total = AddNumbers([
    reduceTaxBand(
      getAnnualIncomeBeforeTax(applicantType, values) * YEAR,
      applicantType === PRIMARY ? values.B1_ProvinceOrTerritory : values.B2_ProvinceOrTerritory
    ) / YEAR,
    applicantType === PRIMARY ? getValueOf(values.B1_GrossMonthlyRentals) : getValueOf(values.B2_GrossMonthlyRentals),
  ]);

  return parseInt(total.toFixed(0));
};

export const reduceTaxBand = (income: number, province: string, isIncomeExcluded?: boolean) => {
  const taxesList = ENUM_TAXES;
  const federalTax = taxesList.filter((tax) => tax.abbreviation === FEDERAL && income >= tax.lowerLimit);
  const federalValue =
    province === 'QC'
      ? calculateValue(federalTax, income) - calculateValue(federalTax, income) * 0.165
      : calculateValue(federalTax, income);
  const provincialTax = taxesList.filter((tax) => tax.abbreviation === province && income >= tax.lowerLimit);
  const provincialValue = calculateValue(provincialTax, income);

  if (!isIncomeExcluded) {
    return income - (federalValue + provincialValue);
  }

  return federalValue + provincialValue;
};

const calculateValue = (taxValues: Taxes[], incomeAmount: number): number => {
  let rpt: number = 0;
  taxValues
    .filter((tax) => tax.rate > 0)
    .forEach((band, index) => {
      if (band.rate > 0) {
        const fixValue = band.rate * PERCENTAGE;
        if (band.upperLimit !== undefined) {
          if (index + 1 === taxValues.length - 1) {
            rpt += parseFloat(((incomeAmount - band.lowerLimit) * fixValue).toString());
          } else {
            rpt += parseFloat(((band.upperLimit - band.lowerLimit) * fixValue).toString());
          }
        } else {
          rpt += parseFloat(((incomeAmount - band.lowerLimit) * fixValue).toString());
        }
      }
    });

  return rpt;
};
