import { Component, input, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '@core/directives/tooltip/tooltip.directive';

@Component({
  selector: 'app-summary-titles',
  templateUrl: './summary-titles.component.html',
  styleUrls: ['./summary-titles.component.scss'],
  standalone: true,
  imports: [TooltipDirective, MatIcon],
})
export class SummaryTitlesComponent {
  insuranceTitle = input.required<string>();
  insuranceDescription = input.required<string>();
}
