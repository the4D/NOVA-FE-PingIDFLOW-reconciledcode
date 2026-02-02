export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  branchId: string;
  isActive?: boolean;
  role: Role;
  createdBy?: string;
  createdOn?: Date;

}

export enum Role {
  Administrator = 1,
  Manager = 2,
  User = 3,
}

export enum Product {
  Lending = 0,
  Insurance = 1,
}
