import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, first, map, take } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import {
  UserResourceParams,
  UsersByCriteria,
  User,
  UserRoleDto,
  initialUserState,
} from '@core/models/tenant/user.model';
import { Role } from '@store/tenant/tenant.interface';

const BASE_URL: string = 'TENANT_API/';
const USER_URL: string = BASE_URL + 'User/Profile/';
const USERS_BY_CRITERIA_URL: string = BASE_URL + 'User/Criteria';
const AUTH_USER: string =
  "https://thermosetting-golden-illustratively.ngrok-free.dev/api/v1/auth/login";

@Injectable({ providedIn: 'root' })
export class UserService {
  private httpClient = inject(HttpClient);

  private _user = new BehaviorSubject<User>(initialUserState());

  public get user$() {
    return this._user.asObservable();
  }

  set user(userValue: User) {
    this._user.next(userValue);
  }

  get userValue() {
    return this._user.value;
  }

  getUser(): void {
    if (this.userValue?.id === '') {
      this.httpClient
        .get<User>(USER_URL)
        .pipe(
          tap((user: User) => {
            this.user = user;
          })
        )
        .pipe(first())
        .subscribe();
    }
  }

  getUsers(): Observable<User[]> {
    return this.httpClient.get<User[]>(BASE_URL + 'User').pipe(
      catchError((error) => {
        return of(error);
      })
    );
  }

  getUserById(userId?: string): Observable<User> {
    return this.httpClient.get<User>(BASE_URL + 'User/Id/' + userId).pipe(
      catchError((error) => {
        return of(error);
      })
    );
  }

  getUsersByCriteria(searchOptions: UserResourceParams): Observable<UsersByCriteria> {
    let params = JSON.parse(JSON.stringify(searchOptions));
    return this.httpClient.get<UsersByCriteria>(USERS_BY_CRITERIA_URL, {
      headers: new HttpHeaders({
        Accept: 'application/vnd.valeyo.user.continuousscrolling.hateoas+json',
      }),
      params: params,
    });
  }

  getUsersByRole(roleId: Role): Observable<User[]> {
    return this.httpClient.get<User[]>(BASE_URL + 'User/Role/' + roleId).pipe(
      catchError((error) => {
        return of(error);
      })
    );
  }

  getUsersByStatus(status: string): Observable<User[]> {
    return this.httpClient.get<User[]>(BASE_URL + 'User/Status/' + status).pipe(
      catchError((error) => {
        return of(error);
      })
    );
  }

  postUser(data: User): Observable<any> {
    return this.httpClient.post(BASE_URL + 'User', { User: data }).pipe(
      catchError((error) => {
        return of(error);
      })
    );
  }

  putUser(data: User): Observable<any> {
    return this.httpClient.put(BASE_URL + 'User', { User: data }).pipe(
      catchError((error) => {
        return of(error);
      })
    );
  }

  deleteUser(userId: string): Observable<any> {
    return this.httpClient.delete(BASE_URL + 'User/' + userId);
  }

  postUserRole(data: UserRoleDto): Observable<any> {
    return this.httpClient.post(BASE_URL + 'UserRole', { UserRoleDto: data }).pipe(
      map((response: any) => {
        return response;
      })
    );
  }

  putUserRole(data: UserRoleDto): Observable<any> {
    return this.httpClient.put(BASE_URL + 'UserRole', { UserRoleDto: data }).pipe(
      map((response: any) => {
        return response;
      })
    );
  }

  getUserToken(data: { email: string; pingUserId: string }): Observable<any> {
    return this.httpClient.post<User[]>(AUTH_USER, data).pipe(
      catchError((error) => {
        return of(error);
      })
    );
  }
}
