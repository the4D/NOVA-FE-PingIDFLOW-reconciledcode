import { formatDate } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { debounceTime } from 'rxjs';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { CarrierRequestService } from '@core/services/insurance/carrier-request.service';
import { CarrierRequestsByCriteria, CarrierRequestResourceParams } from '@core/models/insurance/carrier-request.model';
import { getCarrierRequestStatusList, getCarrierRequestTypeList } from '@core/utils/enums/system-enums';
import { DynamicTableComponent } from '@core/components/dynamic-table/dynamic-table.component';
import { CardComponent } from '@core/components/card/card.component';

@Component({
  selector: 'app-existing-policy',
  templateUrl: './existing-policy.component.html',
  styleUrls: ['./existing-policy.component.scss'],
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
export class ExistingPolicyComponent implements OnInit {
  private store = inject(Store);
  private carrierRequestService = inject(CarrierRequestService);
  private router = inject(Router);

  public pageNumber = 0;
  public seeMoreMsg = '';
  public seeMoreNavLink = '';
  public searchBy = new FormControl('');
  public filterBy = new FormControl('');

  public dataSource: any[] = [];
  public columns: string[] = [
    'carrierRequestType',
    'applicantName',
    'certificateNumber',
    'createdOn',
    'loanType',
    'carrierRequestStatus',
    'cancellationDate',
    'id',
  ];
  public columnTitles: string[] = ['Request Type', 'Name', 'Certificate ID', 'Created On', 'Status'];

  public filterByOptionList = [
    { id: 'CarrierRequestType', description: 'Request Type' },
    { id: 'Name', description: 'Name' },
    { id: 'CertificateNumber', description: 'Certificate ID' },
    { id: 'LoanType', description: 'Loan Type' },
    { id: 'CarrierRequestStatus', description: 'Request Status' },
  ];

  ngOnInit(): void {
    this.searchBy.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      this.pageNumber = 0;
      this.seeMoreCarrierRequests();
    });

    this.seeMoreCarrierRequests();
  }

  public onActionClicked(action: any) {
    let id = action.id;
    let type = action.typeCode;

    switch (type) {
      case 4:
        this.router.navigate(['existing-policy/update-info', id]);
        break;
      case 2:
        this.router.navigate(['existing-policy/submit-claim', id]);
        break;
      case 3:
        this.router.navigate(['existing-policy/cancel-policy', id]);
        break;
    }
  }

  public seeMoreCarrierRequests = () => {
    if (
      (this.searchBy.value && this.filterBy.value && this.searchBy.value.length > 2) ||
      !(this.searchBy.value && this.filterBy.value)
    ) {
      this.pageNumber = this.pageNumber + 1;

      let searchOptions: CarrierRequestResourceParams = {
        fields: this.columns.toString(),
        orderBy: 'CreatedOn desc',
        pageNumber: this.pageNumber,
      };

      if (this.filterBy.value && this.searchBy.value) {
        let enteredSearchByValue = this.searchBy.value.trim().toLowerCase();
        switch (this.filterBy.value.toLowerCase()) {
          case 'carrierRequesttype': {
            searchOptions.carrierRequestType =
              getCarrierRequestTypeList().find((el) => el.description.toLowerCase().startsWith(enteredSearchByValue))
                ?.abbreviation ?? enteredSearchByValue;
            break;
          }
          case 'loanType': {
            searchOptions.applicantName = enteredSearchByValue;
            break;
          }
          case 'name': {
            searchOptions.applicantName = enteredSearchByValue;
            break;
          }
          case 'certificatenumber': {
            searchOptions.certificateNumber = enteredSearchByValue;
            break;
          }
          case 'status': {
            searchOptions.carrierRequestStatus =
              getCarrierRequestStatusList().find((el) => el.description.toLowerCase().startsWith(enteredSearchByValue))
                ?.abbreviation ?? enteredSearchByValue;
            break;
          }
        }
      }

      this.store.dispatch(setLoadingSpinner({ status: true }));

      this.carrierRequestService
        .getCarrierRequestsByCriteria(searchOptions)
        .subscribe((carrierRequest: CarrierRequestsByCriteria) => {
          let tempData: any[] = [];
          carrierRequest.value.forEach((element) => {
            tempData.push({
              id: element.id,
              typeCode: element?.carrierRequestType,
              carrierRequestType: getCarrierRequestTypeList().find((el) => el.id == element?.carrierRequestType)
                ?.description,
              name: element.applicantName,
              certificateNumber: element?.certificateNumber || 'No ID',
              createdOn: element.createdOn ? formatDate(element?.createdOn, 'MMM dd, yyyy', 'en-US') : '',
              carrierRequestStatus:
                getCarrierRequestStatusList().find((el) => el.id == element?.carrierRequestStatus)?.description ||
                'No Status',
            });
          });

          this.seeMoreNavLink = carrierRequest.links.find((n) => n.rel == 'nextPage')?.href ?? '';
          this.seeMoreNavLink ? (this.seeMoreMsg = 'See More Carrier Requests') : (this.seeMoreMsg = '');
          this.dataSource = tempData;
        });
      this.store.dispatch(setLoadingSpinner({ status: false }));
    }
  };

  public onFilterByChanged() {
    this.pageNumber = 0;
    if (this.searchBy.value) {
      this.searchBy.setValue('');
    } else {
      if (this.searchBy.value) this.seeMoreCarrierRequests();
    }
  }
}
