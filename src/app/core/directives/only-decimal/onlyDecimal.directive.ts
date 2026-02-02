import { Directive, ElementRef, HostListener, input, Input } from '@angular/core';

@Directive({
  selector: '[onlyDecimal]',
  standalone: true,
})
export class OnlyDecimalDirective {
  maxValue = input<number>(0);
  private specialKeys: Array<string> = ['Tab', 'End', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Home', 'Delete'];
  private regex: RegExp = new RegExp(/^[0-9]{0,4}(\.[0-9]{0,5})?$/);

  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event'])
  onKeyDown = (event: KeyboardEvent) => {
    if (this.specialKeys.indexOf(event.key) !== -1) {
      return;
    }

    if (this.el.nativeElement.selectionStart !== undefined && this.el.nativeElement.selectionEnd !== undefined) {
      const selectionStart = this.el.nativeElement.selectionStart;
      const selectionEnd = this.el.nativeElement.selectionEnd;

      if (selectionStart !== selectionEnd) {
        const tempValue: string = this.el.nativeElement.value;
        this.el.nativeElement.value = tempValue.replace(tempValue.substring(selectionStart, selectionEnd), '');
      }
    }

    const current: string = this.el.nativeElement.value;
    const next: string = current.concat(event.key);
    const isValidInput = this.validateInput(next);

    if (!isValidInput) {
      event.preventDefault();
    }
  };

  private validateInput(input: string): boolean {
    const regex: RegExp = new RegExp(/^[0-9]{0,4}(\.[0-9]{0,5})?$/);
    const floatValue: number = parseFloat(input);

    return regex.test(input) && !isNaN(floatValue) && floatValue <= this.maxValue();
  }
}
