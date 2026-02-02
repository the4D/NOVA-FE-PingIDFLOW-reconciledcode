import { Component, input, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-noInfoRequired',
  template: `
    <div class="form" [ngClass]="margin() === 1 ? 'mt-0' : ''">
      <div class="d-flex justify-content-center">
        <div class="text-center w-50">
          <mat-icon color="securian-pine-text-color" style="font-size: 74px; width: 74px; min-height: 74px"
            >find_in_page</mat-icon
          >
          <div class="body-medium-bold">
            {{ title() }}
          </div>
          <div class="body-medium-regular pt-3">
            <span [innerText]="message()"></span>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [NgClass, MatIconModule],
})
export class NoHealthQuestionsComponent {
  margin = input<number>(0);
  title = input<string>('');
  message = input<string>('');
}
