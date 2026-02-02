import { SignatureDate } from './signature.model';
export interface FileDownload {
  fileType: string;
  applicationId: string;
  download: boolean;
  SignatureDate: string;
}
