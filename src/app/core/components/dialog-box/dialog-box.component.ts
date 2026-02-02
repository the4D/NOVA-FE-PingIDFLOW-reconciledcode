import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dialog-box',
  templateUrl: './dialog-box.component.html',
  styleUrls: ['./dialog-box.component.scss'],
  standalone: true,
  imports: [TranslateModule],
})
export class DialogBoxComponent {
  private router = inject(Router);
  public data = inject(MAT_DIALOG_DATA);

  onClose = () => {
    this.router.navigate([this.data.path]);
  };
}
