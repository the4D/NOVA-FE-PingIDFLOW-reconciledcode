import { Component, inject, OnInit } from '@angular/core';
import { StepperMessage, initialMessageState } from 'src/app/core/models/insurance/stepper-message.model';
import { StepperMessageService } from 'src/app/core/services/insurance/stepper-message.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'stepper-message',
  template: `
    @if (message.showIt) {
      <div class="d-flex align-items-center my-2 p-3 warning-background">
        <mat-icon aria-label="info" class="info-icon">error</mat-icon>
        <p class="body-small-regular ms-2">
          <span [innerText]="message.message"></span>
        </p>
      </div>
    }
  `,
  styleUrls: ['./stepper-message.component.scss'],
  standalone: true,
  imports: [MatIconModule],
})
export class StepperMessageComponent implements OnInit {
  private stepperMessage = inject(StepperMessageService);

  public message: StepperMessage = initialMessageState();

  ngOnInit() {
    this.stepperMessage.messageContent$.subscribe((message: StepperMessage) => {
      this.message = message;
      if (message.time !== undefined && message.time > 0)
        setTimeout(() => {
          this.message.showIt = false;
        }, message.time);
    });
  }
}
