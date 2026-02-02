import { Directive, TemplateRef, ViewContainerRef, OnChanges, SimpleChanges, input } from '@angular/core';

@Directive({
  selector: '[appReloadComponent]',
  standalone: true,
})
export class ReloadComponentDirective implements OnChanges {
  appReloadComponent = input<number>();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainerRef: ViewContainerRef
  ) {
    this.viewContainerRef.createEmbeddedView(templateRef);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appReloadComponent'] && changes['appReloadComponent'].previousValue !== undefined) {
      this.viewContainerRef.clear();
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    }
  }
}
