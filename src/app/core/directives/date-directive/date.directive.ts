import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { SECURIAN_FORMATS } from './date-format';

@Directive({
  selector: '[matDatepicker]',
  standalone: true,
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: SECURIAN_FORMATS },
  ],
})
export class DateDirective {
  // private el = inject(ElementRef);
  // private regex: RegExp = new RegExp(/^[0-9]+(-[0-9]+){0,10}$/);
  // private specialKeys: Array<string> = ['Tab', 'End', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Home', 'Delete'];
  // @HostListener('keydown', ['$event'])
  // onKeyDown = (event: KeyboardEvent) => {
  //   console.log('coming here that is why::::: ', event.key);
  // if (this.specialKeys.indexOf(event.key) !== -1) {
  //   return;
  // }
  // let current: string = this.el.nativeElement.value;
  // let next: string = current.concat(event.key);
  // if (next.length > 10) {
  //   event.preventDefault();
  // }
  // if (next && !String(next).match(this.regex)) {
  //   event.preventDefault();
  // }
  // if (current.length === 4) {
  //   current += '-';
  // }
  // if (current.length === 7) {
  //   if (current.charAt(6) != '-') {
  //     current += '-';
  //   }
  // }
  // this.el.nativeElement.value = current;
  // };
}
