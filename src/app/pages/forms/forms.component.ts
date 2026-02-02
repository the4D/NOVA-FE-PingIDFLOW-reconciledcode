import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsService } from '../../core/services/forms/forms.service';
import { InsuranceForm } from '../../core/models/forms.model';
import { LoadingSpinnerComponent } from '../../core/components/loading-spinner/loading-spinner.component';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../../store';
import { setLoadingSpinner } from '../../store/core/component/loading-spinner/loading-spinner.actions';

@Component({
    selector: 'app-forms',
    templateUrl: './forms.component.html',
    styleUrls: ['./forms.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCheckboxModule,
        LoadingSpinnerComponent,
        NgClass
    ]
})
export class FormsComponent implements OnInit, OnDestroy {
    forms: InsuranceForm[] = [];
    loading: boolean = false;
    private unsubscribe$ = new Subject<void>();

    private formsService = inject(FormsService);
    private store = inject(Store<AppState>);

    ngOnInit(): void {
        this.loadForms();

        // Subscribe to forms observable from service to keep local state in sync
        this.formsService.forms$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((forms: InsuranceForm[]) => {
                if (forms && forms.length > 0) {
                    this.forms = forms.map(form => this.mapFormForUI(form));
                }
            });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Loads forms from the service
     */
    loadForms(): void {
        this.loading = true;
        this.store.dispatch(setLoadingSpinner({ status: true }));

        this.formsService.getAvailableForms()
            .pipe(
                takeUntil(this.unsubscribe$),
                finalize(() => {
                    this.loading = false;
                    this.store.dispatch(setLoadingSpinner({ status: false }));
                })
            )
            .subscribe({
                next: (forms: InsuranceForm[]): void => {
                    // Ensure all forms have the UI aliases set correctly
                    this.forms = forms.map(form => this.mapFormForUI(form));
                    this.formsService.forms = this.forms; // Update the forms in the service
                },
                error: (error: unknown): void => {
                    console.error('Error loading forms:', error as any);
                }
            });
    }

    get selectedForms(): InsuranceForm[] {
        return this.forms.filter(form => form.selected);
    }

    get isAnyFormSelected(): boolean {
        return this.selectedForms.length > 0;
    }
    /**
     * Downloads selected forms
     */
    downloadSelected(): void {
        if (!this.isAnyFormSelected) return;

        this.loading = true;
        this.store.dispatch(setLoadingSpinner({ status: true }));

        // Create an array of observables, one for each form to download
        const downloadObservables = this.selectedForms.map(form =>
            this.formsService.downloadForm(form)
        );

        // Use forkJoin to download all forms in parallel
        forkJoin(downloadObservables)
            .pipe(
                takeUntil(this.unsubscribe$),
                finalize(() => {
                    this.loading = false;
                    this.store.dispatch(setLoadingSpinner({ status: false }));
                })
            )
            .subscribe({
                next: (formsWithImages: InsuranceForm[]): void => {
                    // Check if we have any forms with images
                    if (formsWithImages.length > 0) {
                        // Process each form
                        formsWithImages.forEach(form => {
                            if (form.formImage) {
                                this.formsService.triggerBlobDownload(
                                    form.formImage,
                                    `${form.formIdentifier} - ${form.formName}.pdf`
                                );
                            } else {
                                console.error(`No image data available for form ${form.formIdentifier}`);
                            }
                        });
                    } else {
                        console.error('No forms were downloaded');
                    }
                },
                error: (error: unknown): void => {
                    console.error('Error downloading forms:', error as any);
                }
            });
    }
    /**
     * Downloads a single form
     */
    downloadForm(form: InsuranceForm, event: Event): void {
        event.stopPropagation();

        this.loading = true;
        this.store.dispatch(setLoadingSpinner({ status: true }));

        this.formsService.downloadForm(form)
            .pipe(
                takeUntil(this.unsubscribe$),
                finalize(() => {
                    this.loading = false;
                    this.store.dispatch(setLoadingSpinner({ status: false }));
                })
            )
            .subscribe({
                next: (formWithImage: InsuranceForm): void => {
                    if (formWithImage.formImage) {
                        this.formsService.triggerBlobDownload(
                            formWithImage.formImage,
                            `${form.formIdentifier} - ${form.formName}.pdf`
                        );
                    } else {
                        console.error(`No image data available for form ${form.formIdentifier}`);
                    }
                },
                error: (error: unknown): void => {
                    console.error(`Error downloading form ${form.formIdentifier}:`, error as any);
                }
            });
    }

    /**
     * Toggles selection state for all forms
     */    toggleAllSelection(checked: boolean): void {
        this.forms.forEach(form => form.selected = checked);
    }    /**
     * Maps API form data to UI-friendly format
     * Ensures all necessary properties exist for UI display
     */
    private mapFormForUI(form: InsuranceForm): InsuranceForm {
        return {
            ...form,
            // These are no longer needed as we're using the proper field names directly
            // but keeping them for backward compatibility
            formCode: form.formIdentifier,
            name: form.formName || '',  // Ensure it's never null
            fileUrl: form.fileLocation || ''  // Ensure it's never null
        };
    }
}
