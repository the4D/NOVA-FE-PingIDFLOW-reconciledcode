import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-certificate-number-popup',
    templateUrl: './certificate-number-popup.component.html',
    standalone: true,
    styleUrls: ['./certificate-number-popup.component.scss'],
    imports: [
        MatIconModule,
        MatDialogModule
    ],
})
export class CertificateNumberPopupComponent {
    constructor(public dialogRef: MatDialogRef<CertificateNumberPopupComponent>) { }
}
