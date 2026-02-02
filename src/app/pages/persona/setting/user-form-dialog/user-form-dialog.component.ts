import { Component, inject, Inject, OnInit } from '@angular/core';
import { Validators, FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';
import { option } from '@core/models/dynamic-form.interface';
import { Branch } from '@core/models/tenant/branch.model';
import { User } from '@core/models/tenant/user.model';
import { BranchService } from '@core/services/tenant/branch.service';
import { UserService } from '@core/services/tenant/user.service';
import { getUserRoleList } from '@core/utils/enums/system-enums';

@Component({
  selector: 'app-user-form-dialog',
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
  ],
})
export class UserFormDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private userService = inject(UserService);
  private branchService = inject(BranchService);
  private fb = inject(FormBuilder);

  public editFormGroup: FormGroup = this.fb.group({
    firstName: [null, [Validators.required]],
    lastName: [null, [Validators.required]],
    email: [null, [Validators.required]],
    employeeId: [null, [Validators.required]],
    branchId: [null, [Validators.required]],
    role: [null, [Validators.required]],
  });

  public branchOptions: option[] = [];
  public roleOptions: option[] = [
    { name: 'Administrator', value: '1' },
    { name: 'User', value: '3' },
  ];
//removed manager role
  constructor(@Inject(MAT_DIALOG_DATA) public userData: User) {}

  ngOnInit() {
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

    if (this.userData) {
      const userData = { ...this.userData };
      userData.role = userData.role;
      userData?.isActive === 'Enabled' ? (userData.isActive = true) : (userData.isActive = false);

      this.editFormGroup.patchValue(userData);
      this.editFormGroup.markAsPristine();

      this.editFormGroup.controls['role'].setValue(this.roleOptions.find((role) => role.name === userData.role)?.value);
    }
  }

  onSubmitUser() {
    if (!this.editFormGroup.valid) {
      return;
    }

    let formValues = this.editFormGroup.value;

    let user: User = {
      id: this.userData?.id ?? undefined,
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      employeeId: formValues.employeeId,
      role: getUserRoleList().find((el) => el.id.toString() === formValues.role)?.description || 'No Role',
      branchId: formValues.branchId,
      isActive: true,
    };

    if (this.userData) {
      this.userService.putUser(user).subscribe((res) => {
        this.dialogRef.close(res);
      });
      return;
    }

    this.userService.postUser(user).subscribe((res) => {
      this.dialogRef.close(res);
    });
  }
}
