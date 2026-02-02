/* eslint-disable prettier/prettier */
import { Injectable } from '@angular/core';
import { TenantFacade } from './store/tenant.facade';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class TenantIndexService {
  constructor(public userService: UserService, public tenantFacade: TenantFacade) {}
  public facade: TenantFacade = this.tenantFacade as TenantFacade;

  public user: UserService = this.userService as UserService;
}
