import { Component, inject, input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '@store';
import { MatDivider } from '@angular/material/divider';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Observable, take } from 'rxjs';
import { QuoteInsuranceTypeResponse } from '@core/models/insurance/quote-insurance-type.model';
import { quoteInsuranceTypeResponseSelector } from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { WaiverReason } from '@core/models/insurance/waiverReason.model';
import { WaiverReasonService } from '@core/services/insurance/waiverReason.service';
import { BubbleComponent } from '../bubble/bubble.component';
import { SummaryTitlesComponent } from '../summary-titles/summary-titles.component';

@Component({
  selector: 'app-summary-coverages',
  templateUrl: './summary-coverages.component.html',
  styleUrls: ['./summary-coverages.component.scss'],
  standalone: true,
  imports: [SummaryTitlesComponent, AsyncPipe, BubbleComponent, DecimalPipe, MatDivider],
})
export class SummaryCoveragesComponent implements OnInit {
  insuranceTypeAbbreviation = input.required<string>();
  applicationIndex = input.required<number>();
  totalMonthlyPremiumWithTaxIncluded = input.required<number>();
  insuranceTitle = input.required<string>();
  insuranceDescription = input.required<string>();

  private store = inject(Store<AppState>);
  private waiverReasonService = inject(WaiverReasonService);

  public quoteResponseData$: Observable<QuoteInsuranceTypeResponse> = this.store.select(
    quoteInsuranceTypeResponseSelector
  );
  public waiverReasonsList!: WaiverReason[];

  constructor() {}

  ngOnInit() {
    this.getWaiverReasons();
  }

  private getWaiverReasons() {
    this.waiverReasonService.waiverReasons$.pipe(take(1)).subscribe((waiverReasons: WaiverReason[]) => {
      this.waiverReasonsList = waiverReasons;
    });
  }

  public getReasonStatus(waiverReasonCode: number | string) {
    const reasonStatus = this.waiverReasonsList.filter((reason) => reason.waiverReasonCode === waiverReasonCode)[0]
      ?.waiverReasonStatus;

    return reasonStatus?.toString();
  }
}
