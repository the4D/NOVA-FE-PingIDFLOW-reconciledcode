import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { EffectsModule } from '@ngrx/effects';
import { EntityDataModule, EntityDataService } from '@ngrx/data';
import { entityConfig } from './entity-metadata';
import { BrowserModule } from '@angular/platform-browser';
import { UserDataService } from './user-data.service';
import { TenantIndexService } from './tenant-index.service';
import { TenantFacade } from './store/tenant.facade';
import { TenantEffects } from './store/tenant.effects';

@NgModule({ declarations: [], imports: [CommonModule, EntityDataModule.forRoot(entityConfig)], providers: [UserDataService, TenantFacade, TenantIndexService, provideHttpClient(withInterceptorsFromDi())] })
export class TenantModule {
  constructor(entityDataService: EntityDataService, userDataService: UserDataService) {
    entityDataService.registerService('User', userDataService);
  }
}

export * from './user.service';
