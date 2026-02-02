import { User } from '../tenant.interface';
export interface TenantState {
  user: User | null;
  users: User[];
  loaded: boolean;
  error?: string | null;
  userId?: string | null;
  userRoleId?: string | null;
}

export const initialTenantState: TenantState = {
  user: null,
  users: [],
  loaded: false,
  error: null,
};
