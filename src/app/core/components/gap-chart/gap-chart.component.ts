import { Component, input, Input, OnChanges, ViewEncapsulation, computed, Signal } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIf, NgStyle, NgClass, UpperCasePipe, DecimalPipe } from '@angular/common';
// import { InsuranceTypeEnum } from '../../utils/enums/insurance-type.enum';

const TOTAL_LIFE_LABEL = 'Total Requirement';
const TOTAL_DISABILITY_LABEL = 'Current Monthly Obligation';
const COVERAGE_LABEL = 'Existing Coverage';
const UNPROTECTED_LABEL = 'Unprotected';

export enum InsuranceTypeEnum {
  DISABILITY = 'disability',
  LIFE = 'life',
}

@Component({
  selector: 'app-gap-chart',
  templateUrl: './gap-chart.component.html',
  styleUrls: ['./gap-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [MatTooltipModule, NgStyle, NgClass, UpperCasePipe, DecimalPipe],
})
export class GapChartComponent implements OnChanges {
  totalReq = input<number>(0);
  existingCov = input<number>(0);
  unprotected = input<number>(0);
  type = input<InsuranceTypeEnum.LIFE | InsuranceTypeEnum.DISABILITY>(InsuranceTypeEnum.LIFE);

  unprotectedValue: Signal<number> = computed(() => {
    return isNaN(this.unprotected()) ? 0 : this.unprotected();
  });

  public totalWidth = 0;
  public totalLabel: string = TOTAL_LIFE_LABEL;
  public coverageLabel: string = COVERAGE_LABEL;
  public unprotectedLabel: string = UNPROTECTED_LABEL;

  ngOnChanges(): void {
    this.totalLabel = this.type() === InsuranceTypeEnum.LIFE ? TOTAL_LIFE_LABEL : TOTAL_DISABILITY_LABEL;

    this.totalWidth = Number(this.totalReq() > this.existingCov() ? this.totalReq() : this.existingCov());
  }
}
