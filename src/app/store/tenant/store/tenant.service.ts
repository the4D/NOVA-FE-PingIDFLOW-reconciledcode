/* eslint-disable prettier/prettier */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpUrlGenerator, Logger } from '@ngrx/data';
import { Observable } from 'rxjs';
import { User } from '../tenant.interface';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  public url: string = 'TENANT_API/';

  constructor(private http: HttpClient) { }

  postUser(data: User): Observable<any> {
    return this.http.post(this.url + 'User', { User: data }).pipe(
      map((response: any) => {
        return response;
      })
    );
  }

  putUser(data: User): Observable<any> {
    return this.http.put(this.url + 'User', { User: data }).pipe(
      map((response: any) => {
        return response;
      })
    );
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(this.url + 'User/' + userId);
  }

  postUserRole(data: User): Observable<any> {
    return this.http.post(this.url + 'UserRole', { UserRoleDto: data }).pipe(
      map((response: any) => {
        return response;
      })
    );
  }
}
