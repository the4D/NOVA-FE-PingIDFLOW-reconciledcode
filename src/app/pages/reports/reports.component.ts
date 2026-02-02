import { MatCardModule } from '@angular/material/card';
import { Component, inject } from '@angular/core';
import { User, User2 } from 'src/app/core/models/tenant/user.model';
import { UserService } from 'src/app/core/services/tenant/user.service';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store';
import { setLoadingSpinner } from 'src/app/store/core/component/loading-spinner/loading-spinner.actions';
import { ConfigService } from '@core/config/config.service';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CardComponent } from '@core/components/card/card.component';
class ReportTab {
  reportIndex!: number;
  reportTitle!: string;
  reportUrl!: string;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatDialogModule,
    MatButtonModule,
    CardComponent,
  ],
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent {
  private store = inject(Store<AppState>);
  private userService = inject(UserService);
  private config = inject(ConfigService);

  private user!: User2;
  private reportServer!: string;
  private reportUrl!: string;

  public tabList: Array<ReportTab> = [
    {
      reportIndex: 0,
      reportTitle: 'Eligible Live Participation',
      reportUrl: 'PRS%20-%20Eligible%20Lives%20Participation&Username=',
    },
    {
      reportIndex: 1,
      reportTitle: 'Eligible Loan Participation',
      reportUrl: 'PRS%20-%20Eligible%20Loan%20Participation&Username=',
    },
    {
      reportIndex: 2,
      reportTitle: 'Eligible Loan Penetration',
      reportUrl: 'PRS%20-%20Eligible%20Loan%20Penetration&Username=',
    },
  ];

  constructor() {
    this.store.dispatch(setLoadingSpinner({ status: true }));
    this.reportServer = this.config.settings.apis.reportingApi.url + this.config.settings.apis.reportingApi.scope;
    this.userService.user$.subscribe({
      next: (user: User) => {
        this.user = {
          id: user.id ? user.id : '',
          tenantId: user.tenantId ? user.tenantId : '',
          branchId: user.branchId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          employeeId: user.employeeId,
          role: user.role,
        };
      },
      error: (err) => {
        console.error('ERROR: ', err);
        this.store.dispatch(setLoadingSpinner({ status: false }));
      },
      complete: () => {
        this.store.dispatch(setLoadingSpinner({ status: false }));
      },
    });
  }

  public selectReport(reportIndex: number) {
    this.reportUrl = this.tabList.filter((p) => p.reportIndex === reportIndex)[0].reportUrl + this.user.email;

    const win = window.open(this.reportServer + this.reportUrl, '_blank');
    if (win !== null) {
      win.onload = () => {
        console.log('--- new window loaded ---');
      };
    }
  }
}
