import { AfterViewInit, Component, inject, Inject } from '@angular/core';

import { AuthenticationResult, EventMessage, EventType, InteractionStatus, RedirectRequest } from '@azure/msal-browser';
import { Store } from '@ngrx/store';
import { CookieService } from 'ngx-cookie-service';
import { filter, Subject, takeUntil } from 'rxjs';
import { AppState } from './store/index';
import { setLoadingSpinner } from './store/core/component/loading-spinner/loading-spinner.actions';
import { getLoading } from './store/core/component/loading-spinner/loading-spinner.selector';
import { BranchService } from './core/services/tenant/branch.service';
import { UserService } from './core/services/tenant/user.service';
import { AuthService } from './auth.service';
import {
  NavigationCancel,
  NavigationError,
  Router,
  NavigationEnd,
  NavigationStart,
  RouterOutlet,
} from '@angular/router';
import { SystemService } from './core/services/system/system.service';
import { WaiverReasonService } from './core/services/insurance/waiverReason.service';
import { ProductService } from './core/services/tenant/product.service';
import { CARRIER_LOAN_TYPES } from './core/utils/enums/insurance-enums';
import { loadingInformationSelector } from './store/pages/new-policy/insurance-application/selectors/insurance-application.selectors';
import { NgClass } from '@angular/common';
import { LoadingSpinnerComponent } from './core/components/loading-spinner/loading-spinner.component';
import { HeaderComponent } from './core/components/header/header.component';
import { SideNavComponent } from './core/components/side-nav/side-nav.component';
import { BreadCrumbComponent } from './core/components/bread-crumb/bread-crumb.component';
import { FooterComponent } from './core/components/footer/footer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    LoadingSpinnerComponent,
    HeaderComponent,
    SideNavComponent,
    NgClass,
    BreadCrumbComponent,
    RouterOutlet,
    FooterComponent,
  ],
})
export class AppComponent implements AfterViewInit {
  public loginDisplay = false;
  private readonly _destroying$ = new Subject<void>();
  public showLoading: boolean = false;
  public sourceApplicationType: string = '';
  public apiWorking: boolean = false;
  public navBarExpand: boolean = false;
  public dontShowBreadCrumb: boolean = false;


  private branchService = inject(BranchService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private store = inject(Store<AppState>);
  private systemService = inject(SystemService);
  private waiverReasonService = inject(WaiverReasonService);
  private productService = inject(ProductService);
  public cookieService = inject(CookieService);

  constructor(

  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.store.dispatch(setLoadingSpinner({ status: true }));
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.store.dispatch(setLoadingSpinner({ status: false }));
      }
    });
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const currentUrl = event.url; // The full URL of the current route      
      if (currentUrl === '/forms') {
        this.dontShowBreadCrumb = true;
      } else {
        this.dontShowBreadCrumb = false;
      }
    });
    this.cookieService.set('ARRAffinitySameSite', '6d7e61a8a935cc86ade2fda043d2f9558e383e036b9924d0c8ff743a8b42fad5');
    this.cookieService.set('ARRAffinity', '6d7e61a8a935cc86ade2fda043d2f9558e383e036b9924d0c8ff743a8b42fad5');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.store.select(getLoading).subscribe((loading) => {
        this.showLoading = loading;
      });
      this.store.select(loadingInformationSelector).subscribe((loading) => {
        this.apiWorking = loading;
      });
    }, 0);
    sessionStorage.removeItem("APPLICATIONCANCELLEDFILENUMBERMAP");
    sessionStorage.removeItem("APPLICATIONSTATUS");
  }

  ngOnInit(): void {
    this.systemService.sourceApplicationType$.subscribe((param) => {
      this.sourceApplicationType = param;
    });

    this.authService.isLoggedIn$
      .pipe(takeUntil(this._destroying$))
      .subscribe((isLoggedIn) => {
        if (isLoggedIn) {
          this.loginDisplay = true;
          this.userService.getUser();
          this.branchService.getAllBranches();
          this.waiverReasonService.getWaiverReasonList();
          this.productService.setProductConfigurationCarrierLoanTypes(CARRIER_LOAN_TYPES);
        } else {
          this.loginDisplay = false;
        }
      });
    //  this.setLoginDisplay();
  }


  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  public navBarToggle(mode: boolean) {
    this.navBarExpand = mode;
  }
}
