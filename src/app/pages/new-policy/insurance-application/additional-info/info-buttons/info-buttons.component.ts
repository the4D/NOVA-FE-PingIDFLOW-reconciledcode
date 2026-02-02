import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-info-buttons',
  standalone: true,
  imports: [],
  templateUrl: './info-buttons.component.html',
  styleUrl: './info-buttons.component.scss',
})
export class InfoButtonsComponent {
  disabledNextButton = input.required<boolean>();
  buttonLabel = input.required<string>();
  backAction = output();
  requestSubmissionAction = output();

  public back() {
    this.backAction.emit();
  }

  requestSubmission() {
    this.requestSubmissionAction.emit();
  }
}
