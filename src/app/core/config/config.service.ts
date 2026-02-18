import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Config } from './config.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config!: Config;
  private http: HttpClient;

  constructor(private readonly httpHandler: HttpBackend) {
    this.http = new HttpClient(httpHandler);
  }

  init(endpoint: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.http
        .get<Config>(endpoint)
        .pipe(map((result) => result))
        .subscribe(
          (value: Config) => {
            this.config = value;
            // Some shitty dev hacks //
            if (!environment.production) {
              // Local
              this.config.apis.insuranceApi = {
                // url: 'https://thermosetting-golden-illustratively.ngrok-free.dev/api/v1/',
                url: "https://greatly-semiround-guillermo.ngrok-free.dev/api/v1/",
                scope: 'http://valeyoNp.onmicrosoft.com/5e707b01-d6bd-4818-8c84-132ddc6d8871/insurance_api_access',
              };
              this.config.apis.tenantApi = {
                url: 'https://thermosetting-golden-illustratively.ngrok-free.dev/api/',
                scope: 'http://valeyoNp.onmicrosoft.com/5e707b01-d6bd-4818-8c84-132ddc6d8871/tenant_api_access',
              };
              this.config.apis.reportingApi = {
                url: 'https://PRSReport-WebAuth%40cri.local:K*&wV86jnnt$6ciNBnq2@np-insurancereporting.selient.ca/ReportServer/Pages/ReportViewer.aspx?/',
                scope: 'PRS/QA/',
              };

              // DEV
              // this.config.apis.insuranceApi = {
              //   url: 'https://dev-securianinsuapi-alpha.digitalcreditor.securiancanada.ca/api/v1/',
              //   scope: 'https://valeyoNp.onmicrosoft.com/5e707b01-d6bd-4818-8c84-132ddc6d8871/insurance_api_access',
              // };
              // this.config.apis.tenantApi = {
              //   url: 'https://dev-cplpltenantapi-alpha.digitalcreditor.securiancanada.ca/api/',
              //   scope: 'https://valeyoNp.onmicrosoft.com/5e707b01-d6bd-4818-8c84-132ddc6d8871/tenant_api_access',
              // };
              // this.config.apis.formMakerServiceApi = {
              //   url: 'https://dev-formakerapi-alpha.digitalcreditor.securiancanada.ca/api/',
              //   scope: '',
              // };
              // this.config.apis.reportingApi = {
              //   url: 'https://PRSReport-WebAuth%40cri.local:K*&wV86jnnt$6ciNBnq2@np-insurancereporting.selient.ca/ReportServer/Pages/ReportViewer.aspx?/',
              //   scope: 'PRS/QA/',
              // };
            }

            resolve(true);
          },
          (error) => {
            reject(error);
          }
        );
    });
  }

  public get settings(): Config {
    return this.config;
  }
}
 