import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { AssetLiability, Coverages, Expenses, FormMetadataDto, GapAnalysisBlob, GapAnalysisPDFResponse, Income } from "src/app/core/models/gap-analysis/gap-analysis.model";
import { AppState } from "src/app/store";
import { setLoadingSpinner } from "src/app/store/core/component/loading-spinner/loading-spinner.actions";
import { Observable, filter, take } from "rxjs";
import { gapAnalysisAssetLiabilitySelector, gapAnalysisBlobSelector, gapAnalysisCoverageSelector, gapAnalysisExpenseSelector, gapAnalysisIncomeSelector } from "../selectors/gap-analysis.selectors";
import { initializeGapAnalysisApplication, setAssetLiabilityToGapAnalysis, setCoveragesToGapAnalysis, setExpensesToGapAnalysis, setGapAnalysisBlobToGapAnalysis, setIncomeToGapAnalysis } from "../actions/gap-analysis.actions";
import { GapAnalysisService } from "src/app/core/services/insurance/gap-analysis.service";

@Injectable({ providedIn: 'root' })
export class GapAnalysisFacade {

    constructor(
        private store: Store<AppState>,
        private gapAnalysisService: GapAnalysisService

    ) {
    }

    public updateLoader(status: boolean) {
        this.store.dispatch(setLoadingSpinner({ status }));
    }

    public updateIncome(income: Income) {
        this.store.dispatch(setIncomeToGapAnalysis({ income }));
    }

    initializeApplication() {
        this.store.dispatch(initializeGapAnalysisApplication());
    }

    public getIncome(): Observable<Income> {
        return this.store
            .select(gapAnalysisIncomeSelector)
            .pipe(filter((income: Income) => income.employmentType !== ''));

    }

    public getAssetLiability(): Observable<AssetLiability> {
        return this.store
            .select(gapAnalysisAssetLiabilitySelector)
            .pipe();
    }

    public getExpense(): Observable<Expenses> {
        return this.store
            .select(gapAnalysisExpenseSelector)
            .pipe();
    }

    public getCoverage(): Observable<Coverages> {
        return this.store
            .select(gapAnalysisCoverageSelector)
            .pipe();
    }

    public updateAssetLiability(assetLiability: AssetLiability) {
        this.store.dispatch(setAssetLiabilityToGapAnalysis({ assetLiability }));
    }

    public gapAnalysisExpenseSelector(): Observable<Expenses> {
        return this.store
            .select(gapAnalysisExpenseSelector)
            .pipe();
    }

    public gapAnalysisBlobSelector(): Observable<GapAnalysisBlob> {
      
        return this.store
            .select(gapAnalysisBlobSelector)
            .pipe();
    }
 
    public updateExpenses(expenses: Expenses) {
        this.store.dispatch(setExpensesToGapAnalysis({ expenses }));
    }

    public updateCoverages(coverages: Coverages) {
        this.store.dispatch(setCoveragesToGapAnalysis({ coverages }));
    }

    public updateGapAnalysisBlob(gapAnalysisBlob: GapAnalysisBlob) {
        this.store.dispatch(setGapAnalysisBlobToGapAnalysis({ gapAnalysisBlob }));
    }

    public generatePdf(gapAnalysisData: GapAnalysisBlob): Observable<GapAnalysisPDFResponse> {

        const finalPayload: FormMetadataDto = {
            formType: 'DownloadOnly',
            formIdentifier: 'CPGAP',
            'templateName': 'CPGAP.pdf',
            'formData': JSON.stringify(gapAnalysisData)
        }

        return this.gapAnalysisService
            .generatePdf(finalPayload);
    }


    public getCalculateData(gapAnalysisData: GapAnalysisBlob): Observable<GapAnalysisBlob> {

        return this.gapAnalysisService
            .getCalculateData(gapAnalysisData);
    }

}        
