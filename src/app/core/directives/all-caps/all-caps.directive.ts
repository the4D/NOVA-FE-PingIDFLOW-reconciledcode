import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[allCaps]',
  standalone: true,
})
export class AllCapsDirective {
  @HostListener('focusout', ['$event'])
  onblur(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      input.value = input.value.toUpperCase();
    }
  }

  @HostListener('input', ['$event']) onInput(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
  }
}
