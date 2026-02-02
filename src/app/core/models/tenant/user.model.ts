import { Link } from '../system/link.model';

export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  branchId: string;
  isActive?: any;
  role: string;
  createdBy?: string;
  createdOn?: Date;
  tenantId?: string;
}

export interface User2 {
  id: string;
  tenantId: string;
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  role: string;
}

export const user2InitialState = (): User2 => ({
  id: '',
  tenantId: '',
  branchId: '',
  firstName: '',
  lastName: '',
  email: '',
  employeeId: '',
  role: '',
});

export enum RoleEnum {
  Empty = 0,
  Administrator = 1,
  Manager = 2,
  User = 3,
}

export interface UserRoleDto {
  userIdentifier: string;
  roleId: string;
  notes: string;
  effectiveOn: Date;
  expiresOn: Date;
  expiredBy: string;
  isPrimary: boolean;
}

export interface UsersByCriteria {
  value: User[];
  links: Link[];
}

export interface UserResourceParams {
  id?: string;
  name?: string;
  email?: string;
  employeeId?: string;
  branchId?: string;
  isActive?: boolean;
  role?: number;
  createdBy?: string;
  createdOn?: Date;
  fields?: string | undefined;
  orderBy?: string | undefined;
  pageSize?: number | undefined;
  pageNumber?: number | undefined;
}

export const initialUserState = (): User => ({
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  employeeId: '',
  branchId: '',
  isActive: false,
  role: '',
  createdBy: '',
  createdOn: undefined,
  tenantId: '',
});
