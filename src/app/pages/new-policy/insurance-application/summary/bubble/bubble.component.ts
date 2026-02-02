import { NgClass } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';

@Component({
  selector: 'app-bubble',
  templateUrl: './bubble.component.html',
  styleUrls: ['./bubble.component.scss'],
  standalone: true,
  imports: [NgClass],
})
export class BubbleComponent implements OnInit {
  description = input.required<string>();
  style = input.required<string>();

  constructor() {}

  ngOnInit() {}
}
