import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { FormMetadataDto, GapAnalysisBlob, GapAnalysisPDFResponse } from '../../models/gap-analysis/gap-analysis.model';

const BASE_URL: string = 'INSURANCE_API/';
const GAP_ANALYSIS_FORM_GENERATE_URL: string = BASE_URL + 'Form/Generate';
const GAP_ANALYSIS_CALCULATE_DATA_URL: string = BASE_URL + 'GapAnalysis';

@Injectable({
  providedIn: 'root',
})
export class GapAnalysisService {

  constructor(private http: HttpClient) { }

  public generatePdf(formMetaData: FormMetadataDto): Observable<GapAnalysisPDFResponse> {

    const stringifyFormData: string = JSON.stringify(formMetaData);
    return this.http.post<GapAnalysisPDFResponse>(
      GAP_ANALYSIS_FORM_GENERATE_URL,
      stringifyFormData,
      {
        headers : new HttpHeaders({
          'Accept': 'application/vnd.securian.applicationform.fromcaseinsensitivejson.single.json',
          'Content-Type': 'application/json'
        })
      }
    );
  }

  public getCalculateData(formMetaData: GapAnalysisBlob): Observable<GapAnalysisBlob> {
    
    return this.http.post<GapAnalysisBlob>(
      GAP_ANALYSIS_CALCULATE_DATA_URL,
      formMetaData
    );
  }
}
