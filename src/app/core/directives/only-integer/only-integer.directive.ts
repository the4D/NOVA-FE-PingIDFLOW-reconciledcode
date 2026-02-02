import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[onlyInteger]',
  standalone: true,
})
export class OnlyIntegerDirective {
  private specialKeys: Array<string> = ['Tab', 'End', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Home', 'Delete'];
  private regex: RegExp = new RegExp(/^[0-9]$/);

  @HostListener('keydown', ['$event'])
  onKeyDown = (event: KeyboardEvent) => {
    if (this.specialKeys.indexOf(event.key) !== -1) {
      return;
    }

    if (!String(event.key).match(this.regex)) {
      event.preventDefault();
    }
  };
}
