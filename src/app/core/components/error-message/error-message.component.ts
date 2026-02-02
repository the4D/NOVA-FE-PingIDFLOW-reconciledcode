import { Component, input, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'errorMessage',
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.scss'],
  standalone: true,
  imports: [MatIconModule],
})
export class ErrorMessageComponent {
  message = input.required<string>();
}
