import { Directive, ElementRef, HostListener, inject, input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';
import { LanguageService } from '@core/services/language/language.service';

interface Options {
  align?: string;
  decimal?: string;
  suffix?: string;
  prefix?: string;
  precision?: number | string;
  thousands?: string;
  isPercentage?: boolean;
}

@Directive({
  selector: '[appCurrencyOptions]',
  standalone: true,
})
export class CurrencyOptionsDirective implements OnChanges {
  options = input.required<Options>();

  public el = inject(ElementRef);
  public renderer = inject(Renderer2);
  public languageService = inject(LanguageService);

  private specialKeys: Array<string> = ['Tab', 'End', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Home', 'Delete'];
  private regex: RegExp = new RegExp(/^\d{1,3}$/);

  ngOnChanges(changes: SimpleChanges): void {
    this.languageService.languageSelected$.subscribe((languageSelected) => {
      this.formatByLanguageSelection(languageSelected);
    });

    if (changes['options'].currentValue.suffix !== undefined && changes['options'].currentValue.suffix === '%') {
      this.options().align = 'left';
      this.options().suffix = '%';
      this.options().thousands = '';
    } else {
      this.options().thousands = ',';
      this.options().prefix = '$';
    }
    this.options().precision = 0;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown = (event: KeyboardEvent) => {
    if (this.specialKeys.indexOf(event.key) !== -1) {
      return;
    }

    const current: string = this.el.nativeElement.value;
    const next: string = current.concat(event.key);
    if (next && parseInt(next) > 100 && !String(next).match(this.regex) && this.options().isPercentage) {
      event.preventDefault();
    }

    if (next && parseInt(next) > 100 && this.options().isPercentage) {
      event.preventDefault();
    }
  };

  @HostListener('blur')
  setInputFocusOut(): void {
    this.languageService.languageSelected$.subscribe((languageSelected) => {
      this.formatByLanguageSelection(languageSelected);
    });
  }

  @HostListener('focus')
  setInputFocusIn(): void {
    this.options().precision = 0;
    this.options().prefix = '';
    this.options().suffix = '';
    this.options().thousands = '';
    this.options().align = 'left';
  }

  private formatByLanguageSelection(languageSelected: string) {
    if (languageSelected === 'fr-FR') {
      if (this.options().isPercentage) {
        this.options().suffix = '%';
        this.options().thousands = '';
      } else {
        this.options().prefix = '';
        this.options().suffix = ' $';
        this.options().thousands = ' ';
      }
    } else {
      if (this.options().isPercentage) {
        this.options().suffix = '%';
        this.options().thousands = '';
        this.options().prefix = '';
      } else {
        this.options().prefix = '$';
        this.options().thousands = ',';
        this.options().suffix = '';
      }
    }
  }
}
