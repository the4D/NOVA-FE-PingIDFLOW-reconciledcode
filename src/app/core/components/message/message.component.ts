import { Component, inject, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
export interface DialogData {
  type: 'warning' | 'success' | 'attention' | 'delete';
  message?: any;
  description?: string;
  title?: string;
  button?: string;
  result?: any;
}

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatDialogModule],
})
export class MessageComponent {
  public dialogRef = inject(MatDialogRef<MessageComponent>);

  accepted = true;

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    data.title = data.title === undefined || data.title === '' ? 'Something Went Wrong!' : data.title;
  }

  acceptDelete(accepted: boolean) {
    this.dialogRef.close(accepted);
  }
}
