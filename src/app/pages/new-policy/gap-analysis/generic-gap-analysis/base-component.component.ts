import { Component, input, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import {
  AssetLiability,
  Coverages,
  Expenses,
  GapAnalysisBlob,
  GapAnalysisPDFResponse,
  Income,
  LenderInfo,
  initialValueBlob,
} from '@core/models/gap-analysis/gap-analysis.model';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { InsuranceTypeEnum } from '../gap-analysis.component';
import { GapAnalysisFacade } from '@store/pages/new-policy/gap-analysis/facades/gap-analysis.facades';

@Component({
  selector: 'app-base',
  template: ` <p>base works!</p> `,
  styles: [],
})
export class BaseComponent {
  public stepper = input.required<MatStepper>();
  public stepList = input<any[]>([]);
  @ViewChild('mainStepper', { static: false }) public mainStepper!: MatStepper;
  @ViewChild('titleStepper') titleStepper!: MatStepper;

  public title!: string;
  public description!: string;
  public nextButtonLabel!: string;
  protected isReadOnly: boolean = false;

  public totalCoverage: number = 0;
  public totalDebts: number = 0;
  public totalExpense: number = 0;
  public baseExpenses: number = 0;
  public additionalExpenses: number = 0;
  public monthlyIncome: number = 0;
  public branch!: string;
  public phoneNumber: string = '';
  public disabilityTotalCoverage: number = 0;
  public coverageGap: number = 0;
  public lenderFormValid: boolean = false;
  public gapAnalysisTemp: GapAnalysisBlob = initialValueBlob();
  public lenderInfo!: LenderInfo;
  public income!: Income;
  public coverage!: Coverages;
  public assetLiability!: AssetLiability;
  public expenses!: Expenses;
  public existingCoverageDisability: number = 0;
  public gapAnalysisPDFResponse!: GapAnalysisPDFResponse;
  public insuranceTypeLife = InsuranceTypeEnum.LIFE;
  public insuranceTypeDisability = InsuranceTypeEnum.DISABILITY;

  public disabilityMonthlyIncomeGap: number = 0;

  public stepListArr = [
    {
      title: 'Income',
      description: 'Details of Income',
    },
    {
      title: 'Assets & Liabilities',
      description: 'Assets & Liabilities',
    },
    {
      title: 'Expenses',
      description: 'Expenses',
    },
    {
      title: 'Coverages',
      description: 'Coverages ',
    },
    {
      title: 'Results',
      description: 'Results',
    },
  ];

  public toolTip: any = {
    investments: 'Government & Corporate Bonds, Mutual Funds, Money Market Funds, etc.',
    savings: 'Chequing and Savings',
    others: 'Recreational vehicles, valuable collections, etc.',
    newLoan: 'New loan, line of credit or mortgage being applied for today.',
    utilities: 'Water, Hydro, Gas',
    otherExpenses: 'Cell phones,  kids sports or activities, gym memberships, subscriptions, cable, internet etc.',
    transportation: 'Vehicle insurance, Transportation fare, cost of fuel, vehicle maintenance',
    lifeInsurance: 'Permanent, Whole, Term, Universal Life',
    groupLifeInsurance: 'Coverage at work, how much life insurance does the individual have through work?',
    creditProtection: 'Loan, Line of Credit or Mortgage insurance already in place.',
    incomeReplacementCoverage: 'Short term, Long term. Typically, between 50% - 65% of gross income.',
  };

  protected getEmploymentTypeList = () => [
    { value: 'annual', description: 'Annual Salary' },
    { value: 'hourly', description: 'Hourly Pay' },
  ];

  public showStepper = false;
  constructor(
    public fb: FormBuilder,
    public stepService: SharedStepService
  ) {}

  public disableButton(form: FormGroup): boolean {
    if (this.isReadOnly) {
      return false;
    }

    if (!form.valid && !this.isReadOnly) {
      return true;
    }

    return false;
  }

  public refreshDataFromStore(storeFacade: GapAnalysisFacade): void {
    storeFacade.getAssetLiability().subscribe((assetLiability: AssetLiability) => {
      this.assetLiability = assetLiability;
      this.totalDebts = assetLiability?.liability?.totalLiability;
    });

    storeFacade.getCoverage().subscribe((coverages: Coverages) => {
      this.coverage = coverages;
      this.totalCoverage = coverages?.totalCoverageAmount;
      //this.totalCoverage = this.formatNumberToCurrencyString(this.totalCoverage);

      if (coverages.incomeReplacementCoverage) {
        this.disabilityTotalCoverage = coverages?.coverageAmount;
      } else {
        this.disabilityTotalCoverage = 0;
      }
    });

    storeFacade.getIncome().subscribe((income: Income) => {
      this.income = income;
      this.monthlyIncome = income?.estimatedMonthlyIncome;
    });

    storeFacade.getExpense().subscribe((expenses: Expenses) => {
      this.expenses = expenses;
      this.baseExpenses = 0;
      this.additionalExpenses = 0;
      for (const [key, value] of Object.entries(expenses)) {
        if (
          key != 'loans' &&
          key != 'creditCards' &&
          key != 'lineOfCredit' &&
          key != 'newDebt' &&
          key != 'totalExpenses'
        ) {
          this.baseExpenses += Number(value);
        }
        if (
          key != 'housing' &&
          key != 'propertyTaxes' &&
          key != 'utilities' &&
          key != 'children' &&
          key != 'transportation' &&
          key != 'groceries' &&
          key != 'insurance' &&
          key != 'otherExpenses' &&
          key != 'totalExpenses'
        ) {
          this.additionalExpenses += Number(value);
        }
      }
    });
  }

  public prepareFinalPayLoadForPdf(gapAnalysisBlob: GapAnalysisBlob): GapAnalysisBlob {
    const pdfPayload: GapAnalysisBlob = initialValueBlob();
    pdfPayload.lendingOfficer = this.lenderInfo?.lender;
    pdfPayload.email = this.lenderInfo?.userEmail;
    pdfPayload.branch = this.branch;
    pdfPayload.phone = this.phoneNumber;
    pdfPayload.incomeInformationEmploymentType =
      this.income?.employmentType == 'annual' ? 'Annual Salary' : 'Hourly Pay';
    pdfPayload.incomeInformationGrossAnnualIncome = this.formatNumberToCurrencyString(this.income?.annualIncome);
    pdfPayload.incomeInformationAverageHoursPerWeek = this.income?.workHours ? this.income?.workHours?.toString() : '0';
    pdfPayload.incomeInformationHourlyPay = this.formatNumberToCurrencyString(this.income?.hourlyPay);
    pdfPayload.incomeInformationAdditionalAnnualIncome = this.formatNumberToCurrencyString(
      this.income?.additionalIncome
    );
    pdfPayload.incomeInformationEstimatedMonthlyIncome = this.formatNumberToCurrencyString(
      this.income?.estimatedMonthlyIncome
    );
    pdfPayload.assetsRealEstate = this.formatNumberToCurrencyString(this.assetLiability?.asset?.realEstate);
    pdfPayload.assetsInvestments = this.formatNumberToCurrencyString(this.assetLiability?.asset?.investments);
    pdfPayload.assetsSavings = this.formatNumberToCurrencyString(this.assetLiability?.asset?.savings);
    pdfPayload.assetsOtherAssets = this.formatNumberToCurrencyString(this.assetLiability?.asset?.others);
    pdfPayload.assetsTotalAssets = this.formatNumberToCurrencyString(this.assetLiability?.asset?.totalAsset);
    pdfPayload.liabilitiesExistingMortgage = this.formatNumberToCurrencyString(
      this.assetLiability?.liability?.mortgage
    );
    pdfPayload.liabilitiesExistingLineOfCredit = this.formatNumberToCurrencyString(
      this.assetLiability?.liability?.lineOfCredit
    );
    pdfPayload.liabilitiesExistingLoans = this.formatNumberToCurrencyString(this.assetLiability?.liability?.loans);
    pdfPayload.liabilitiesExistingCreditCards = this.formatNumberToCurrencyString(
      this.assetLiability?.liability?.creditCards
    );
    pdfPayload.liabilitiesNewDebt = this.formatNumberToCurrencyString(this.assetLiability?.liability?.newDebt);
    pdfPayload.liabilitiesTotalLiabilities = this.formatNumberToCurrencyString(
      this.assetLiability?.liability?.totalLiability
    );
    pdfPayload.monthlyExpensesHousing = this.formatNumberToCurrencyString(this.expenses?.housing);
    pdfPayload.monthlyExpensesPropertyTaxes = this.formatNumberToCurrencyString(this.expenses?.propertyTaxes);
    pdfPayload.monthlyExpensesUtilities = this.formatNumberToCurrencyString(this.expenses.utilities);
    pdfPayload.monthlyExpensesChildrenAndEducation = this.formatNumberToCurrencyString(this.expenses?.children);
    pdfPayload.monthlyExpensesTransportation = this.formatNumberToCurrencyString(this.expenses?.transportation);
    pdfPayload.monthlyExpensesGroceries = this.formatNumberToCurrencyString(this.expenses?.groceries);
    pdfPayload.monthlyExpensesHouseInsurance = this.formatNumberToCurrencyString(this.expenses?.insurance);
    pdfPayload.monthlyExpensesOtherExpenses = this.formatNumberToCurrencyString(this.expenses?.otherExpenses);
    pdfPayload.monthlyExpensesLoans = this.formatNumberToCurrencyString(this.expenses.loans);
    pdfPayload.monthlyExpensesCreditCards = this.formatNumberToCurrencyString(this.expenses?.creditCards);
    pdfPayload.monthlyExpensesLineOfCredit = this.formatNumberToCurrencyString(this.expenses?.lineOfCredit);
    pdfPayload.monthlyExpensesNewDebt = this.formatNumberToCurrencyString(this.expenses?.newDebt);
    pdfPayload.monthlyExpensesTotalMonthlyExpenses = this.formatNumberToCurrencyString(this.expenses?.totalExpenses);
    pdfPayload.coveragesLifeInsurance = this.formatNumberToCurrencyString(this.coverage?.lifeInsurance);
    pdfPayload.coveragesGroupLifeInsurance = this.formatNumberToCurrencyString(this.coverage?.groupLifeInsurance);
    pdfPayload.coveragesCreditProtection = this.formatNumberToCurrencyString(this.coverage?.creditProtection);
    pdfPayload.coveragesCoveragePercentage = this.coverage?.coverageAmount
      ? this.coverage?.coverageAmount.toFixed(2) + ' %'
      : '0.00 %';
    pdfPayload.resultsLifeTotalRequirement = this.formatNumberToCurrencyString(
      parseFloat(gapAnalysisBlob.resultsLifeTotalRequirement)
    );
    pdfPayload.resultsLifeExistingCoverage = this.formatNumberToCurrencyString(this.totalCoverage);
    pdfPayload.resultsLifeUnprotectedCoverage = this.formatNumberToCurrencyString(
      parseFloat(gapAnalysisBlob.resultsLifeUnprotectedCoverage)
    );
    pdfPayload.resultsDisabilityCurrentMonthlyObligation = this.formatNumberToCurrencyString(
      parseFloat(gapAnalysisBlob.resultsDisabilityCurrentMonthlyObligation)
    );
    pdfPayload.resultsDisabilityExistingCoverage = this.formatNumberToCurrencyString(
      parseFloat(gapAnalysisBlob.resultsDisabilityExistingCoverage)
    );
    pdfPayload.resultsDisabilityMonthlyIncomeGap = this.formatNumberToCurrencyString(
      parseFloat(gapAnalysisBlob.resultsDisabilityMonthlyIncomeGap)
    );
    pdfPayload.resultsCalculatedMonthlyGap = this.formatNumberToCurrencyString(
      parseFloat(gapAnalysisBlob.resultsCalculatedMonthlyGap)
    );
    pdfPayload.resultsCalculatedUnprotectedCoverages = this.formatNumberToCurrencyString(
      parseFloat(gapAnalysisBlob.resultsCalculatedUnprotectedCoverages)
    );

    return pdfPayload;
  }

  public getAllDataFromStore(): GapAnalysisBlob {
    this.gapAnalysisTemp.lendingOfficer = this.lenderInfo?.lender;
    this.gapAnalysisTemp.email = this.lenderInfo?.userEmail;
    this.gapAnalysisTemp.branch = this.lenderInfo?.branch;
    this.gapAnalysisTemp.phone = this.lenderInfo?.phoneNumber;
    this.gapAnalysisTemp.incomeInformationEmploymentType = this.income?.employmentType;
    this.gapAnalysisTemp.incomeInformationGrossAnnualIncome = this.income?.annualIncome?.toString();
    this.gapAnalysisTemp.incomeInformationEstimatedMonthlyIncome = this.income?.estimatedMonthlyIncome?.toString();
    this.gapAnalysisTemp.incomeInformationAverageHoursPerWeek = this.income?.workHours?.toString();
    this.gapAnalysisTemp.incomeInformationHourlyPay = this.income?.hourlyPay?.toString();
    this.gapAnalysisTemp.incomeInformationAdditionalAnnualIncome = this.income?.annualIncome?.toString();
    this.gapAnalysisTemp.assetsRealEstate = this.assetLiability?.asset?.realEstate?.toString();
    this.gapAnalysisTemp.assetsInvestments = this.assetLiability?.asset?.investments?.toString();
    this.gapAnalysisTemp.assetsSavings = this.assetLiability?.asset?.savings?.toString();
    this.gapAnalysisTemp.assetsOtherAssets = this.assetLiability?.asset?.others?.toString();
    this.gapAnalysisTemp.assetsTotalAssets = this.assetLiability?.asset?.totalAsset?.toString();
    this.gapAnalysisTemp.liabilitiesExistingMortgage = this.assetLiability?.liability?.mortgage?.toString();
    this.gapAnalysisTemp.liabilitiesExistingMortgage = this.assetLiability?.liability?.lineOfCredit?.toString();
    this.gapAnalysisTemp.liabilitiesExistingLoans = this.assetLiability?.liability?.loans?.toString();
    this.gapAnalysisTemp.liabilitiesExistingCreditCards = this.assetLiability?.liability?.creditCards?.toString();
    this.gapAnalysisTemp.liabilitiesNewDebt = this.assetLiability?.liability?.newDebt?.toString();
    this.gapAnalysisTemp.liabilitiesTotalLiabilities = this.assetLiability?.liability?.totalLiability?.toString();
    this.gapAnalysisTemp.monthlyExpensesHousing = this.expenses?.housing?.toString();
    this.gapAnalysisTemp.monthlyExpensesPropertyTaxes = this.expenses?.propertyTaxes?.toString();
    this.gapAnalysisTemp.monthlyExpensesUtilities = this.expenses.utilities?.toString();
    this.gapAnalysisTemp.monthlyExpensesChildrenAndEducation = this.expenses?.children?.toString();
    this.gapAnalysisTemp.monthlyExpensesTransportation = this.expenses?.transportation?.toString();
    this.gapAnalysisTemp.monthlyExpensesGroceries = this.expenses?.groceries?.toString();
    this.gapAnalysisTemp.monthlyExpensesHouseInsurance = this.expenses?.insurance?.toString();
    this.gapAnalysisTemp.monthlyExpensesOtherExpenses = this.expenses?.otherExpenses?.toString();
    this.gapAnalysisTemp.monthlyExpensesLoans = this.assetLiability?.liability?.loans?.toString();
    this.gapAnalysisTemp.monthlyExpensesCreditCards = this.expenses?.creditCards?.toString();
    this.gapAnalysisTemp.monthlyExpensesNewDebt = this.expenses?.newDebt?.toString();
    this.gapAnalysisTemp.monthlyExpensesTotalMonthlyExpenses = this.expenses?.totalExpenses?.toString();
    this.gapAnalysisTemp.coveragesLifeInsurance = this.coverage?.lifeInsurance?.toString();
    this.gapAnalysisTemp.coveragesGroupLifeInsurance = this.coverage?.groupLifeInsurance?.toString();
    this.gapAnalysisTemp.coveragesCreditProtection = this.coverage?.creditProtection?.toString();
    this.gapAnalysisTemp.coveragesCoveragePercentage = this.coverage?.coverageAmount?.toString();

    return this.gapAnalysisTemp;
  }

  protected openPdfFile(referenceNumber: string, documentContent: string | undefined, download?: boolean) {
    var blob = this.b64toBlob(documentContent, 'application/pdf');
    var fileURL = URL.createObjectURL(blob);

    if (download) {
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = referenceNumber;
      link.click();
    } else {
      window.open(fileURL);
    }
  }

  protected b64toBlob(b64Data: any, contentType: string) {
    contentType = contentType || '';
    let sliceSize = 512;
    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  protected formatNumberToCurrencyString(value?: number): string {
    return value || value == 0
      ? '$ ' + value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '$ 0.00';
  }

  protected formatPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length === 0) {
      phoneNumber = '';
    } else if (phoneNumber.length <= 3) {
      phoneNumber = phoneNumber.replace(/^(\d{0,3})/, '($1)');
    } else if (phoneNumber.length <= 6) {
      phoneNumber = phoneNumber.replace(/^(\d{0,3})(\d{0,3})/, '($1) $2');
    } else if (phoneNumber.length <= 10) {
      phoneNumber = phoneNumber.replace(/^(\d{0,3})(\d{0,3})(\d{0,4})/, '($1) $2-$3');
    } else {
      phoneNumber = phoneNumber.substring(0, 10);
      phoneNumber = phoneNumber.replace(/^(\d{0,3})(\d{0,3})(\d{0,4})/, '($1) $2-$3');
    }

    return phoneNumber;
  }
}
