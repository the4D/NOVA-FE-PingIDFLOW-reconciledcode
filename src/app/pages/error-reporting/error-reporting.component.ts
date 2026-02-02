import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import moment from 'moment';
import { ApplicationService } from '@core/services/insurance/application.service';
import {
  ApplicationsByCriteria,
  ApplicationResourceParams,
  PaginatedApplication,
} from '@core/models/insurance/application.model';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { Router } from '@angular/router';
import { getApplicationStatusList, getInsuranceTypeList } from '@core/utils/enums/system-enums';
import { AppState } from '@store';
import { BranchService } from '@core/services/tenant/branch.service';
import * as XLSX from 'xlsx';
import * as FileSave from 'file-saver';
import { DynamicTableComponent } from '@core/components/dynamic-table/dynamic-table.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateDirective } from '@core/directives/date-directive/date.directive';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-error-reporting',
  templateUrl: './error-reporting.component.html',
  styleUrls: ['./error-reporting.component.scss'],
  standalone: true,
  imports: [
    DynamicTableComponent,
    MatDatepickerModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatMomentDateModule,
    DateDirective,
    MatInputModule,
  ],
})
export class ErrorReportingComponent implements OnInit {
  private store = inject(Store<AppState>);
  private applicationService = inject(ApplicationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private branchService = inject(BranchService);

  public pageNumber = 0;
  public seeMoreMsg = '';
  public seeMoreNavLink = '';

  public displayActions: boolean = false;
  public today = moment().format('dddd MMMM D, YYYY');
  public userName: string = '';
  public minFromDate!: Date;
  public totalRecord: number = 0;

  public searchForm: FormGroup = this.fb.group({
    fromDate: [null],
    toDate: [null],
  });

  public dataSource: PaginatedApplication[] = [];
  public columns: string[] = [
    'loanIdentifier',
    'id',
    'uWResponseCode',
    'creditUnion',
    'branchID',
    'applicationStatusEW',
    'insuranceTypeStr',
    'createdBy',
  ];
  public columnsSearch: string[] = [];
  public columnTitles: string[] = [
    'Loan Number',
    'Application ID',
    'Error message',
    'Credit Union',
    'Branch',
    'Status',
    'Insurance Type',
    'Member Name',
  ];

  ngOnInit() {
    this.searchForm.get('fromDate')?.valueChanges.subscribe({
      next: (data) => {
        this.minFromDate = moment(data).toDate();
        this.pageNumber = 0;
        this.seeMoreApplications();
      },
    });
    this.seeMoreApplications();
  }

  public downloadExcelReport = () => {
    const CSV_EXTENSION = '.csv';
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSource);
    const csvOutput: string = XLSX.utils.sheet_to_csv(worksheet);
    FileSave.saveAs(new Blob([csvOutput]), `EW_Error_export_${new Date().getTime()}${CSV_EXTENSION}`);
  };

  public seeMoreApplications = () => {
    if (this.searchForm.controls['fromDate'].value && this.searchForm.controls['toDate'].value) {
      this.pageNumber = this.pageNumber + 1;

      let searchOptions: ApplicationResourceParams = {
        fields: this.columnsSearch.toString(),
        orderBy: 'CreatedOn asc',
        pageNumber: this.pageNumber,
      };

      searchOptions.fromDate = this.searchForm.controls['fromDate'].value;
      searchOptions.toDate = this.searchForm.controls['toDate'].value;
      this.store.dispatch(setLoadingSpinner({ status: true }));

      this.applicationService
        .getApplicationsByCriteria(searchOptions)
        .subscribe((application: ApplicationsByCriteria | any) => {
          let tempData: PaginatedApplication[] = [];

          application.value.forEach(async (element: PaginatedApplication) => {
            let branchName: string = '';
            this.branchService.branches$.subscribe((branches) => {
              branchName = branches.find((b) => b.id == element.branchID)?.name || '';
            });

            tempData.push({
              loanIdentifier: element.loanIdentifier,
              id: element.id,
              uWResponseCode: element.uWResponseCode,
              creditUnion: 'Coast Capital',
              branchID: branchName,
              createdBy: element.createdBy,
              applicationStatusEW: `<div class="body-medium-bold">${
                getApplicationStatusList().find((el) => el.id == element.applicationStatus)?.description || 'No Status'
              }</div>`,
              insuranceTypeStr:
                getInsuranceTypeList().find((el) => el.id == element.insuranceType)?.description || 'No Insurance Type',
            });
          });

          this.totalRecord = application.recordCount;
          this.seeMoreNavLink = application.links.find((n: any) => n.rel == 'nextPage')?.href ?? '';
          this.seeMoreNavLink ? (this.seeMoreMsg = 'See More Applications') : (this.seeMoreMsg = '');

          this.store.dispatch(setLoadingSpinner({ status: false }));
          this.dataSource = tempData;

          // delete tempData['applicationStatusEW'];
        });
    }
  };

  public ontoDateChanged() {
    this.pageNumber = 0;
    if (this.searchForm.controls['fromDate'].value) {
      this.searchForm.controls['fromDate'].setValue('');
    } else {
      if (this.searchForm.controls['fromDate'].value) this.seeMoreApplications();
    }
  }

  public onSelectApplication = (application: PaginatedApplication) => {
    this.router.navigate(['error-reporting/application/' + application.loanIdentifier]);
  };
}
