import { AfterViewInit, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { SharedStepService } from '@core/services/insurance/shared-step.service';
import { GapAnalysisFacade } from '@store/pages/new-policy/gap-analysis/facades/gap-analysis.facades';
import { BaseComponent } from '../base-component.component';
import { BranchService } from '@core/services/tenant/branch.service';
import { Branch } from '@core/models/tenant/branch.model';
import { GapAnalysisBlob, initialValueBlob } from '@core/models/gap-analysis/gap-analysis.model';
import { GapChartComponent } from '@core/components/gap-chart/gap-chart.component';
import { LenderInfoComponent } from '@core/components/lender-info/lender-info.component';

@Component({
  selector: 'app-results',
  templateUrl: './results-info.component.html',
  styleUrls: ['./results-info.component.scss'],
  standalone: true,
  imports: [LenderInfoComponent, GapChartComponent, AsyncPipe, CurrencyPipe],
})
export class ResultsInfoComponent extends BaseComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  public storeFacade = inject(GapAnalysisFacade);
  private branchService = inject(BranchService);
  private cd = inject(ChangeDetectorRef);

  constructor(
    public override fb: FormBuilder,
    public override stepService: SharedStepService
  ) {
    super(fb, stepService);
  }

  ngOnInit(): void {
    this.cd.detectChanges();
    this.refreshDataFromStore(this.storeFacade);
  }

  public async downloadReport() {
    this.refreshDataFromStore(this.storeFacade);
    let pdfPayload: GapAnalysisBlob = initialValueBlob();

    this.storeFacade.gapAnalysisBlobSelector().subscribe((gapAnalysisBlob: GapAnalysisBlob) => {
      pdfPayload = this.prepareFinalPayLoadForPdf(gapAnalysisBlob);
      pdfPayload.todayDate = this.getTodayDate();
      this.storeFacade.updateLoader(true);
    });

    await this.storeFacade.generatePdf(pdfPayload).subscribe((result) => {
      this.gapAnalysisPDFResponse = result;
      this.openPdfFile(
        this.gapAnalysisPDFResponse?.referenceNumber,
        this.gapAnalysisPDFResponse?.insuranceForms[0],
        false
      );
      this.storeFacade.updateLoader(false);
    });
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  public override disableButton(): boolean {
    if (!this.lenderFormValid) {
      return true;
    }

    return false;
  }

  public back = () => {
    this.stepService.currentState = {
      ...this.stepService.currentStateValue,
      currentStep: 5,
    };
    this.stepper().previous();
  };

  public lenderValidationForm(isValid: boolean) {
    this.lenderFormValid = isValid;
  }

  public getLenderInfoForm(lenderForm: FormGroup) {
    this.lenderInfo = JSON.parse(JSON.stringify(lenderForm));
    this.phoneNumber = this.formatPhoneNumber(this.lenderInfo?.phoneNumber);
    const branchId: string = this.lenderInfo?.branch;

    this.branchService.branches$.subscribe((branches: Branch[]) => {
      if (branches && branches.length > 0) {
        this.branch = branches?.find((branch: Branch) => branch.id === branchId)!.name;
      }
    });

    this.refreshDataFromStore(this.storeFacade);
  }

  private getTodayDate(): string {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    return mm + '/' + dd + '/' + yyyy;
  }

  public goToQQ() {
    this.router.navigate(['new-policy/quick-quote']);
  }
}
