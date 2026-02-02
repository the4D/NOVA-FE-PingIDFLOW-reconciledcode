import { Address, addressInitialState } from './branch-address.model';

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  district: any;
  transitNo: string;
  isCorporateOffice: boolean;
  address: Address;
  phones: Phone[];
}

export interface Phone {
  branchId: string;
  extension: string | null;
  id: string;
  isPrimary: boolean;
  number: string;
  phoneType: string;
  tenantId: string;
}

export const branchInitialState = (): Branch => ({
  id: '',
  tenantId: '',
  name: '',
  code: '',
  district: null,
  transitNo: '',
  isCorporateOffice: false,
  address: addressInitialState(),
  phones: [],
});

export const branchesInitialState = (): Branch[] => [];
