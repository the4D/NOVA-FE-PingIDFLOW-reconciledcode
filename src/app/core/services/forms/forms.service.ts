import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormType, InsuranceForm } from '../../models/forms.model';

// API endpoints
const BASE_URL: string = 'INSURANCE_API/';
const FORMS_URL: string = BASE_URL + 'Form/';
const FORM_DOWNLOAD_URL: string = FORMS_URL + 'Download/';
const FORMS_BATCH_DOWNLOAD_URL: string = FORMS_URL + 'BatchDownload';

@Injectable({
    providedIn: 'root'
})
export class FormsService {
    private httpClient = inject(HttpClient);

    private _forms: BehaviorSubject<InsuranceForm[]> = new BehaviorSubject<InsuranceForm[]>([]);
    public forms$ = this._forms.asObservable();

    get formsValue(): InsuranceForm[] {
        return this._forms.value;
    }

    set forms(forms: InsuranceForm[]) {
        this._forms.next(forms);
    }    /**
     * Gets all available insurance forms
     * @returns Observable<InsuranceForm[]> List of available forms
     */
    getAvailableForms(): Observable<InsuranceForm[]> {
        // API call to get forms from backend
        return this.httpClient.get<any[]>(FORMS_URL).pipe(
            map(apiResponse => this.mapApiResponseToInsuranceForms(apiResponse)),
            shareReplay()
        );
    }

    /**
     * Maps API response to InsuranceForm model
     * @param apiResponse API response data
     * @returns InsuranceForm[] Mapped forms data
     */
    private mapApiResponseToInsuranceForms(apiResponse: any[]): InsuranceForm[] {
        return apiResponse.map(item => ({
            id: item.id || '',
            formIdentifier: item.formIdentifier || '',
            formType: item.formType || 0,
            formTemplate: item.formTemplate || '',
            formName: item.formName || '',
            description: item.description || '',
            isFederal: item.isFederal || false,
            version: item.version || '',
            fileLocation: item.fileLocation || '',
            sequence: item.sequence || 0,
            carrierFormConfigurations: item.carrierFormConfigurations || [],
            selected: false
        }));
    }

    /**
     * Gets a specific form by ID
     * @param formId The ID of the form to retrieve
     * @returns Observable<InsuranceForm> The requested form
     */
    getFormById(formId: string): Observable<InsuranceForm> {
        return this.httpClient.get<InsuranceForm>(`${FORMS_URL}${formId}`).pipe(
            shareReplay()
        );
    }    /**
     * Downloads a single form
     * @param form The form to download
     * @returns Observable<InsuranceForm> The form with the form image data attached
     */
    downloadForm(form: InsuranceForm): Observable<InsuranceForm> {
        // API call to download the form
        return this.httpClient.get<InsuranceForm>(`${FORM_DOWNLOAD_URL}${form.formIdentifier}`).pipe(
            shareReplay()
        )
    }


    /**
     * Helper method to trigger file download with blob data
     * @param blob The blob data to download
     * @param fileName Name to save the file as
     */
    triggerBlobDownload(documentContent: string | undefined, fileName: string): void {
        var blob = this.b64toBlob(documentContent, 'application/pdf');
        var fileURL = URL.createObjectURL(blob);

        // if (download) {
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = fileName;
        link.click();
        /* } else {
             window.open(fileURL);
         }*/
    }
    private b64toBlob(b64Data: any, contentType: string) {
        contentType = contentType || '';
        let sliceSize = 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }
}
