import { Injectable } from '@angular/core';

import { EntityCollectionServiceBase, EntityCollectionServiceElementsFactory } from '@ngrx/data';
import { User } from './tenant.interface';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService extends EntityCollectionServiceBase<User | any> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('User', serviceElementsFactory);
  }
}
