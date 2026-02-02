import { Component, inject, OnInit } from '@angular/core';
import { Validators, FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { take } from 'rxjs';

import { JsonFormData, option } from '@core/models/dynamic-form.interface';
import { UserService } from '@core/services/tenant/user.service';
import { User } from '@core/models/tenant/user.model';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { BranchService } from '@core/services/tenant/branch.service';
import { Branch } from '@core/models/tenant/branch.model';
import { AppState } from '@store';
import { EnumService } from '@core/services/insurance/enum.service';
import { getUserRoleList } from '@core/utils/enums/system-enums';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatDividerModule,
    MatInputModule,
  ],
})
export class ProfileComponent implements OnInit {
  private store = inject(Store<AppState>);
  private userService = inject(UserService);
  private branchService = inject(BranchService);
  private fb = inject(FormBuilder);
  private enumService = inject(EnumService);

  public editFormInputData: JsonFormData[] = [];
  public editFormGroup: FormGroup = this.fb.group({
    isActive: [null, [Validators.required]],
    firstName: [null, [Validators.required]],
    lastName: [null, [Validators.required]],
    emailAddress: [null, [Validators.required]],
    employeeId: [null, [Validators.required]],
    branchId: [null, [Validators.required]],
    role: [null, [Validators.required]],
    createdBy: [null, [Validators.required]],
  });
  public branchId: string = '';
  public branchOptions: option[] = [];
  public roleOptions = getUserRoleList();
  public dropdownOptions = [
    {
      name: 'Active',
      value: true,
    },
    {
      name: 'Inactive',
      value: false,
    },
  ];

  ngOnInit(): void {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    setTimeout(() => {
      this.branchService.branches$.pipe(take(1)).subscribe((branches: Branch[]) => {
        let options: option[] = [];
        branches.forEach((branch: Branch) => {
          let option: option = {
            name: branch.name,
            value: branch.id,
          };
          options.push(option);
        });
        this.branchOptions = options;
      });

      this.onGetUser();
    }, 1200);
  }

  onGetUser() {
    this.userService.user$.pipe(take(1)).subscribe((user: User) => {
      this.userService.user = user;
      this.editFormGroup.patchValue(user);
      this.editFormGroup.disable();
      this.editFormGroup.get('emailAddress')?.setValue(user.email);
      this.editFormGroup.get('role')?.setValue(this.enumService.getId(getUserRoleList(), user.role));
    });
    this.store.dispatch(setLoadingSpinner({ status: false }));
  }
}
