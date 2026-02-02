import { formatCurrency, getCurrencySymbol, registerLocaleData } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import localeFr from '@angular/common/locales/fr';
registerLocaleData(localeFr, 'fr');

@Pipe({
  name: 'currencyOption',
  standalone: true,
})
export class CurrencyOptionPipe implements PipeTransform {
  transform(
    value: number,
    currencyCode: string = 'USD',
    display: 'code' | 'symbol' | 'symbol-narrow' | string | boolean = 'symbol',
    digitsInfo: string = '2.0',
    locale: string = 'en-US'
  ): string | null {
    let result = formatCurrency(
      value,
      locale !== 'en-US' ? 'fr' : locale,
      getCurrencySymbol(currencyCode, 'wide'),
      currencyCode,
      digitsInfo
    );
    if (result.includes('$0') && result.indexOf('$0') === 1) {
      result = result.replace('$0', '$');
    }

    if (result.includes('$0') && result.length >= 3 && result.length <= 4) {
      result = result.replace('$0', '$');
    }

    if (result === '$00') {
      result = '$0';
    }

    if (result === '00 $') {
      result = '0 $';
    }

    return result;
  }
}
