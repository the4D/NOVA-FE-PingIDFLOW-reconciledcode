import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormMetadataDto } from '@core/models/quickQuote/quick-quote.model';

const BASE_URL: string = 'INSURANCE_API/';
const PDF_FORM_GENERATE: string = `${BASE_URL}Form/Generate`;

@Injectable({
  providedIn: 'root',
})
export class QuickQuoteService {
  private http = inject(HttpClient);

  public generatePdf(formMetaData: FormMetadataDto) {
    return this.http.post<any>(PDF_FORM_GENERATE, JSON.stringify(formMetaData), {
      headers: new HttpHeaders({
        Accept: 'application/vnd.securian.applicationform.fromcasesensitivejson.single.json',
        'Content-Type': 'application/json',
      }),
    });
  }
}
