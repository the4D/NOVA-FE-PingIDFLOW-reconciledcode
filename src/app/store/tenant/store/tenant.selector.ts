import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TenantState } from './tenant.state';

export const selectUsersState = createFeatureSelector<TenantState>('tenant');

export const selectUsersLoaded = createSelector(
  selectUsersState,
  (state: TenantState) => state?.loaded
);

export const selectUsersError = createSelector(
  selectUsersState,
  (state: TenantState) => state?.error
);

export const selectAllUsers = createSelector(selectUsersState, (state: TenantState) => state.users);
export const selectPostedUser = createSelector(
  selectUsersState,
  (state: TenantState) => state.userId
);

export const selectPostedUserRole = createSelector(
  selectUsersState,
  (state: TenantState) => state.userRoleId
);
