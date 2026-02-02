import { Component, ElementRef, HostListener } from '@angular/core';
import { TooltipPosition, ToolTipStyle } from '../../directives/tooltip/tooltip-enum';
import { NgClass } from '@angular/common';

@Component({
  selector: 'tooltip',
  templateUrl: './tool-tip.component.html',
  styleUrls: ['./tool-tip.component.scss'],
  standalone: true,
  imports: [NgClass],
})
export class ToolTipComponent {
  public position: TooltipPosition = TooltipPosition.DEFAULT;
  public tooltip: string = '';
  public left: number = 0;
  public top: number = 0;
  private firstFlag: boolean = true;
  public style: ToolTipStyle = ToolTipStyle.DEFAULT;

  @HostListener('document:click', ['$event'])
  clickOut(event: any) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (!this.firstFlag && this.tooltip !== '') {
        this.tooltip = '';
        this.firstFlag = true;
      } else if (this.tooltip === '') {
        this.firstFlag = true;
      } else {
        this.firstFlag = false;
      }
    }
  }

  constructor(private elementRef: ElementRef) {}
}
