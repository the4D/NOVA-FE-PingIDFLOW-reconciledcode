/* eslint-disable ngrx/on-function-explicit-return-type */
/* eslint-disable prettier/prettier */
import * as TenantActions from './tenant.actions';
import { Action, createReducer, on, State } from '@ngrx/store';
import { TenantState, initialTenantState } from './tenant.state';

const reducer = createReducer(
  initialTenantState,
  on(TenantActions.postUser, (state, { data }: any) => ({ ...state, data })),
  on(TenantActions.postUserSuccess, (state: TenantState, { user }) => ({
    ...state,

    userId: user,
  })),
  on(TenantActions.postUserFailure, (state: TenantState, { error }: any) => ({
    ...state,
    error,
  })),

  on(TenantActions.putUser, (state, { data }: any) => ({ ...state, data })),
  on(TenantActions.putUserSuccess, (state: TenantState, { user }) => ({
    ...state,

    userId: user,
  })),
  on(TenantActions.putUserFailure, (state: TenantState, { error }: any) => ({
    ...state,
    error,
  })),

  on(TenantActions.deleteUser, (state, { data }: any) => ({
    ...state,
    data,
  })),
  on(TenantActions.deleteUserSuccess, (state: TenantState) => ({
    ...state,
  })),
  on(TenantActions.deleteUserFailure, (state: TenantState, { error }: any) => ({
    ...state,
    error,
  })),

  on(TenantActions.postUserRole, (state, { data }: any) => ({
    ...state,
    data,
  })),
  on(TenantActions.postUserRoleSuccess, (state: TenantState, { user }) => ({
    ...state,

    userRoleId: user,
  })),
  on(TenantActions.postUserRoleFailure, (state: TenantState, { error }: any) => ({
    ...state,
    error,
  }))
);

export function tenantReducer(state: TenantState | undefined, action: Action) {
  return reducer(state, action);
}
