import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GapAnalysisPdfComponent } from './quick-quote-pdf.component';

describe('GapAnalysisPdfComponent', () => {
  let component: GapAnalysisPdfComponent;
  let fixture: ComponentFixture<GapAnalysisPdfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [GapAnalysisPdfComponent],
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GapAnalysisPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
