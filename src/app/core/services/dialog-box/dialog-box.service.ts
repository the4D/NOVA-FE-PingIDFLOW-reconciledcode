import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DialogBoxComponent } from '@core/components/dialog-box/dialog-box.component';

export interface IDialogBox {
  messageType: string;
  messageText: string;
}

const initialState = (): IDialogBox => {
  return {
    messageType: 'Warning',
    messageText: '',
  };
};

@Injectable({
  providedIn: 'root',
})
export class DialogBoxService {
  private _dialogBox: BehaviorSubject<IDialogBox> = new BehaviorSubject(initialState());

  get dialogBox$() {
    return this._dialogBox.asObservable();
  }

  set dialogBox(dialogBoxData: IDialogBox) {
    this._dialogBox.next(dialogBoxData);
  }

  constructor(private dialog: MatDialog) {}

  public openDialog(messageText: string, messageType: string, messagePath: string) {
    this.dialog.open(DialogBoxComponent, {
      height: '330px',
      width: '480px',
      data: {
        type: messageType,
        message: messageText,
        path: messagePath,
      },
    });
  }
}
