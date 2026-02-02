import {
  ApplicationRef,
  ComponentRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  HostListener,
  inject,
  input,
  Input,
  OnDestroy,
  viewChild,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { ToolTipComponent } from '../../components/tool-tip/tool-tip.component';
import { TooltipPosition } from './tooltip-enum';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective {
  tooltip = input<any>();

  private elementRef = inject(ElementRef);
  private appRef = inject(ApplicationRef);
  private viewContainerRef = inject(ViewContainerRef);

  private toolTipComponent!: ComponentRef<any>;

  destroy(): void {
    if (this.toolTipComponent !== null) {
      this.appRef.detachView(this.toolTipComponent.hostView);
      this.toolTipComponent.destroy();
    }
  }

  @HostListener('mouseover', ['$event'])
  onMouseOver(): void {
    const component = this.viewContainerRef.createComponent(ToolTipComponent);
    if (this.toolTipComponent === null || this.toolTipComponent === undefined) {
      this.toolTipComponent = component;
      const domElem = (this.toolTipComponent.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
      document.body.appendChild(domElem);
      this.setTooltipComponentProperties();
      this.toolTipComponent.hostView.detectChanges();
    } else if (this.toolTipComponent.instance.tooltip === '') {
      this.setTooltipComponentProperties();
    }
  }

  @HostListener('mouseout', ['$event'])
  onMouseOut() {
    if (
      this.toolTipComponent !== null &&
      this.toolTipComponent !== undefined &&
      !this.toolTipComponent.instance.firstFlag
    ) {
      this.toolTipComponent.instance.tooltip = '';
      this.toolTipComponent.instance.firstFlag = true;
    }
  }

  @HostListener('document:wheel', ['$event'])
  onMouseWheel() {
    if (
      this.toolTipComponent !== null &&
      this.toolTipComponent !== undefined &&
      !this.toolTipComponent.instance.firstFlag
    ) {
      this.toolTipComponent.instance.tooltip = '';
      this.toolTipComponent.instance.firstFlag = true;
    }
  }

  private setTooltipComponentProperties() {
    if (!this.toolTipComponent) {
      return;
    }

    this.toolTipComponent.instance.tooltip = this.tooltip().tooltip;
    this.toolTipComponent.instance.position = this.tooltip().position;
    this.toolTipComponent.instance.style = this.tooltip().style;
    this.toolTipComponent.instance.firstFlag = false;

    const { left, right, top, bottom } = this.elementRef.nativeElement.getBoundingClientRect();

    switch (this.tooltip().position) {
      case TooltipPosition.BELOW:
        this.toolTipComponent.instance.left = Math.round((right - left) / 2 + left);
        this.toolTipComponent.instance.top = Math.round(bottom);
        break;

      case TooltipPosition.ABOVE:
        this.toolTipComponent.instance.left = Math.round((right - left) / 2 + left);
        this.toolTipComponent.instance.top = Math.round(bottom);
        break;

      case TooltipPosition.RIGHT:
        this.toolTipComponent.instance.left = Math.round(right);
        this.toolTipComponent.instance.top = Math.round(top + (bottom - top) / 2);
        break;

      case TooltipPosition.LEFT:
        this.toolTipComponent.instance.left = Math.round((left - right) / 2 + right);
        this.toolTipComponent.instance.top = Math.round(top);
        break;

      case TooltipPosition.TOP:
        this.toolTipComponent.instance.left = Math.round((right - left) / 2 + left);
        this.toolTipComponent.instance.top = Math.round(top);
        break;

      default:
        break;
    }
  }
}
