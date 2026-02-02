import { BlobFile } from './blob.model';

export class CarrierRequestSubmitClaim {
  certificateNumber!: string;
  name!: string;
  loanType!: string;
  fileUrl?: string;
  date?: Date;
  changedBy?: string;
}

export interface ICarrierRequestSubmitClaim {
  submitClaimDto: CarrierRequestSubmitClaim;
  blobDto: BlobFile;
}
