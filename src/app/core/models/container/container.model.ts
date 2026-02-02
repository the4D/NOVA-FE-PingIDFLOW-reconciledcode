import { LoanRequest } from '../insurance/loan.model';

export interface Container {
  applicationDto: LoanRequest;
  command: string;
  postbackUrl?: string;
}
