import { Component, computed, input, Input, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-info-box',
  templateUrl: './info-box.component.html',
  styleUrls: ['./info-box.component.scss'],
  standalone: true,
})
export class InfoBoxComponent {
  title = input.required<string>();
  content = input.required<string>();
  // showMessage = input<boolean>();

  // ngOnInit(): void {
  //   console.log(this.showMessage());
  // }
}
