import { TestBed } from '@angular/core/testing';
import { FormsService } from './forms.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InsuranceForm, FormType } from '../../models/forms.model';

describe('FormsService', () => {
    let service: FormsService;
    let httpMock: HttpTestingController;

    const mockForms: InsuranceForm[] = [
        {
            id: '1',
            formIdentifier: 'CP0159',
            formType: FormType.SupplementalDocument,
            formTemplate: 'CP0159.pdf',
            formName: 'Beneficiary Designation Change',
            description: 'Use this form to change your beneficiary designation for your insurance policy.',
            isFederal: false,
            version: '1',
            fileLocation: 'assets/forms/CP0159-Beneficiary-Designation-Change.pdf',
            sequence: 1,
            carrierFormConfigurations: [],
            selected: false
        },
        {
            id: '2',
            formIdentifier: 'CP0162',
            formType: FormType.SupplementalDocument,
            formTemplate: 'CP0162.pdf',
            formName: 'Service Request Form',
            description: 'Use this form to request changes to your insurance policy.',
            isFederal: false,
            version: '1',
            fileLocation: 'assets/forms/CP0162-Service-Request-Form.pdf',
            sequence: 2,
            carrierFormConfigurations: [],
            selected: false
        }
    ];

    // Mock API response with different structure to test mapping
    const mockApiResponse = [
        {
            id: '1',
            formIdentifier: 'CP0159',
            formType: 1,
            formTemplate: 'CP0159.pdf',
            formName: 'Beneficiary Designation Change',
            description: 'Use this form to change your beneficiary designation.',
            isFederal: false,
            version: '1.0',
            fileLocation: 'path/to/form.pdf',
            sequence: 1,
            carrierFormConfigurations: []
        }
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [FormsService]
        });

        service = TestBed.inject(FormsService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('forms$ observable', () => {
        it('should initialize with an empty array', () => {
            service.forms$.subscribe(forms => {
                expect(forms).toEqual([]);
            });
        });

        it('should emit new forms when set', () => {
            service.forms = mockForms;

            service.forms$.subscribe(forms => {
                expect(forms).toEqual(mockForms);
            });
        });

        it('should provide access to current forms value', () => {
            service.forms = mockForms;

            expect(service.formsValue).toEqual(mockForms);
        });
    });

    describe('getAvailableForms', () => {
        it('should retrieve forms from the API', () => {
            service.getAvailableForms().subscribe(forms => {
                expect(forms.length).toBe(1);
                expect(forms[0].formIdentifier).toBe('CP0159');
            });

            const req = httpMock.expectOne('INSURANCE_API/Form/');
            expect(req.request.method).toBe('GET');
            req.flush(mockApiResponse);
        });

        it('should correctly map API response to InsuranceForm model', () => {
            service.getAvailableForms().subscribe(forms => {
                const form = forms[0];
                expect(form.id).toBe('1');
                expect(form.formIdentifier).toBe('CP0159');
                expect(form.formType).toBe(1);
                expect(form.formName).toBe('Beneficiary Designation Change');
                expect(form.selected).toBe(false); // Default value
            });

            const req = httpMock.expectOne('INSURANCE_API/Form/');
            req.flush(mockApiResponse);
        });

        it('should handle empty API response', () => {
            service.getAvailableForms().subscribe(forms => {
                expect(forms).toEqual([]);
            });

            const req = httpMock.expectOne('INSURANCE_API/Form/');
            req.flush([]);
        });

        it('should handle API errors', () => {
            service.getAvailableForms().subscribe({
                next: () => fail('Expected an error, not forms'),
                error: error => expect(error.status).toBe(500)
            });

            const req = httpMock.expectOne('INSURANCE_API/Form/');
            req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
        });
    });

    describe('getFormById', () => {
        it('should retrieve a specific form by ID', () => {
            const formId = '1';

            service.getFormById(formId).subscribe(form => {
                expect(form.id).toBe(formId);
                expect(form.formIdentifier).toBe('CP0159');
            });

            const req = httpMock.expectOne(`INSURANCE_API/Form/${formId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockApiResponse[0]);
        });
    }); describe('downloadForm', () => {
        it('should download a single form', () => {
            const form = mockForms[0];
            const mockResponse = {
                id: form.id,
                formIdentifier: form.formIdentifier,
                formName: form.formName,
                documentContent: 'base64encodedcontent'
            };

            service.downloadForm(form).subscribe(formWithImage => {
                expect(formWithImage.id).toBe(form.id);
                expect(formWithImage.formIdentifier).toBe(form.formIdentifier);
            });

            const req = httpMock.expectOne(`INSURANCE_API/Form/Download/${form.formIdentifier}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);
        });
    }); describe('triggerBlobDownload', () => {
        it('should create a download link and trigger a click', () => {
            const mockBase64String = 'VGVzdCBjb250ZW50'; // Base64 encoded "Test content"
            const fileName = 'test.pdf';

            // Create a spy for b64toBlob
            const mockBlob = new Blob(['Test content'], { type: 'application/pdf' });
            spyOn<any>(service, 'b64toBlob').and.returnValue(mockBlob);

            // Spy on document methods
            const createElementSpy = spyOn(document, 'createElement').and.callThrough();
            const appendChildSpy = spyOn(document.body, 'appendChild').and.callThrough();
            const removeChildSpy = spyOn(document.body, 'removeChild').and.callThrough();

            // Mock URL.createObjectURL and URL.revokeObjectURL
            const mockUrl = 'blob:test-url';
            spyOn(URL, 'createObjectURL').and.returnValue(mockUrl);
            spyOn(URL, 'revokeObjectURL');

            // Mock link click
            const mockLink = document.createElement('a');
            spyOn(mockLink, 'click');
            createElementSpy.and.returnValue(mockLink);

            // Call the method
            service.triggerBlobDownload(mockBase64String, fileName);

            // Verify expectations
            expect(service['b64toBlob']).toHaveBeenCalledWith(mockBase64String, 'application/pdf');
            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(mockLink.href).toBe(mockUrl);
            expect(mockLink.download).toBe(fileName);
            expect(mockLink.click).toHaveBeenCalled();
            expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
            expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
        });
    });

    describe('mapApiResponseToInsuranceForms', () => {
        it('should correctly map API response with all fields', () => {
            const result = service['mapApiResponseToInsuranceForms'](mockApiResponse);

            expect(result.length).toBe(1);
            expect(result[0].id).toBe('1');
            expect(result[0].formIdentifier).toBe('CP0159');
            expect(result[0].formName).toBe('Beneficiary Designation Change');
            expect(result[0].selected).toBe(false);
        });

        it('should handle missing fields in API response', () => {
            const incompleteResponse = [{
                id: '3',
                formIdentifier: 'CP0176'
                // Missing other fields
            }];

            const result = service['mapApiResponseToInsuranceForms'](incompleteResponse);

            expect(result.length).toBe(1);
            expect(result[0].id).toBe('3');
            expect(result[0].formIdentifier).toBe('CP0176');
            expect(result[0].formName).toBe(''); // Default value
            expect(result[0].formType).toBe(0); // Default value
            expect(result[0].isFederal).toBe(false); // Default value
            expect(result[0].selected).toBe(false); // Default value
        });

        it('should handle null or undefined API response', () => {
            expect(service['mapApiResponseToInsuranceForms'](null as any)).toEqual([]);
            expect(service['mapApiResponseToInsuranceForms'](undefined as any)).toEqual([]);
        });
    });
});
