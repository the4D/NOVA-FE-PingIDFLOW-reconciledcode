import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Loan } from '@core/models/insurance/loan.model';
import { EnumService } from '@core/services/insurance/enum.service';
import { getPaymentFrequencyList } from '@core/utils/enums/system-enums';
import { AppState } from '@store';
import { insuranceApplicationLoanSelector } from '@store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'pricing-coverage-top-info',
    templateUrl: './pricing-coverage-top-info.component.html',
    styleUrls: ['./pricing-coverage-top-info.component.scss'],
    standalone: true,
    imports: [DecimalPipe],
})
export class PricingCoverageTopInfoComponent implements OnInit {
  public loan!: Loan;
  public frequency: string = '';

  constructor(private enumService: EnumService, private store: Store<AppState>) {}

  ngOnInit() {
    this.getLoanFromStore();
  }

  private getLoanFromStore() {
    this.store.select(insuranceApplicationLoanSelector).subscribe((loan: Loan) => {
      if (loan) {
        this.loan = loan;
        this.frequency = this.enumService.getDescription(
          getPaymentFrequencyList(),
          loan.paymentFrequency
        );
      }
    });
  }
}
