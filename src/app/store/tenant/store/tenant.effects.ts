import { TenantActionNames } from './tenant.actions';
import * as TenantActions from './tenant.actions';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TenantService } from './tenant.service';
import { Observable, of, switchMap } from 'rxjs';
import { catchError, exhaustMap, map } from 'rxjs/operators';
import { Action } from '@ngrx/store';

// eslint-disable-next-line prettier/prettier

@Injectable()
export class TenantEffects {
  constructor(
    private readonly actions$: Actions<any>,
    private readonly tenantService: TenantService
  ) {}
  public readonly postUser$: Observable<any> = createEffect(() => {
    return this.actions$.pipe(
      ofType(TenantActionNames.POST_USER),
      exhaustMap((action) => {
        return this.tenantService.postUser(action.user).pipe(
          map((response) => {
            return TenantActions.postUserSuccess({
              user: response,
            });
          }),
          catchError((error: any) => of(TenantActions.postUserFailure(error)))
        );
      })
    );
  });

  public readonly putUser$: Observable<any> = createEffect(() => {
    return this.actions$.pipe(
      ofType(TenantActionNames.PUT_USER),
      exhaustMap((action) => {
        return this.tenantService.putUser(action.user).pipe(
          map((response) => {
            return TenantActions.putUserSuccess({
              user: response,
            });
          }),
          catchError((error: any) => of(TenantActions.putUserFailure(error)))
        );
      })
    );
  });

  public readonly deleteUser$: Observable<any> = createEffect(() => {
    return this.actions$.pipe(
      ofType(TenantActionNames.DELETE_USER),
      exhaustMap((action) => {
        return this.tenantService.deleteUser(action.userId).pipe(
          map((response) => {
            return TenantActions.deleteUserSuccess({
              user: response,
            });
          }),
          catchError((error: any) => of(TenantActions.deleteUserFailure(error)))
        );
      })
    );
  });

  public readonly postUserRole$: Observable<any> = createEffect(() => {
    return this.actions$.pipe(
      ofType(TenantActionNames.POST_USER_ROLE),
      exhaustMap((action) => {
        return this.tenantService.postUserRole(action.user).pipe(
          map((response) => {
            return TenantActions.postUserRoleSuccess({
              user: response,
            });
          }),
          catchError((error: any) => of(TenantActions.postUserRoleFailure(error)))
        );
      })
    );
  });
}
