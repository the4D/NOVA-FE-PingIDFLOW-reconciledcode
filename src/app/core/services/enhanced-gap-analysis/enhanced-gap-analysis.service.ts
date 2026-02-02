import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReadForm, ReadFormTokens } from '@core/models/form-maker-service/form-maker-service.model';
import { ConfigService } from '@core/config/config.service';
import { FormMetadataDto } from '@core/models/gap-analysis/gap-analysis.model';

const READ_FORM_TOKENS_URL: string = 'ReadFormTokens/';
const READ_FORM_URL: string = 'ReadForm/';
const BASE_INSURANCE_API_URL: string = 'INSURANCE_API/';
const GENERATE_GAP_ANALYSIS_FORM_URL: string = BASE_INSURANCE_API_URL + 'Form/Generate';

@Injectable({
  providedIn: 'root',
})
export class EnhancedGapAnalysisService {
  private BASE_FORMMAKERSERVICE_URL: string = '';
  private httpClient = inject(HttpClient);
  private configService = inject(ConfigService);

  constructor() {
    this.BASE_FORMMAKERSERVICE_URL = this.configService.settings.apis.formMakerServiceApi.url;
  }

  public readFormTokens(readFormTokens: ReadFormTokens): Observable<any> {
    return this.httpClient.post<any>(`${this.BASE_FORMMAKERSERVICE_URL}${READ_FORM_TOKENS_URL}`, readFormTokens, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }

  public readForm(readForm: ReadForm): Observable<any> {
    return this.httpClient.post<any>(`${this.BASE_FORMMAKERSERVICE_URL}${READ_FORM_URL}`, readForm, {
      headers: new HttpHeaders({
        'Content-Type': 'application/octet-stream',
      }),
    });
  }

  public generateGapAnalysisForm(formMetaData: FormMetadataDto) {
    return this.httpClient.post<any>(GENERATE_GAP_ANALYSIS_FORM_URL, JSON.stringify(formMetaData), {
      headers: new HttpHeaders({
        Accept: 'application/vnd.securian.applicationform.fromcasesensitivejson.single.json',
        'Content-Type': 'application/json',
      }),
    });
  }
}
