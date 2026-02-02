import { Component, inject, input, Input, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormToken } from '@core/utils/Interfaces/form-token.model';
import { EnhancedGapAnalysisFormDataService } from '@core/services/enhanced-gap-analysis-form-data/enhanced-gap-analysis-form-data.service';
import { LanguageService } from '@core/services/language/language.service';

@Component({
  selector: 'coverage-percentage-life-critical',
  templateUrl: './coverage-percentage-life-critical.component.html',
  styleUrls: ['../results.component.scss'],
  standalone: true,
  imports: [MatIconModule, AsyncPipe],
})
export class CoveragePercentageLifeCriticalComponent implements OnInit {
  incomeCard = input<boolean>();
  cardTitle = input<string>();

  public languageService = inject(LanguageService);
  private enhancedGapDataService = inject(EnhancedGapAnalysisFormDataService);

  public gapData!: FormToken;

  ngOnInit() {
    this.gapData = this.enhancedGapDataService.gapAnalysisDataObj;
  }
}
