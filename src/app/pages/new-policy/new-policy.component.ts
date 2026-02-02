import { Component, inject, OnInit } from '@angular/core';
import { UntypedFormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { formatDate } from '@angular/common';
import { debounceTime } from 'rxjs';
import moment from 'moment';
import { ApplicationService } from '@core/services/insurance/application.service';
import {
  ApplicationsByCriteria,
  ApplicationResourceParams,
  PaginatedApplication,
  ApplicantsByCriteriaDto,
} from '@core/models/insurance/application.model';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { Router } from '@angular/router';
import { APPLICANT_TYPE } from '@core/utils/enums/insurance-enums';
import {
  getApplicantTypeList,
  getApplicationStatusList,
  getLoanTypeList,
  getSourceTypeList,
} from '@core/utils/enums/system-enums';
import { AppState } from '@store';
import { EnumService } from '@core/services/insurance/enum.service';
import { DynamicTableComponent } from '@core/components/dynamic-table/dynamic-table.component';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CardComponent } from '@core/components/card/card.component';

@Component({
  selector: 'app-new-policy',
  templateUrl: './new-policy.component.html',
  styleUrls: ['./new-policy.component.scss'],
  standalone: true,
  imports: [
    CardComponent,
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
export class NewPolicyComponent implements OnInit {
  public pageNumber = 0;
  public seeMoreMsg = '';
  public seeMoreNavLink = '';
  public searchBy = new UntypedFormControl('');
  public filterBy = new UntypedFormControl('');
  public displayActions: boolean = false;
  public today = moment().format('dddd MMMM D, YYYY');
  public userName: string = '';

  public dataSource: any[] = [];
  columns: string[] = [
    'multi',
    'applicants',
    'loanIdentifier',
    'loanType',
    'sourceType',
    'createdOn',
    'applicationStatus',
  ];
  columnsSearch: string[] = [
    'applicants',
    'loanIdentifier',
    'loanType',
    'sourceType',
    'createdOn',
    'applicationStatus',
  ];
  columnTitles: string[] = ['multi', 'Name', 'Loan Number', 'Loan Type', 'Source Type', 'Created On', 'Status'];

  public filterByOptionList = [
    { id: 'Applicants', description: 'Name' },
    { id: 'LoanIdentifier', description: 'Loan Number' },
    { id: 'LoanType', description: 'Loan Type' },
    { id: 'SourceType', description: 'Source Type' },
    { id: 'ApplicationStatus', description: 'Status' },
  ];

  private store = inject(Store<AppState>);
  private enumService = inject(EnumService);
  private applicationService = inject(ApplicationService);
  private router = inject(Router);

  constructor() { }

  ngOnInit(): void {
    this.searchBy.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      this.pageNumber = 0;
      this.seeMoreApplications();
    });
    // Get user info from sessionStorage or token
    const userInfo = sessionStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        this.userName = parsed.firstName || parsed.given_name || 'User';
      } catch {
        this.userName = 'User';
      }
    }

    this.seeMoreApplications();
  }

  public seeMoreApplications = () => {
    if (
      (this.searchBy.value && this.filterBy.value && this.searchBy.value.length > 2) ||
      !(this.searchBy.value && this.filterBy.value)
    ) {
      this.pageNumber = this.pageNumber + 1;

      let searchOptions: ApplicationResourceParams = {
        fields: this.columnsSearch.toString(),
        orderBy: 'CreatedOn desc',
        pageNumber: this.pageNumber,
      };

      if (this.filterBy.value && this.searchBy.value) {
        let enteredSearchByValue = this.searchBy.value.trim().toLowerCase();

        switch (this.filterBy.value.toLowerCase()) {
          case 'applicants': {
            searchOptions.applicants = enteredSearchByValue;
            break;
          }
          case 'loanidentifier': {
            searchOptions.loanIdentifier = enteredSearchByValue;
            break;
          }
          case 'loantype': {
            searchOptions.loanType =
              getLoanTypeList().find((el) => el.description.toLowerCase().startsWith(enteredSearchByValue))
                ?.abbreviation ?? enteredSearchByValue;
            break;
          }
          case 'sourcetype': {
            searchOptions.sourceType =
              getSourceTypeList().find((el) => el.description.toLowerCase().startsWith(enteredSearchByValue))
                ?.abbreviation ?? enteredSearchByValue;
            break;
          }
          case 'applicationstatus': {
            searchOptions.applicationStatus =
              getApplicationStatusList().find((el) => el.description.toLowerCase().startsWith(enteredSearchByValue))
                ?.abbreviation ?? enteredSearchByValue;
            break;
          }
        }
      }

      this.store.dispatch(setLoadingSpinner({ status: true }));

      this.applicationService
        .getApplicationsByCriteria(searchOptions)
        .subscribe((application: ApplicationsByCriteria | any) => {
          let tempData: any[] = [];
          application.value.forEach((element: PaginatedApplication) => {
            tempData.push({
              multi: element.applicants!.length > 1,
              applicants: this.getNamesFormatted(element.applicants!),
              loanIdentifier: element.loanIdentifier,
              loanType: getLoanTypeList().find((el) => el.id == element.loanType)?.description || 'No Loan Type',
              sourceType:
                getSourceTypeList().find((el) => el.id == element.sourceType)?.description || 'No Source Type',
              createdOn: element.createdOn ? formatDate(element.createdOn, 'dd/MM/yyyy', 'en-US') : '',
              applicationStatus: `<div class="body-medium-bold">${getApplicationStatusList().find((el) => el.id == element.applicationStatus)?.description || 'No Status'
                }</div>`,
            });
          });

          this.seeMoreNavLink = application.links.find((n: any) => n.rel == 'nextPage')?.href ?? '';
          this.seeMoreNavLink ? (this.seeMoreMsg = 'See More Applications') : (this.seeMoreMsg = '');

          this.store.dispatch(setLoadingSpinner({ status: false }));
          this.dataSource = tempData;
        });
    }
  };

  private getNamesFormatted(applicants: ApplicantsByCriteriaDto[]) {
    let result = '';
    applicants.forEach((applicant) => {
      if (applicant.applicantType == this.enumService.getId(getApplicantTypeList(), APPLICANT_TYPE.PRIMARY)) {
        result += `<div class="body-medium-bold">${applicant.name}</div>`;
      } else {
        result += `<div class="body-medium-regular">${applicant.name}</div>`;
      }
    });

    return result;
  }

  public onFilterByChanged() {
    this.pageNumber = 0;
    if (this.searchBy.value) {
      this.searchBy.setValue('');
    } else {
      if (this.searchBy.value) this.seeMoreApplications();
    }
  }

  public onSelectApplication = (application: PaginatedApplication) => {
    this.router.navigate(['new-policy/insurance-application/' + application.loanIdentifier]);
  };
}
