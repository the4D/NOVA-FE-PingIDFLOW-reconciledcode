/* eslint-disable ngrx/select-style */
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { User } from '../tenant.interface';
import * as TenantSelectors from './tenant.selector';
import * as TenantActions from './tenant.actions';
import { ConfigService } from '../../../core/config/config.service';
@Injectable()
export class TenantFacade {
  constructor(
    private config: ConfigService,
    private readonly store: Store
  ) {
    // Removed MsalService token acquisition - authentication handled elsewhere
    // let tokenRequest = {
    //   scopes: [config.settings.apis.tenantApi.scope],
    // };
    // this.msalService.acquireTokenSilent(tokenRequest);
  }

  public readonly loaded$: Observable<boolean> = this.store.pipe(
    select(TenantSelectors.selectUsersLoaded)
  );
  public readonly allUsers$: Observable<any> = this.store.pipe(
    select(TenantSelectors.selectAllUsers)
  );
  public readonly postedUser$: Observable<any> = this.store.pipe(
    select(TenantSelectors.selectPostedUser)
  );
  public readonly error$: Observable<any> = this.store.pipe(
    select(TenantSelectors.selectUsersError)
  );

  public readonly postedUserRole$: Observable<any> = this.store.pipe(
    select(TenantSelectors.selectPostedUserRole)
  );
  public postUserRole(data: User): void {
    this.store.dispatch(TenantActions.postUserRole({ user: data }));
  }
  public async postUser(data: any): Promise<void> {
    this.store.dispatch(TenantActions.postUser({ user: data }));
  }
  public putUser(data: User): void {
    this.store.dispatch(TenantActions.putUser({ user: data }));
  }
  public deleteUser(id: string): void {
    this.store.dispatch(TenantActions.deleteUser({ userId: id }));
  }
}
