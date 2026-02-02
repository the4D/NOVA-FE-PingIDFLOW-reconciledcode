import { HttpClient } from '@angular/common/http';
import { inject, Injectable, OnDestroy } from '@angular/core';
import { tap, first } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { Branch, branchesInitialState } from '@core/models/tenant/branch.model';

const BASE_URL: string = 'TENANT_API/';
const ALL_BRANCHES_URL: string = BASE_URL + 'Branch/';

@Injectable({ providedIn: 'root' })
export class BranchService implements OnDestroy {
  private httpClient = inject(HttpClient);

  private _branches = new BehaviorSubject<Branch[]>(branchesInitialState());

  public get branches$() {
    return this._branches.asObservable();
  }

  ngOnDestroy(): void {
    this.branches = branchesInitialState();
    this._branches.complete();
  }

  set branches(branchValues: Branch[]) {
    this._branches.next(branchValues);
  }

  get branchesValue(): Branch[] {
    return this._branches.value;
  }

  getAllBranches(): void {
    this.httpClient
      .get<Branch[]>(ALL_BRANCHES_URL)
      .pipe(
        tap((branches: Branch[]) => {
          this.branches = branches;
        })
      )
      .pipe(first())
      .subscribe();
  }
}
