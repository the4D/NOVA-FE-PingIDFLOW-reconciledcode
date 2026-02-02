import { Link } from '../system/link.model';

export interface CarrierRequestsByCriteria {
  value: PaginatedCarrierRequest[];
  links: Link[];
}

export interface PaginatedCarrierRequest {
  id: string;
  certificateNumber: string;
  carrierRequestType: number;
  carrierRequestStatus: number;
  applicantName: string;
  loanType: number;
  cancellationDate: Date;
  createdOn: Date;
}

export interface CarrierRequestResourceParams {
  id?: string;
  certificateNumber?: string;
  carrierRequestType?: string;
  carrierRequestStatus?: string;
  applicantName?: string;
  loanType?: string;
  cancellationDate?: string;
  createdOn?: string;
  fields?: string;
  orderBy?: string;
  pageSize?: number;
  pageNumber?: number;
}
