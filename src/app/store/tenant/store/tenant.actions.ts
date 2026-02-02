/* eslint-disable ngrx/prefer-action-creator */
import { Action, createAction, props } from '@ngrx/store';
import { User } from '../tenant.interface';

export enum TenantActionNames {
  POST_USER = '[User] Post User',
  POST_USER_SUCCESS = '[User] Post User Success',
  POST_USER_FAIL = '[User] Post User Fail',
  POST_USER_ROLE = '[User] Post User Role',
  POST_USER_ROLE_SUCCESS = '[User] Post User Role Success',
  POST_USER_ROLE_FAIL = '[User] Post User Role Fail',
  DELETE_USER = '[User] Delete User',
  DELETE_USER_SUCCESS = '[User] Delete User Success',
  DELETE_USER_FAIL = '[User] Delete User Fail',
  PUT_USER = '[User] Put User',
  PUT_USER_SUCCESS = '[User] Put User Success',
  PUT_USER_FAIL = '[User] Put User Fail',
}

export const postUser = createAction(TenantActionNames.POST_USER, props<{ user: any }>());
export const postUserSuccess = createAction(
  TenantActionNames.POST_USER_SUCCESS,
  props<{ user: User[] | any }>()
);
export const postUserFailure = createAction(
  TenantActionNames.POST_USER_FAIL,
  props<{ error: any }>()
);

export const putUser = createAction(TenantActionNames.PUT_USER, props<{ user: any }>());
export const putUserSuccess = createAction(
  TenantActionNames.PUT_USER_SUCCESS,
  props<{ user: User[] | any }>()
);
export const putUserFailure = createAction(
  TenantActionNames.PUT_USER_FAIL,
  props<{ error: any }>()
);

export const deleteUser = createAction(TenantActionNames.DELETE_USER, props<{ userId: string }>());
export const deleteUserSuccess = createAction(
  TenantActionNames.DELETE_USER_SUCCESS,
  props<{ user: User[] | any }>()
);
export const deleteUserFailure = createAction(
  TenantActionNames.DELETE_USER_FAIL,
  props<{ error: any }>()
);

export const postUserRole = createAction(TenantActionNames.POST_USER_ROLE, props<{ user: any }>());
export const postUserRoleSuccess = createAction(
  TenantActionNames.POST_USER_ROLE_SUCCESS,
  props<{ user: User[] | any }>()
);
export const postUserRoleFailure = createAction(
  TenantActionNames.POST_USER_ROLE_FAIL,
  props<{ error: any }>()
);

export type TenantActions = Action | ReturnType<typeof postUser>;
