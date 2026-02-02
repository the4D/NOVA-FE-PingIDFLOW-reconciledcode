import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Component, inject, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';
import { ErrorHandlerService } from '@core/services/system/errorHandler.service';
import { User } from '@core/models/tenant/user.model';
import { UserFormDialogComponent } from './user-form-dialog/user-form-dialog.component';
import { MessageComponent } from '@core/components/message/message.component';
import { AccountTableComponent } from '@core/components/account-table/account-table.component';
import { UserService } from '@core/services/tenant/user.service';
import { AccountTableComponent as AccountTableComponent_1 } from '@core/components/account-table/account-table.component';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
  standalone: true,
  imports: [AccountTableComponent_1],
})
export class SettingComponent {
  @ViewChild(AccountTableComponent) accountTable!: AccountTableComponent;
  public warningShown: boolean = false;

  public userService = inject(UserService);
  public dialog = inject(MatDialog);
  public httpUtilsService = inject(ErrorHandlerService);

  getAllUsers(): void {
    this.accountTable.getAllUsers();
  }

  deleteUser(user: User): void {
    if (user.id != undefined) {
      this.userService
        .deleteUser(user.id)
        .pipe(take(1))
        .subscribe(() => {
          this.getAllUsers();
        });
    }
  }
  formDialog(data?: User): MatDialogRef<UserFormDialogComponent> {
    return this.dialog.open(UserFormDialogComponent, {
      data,
    });
  }
  messageDialog(type: string, message: string): MatDialogRef<MessageComponent> {
    return this.dialog.open(MessageComponent, {
      width: '500px',
      maxHeight: '100%',
      panelClass: 'custom-dialog-container',
      data: {
        type,
        message: message,
      },
    });
  }

  showForm(user?: User): void {
    if (user || this.warningShown) {
      this.formDialog(user)
        .afterClosed()
        .subscribe((result) => {
          this.getAllUsers();
          user ? this.userEdited(result) : this.userCreated(result);
        });
    } else {
      this.messageDialog(
        'attention',
        `Product Knowledge training must be completed before an individual can engage in the sales of
            the creditor insurance product. Please ensure the user has completed or will be completing
            prior to sales, the required training and assessment via your learning management system.`
      )
        .afterClosed()
        .subscribe((result: any) => {
          this.warningShown = true;
          this.showForm(user);
        });
    }
  }

  userCreated(ev?: User | HttpErrorResponse): void {
    if (ev instanceof HttpErrorResponse) {
      this.messageDialog('warning', `Error creating user -  ${this.httpUtilsService.parseError(ev)}`);
    } else if (ev instanceof Object) {
      this.messageDialog('success', `You have successfully created a new user - ${ev.firstName} ${ev.lastName}`);
    }
    this.getAllUsers();
  }

  userEdited(ev?: User | HttpErrorResponse): void {
    if (ev instanceof HttpErrorResponse) {
      this.messageDialog('warning', `Error editing existing user - ${this.httpUtilsService.parseError(ev)}`);
    } else if (ev instanceof Object) {
      this.messageDialog('success', `You have successfully edited an existing user - ${ev.firstName} ${ev.lastName}`);
    }
    this.getAllUsers();
  }

  toggleDeleteUserMsg(user: User): void {
    if (!user) return;
    var x = this.messageDialog('delete', `Are you sure you want to delete ${user.firstName} ${user.lastName}?`)
      .afterClosed()
      .subscribe((result: any) => {
        if (result) {
          this.deleteUser(user);
        }
      });
  }
}
