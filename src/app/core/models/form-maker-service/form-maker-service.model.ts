import { InputMode, OutputMode, Product } from '@core/utils/enums/form-maker-service-enums';

export interface ReadFormTokens {
  tokensToRead?: string[];
  formImage?: string;
}

export interface ReadForm {
  formImage?: string;
}

export class FormRequestBase {
  targetProduct!: Product | undefined;
  targetOutputMode!: OutputMode | undefined;
  targetInputMode!: InputMode | undefined;
  formMetaDataCollection!: FormMetadata[];
}

export class FormMetadata {
  constructor(formIdentifier: string, templateName: string, formData: string) {
    this.formIdentifier = formIdentifier;
    this.templateName = templateName;
    this.formData = formData;
  }
  formIdentifier!: string;
  templateName!: string;
  formData!: string;
}

export class FormResponse {
  referenceNumber: string | undefined;
  responseCodes: FormResponseCode[] = [];
  insuranceForms!: string[];
}

export class FormResponseCode {
  code: string | undefined;
  message: string | undefined;
  isError: boolean | undefined;
}
