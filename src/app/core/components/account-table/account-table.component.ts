import { Component, OnInit, Output, EventEmitter, output, inject } from '@angular/core';
import { UntypedFormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Store } from '@ngrx/store';
import { formatDate } from '@angular/common';
import { debounceTime } from 'rxjs';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { UserService } from '@core/services/tenant/user.service';
import { UserResourceParams, UsersByCriteria, User } from '@core/models/tenant/user.model';
import { getUserRoleList } from '@core/utils/enums/system-enums';
import { AppState } from '@store';
import { DynamicTableComponent } from '../dynamic-table/dynamic-table.component';

export const getUserStatusList = (): any[] => [
  { id: 0, description: 'Disabled' },
  { id: 1, description: 'Enabled' },
];

@Component({
  selector: 'app-account-table',
  templateUrl: './account-table.component.html',
  styleUrls: ['./account-table.component.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatOptionModule,
    MatInputModule,
    MatIconModule,
    DynamicTableComponent,
  ],
})
export class AccountTableComponent implements OnInit {
  private store = inject(Store<AppState>);
  public userService = inject(UserService);

  public pageNumber = 0;
  public seeMoreMsg = '';
  public seeMoreNavLink = '';
  public searchBy = new UntypedFormControl('');
  public filterBy = new UntypedFormControl('');
  public dataSource: User[] = [];
  public columns: string[] = ['name', 'role', 'employeeId', 'createdOn', 'isActive', 'actions'];
  public columnTitles: string[] = ['Name', 'Role', 'Employee ID', 'Date Added', 'Status', ' '];

  public filterByOptionList = [
    { id: 'Role', description: 'Role' },
    { id: 'Status', description: 'Status' },
    { id: 'Name', description: 'Name' },
  ];

  editUserEvent = output<User>();
  deleteUserEvent = output<User>();

  ngOnInit(): void {
    this.searchBy.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      this.pageNumber = 0;
      this.getAllUsers();
    });

    this.getAllUsers();
  }

  getAllUsers(): void {
    if (
      (this.searchBy.value && this.filterBy.value && this.searchBy.value.length > 2) ||
      !(this.searchBy.value && this.filterBy.value)
    ) {
      this.pageNumber += 1;
      let searchOptions: UserResourceParams = {
        orderBy: 'CreatedOn desc',
        pageNumber: this.pageNumber,
      };

      if (this.filterBy.value && this.searchBy.value) {
        let enteredSearchByValue = this.searchBy.value.trim().toLowerCase();
        switch (this.filterBy.value.toLowerCase()) {
          case 'role': {
            searchOptions.role = getUserRoleList().find((el) =>
              el.description.toLowerCase().startsWith(enteredSearchByValue)
            )?.id;
            break;
          }
          case 'status': {
            searchOptions.isActive = Boolean(
              getUserStatusList().find((el) => el.description.toLowerCase().startsWith(enteredSearchByValue))?.id
            );
            break;
          }
          case 'name': {
            searchOptions.name = enteredSearchByValue;
            break;
          }
        }
      }

      this.store.dispatch(setLoadingSpinner({ status: true }));

      this.userService.getUsersByCriteria(searchOptions).subscribe((user: UsersByCriteria) => {
        let tempData: any[] = [];
        user.value.forEach((element) => {
          tempData.push({
            id: element.id,
            branchId: element.branchId,
            firstName: element.firstName,
            lastName: element.lastName,
            name: element.firstName + ' ' + element.lastName,
            employeeId: element.employeeId,
            email: element.email,
            role: getUserRoleList().find((el) => el.abbreviation == element?.role)?.description || 'No Role',
            isActive: getUserStatusList().find((el) => Boolean(el.id) == element?.isActive)?.description || 'Unknown',
            createdOn: element.createdOn ? formatDate(element?.createdOn, 'MMM dd, yyyy', 'en-US').toString() : '',
            createdBy: element.createdBy,
          });
        });

        this.seeMoreNavLink = user.links.find((n) => n.rel == 'nextPage')?.href ?? '';
        this.seeMoreNavLink ? (this.seeMoreMsg = 'See More User Accounts') : (this.seeMoreMsg = '');
        this.dataSource = tempData;
      });

      this.store.dispatch(setLoadingSpinner({ status: false }));
    }
  }

  onFilterByChanged() {
    this.pageNumber = 0;
    if (this.searchBy.value) {
      this.searchBy.setValue('');
    } else {
      if (this.searchBy.value) this.getAllUsers();
    }
  }

  // getAllUsers(): void {
  //   this.store.dispatch(setLoadingSpinner({ status: true }));
  //
  //   this.userService.getUsers().subscribe((users: User[]) => {
  //     this.accounts = users;
  //     this.store.dispatch(setLoadingSpinner({ status: false }));
  //
  //     return this.accounts;
  //   });
  // }

  // filterAccounts(search: string, filterBy: string): User[] {
  //   if (filterBy === 'role') {
  //     this.getAllUsers();
  //   } else {
  //     this.getAllUsers();
  //   }
  //   return this.accounts;
  // }

  // toggleDisplayActions(): void {
  //   this.displayActions = !this.displayActions;
  // }

  editUser(user: User): void {
    this.editUserEvent.emit(user);
  }

  deleteUser(user: User): void {
    this.deleteUserEvent.emit(user);
  }
}
