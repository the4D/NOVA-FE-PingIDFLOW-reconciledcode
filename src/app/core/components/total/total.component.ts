import { Component, inject, input } from '@angular/core';
import { NgClass, AsyncPipe } from '@angular/common';
import { LanguageService } from '@core/services/language/language.service';
import { CurrencyOptionPipe } from '@core/utils/pipes/currency-option/currency-option.pipe';

@Component({
  selector: 'app-total',
  template: `
    <div>
      <div
        class="securian-card bg-light d-flex flex-row justify-content-between total"
        [ngClass]="applicantType() === 'general' ? 'bag-light-color' : 'bg-light'">
        <div class="body-medium-bold">
          {{ title() }}
        </div>
        <p class="body-medium-bold">
          @if (languageService.languageSelected$ | async; as language) {
            {{ total() | currencyOption: 'USD' : 'symbol' : '2.0' : language }}
          }
        </p>
      </div>
    </div>
  `,
  styleUrls: ['./total.component.scss'],
  standalone: true,
  imports: [NgClass, AsyncPipe, CurrencyOptionPipe],
})
export class TotalComponent {
  applicantType = input<string>('');
  title = input<string>('');
  total = input<number>(0);

  public languageService = inject(LanguageService);
}
