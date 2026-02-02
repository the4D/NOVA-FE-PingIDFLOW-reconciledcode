import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsComponent } from './forms.component';
import { FormsService } from '../../core/services/forms/forms.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError, forkJoin } from 'rxjs';
import { InsuranceForm, FormType } from '../../core/models/forms.model';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../core/components/loading-spinner/loading-spinner.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { AppState } from '../../store';
import { setLoadingSpinner } from '../../store/core/component/loading-spinner/loading-spinner.actions';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('FormsComponent', () => {
    let component: FormsComponent;
    let fixture: ComponentFixture<FormsComponent>;
    let formsService: jasmine.SpyObj<FormsService>;
    let store: MockStore<AppState>;

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

    beforeEach(async () => {        // Create a spy for the FormsService
        const formsServiceSpy = jasmine.createSpyObj('FormsService', [
            'getAvailableForms',
            'downloadForm',
            'triggerBlobDownload'
        ]);
        formsServiceSpy.forms$ = of([]);

        await TestBed.configureTestingModule({
            imports: [
                FormsComponent,
                HttpClientTestingModule,
                MatCheckboxModule,
                FormsModule,
                NoopAnimationsModule
            ],
            providers: [
                { provide: FormsService, useValue: formsServiceSpy },
                provideMockStore({
                    initialState: {
                        core: {
                            component: {
                                loadingSpinner: {
                                    status: false
                                }
                            }
                        }
                    }
                })
            ]
        }).compileComponents();

        formsService = TestBed.inject(FormsService) as jasmine.SpyObj<FormsService>;
        store = TestBed.inject(MockStore);
        spyOn(store, 'dispatch').and.callThrough();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FormsComponent);
        component = fixture.componentInstance;

        // Setup default responses for service calls
        formsService.getAvailableForms.and.returnValue(of(mockForms));

        // Create a spy for the forms$ BehaviorSubject
        Object.defineProperty(formsService, 'forms$', {
            get: () => of(mockForms)
        });

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('initialization', () => {
        it('should load forms on init', () => {
            expect(formsService.getAvailableForms).toHaveBeenCalled();
            expect(component.forms.length).toBe(2);
        });
        /*
                xit('should show loading spinner while fetching forms', fakeAsync(() => {
                    formsService.getAvailableForms.and.returnValue(of(mockForms).pipe(delay(100)));
                    component.loadForms();
        
                    expect(component.loading).toBeTrue();
                    expect(store.dispatch).toHaveBeenCalledWith(setLoadingSpinner({ status: true }));
        
                    tick(100);
        
                    expect(component.loading).toBeFalse();
                    expect(store.dispatch).toHaveBeenCalledWith(setLoadingSpinner({ status: false }));
                }));
        */
        it('should show empty state when no forms are available', () => {
            formsService.getAvailableForms.and.returnValue(of([]));
            component.loadForms();
            fixture.detectChanges();

            const emptyStateEl = fixture.debugElement.query(By.css('.empty-state'));
            expect(emptyStateEl).toBeTruthy();

            const refreshButton = emptyStateEl.query(By.css('button'));
            expect(refreshButton).toBeTruthy();

            // Test refresh button click
            refreshButton.triggerEventHandler('click', null);
            expect(formsService.getAvailableForms).toHaveBeenCalledTimes(2);
        });
    });

    describe('form display', () => {
        it('should display forms in a table format', () => {
            const formRows = fixture.debugElement.queryAll(By.css('.form-row'));
            expect(formRows.length).toBe(2);

            const firstFormId = formRows[0].query(By.css('.col-form-id')).nativeElement.textContent.trim();
            expect(firstFormId).toBe('CP0159');

            const firstFormName = formRows[0].query(By.css('.col-form-name')).nativeElement.textContent.trim();
            expect(firstFormName).toBe('Beneficiary Designation Change');
        });

        it('should correctly map form data to UI display', () => {
            const incompleteForm: InsuranceForm = {
                id: '3',
                formIdentifier: 'CP0176',
                formType: FormType.SupplementalDocument,
                formTemplate: 'CP0176.pdf',
                formName: 'Test Form',
                isFederal: false,
                version: '1',
                fileLocation: null,
                sequence: 3,
                carrierFormConfigurations: []
            };

            const mappedForm = component['mapFormForUI'](incompleteForm);

            expect(mappedForm.formCode).toBe('CP0176');
            expect(mappedForm.name).toBe('Test Form');
            expect(mappedForm.fileUrl).toBe('');
        });
    });

    describe('form selection', () => {
        it('should track selected forms', () => {
            component.forms[0].selected = true;

            expect(component.selectedForms.length).toBe(1);
            expect(component.isAnyFormSelected).toBeTrue();

            component.forms[0].selected = false;

            expect(component.selectedForms.length).toBe(0);
            expect(component.isAnyFormSelected).toBeFalse();
        });

        it('should toggle all form selections', () => {
            component.toggleAllSelection(true);

            expect(component.forms.every(form => form.selected)).toBeTrue();
            expect(component.selectedForms.length).toBe(2);

            component.toggleAllSelection(false);

            expect(component.forms.every(form => !form.selected)).toBeTrue();
            expect(component.selectedForms.length).toBe(0);
        });

        it('should enable download button only when forms are selected', () => {
            fixture.detectChanges();

            const downloadButton = fixture.debugElement.query(By.css('.download-selected button'));
            expect(downloadButton.nativeElement.disabled).toBeTrue();

            component.forms[0].selected = true;
            fixture.detectChanges();

            expect(downloadButton.nativeElement.disabled).toBeFalse();
        });
    }); describe('downloading forms', () => {
        it('should download a single form when clicked', fakeAsync(() => {
            const form = mockForms[0];
            const formWithImage = { ...form, formImage: 'base64data' };

            formsService.downloadForm.and.returnValue(of(formWithImage));

            const event = new MouseEvent('click');
            spyOn(event, 'stopPropagation');

            component.downloadForm(form, event as any);

            // Complete the async operation
            tick();

            expect(event.stopPropagation).toHaveBeenCalled();
            expect(formsService.downloadForm).toHaveBeenCalledWith(form);
            expect(formsService.triggerBlobDownload).toHaveBeenCalledWith(
                'base64data',
                `${form.formIdentifier} - ${form.formName}.pdf`
            );
        }));

        it('should handle missing form image data', () => {
            const form = mockForms[0];
            const formWithoutImage = { ...form, formImage: undefined };

            formsService.downloadForm.and.returnValue(of(formWithoutImage));

            spyOn(console, 'error');

            const event = new MouseEvent('click');
            component.downloadForm(form, event as any);

            expect(console.error).toHaveBeenCalledWith(`No image data available for form ${form.formIdentifier}`);
            expect(formsService.triggerBlobDownload).not.toHaveBeenCalled();
        }); it('should download selected forms when download button is clicked', fakeAsync(() => {
            // Select two forms
            component.forms[0].selected = true;
            component.forms[1].selected = true;

            // Create forms with image data
            const form1WithImage = { ...component.forms[0], formImage: 'base64data1' };
            const form2WithImage = { ...component.forms[1], formImage: 'base64data2' };

            // Setup return values for downloadForm calls
            formsService.downloadForm.and.returnValues(
                of(form1WithImage),
                of(form2WithImage)
            );

            // Call the method
            component.downloadSelected();

            // Complete the async operation
            tick();

            // Verify downloadForm was called for each selected form
            expect(formsService.downloadForm).toHaveBeenCalledWith(component.forms[0]);
            expect(formsService.downloadForm).toHaveBeenCalledWith(component.forms[1]);

            // Verify triggerBlobDownload was called for each form
            expect(formsService.triggerBlobDownload).toHaveBeenCalledWith(
                'base64data1',
                `${component.forms[0].formIdentifier} - ${component.forms[0].formName}.pdf`
            );
            expect(formsService.triggerBlobDownload).toHaveBeenCalledWith(
                'base64data2',
                `${component.forms[1].formIdentifier} - ${component.forms[1].formName}.pdf`
            );
        })); it('should not download forms if none are selected', () => {
            component.downloadSelected();

            expect(formsService.downloadForm).not.toHaveBeenCalled();
        });

        it('should handle download errors gracefully', () => {
            const error = new Error('Download failed');
            formsService.downloadForm.and.returnValue(throwError(() => error));

            spyOn(console, 'error');

            const event = new MouseEvent('click');
            component.downloadForm(mockForms[0], event as any);

            expect(console.error).toHaveBeenCalledWith(
                `Error downloading form ${mockForms[0].formIdentifier}:`,
                error
            );
        });
    });

    describe('error handling', () => {
        it('should handle form loading errors', () => {
            const error = new Error('Failed to load forms');
            formsService.getAvailableForms.and.returnValue(throwError(() => error));

            spyOn(console, 'error');

            component.loadForms();

            expect(console.error).toHaveBeenCalledWith('Error loading forms:', error);
            expect(component.loading).toBeFalse();
        });
    });
});

// Helper to add delay to observables
function delay(ms: number) {
    return (observable: any) => new Observable(observer => {
        const subscription = observable.subscribe({
            next: (v: any) => setTimeout(() => observer.next(v), ms),
            error: (e: any) => setTimeout(() => observer.error(e), ms),
            complete: () => setTimeout(() => observer.complete(), ms)
        });
        return () => subscription.unsubscribe();
    });
}

// Add missing import
import { Observable } from 'rxjs';
