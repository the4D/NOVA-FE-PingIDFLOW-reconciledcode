import { Component, AfterViewInit, SimpleChanges, input, output } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Observable, filter, of } from 'rxjs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormGroup } from '@angular/forms';
import { OnChanges } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

import { JsonFormData, option } from '@core/models/dynamic-form.interface';

interface filter {
  value: string;
  name: string;
  category: option;
}

@Component({
  selector: 'app-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
  standalone: true,
  imports: [MatTableModule, NgClass, MatIconModule, RouterLink, RouterLinkActive],
})
export class DynamicTableComponent implements AfterViewInit, OnChanges {
  dataSourceType = input.required<string>();
  emptyMsg = input<string>('');
  buttonMsg = input<string>('');
  btnNavLink = input<string>('');
  seeMoreMsg = input<string>('');
  seeMoreNavLink = input<string>('');
  title = input<string>('');
  columnTitles = input<string[]>([]);
  data = input<any[] | undefined>();
  columns = input<string[]>([]);
  showNoDataSectionEW = input<boolean>(false);

  clickAction = output<any>();
  clickMorePages = output();
  clickToEdit = output<any>();
  clickToDelete = output<any>();

  public separatorKeysCodes: number[] = [ENTER, COMMA];
  public filters: filter[] = [];
  public filters$: Observable<filter[]> = of(this.filters);
  public dataSource: MatTableDataSource<any> = new MatTableDataSource();
  public selectedCategory: option | undefined = undefined;
  public selectedFilterValue: string = '';
  public formInputData!: JsonFormData;
  public formGroup!: FormGroup;

  ngAfterViewInit() {
    this.dataSource = new MatTableDataSource(this.data());

    // if (this.showNoDataSectionEW()) {
    //   this.emptyMsg = 'No Data Found';
    // }

    this.dataSource = new MatTableDataSource(this.data());
  }

  //on change
  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.dataSource = new MatTableDataSource(this.data());
      // this.dataSource.paginator = this.paginator();
      // this.dataSource.sort = this.sort();
    }
  }

  addFilter(): void {
    if (!this.selectedFilterValue || !this.selectedCategory) return;

    this.filters.push({
      value: this.selectedFilterValue,
      name: this.selectedFilterValue.toString(),
      category: this.selectedCategory,
    });
    let index =
      this.formInputData.controls[0].dropdownOptions?.findIndex(
        (option) => this.selectedCategory?.name === option.name
      ) || null;

    index !== null ? this.formInputData.controls[0].dropdownOptions?.splice(index, 1) : null;
    this.formGroup.reset();
    this.selectedCategory = undefined;
    this.selectedFilterValue = '';
  }

  remove(filter: filter): void {
    const index = this.filters.indexOf(filter);

    if (index >= 0) {
      this.filters.splice(index, 1);
    }
  }

  sortChange(event: any) {}

  editFilter(filter: filter): void {
    this.selectedFilterValue = filter.value;
    this.selectedCategory = filter.category;
    this.formGroup.controls['category'].setValue(filter.category.name);
    filter.value === 'date'
      ? this.formGroup.controls['date'].setValue(filter.value)
      : this.formGroup.controls['searchKey'].setValue(filter.value);

    const index = this.filters.indexOf(filter);

    if (index >= 0) {
      this.filters.splice(index, 1);
    }
    this.formInputData.controls[0].dropdownOptions?.forEach((option) => {
      if (option.name === filter.category.name) {
        option.disabled = false;
      }
    });
  }

  camelCaseToTitleCase(str: string) {
    const res = str.replace(/([A-Z])/g, ' $1');
    const finalResult = res.charAt(0).toUpperCase() + res.slice(1);
    return finalResult;
  }

  titleToCamel(str: string) {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  private _filter() {
    this.filters.forEach((filter) => {
      this.dataSource.data = this.dataSource.data.filter((item: any) => {
        let filterName = String(filter.category.name);
        let filterValue = String(filter.value).trim().toLowerCase();
        let itemValue = String(item[filterName]).trim().toLowerCase();
        return itemValue.includes(filterValue) || itemValue === filterValue;
      });
    });
  }

  private _listenForFormChanges() {
    this.formGroup.controls['searchKey'].valueChanges.subscribe((data) => {
      this.selectedFilterValue = String(data);
    });
    this.formGroup.controls['category'].valueChanges.subscribe((data) => {
      let key = this.formInputData.controls[0].dropdownOptions?.find((option) => option.name === data);
      this.selectedCategory = key;
      this.selectedFilterValue = '';
      this.formGroup.controls['searchKey'].setValue('');
      document.getElementById('dynamicTextInput')?.focus();
    });
    this.formGroup.controls['date'].valueChanges.subscribe((data) => {
      if (this.selectedCategory?.name === 'date') {
        this.selectedFilterValue = new Date(data).toISOString();
      }
    });
    this.filters$.subscribe((data) => {
      this.formInputData.controls[0].dropdownOptions?.map((item) => {
        data.forEach((filter) => {
          if (filter.category.name === item.name) {
            item.disabled = true;
          }
        });
      });
    });
  }

  clickEvent = (row: any, index: any) => {
    row.index = index;
    this.clickAction.emit(row);
  };

  clickMorePagesEvent = () => {
    this.clickMorePages.emit();
  };

  clickToEditEvent = (row: any) => {
    this.clickToEdit.emit(row);
  };

  clickToDeleteEvent = (row: any) => {
    this.clickToDelete.emit(row);
  };
}
