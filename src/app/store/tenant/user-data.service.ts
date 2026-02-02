import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DefaultDataService, HttpUrlGenerator, Logger } from '@ngrx/data';

import { Observable, of } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

import { User } from './tenant.interface';

@Injectable()
export class UserDataService extends DefaultDataService<User> {
  public url: string = 'TENANT_API/User';

  constructor(http: HttpClient, httpUrlGenerator: HttpUrlGenerator, logger: Logger) {
    super('User', http, httpUrlGenerator);
    logger.log('Created custom User EntityDataService');
  }

  override add(data: User): Observable<any> {
    //POST
    return this.http.post(this.url, data);
  }
  override delete(endpoint: number | string): Observable<any> {
    //DELETE
    return this.http.delete(this.url + '/' + endpoint);
  }

  override update(update: any): Observable<any> {
    //PUT
    return this.http.put(this.url, update.data);
  }

  override getAll(): Observable<User[]> {
    //GET ALL
    return this.http.get<User[]>(this.url);
  }

  override getById(endpoint: string): Observable<User> {
    //GET BY ID
    return this.http.get<User>(this.url + '/' + endpoint);
  }
  override getWithQuery(endpoint: string): Observable<User[]> {
    //GET BY ID
    return this.http.get<User[]>(this.url + '/' + endpoint);
  }
}
