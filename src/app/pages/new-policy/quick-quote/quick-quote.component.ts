import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntypedFormGroup } from '@angular/forms';
import { JsonFormData } from '@core/models/dynamic-form.interface';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { ProductService } from '@core/services/tenant/product.service';
import { MessageComponent } from '@core/components/message/message.component';
import { QuoteService } from '@core/services/insurance/quote.service';
import {
  InsuranceTypeApplicantRequest,
  InsuranceTypeApplicationRequest,
  InsuranceTypeCoverageResponse,
  QuoteInsuranceTypeRequest,
  QuoteInsuranceTypeResponse,
  applicantCoveragesQQ,
} from '@core/models/insurance/quote-insurance-type.model';
import { APPLICANT_TYPE, INSURANCE_TYPE, QQ_LOAN_IDENTIFIER } from '@core/utils/enums/insurance-enums';
import {
  getCoverageTypeList,
  getInsuranceTypeList,
  getLoanTypeList,
  getPaymentFrequencyList,
  getProvinceList,
} from '@core/utils/enums/system-enums';
import { EnumService } from '@core/services/insurance/enum.service';
import { AppState } from '@store';
import { FormMetadataDto, getStringifyQuickQuote, QuickQuoteMPDto } from '@core/models/quickQuote/quick-quote.model';
import { ApplicantEmitter, ApplicantInfoComponent } from '@core/components/applicant-info/applicant-info.component';
import { LenderInfoComponent } from '@core/components/lender-info/lender-info.component';
import { LoanInfoComponent } from '@core/components/loan-info/loan-info.component';
import {
  loadingInformationSelector,
  quoteInsuranceTypeResponseSelector,
} from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { Observable } from 'rxjs';
import { UserService } from '@core/services/tenant/user.service';
import { UserResourceParams, UsersByCriteria } from '@core/models/tenant/user.model';
import { ViewportScroller, AsyncPipe } from '@angular/common';
import { QuickQuoteService } from '@core/services/insurance/quick-quote.service';
import { Applicant } from '@core/models/insurance/applicant.model';
import {
  quoteInsuranceTypeQuickQuote,
  setApplicationIdentifierEmpty,
} from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import moment from 'moment';
import { WaiverReasonService } from '@core/services/insurance/waiverReason.service';
import { BranchService } from '@core/services/tenant/branch.service';
import { PricingCoverageComponent } from '@core/components/pricing-coverage/pricing-coverage.component';
import { PolicyGroupingComponent } from '@core/components/policy-grouping/policy-grouping.component';
import { MatDividerModule } from '@angular/material/divider';
import { ApplicantInfoComponent as ApplicantInfoComponent_1 } from '@core/components/applicant-info/applicant-info.component';
import { LoanInfoComponent as LoanInfoComponent_1 } from '@core/components/loan-info/loan-info.component';
import { LenderInfoComponent as LenderInfoComponent_1 } from '@core/components/lender-info/lender-info.component';

@Component({
  selector: 'app-quick-quote',
  templateUrl: './quick-quote.component.html',
  styleUrls: ['./quick-quote.component.scss'],
  standalone: true,
  imports: [
    LenderInfoComponent_1,
    LoanInfoComponent_1,
    ApplicantInfoComponent_1,
    MatDividerModule,
    PolicyGroupingComponent,
    PricingCoverageComponent,
    AsyncPipe,
  ],
})
export class QuickQuoteComponent {
  loanInfo = viewChild<LoanInfoComponent | undefined>('loanInfo');
  lenderInfo = viewChild<LenderInfoComponent | undefined>('lenderInfo');
  applicantInfo = viewChild<ApplicantInfoComponent | undefined>('applicantInfo');

  private store = inject(Store<AppState>);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private userService = inject(UserService);
  private elementRef = inject(ElementRef);
  private scroller = inject(ViewportScroller);
  private quickQuoteService = inject(QuickQuoteService);
  private waiverReasonService = inject(WaiverReasonService);
  private branchService = inject(BranchService);
  public enumService = inject(EnumService);
  public quoteService = inject(QuoteService);
  public productService = inject(ProductService);

  public insuredAmount = '';
  public payment = 0;
  public frequency = 0;
  public frequencyString: string | undefined;
  public totalCoverageCost = 0;
  public formInputData: JsonFormData[] = [];
  public formGroups: UntypedFormGroup[] = [];
  public coverages: any[] = [];
  public frequencyTypeList = getPaymentFrequencyList();
  public lenderFormValid: boolean = false;
  public loanFormValid: boolean = false;
  public applicantFormValid: boolean = false;
  public applicantFormObjValues!: ApplicantEmitter[];
  public lenderFormObjValues!: UntypedFormGroup;
  public loanFormObjValues!: UntypedFormGroup;
  public isQuoteInsuranceTypeResponseVisible: boolean = false;
  public quoteInsuranceTypeResponseData$: Observable<QuoteInsuranceTypeResponse> = this.store.select(
    quoteInsuranceTypeResponseSelector
  );
  public applicantListLength: number = 0;
  private canGeneratePdf: boolean = false;

  private scrollDown() {
    var container = this.elementRef.nativeElement.querySelector('#ending');
    if (container !== null) {
      this.scroller.scrollToAnchor('ending');
    }
  }

  clearForm() {
    this.isQuoteInsuranceTypeResponseVisible = false;
    this.lenderInfo()?.setLenderForm(undefined, undefined);
    this.loanInfo()?.clearForm();
    this.applicantInfo()?.clearForm();
    this.getFormValues();
  }

  public messageDialog(message: string): MatDialogRef<MessageComponent> {
    return this.dialog.open(MessageComponent, {
      width: '500px',
      data: {
        type: 'warning',
        message,
      },
    });
  }

  public async downloadPDF() {
    let pdfName = '';
    const loanValues = this.loanFormObjValues.getRawValue();
    switch (loanValues.insuranceType) {
      case INSURANCE_TYPE.SINGLE_PREMIUM:
        pdfName = 'CPQQ01SP';
        break;

      case INSURANCE_TYPE.MORTGAGE:
        pdfName = 'CPQQ02MP';
        break;

      default:
        pdfName = 'CPQQ02LOC';
        break;
    }
    const pdfData: FormMetadataDto = {
      formType: 'DownloadOnly',
      formIdentifier: pdfName,
      templateName: `${pdfName}.pdf`,
      formData: await this.getQuickQuoteData(),
    };

    this.quickQuoteService.generatePdf(pdfData).subscribe((response) => {
      this.openPdfFile(response?.referenceNumber, response?.insuranceForms[0], false);
    });
  }

  private async getQuickQuoteData() {
    let valueDto: QuickQuoteMPDto = {};
    await this.quoteInsuranceTypeResponseData$.subscribe((typeResponse: QuoteInsuranceTypeResponse) => {
      const loanValues = this.loanFormObjValues.getRawValue();
      const lenderValues = this.lenderFormObjValues.getRawValue();

      const branchName = this.branchService.branchesValue.find((branch) => branch.id === lenderValues.branch)?.name;

      valueDto = {
        LendingOfficer: lenderValues.lender,
        LendingOfficerEmail: lenderValues.userEmail,
        LendingOfficerPhone: lenderValues.phoneNumber,
        LenderBranch: branchName,
        FormDate: '2024-06-06T00:00:00',
        LoanType: this.enumService.getDescription(getLoanTypeList(), loanValues.loanType),
        InsuranceType: this.enumService.getDescription(getInsuranceTypeList(), loanValues.insuranceType),
        LoanAmount: loanValues.loanAmount,
        InsuredLoanPercentAmount:
          typeResponse.applications[0].coverages
            ?.find((coverage) => coverage.coverageType === this.enumService.getAbbreviation(getCoverageTypeList(), 1))
            ?.coveragePercent.toString() + '%',
        InsuredPaymentPercentAmount:
          typeResponse.applications[0].coverages
            ?.find((coverage) => coverage.coverageType === this.enumService.getAbbreviation(getCoverageTypeList(), 2))
            ?.coveragePercent.toString() + '%',
        // LoanAmount: `${this.customOption.transform(parseInt(this.getTotalOutstandingLiabilitiesDebtBalanceValue().toString()), 'USD', 'symbol', '2.0', this.languageService.languageSelectedStr)?.toString().normalize("NFKC"),
        PaymentAmount: loanValues.paymentAmount,
        PaymentFrequency: loanValues.paymentFrequency,
        PaymentType: loanValues.paymentType,
        FundingDate: moment(loanValues.fundingDate).format('D/MM/YYYY').toString(),
        FirstPaymentDate: moment(loanValues.firstPaymentDate).format('D/MM/YYYY').toString(),
        InterestRate: `${loanValues.interestRate}%`,
        LoanTerm: loanValues.loanTerm,
        Amortization: loanValues.amortization,
        LoanAmountCovered: typeResponse.applications[0].loanAmountCovered.toString(),
        LoanPaymentAmountCovered: typeResponse.paymentCoverageLimit.toString(),
        FirstApplicationNames: this.getApplicantsNames(typeResponse.applications[0].applicants),
        SecondApplicationNames: 'Testing Second Names',
        FirstApplicationLIFEPremiumAmount: "$" + this.getPremiumAmountPerCoverage(
          typeResponse.applications[0].coverages,
          this.enumService.getAbbreviation(getCoverageTypeList(), 1)
        ),
        FirstApplicationLIFEInsuredAmount:"$" + typeResponse.applications[0].coverages
          ?.find((coverage) => coverage.coverageType === this.enumService.getAbbreviation(getCoverageTypeList(), 1))
          ?.insuredAmount.toFixed(2).toString(),
        FirstApplicationDISPremiumAmount: "$" + this.getPremiumAmountPerCoverage(
          typeResponse.applications[0].coverages,
          this.enumService.getAbbreviation(getCoverageTypeList(), 2)
        ),
        FirstApplicationDISInsuredAmount:"$" + typeResponse.applications[0].coverages
          ?.find((coverage) => coverage.coverageType === this.enumService.getAbbreviation(getCoverageTypeList(), 2))
          ?.insuredAmount.toFixed(2).toString(),
        FirstApplicationADBPremiumAmount:"$" + this.getPremiumAmountPerCoverage(
          typeResponse.applications[0].coverages,
          this.enumService.getAbbreviation(getCoverageTypeList(), 3)
        ),
        FirstApplicationADBInsuredAmount: "$" + typeResponse.applications[0].coverages
          ?.find((coverage) => coverage.coverageType === this.enumService.getAbbreviation(getCoverageTypeList(), 3))
          ?.insuredAmount.toFixed(2).toString(),
        FirstApplicationIUIPremiumAmount:"$" + this.getPremiumAmountPerCoverage(
          typeResponse.applications[0].coverages,
          this.enumService.getAbbreviation(getCoverageTypeList(), 5)
        ),
        FirstApplicationIUIInsuredAmount:"$" + typeResponse.applications[0].coverages
          ?.find((coverage) => coverage.coverageType === this.enumService.getAbbreviation(getCoverageTypeList(), 5))
          ?.insuredAmount.toFixed(2).toString(),
        FirstApplicationCIPremiumAmount:"$" + this.getPremiumAmountPerCoverage(
          typeResponse.applications[0].coverages,
          this.enumService.getAbbreviation(getCoverageTypeList(), 4)
        ),
        FirstApplicationCIInsuredAmount: "$" + typeResponse.applications[0].coverages
          ?.find((coverage) => coverage.coverageType === this.enumService.getAbbreviation(getCoverageTypeList(), 4))
          ?.insuredAmount.toFixed(2).toString(),
        FirstApplicationPremiumPaymentAmount:"$" + this.getTotalPremiumAmount(typeResponse.applications[0].coverages),
        PrimaryApplicantName: typeResponse.applications[0].applicants[0].firstName,
        PrimaryBirthDate: moment(typeResponse.applications[0].applicants[0].birthDate).format('D/MM/YYYY').toString(),
        PrimaryIsSmoker: typeResponse.applications[0].applicants[0].isSmoker ? 'Yes' : 'No',
        PrimarySelfEmployed: typeResponse.applications[0].applicants[0].selfEmployed ? 'Yes' : 'No',
        PrimaryWorkHours: typeResponse.applications[0].applicants[0].workHours.toString(),
        PrimaryProvince: this.enumService.getDescription(
          getProvinceList(),
          this.applicantFormObjValues.find(
            (appForm) => appForm.lastName === typeResponse.applications[0]?.applicants[0]?.lastName
          )?.province
        ),

        SecondaryApplicantName: typeResponse.applications[0].applicants[2]?.firstName,
        SecondaryBirthDate:
          typeResponse.applications[0].applicants[1]?.birthDate !== undefined
            ? moment(typeResponse.applications[0].applicants[1]?.birthDate).format('D/MM/YYYY').toString()
            : '',
        SecondaryIsSmoker:
          typeResponse.applications[0].applicants[1]?.isSmoker !== undefined
            ? typeResponse.applications[0].applicants[1]?.isSmoker
              ? 'Yes'
              : 'No'
            : '',
        SecondarySelfEmployed:
          typeResponse.applications[0].applicants[1]?.selfEmployed !== undefined
            ? typeResponse.applications[0].applicants[1]?.selfEmployed
              ? 'Yes'
              : 'No'
            : '',
        SecondaryWorkHours: typeResponse.applications[0].applicants[1]?.workHours.toString(),
        SecondaryProvince:
          typeResponse.applications[0]?.applicants[1]?.lastName !== undefined
            ? this.enumService.getDescription(
                getProvinceList(),
                this.applicantFormObjValues.find(
                  (appForm) => appForm.lastName === typeResponse.applications[0]?.applicants[1]?.lastName
                )?.province
              )
            : '',

        TertiaryApplicantName: typeResponse.applications[0]?.applicants[2]?.firstName,
        QuaternaryApplicantName: typeResponse.applications[0]?.applicants[2]?.firstName,
      };

      switch (typeResponse.insuranceType) {
        case INSURANCE_TYPE.SINGLE_PREMIUM:
          valueDto = {
            ...valueDto,
            InsuranceAmortization: typeResponse.applications[0].amortization.toString(),
            TertiaryBirthDate:
              typeResponse.applications[0]?.applicants[2]?.birthDate !== undefined
                ? moment(typeResponse.applications[0]?.applicants[2]?.birthDate).format('D/MM/YYYY').toString()
                : '',
            TertiaryIsSmoker:
              typeResponse.applications[0]?.applicants[2]?.isSmoker !== undefined
                ? typeResponse.applications[0]?.applicants[2]?.isSmoker
                  ? 'Yes'
                  : 'No'
                : '',
            TertiarySelfEmployed:
              typeResponse.applications[0]?.applicants[2]?.selfEmployed !== undefined
                ? typeResponse.applications[0]?.applicants[2]?.selfEmployed
                  ? 'Yes'
                  : 'No'
                : '',
            TertiaryWorkHours: typeResponse.applications[0]?.applicants[2]?.workHours.toString(),
            TertiaryProvince:
              typeResponse.applications[0]?.applicants[2]?.lastName !== undefined
                ? this.enumService.getDescription(
                    getProvinceList(),
                    this.applicantFormObjValues.find(
                      (appForm) => appForm.lastName === typeResponse.applications[0]?.applicants[2]?.lastName
                    )?.province
                  )
                : '',
            QuaternaryBirthDate:
              typeResponse.applications[0]?.applicants[3]?.birthDate !== undefined
                ? moment(typeResponse.applications[0]?.applicants[3]?.birthDate).format('D/MM/YYYY').toString()
                : '',
            QuaternaryIsSmoker:
              typeResponse.applications[0]?.applicants[3]?.isSmoker !== undefined
                ? typeResponse.applications[0]?.applicants[3]?.isSmoker
                  ? 'Yes'
                  : 'No'
                : '',
            QuaternarySelfEmployed:
              typeResponse.applications[0]?.applicants[3]?.selfEmployed !== undefined
                ? typeResponse.applications[0]?.applicants[3]?.selfEmployed
                  ? 'Yes'
                  : 'No'
                : '',
            QuaternaryWorkHours: typeResponse.applications[0]?.applicants[3]?.workHours.toString(),
            QuaternaryProvince:
              typeResponse.applications[0]?.applicants[3]?.lastName !== undefined
                ? this.enumService.getDescription(
                    getProvinceList(),
                    this.applicantFormObjValues.find(
                      (appForm) => appForm.lastName === typeResponse.applications[0]?.applicants[3]?.lastName
                    )?.province
                  )
                : '',
            PrimaryLIFECoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 1),
              'coverageCode'
            ),
            PrimaryDISCoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 2),
              'coverageCode'
            ),
            PrimaryADBCoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 3),
              'coverageCode'
            ),
            PrimaryCICoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 4),
              'coverageCode'
            ),
            PrimaryIUICoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 5),
              'coverageCode'
            ),
            SecondaryLIFECoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 1),
              'coverageCode'
            ),
            SecondaryDISCoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 2),
              'coverageCode'
            ),
            SecondaryADBCoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 3),
              'coverageCode'
            ),
            SecondaryCICoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 4),
              'coverageCode'
            ),
            SecondaryIUICoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 5),
              'coverageCode'
            ),
            TertiaryLIFECoverageCode: this.getCoverageInfo(
              typeResponse.applications[0]?.applicants[2],
              this.enumService.getAbbreviation(getCoverageTypeList(), 1),
              'coverageCode'
            ),
            TertiaryDISCoverageCode: this.getCoverageInfo(
              typeResponse.applications[0]?.applicants[2],
              this.enumService.getAbbreviation(getCoverageTypeList(), 2),
              'coverageCode'
            ),
            TertiaryADBCoverageCode: this.getCoverageInfo(
              typeResponse.applications[0]?.applicants[2],
              this.enumService.getAbbreviation(getCoverageTypeList(), 3),
              'coverageCode'
            ),
            TertiaryCICoverageCode: this.getCoverageInfo(
              typeResponse.applications[0]?.applicants[2],
              this.enumService.getAbbreviation(getCoverageTypeList(), 4),
              'coverageCode'
            ),
            TertiaryIUICoverageCode: this.getCoverageInfo(
              typeResponse.applications[0]?.applicants[2],
              this.enumService.getAbbreviation(getCoverageTypeList(), 5),
              'coverageCode'
            ),
            QuaternaryLIFECoverageCode: this.getCoverageInfo(
              typeResponse.applications[0]?.applicants[3],
              this.enumService.getAbbreviation(getCoverageTypeList(), 1),
              'coverageCode'
            ),
            QuaternaryDISCoverageCode: this.getCoverageInfo(
              typeResponse.applications[0]?.applicants[3],
              this.enumService.getAbbreviation(getCoverageTypeList(), 2),
              'coverageCode'
            ),
            QuaternaryADBCoverageCode: this.getCoverageInfo(
              typeResponse.applications[0]?.applicants[3],
              this.enumService.getAbbreviation(getCoverageTypeList(), 3),
              'coverageCode'
            ),
            QuaternaryCICoverageCode: this.getCoverageInfo(
              typeResponse.applications[0]?.applicants[3],
              this.enumService.getAbbreviation(getCoverageTypeList(), 4),
              'coverageCode'
            ),
            QuaternaryIUICoverageCode: this.getCoverageInfo(
              typeResponse.applications[0]?.applicants[3],
              this.enumService.getAbbreviation(getCoverageTypeList(), 5),
              'coverageCode'
            ),
          };
          break;

        default:
          valueDto = {
            ...valueDto,
            InsuredLoan: 'IL',
            InsuranceAmortization: typeResponse.applications[0].amortization.toString(),
            TertiaryBirthDate:
              typeResponse.applications[1]?.applicants[0]?.birthDate !== undefined
                ? moment(typeResponse.applications[1]?.applicants[0]?.birthDate).format('D/MM/YYYY').toString()
                : '',
            TertiaryIsSmoker:
              typeResponse.applications[1]?.applicants[0]?.isSmoker !== undefined
                ? typeResponse.applications[1]?.applicants[0]?.isSmoker
                  ? 'Yes'
                  : 'No'
                : '',
            TertiarySelfEmployed:
              typeResponse.applications[1]?.applicants[0]?.selfEmployed !== undefined
                ? typeResponse.applications[1]?.applicants[0]?.selfEmployed
                  ? 'Yes'
                  : 'No'
                : '',
            TertiaryWorkHours: typeResponse.applications[1]?.applicants[0]?.workHours.toString(),
            TertiaryProvince:
              typeResponse.applications[1]?.applicants[0]?.lastName !== undefined
                ? this.enumService.getDescription(
                    getProvinceList(),
                    this.applicantFormObjValues.find(
                      (appForm) => appForm.lastName === typeResponse.applications[1]?.applicants[0]?.lastName
                    )?.province
                  )
                : '',
            QuaternaryBirthDate:
              typeResponse.applications[1]?.applicants[1]?.birthDate !== undefined
                ? moment(typeResponse.applications[1]?.applicants[1]?.birthDate).format('D/MM/YYYY').toString()
                : '',
            QuaternaryIsSmoker:
              typeResponse.applications[1]?.applicants[1]?.isSmoker !== undefined
                ? typeResponse.applications[1]?.applicants[1]?.isSmoker
                  ? 'Yes'
                  : 'No'
                : '',
            QuaternarySelfEmployed:
              typeResponse.applications[1]?.applicants[1]?.selfEmployed !== undefined
                ? typeResponse.applications[1]?.applicants[1]?.selfEmployed
                  ? 'Yes'
                  : 'No'
                : '',
            QuaternaryWorkHours: typeResponse.applications[1]?.applicants[1]?.workHours.toString(),
            QuaternaryProvince:
              typeResponse.applications[1]?.applicants[1]?.lastName !== undefined
                ? this.enumService.getDescription(
                    getProvinceList(),
                    this.applicantFormObjValues.find(
                      (appForm) => appForm.lastName === typeResponse.applications[1]?.applicants[1]?.lastName
                    )?.province
                  )
                : '',
            PrimaryLIFECoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 1),
              'coverageCode'
            ),
            PrimaryDISCoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 2),
              'coverageCode'
            ),
            PrimaryADBCoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 3),
              'coverageCode'
            ),
            PrimaryCICoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 4),
              'coverageCode'
            ),
            PrimaryIUICoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 5),
              'coverageCode'
            ),
            SecondaryLIFECoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 1),
              'coverageCode'
            ),
            SecondaryDISCoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 2),
              'coverageCode'
            ),
            SecondaryADBCoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 3),
              'coverageCode'
            ),
            SecondaryCICoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 4),
              'coverageCode'
            ),
            SecondaryIUICoverageCode: this.getCoverageInfo(
              typeResponse.applications[0].applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 5),
              'coverageCode'
            ),
            TertiaryLIFECoverageCode: this.getCoverageInfo(
              typeResponse.applications[1]?.applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 1),
              'coverageCode'
            ),
            TertiaryDISCoverageCode: this.getCoverageInfo(
              typeResponse.applications[1]?.applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 2),
              'coverageCode'
            ),
            TertiaryADBCoverageCode: this.getCoverageInfo(
              typeResponse.applications[1]?.applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 3),
              'coverageCode'
            ),
            TertiaryCICoverageCode: this.getCoverageInfo(
              typeResponse.applications[1]?.applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 4),
              'coverageCode'
            ),
            TertiaryIUICoverageCode: this.getCoverageInfo(
              typeResponse.applications[1]?.applicants[0],
              this.enumService.getAbbreviation(getCoverageTypeList(), 5),
              'coverageCode'
            ),
            QuaternaryLIFECoverageCode: this.getCoverageInfo(
              typeResponse.applications[1]?.applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 1),
              'coverageCode'
            ),
            QuaternaryDISCoverageCode: this.getCoverageInfo(
              typeResponse.applications[1]?.applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 2),
              'coverageCode'
            ),
            QuaternaryADBCoverageCode: this.getCoverageInfo(
              typeResponse.applications[1]?.applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 3),
              'coverageCode'
            ),
            QuaternaryCICoverageCode: this.getCoverageInfo(
              typeResponse.applications[1]?.applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 4),
              'coverageCode'
            ),
            QuaternaryIUICoverageCode: this.getCoverageInfo(
              typeResponse.applications[1]?.applicants[1],
              this.enumService.getAbbreviation(getCoverageTypeList(), 5),
              'coverageCode'
            ),
            SecondApplicationLIFEPremiumAmount: "$" + this.getPremiumAmountPerCoverage(
              typeResponse.applications[1]?.coverages,
              this.enumService.getAbbreviation(getCoverageTypeList(), 1)
            ),
            SecondApplicationLIFEInsuredAmount: "$" + typeResponse.applications[1]?.coverages
              ?.find((coverage) => coverage.coverageType === this.enumService.getAbbreviation(getCoverageTypeList(), 1))
              ?.insuredAmount.toFixed(2).toString(),
            SecondApplicationDISPremiumAmount:"$" + this.getPremiumAmountPerCoverage(
              typeResponse.applications[1]?.coverages,
              this.enumService.getAbbreviation(getCoverageTypeList(), 2)
            ),
            SecondApplicationDISInsuredAmount:"$" + typeResponse.applications[1]?.coverages
              ?.find((coverage) => coverage.coverageType === this.enumService.getAbbreviation(getCoverageTypeList(), 2))
              ?.insuredAmount.toFixed(2).toString(),
            SecondApplicationADBPremiumAmount:"$" + this.getPremiumAmountPerCoverage(
              typeResponse.applications[1]?.coverages,
              this.enumService.getAbbreviation(getCoverageTypeList(), 3)
            ),
            SecondApplicationADBInsuredAmount:"$" + typeResponse.applications[1]?.coverages
              ?.find((coverage) => coverage.coverageType === this.enumService.getAbbreviation(getCoverageTypeList(), 3))
              ?.insuredAmount.toFixed().toString(),
            SecondApplicationIUIPremiumAmount:"$" + this.getPremiumAmountPerCoverage(
              typeResponse.applications[1]?.coverages,
              this.enumService.getAbbreviation(getCoverageTypeList(), 5)
            ),
            SecondApplicationIUIInsuredAmount:"$" + typeResponse.applications[1]?.coverages
              ?.find((coverage) => coverage.coverageType === this.enumService.getAbbreviation(getCoverageTypeList(), 5))
              ?.insuredAmount.toFixed(2).toString(),
            SecondApplicationCIPremiumAmount:"$" + this.getPremiumAmountPerCoverage(
              typeResponse.applications[1]?.coverages,
              this.enumService.getAbbreviation(getCoverageTypeList(), 4)
            ),
            SecondApplicationCIInsuredAmount:"$" + typeResponse.applications[1]?.coverages
              ?.find((coverage) => coverage.coverageType === this.enumService.getAbbreviation(getCoverageTypeList(), 4))
              ?.insuredAmount.toFixed(2).toString(),
            SecondApplicationPremiumPaymentAmount:"$" + this.getTotalPremiumAmount(typeResponse.applications[1]?.coverages),
          };
          break;
      }
    });

    return JSON.stringify(valueDto);
  }

  private getPremiumAmountPerCoverage(
    coverages: InsuranceTypeCoverageResponse[] | undefined,
    coverageType: string
  ): string {
    let result = undefined;
    const coverage = coverages?.find((coverage) => coverage.coverageType === coverageType);
    if (coverage !== undefined) {
      result =
        (coverage?.premiumAmount.toFixed(2) !== undefined ? coverage?.premiumAmount : 0.00) +
        (coverage?.premiumTaxAmount.toFixed(2) !== undefined ? coverage?.premiumTaxAmount : 0.00);
    }
    return result !== undefined ? result?.toString() : '';
  }

  private getTotalPremiumAmount(coverages: InsuranceTypeCoverageResponse[] | undefined): string {
    let total: number | undefined = undefined;
    coverages?.forEach((coverage) => {
      if (total?.toFixed(2)) total += coverage.premiumAmount + coverage.premiumTaxAmount;      
      else total = coverage.premiumAmount + coverage.premiumTaxAmount;
    });

    return total !== undefined ? total : '';
  }

  private getCoverageInfo(applicant: Applicant, filterBy: string, param: string): string {
    let value: string | undefined = '';
    if (applicant !== undefined) {
      const objValue = applicant.applicantCoverages?.find((coverage) => coverage.coverageType === filterBy);

      if (objValue) {
        value = Object.entries(objValue).find((val) => val[0] === param)?.[1];
        value = this.waiverReasonService.waiverReasonsValue
          .find((reason) => reason.waiverReasonCode === value)
          ?.waiverReasonStatus.toString();
        value = value === 'Insured' ? 'Taken' : value;
      }
    }

    return value ? value : '';
  }

  private getApplicantsNames(applicants: Applicant[]): string {
    let applicantNames = '';
    applicants.forEach((applicant) => {
      applicantNames += applicantNames === '' ? applicant.firstName : `, ${applicant.firstName}`;
    });
    return applicantNames;
  }

  protected openPdfFile(referenceNumber: string, documentContent: string | undefined, download?: boolean) {
    const blob = this.b64toBlob(documentContent, 'application/pdf');
    const fileURL = URL.createObjectURL(blob);

    if (download) {
      const anchor = document.createElement('a');
      anchor.href = fileURL;
      anchor.download = referenceNumber;
      anchor.click();
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

  public toApplication(): void {
    this.store.dispatch(setApplicationIdentifierEmpty());
    this.store.dispatch(setLoadingSpinner({ status: true }));
    setTimeout(() => {
      this.store.dispatch(setLoadingSpinner({ status: false }));
      this.router.navigate([`/new-policy/insurance-application/${QQ_LOAN_IDENTIFIER}`]);
    }, 1000);
  }

  public lenderValidationForm(isValid: boolean) {
    this.lenderFormValid = isValid;
  }

  public getLenderInfoForm(lenderForm: UntypedFormGroup) {
    this.lenderFormObjValues = lenderForm;
  }

  public onGenerateSomething() {
    const value: FormMetadataDto = {
      formType: 'DownloadOnly',
      formIdentifier: 'CPQQ02MP',
      templateName: 'CPQQ02MP.pdf',
      formData: getStringifyQuickQuote(),
    };
  }

  public loanValidationForm(isValid: boolean) {
    this.loanFormValid = isValid;
  }

  public getLoanInfoForm(loanForm: UntypedFormGroup) {
    this.loanFormObjValues = loanForm;
  }

  public applicantValidationForm(isValid: boolean) {
    this.applicantFormValid = isValid;
  }

  public formsValid() {
    if (this.lenderFormValid && this.loanFormValid && this.applicantFormValid) {
      return false;
    }
    return true;
  }

  public getApplicantInfoForm(applicantForm: ApplicantEmitter[]) {
    this.applicantFormObjValues = applicantForm;
  }

  public getFormValues() {
    this.lenderInfo()?.lenderFormInfoValues();
    this.loanInfo()?.loanFormInfoValues();
    this.prePopulateFirstPaymentDate();
    this.applicantInfo()?.applicantInfoValues();
  }
  private prePopulateFirstPaymentDate() {
    let oneMonthLaterDate: Date = moment().add(1, 'months').toDate();
    if (
      oneMonthLaterDate &&
      this.loanInfo()?.loanForm.get('firstPaymentDate') &&
      this.loanInfo()?.loanForm.get('firstPaymentDate')?.value === null
    ) {
      this.loanInfo()?.loanForm.get('firstPaymentDate')?.setValue(oneMonthLaterDate);
    }
  }

  public generateQuote() {
    this.getFormValues();

    const quoteRequest: QuoteInsuranceTypeRequest = this.prepareRequest();
    this.quoteInsuranceType(quoteRequest);
    this.isQuoteInsuranceTypeResponseVisible = true;
  }

  public reQuote() {
    this.isQuoteInsuranceTypeResponseVisible = false;
  }

  private prepareRequest(): QuoteInsuranceTypeRequest {
    const loanValues = this.loanFormObjValues.getRawValue();
    const lenderValues = this.lenderFormObjValues.getRawValue();

    const applications: InsuranceTypeApplicationRequest[] = this.getApplications(
      loanValues.amortization,
      loanValues.insuranceType
    );

    let quoteRequest: QuoteInsuranceTypeRequest = {
      loanId: loanValues.loanId,
      loanType: loanValues.loanType,
      insuranceType: loanValues.insuranceType,
      paymentType: loanValues.paymentType,
      fundingDate: loanValues.fundingDate,
      firstPaymentDate: loanValues.firstPaymentDate,
      loanAmount: loanValues.loanAmount,
      paymentAmount: loanValues.paymentAmount,
      monthlyPaymentAmount: loanValues.paymentAmount,
      paymentFrequency: loanValues.paymentFrequency,
      interestRate: loanValues.interestRate,
      loanTerm: loanValues.loanTerm,
      amortization: loanValues.amortization,
      applications: applications,
      branchId: this.lenderFormObjValues.getRawValue().branch,
      lenderId: this.getLenderId(lenderValues.userEmail),
    };

    return quoteRequest;
  }

  private getLenderId(email: string) {
    const user = this.userService.userValue;
    let userId: string | undefined = '';
    if (email === user.email) {
      userId = user.id;
    } else {
      const searchOptions: UserResourceParams = {
        email: email,
      };
      this.userService.getUsersByCriteria(searchOptions).subscribe((response: UsersByCriteria) => {
        userId = response.value[0].id;
      });
    }

    return userId;
  }

  private getApplications(amortization: number, insuranceType: string): InsuranceTypeApplicationRequest[] {
    let applications: InsuranceTypeApplicationRequest[] = [];

    if (this.applicantFormObjValues.length <= 2 || insuranceType === INSURANCE_TYPE.SINGLE_PREMIUM) {
      applications.push({
        id: 1,
        loanAmountCovered: 0,
        loanPaymentAmountCovered: 0,
        amortization: amortization,
        applicants: this.getApplicantList(),
      });
    } else if (this.applicantFormObjValues.length > 2) {
      let index = 1;
      while (index <= 2) {
        applications.push({
          id: index,
          loanAmountCovered: 0,
          loanPaymentAmountCovered: 0,
          amortization: amortization,
          applicants: this.getApplicantsByGrouping(index),
        });

        index += 1;
      }
    }

    return applications;
  }

  private getApplicantsByGrouping(index: number): InsuranceTypeApplicantRequest[] {
    let applicants: InsuranceTypeApplicantRequest[] = [];

    this.applicantFormObjValues.forEach((applicant, applicantIndex) => {
      if (index === 1 && applicantIndex <= 1) {
        applicants.push({
          applicantSequence: applicantIndex + 1,
          applicantIdentifier: `${applicantIndex + 1}${applicantIndex}${applicantIndex + 1}${applicantIndex + 3}`,
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          applicantType: applicantIndex % 2 === 0 ? APPLICANT_TYPE.PRIMARY : APPLICANT_TYPE.SECONDARY,
          birthDate: applicant.birthDate,
          isSmoker: applicant.isSmoker,
          selfEmployed: applicant.selfEmployed,
          workHours: applicant.workHours,
          province: applicant.province,
          coverages: applicantCoveragesQQ(),
          gender: applicant.gender,
          applicantEmails: applicant.applicantEmails,
          applicantPhones: applicant.applicantPhones,
          applicantAddresses: applicant.applicantAddresses,
          applicantConsents: applicant.applicantConsents,
        });
      }

      if (index === 2 && applicantIndex >= 2) {
        applicants.push({
          applicantSequence: applicantIndex + 1,
          applicantIdentifier: `${applicantIndex + 1}${applicantIndex}${applicantIndex + 1}${applicantIndex + 3}`,
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          applicantType: applicantIndex % 2 !== 0 ? APPLICANT_TYPE.SECONDARY : APPLICANT_TYPE.PRIMARY,
          birthDate: applicant.birthDate,
          isSmoker: applicant.isSmoker,
          selfEmployed: applicant.selfEmployed,
          workHours: applicant.workHours,
          province: applicant.province,
          coverages: applicantCoveragesQQ(),
          gender: applicant.gender,
          applicantEmails: applicant.applicantEmails,
          applicantPhones: applicant.applicantPhones,
          applicantAddresses: applicant.applicantAddresses,
          applicantConsents: applicant.applicantConsents,
        });
      }
    });

    return applicants;
  }

  private getApplicantList(): InsuranceTypeApplicantRequest[] {
    return this.applicantFormObjValues?.map((applicant, applicantIndex) => ({
      applicantSequence: applicantIndex + 1,
      applicantIdentifier: `${applicantIndex + 1}${applicantIndex}${applicantIndex + 1}${applicantIndex + 3}`,
      firstName: applicant.firstName,
      lastName: applicant.lastName,
      applicantType: applicant.applicantType,
      birthDate: applicant.birthDate,
      isSmoker: applicant.isSmoker,
      selfEmployed: applicant.selfEmployed,
      workHours: applicant.workHours,
      province: applicant.province,
      coverages: applicantCoveragesQQ(),
      gender: applicant.gender,
      applicantEmails: applicant.applicantEmails,
      applicantPhones: applicant.applicantPhones,
      applicantAddresses: applicant.applicantAddresses,
      applicantConsents: applicant.applicantConsents,
    }));
  }

  public canRemoveApplicants() {
    if (this.applicantListLength && this.applicantListLength > 1) {
      return true;
    }
    return false;
  }

  public setApplicantList(length: number) {
    this.applicantListLength = length;
  }

  private quoteInsuranceType(quoteRequest: QuoteInsuranceTypeRequest) {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.store.dispatch(quoteInsuranceTypeQuickQuote({ request: quoteRequest }));

    this.store.select(loadingInformationSelector).subscribe({
      next: (loading) => {
        if (!loading) {
          setTimeout(() => {
            this.scrollDown();
            this.canGeneratePdf = true;
          }, 1400);
        }
      },
    });
  }

  public removeApplicant(index: number) {
    this.isQuoteInsuranceTypeResponseVisible = false;
    this.applicantInfo()?.removeApplicant(index);
  }

  public canPdfBeGenerated() {
    return !this.canGeneratePdf;
  }
}
