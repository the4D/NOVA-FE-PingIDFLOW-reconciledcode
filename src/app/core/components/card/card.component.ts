import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  standalone: true,
  imports: [NgClass],
})
export class CardComponent {
  title = input.required<string>();
  cardImage = input.required<string>();
  cardBody = input.required<string>();
  link = input.required<string>();
  color = input.required<string>();

  redirectToEvent = output();

  private router = inject(Router);

  public routerTo() {
    if (this.link() === undefined || this.link() === '') {
      this.redirectToEvent.emit();
    } else {
      this.router.navigate([this.link()]);
    }
  }
}
