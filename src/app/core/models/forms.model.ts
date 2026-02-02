export interface InsuranceForm {
    id: string;
    formIdentifier: string; // This matches with formCode in the UI
    formType: number;
    formTemplate: string;
    formName: string; // This matches with name in the UI
    description?: string;
    isFederal: boolean;
    version: string;
    fileLocation: string | null;
    sequence: number;
    carrierFormConfigurations: any[];
    selected?: boolean;
    formImage?: string;

    formCode?: string;
    name?: string;
    fileUrl?: string;
}

export enum FormType {
    Unknown = 0,
    Application = 1,
    HealthQuestionnaire = 2,
    QuickQuote = 3,
    SupplementalDocument = 4
}
