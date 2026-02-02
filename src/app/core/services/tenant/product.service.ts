import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { option } from '@core/models/dynamic-form.interface';
import { ProductConfiguration } from '@core/models/tenant/product.model';
import { CarrierLoanType, carrierLoanTypesInitialState } from '@core/models/insurance/carrier-loan-type.model';

const BASE_URL: string = 'TENANT_API/';
const PRODUCT_CONFIGURATION_URL: string = BASE_URL + 'ProductConfiguration/';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private httpClient = inject(HttpClient);

  private _carrierLoanTypes: BehaviorSubject<CarrierLoanType[]> = new BehaviorSubject(carrierLoanTypesInitialState());

  public get carrierLoanTypes$() {
    return this._carrierLoanTypes.asObservable();
  }

  public set carrierLoanTypes(carrierLoanTypeList: CarrierLoanType[]) {
    this._carrierLoanTypes.next(carrierLoanTypeList);
  }

  public get carrierLoanTypesValue() {
    return this._carrierLoanTypes.value;
  }

  destroySession(): void {
    this._carrierLoanTypes = new BehaviorSubject(carrierLoanTypesInitialState());
  }

  public getProductConfigurations(configType: string): Observable<ProductConfiguration> {
    return this.httpClient.get<ProductConfiguration>(PRODUCT_CONFIGURATION_URL + configType);
  }

  public setProductConfigurations(configType: string, dropdownList: option[]) {
    this.getProductConfigurations(configType).subscribe((config: ProductConfiguration) => {
      config.configValue.forEach((element) => {
        dropdownList.push({ name: element.name, value: element.value, disabled: false });
      });
    });
  }

  public setProductConfigurationCarrierLoanTypes(configType: string) {
    let dropdownList: CarrierLoanType[] = [];
    this.getProductConfigurations(configType).subscribe((config: ProductConfiguration) => {
      config.configValue.forEach((element: any) => {
        dropdownList.push({
          name: element.name,
          value: element.value.toString(),
          insuranceTypes: element.insuranceTypes,
          contractType: element.contractType,
        });
      });
      this.carrierLoanTypes = dropdownList;
    });
  }
}
