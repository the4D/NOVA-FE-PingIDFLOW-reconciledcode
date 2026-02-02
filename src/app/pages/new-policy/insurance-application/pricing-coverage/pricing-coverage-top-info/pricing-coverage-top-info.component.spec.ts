/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PricingCoverageTopInfoComponent } from './pricing-coverage-top-info.component';

describe('PricingCoverageTopInfoComponent', () => {
  let component: PricingCoverageTopInfoComponent;
  let fixture: ComponentFixture<PricingCoverageTopInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [PricingCoverageTopInfoComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PricingCoverageTopInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
