import { InjectionToken, NgModule, APP_INITIALIZER } from '@angular/core';
import { IPublicClientApplication, PublicClientApplication, LogLevel, BrowserAuthOptions } from '@azure/msal-browser';
import {
  MsalGuard,
  MsalInterceptor,
  MsalBroadcastService,
  MsalInterceptorConfiguration,
  MsalModule,
  MsalService,
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration,
} from '@azure/msal-angular';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ConfigService } from '../config/config.service';
import { environment } from '../../../environments/environment';
import { AuthRequest } from '../config/config.model';
const AUTH_CONFIG_URL_TOKEN = new InjectionToken<string>('AUTH_CONFIG_URL');

export function initializerFactory(env: ConfigService, configUrl: string): any {
  const promise = env.init(configUrl).then((value) => {
    console.log('finished getting configurations dynamically.');
  });
  return () => promise;
}

const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1; // Remove this line to use Angular Universal

export function loggerCallback(logLevel: LogLevel, message: string) {
  //console.log('---->', message);
}

export function MSALInstanceFactory(config: ConfigService): IPublicClientApplication {
  if (environment.production) {
    return new PublicClientApplication({
      auth: config.settings.msal.auth,
      cache: config.settings.msal.cache,
      system: {
        loggerOptions: {
          loggerCallback,
          logLevel: LogLevel.Info,
          piiLoggingEnabled: false,
        },
      },
    });
  }

  // FOR LOCAL DEV //
  let auth: BrowserAuthOptions = {
    clientId: '5bb59843-0715-47d4-9f52-c173ebf5c64b',
    authority: 'https://np-login.creditorlogin.securiancanada.ca/1b464ad4-7516-4495-91fe-a41624f5a9eb/B2C_1_si_neo',
    knownAuthorities: ['np-login.creditorlogin.securiancanada.ca'],
    redirectUri: '/',
  };

  return new PublicClientApplication({
    auth: auth,
    cache: config.settings.msal.cache,
    system: {
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false,
      },
    },
  });
}

export function MSALInterceptorConfigFactory(config: ConfigService): MsalInterceptorConfiguration {
  if (environment.production) {
    const protectedResourceMap = new Map<string, Array<string>>(config.settings.interceptor.protectedResourceMap);
    return {
      interactionType: config.settings.interceptor.interactionType,
      protectedResourceMap,
    };
  }

  // FOR LOCAL DEV //

  const protectedResourceMap = new Map<string, Array<string>>();

  protectedResourceMap.set('INSURANCE_API/*', [
    'https://valeyoNp.onmicrosoft.com/5e707b01-d6bd-4818-8c84-132ddc6d8871/insurance_api_access',
  ]);

  protectedResourceMap.set('BORROWER_API/*', [
    'https://valeyoNp.onmicrosoft.com/5e707b01-d6bd-4818-8c84-132ddc6d8871/borrower_api_access',
  ]);

  protectedResourceMap.set('TENANT_API/*', [
    'https://valeyoNp.onmicrosoft.com/5e707b01-d6bd-4818-8c84-132ddc6d8871/tenant_api_access',
  ]);

  return {
    interactionType: config.settings.interceptor.interactionType,
    protectedResourceMap,
  };
}

export function MSALGuardConfigFactory(config: ConfigService): MsalGuardConfiguration {
  if (environment.production) {
    return {
      interactionType: config.settings.guard.interactionType,
      authRequest: config.settings.guard.authRequest,
    };
  }

  // FOR LOCAL DEV //
  let authRequest: AuthRequest = {
    scopes: [
      'https://valeyoNp.onmicrosoft.com/5e707b01-d6bd-4818-8c84-132ddc6d8871/insurance_api_access',
      'https://valeyoNp.onmicrosoft.com/5e707b01-d6bd-4818-8c84-132ddc6d8871/borrower_api_access',
      'https://valeyoNp.onmicrosoft.com/5e707b01-d6bd-4818-8c84-132ddc6d8871/services_api_access',
      'https://valeyoNp.onmicrosoft.com/5e707b01-d6bd-4818-8c84-132ddc6d8871/tenant_api_access',
    ],
  };

  return {
    interactionType: config.settings.guard.interactionType,
    authRequest: authRequest,
  };
}

@NgModule({
  providers: [],
  imports: [MsalModule],
})
export class MsalConfigDynamicModule {
  static forRoot(configFile: string) {
    return {
      ngModule: MsalConfigDynamicModule,
      providers: [
        ConfigService,
        { provide: AUTH_CONFIG_URL_TOKEN, useValue: configFile },
        {
          provide: APP_INITIALIZER,
          useFactory: initializerFactory,
          deps: [ConfigService, AUTH_CONFIG_URL_TOKEN],
          multi: true,
        },
        {
          provide: MSAL_INSTANCE,
          useFactory: MSALInstanceFactory,
          deps: [ConfigService],
        },
        {
          provide: MSAL_GUARD_CONFIG,
          useFactory: MSALGuardConfigFactory,
          deps: [ConfigService],
        },
        {
          provide: MSAL_INTERCEPTOR_CONFIG,
          useFactory: MSALInterceptorConfigFactory,
          deps: [ConfigService],
        },
        MsalService,
        MsalGuard,
        MsalBroadcastService,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MsalInterceptor,
          multi: true,
        },
      ],
    };
  }
}

// export function MsalConfigDynamicProviders(configFile: string) {
//   return [
//     { provide: AUTH_CONFIG_URL_TOKEN, useValue: configFile },
//     {
//       provide: APP_INITIALIZER,
//       useFactory: initializerFactory,
//       deps: [ConfigService, AUTH_CONFIG_URL_TOKEN],
//       multi: true,
//     },
//     {
//       provide: MSAL_INSTANCE,
//       useFactory: MSALInstanceFactory,
//       deps: [ConfigService],
//     },
//     {
//       provide: MSAL_GUARD_CONFIG,
//       useFactory: MSALGuardConfigFactory,
//       deps: [ConfigService],
//     },
//     {
//       provide: MSAL_INTERCEPTOR_CONFIG,
//       useFactory: MSALInterceptorConfigFactory,
//       deps: [ConfigService],
//     },
//     MsalService,
//     MsalGuard,
//     MsalBroadcastService,
//     {
//       provide: HTTP_INTERCEPTORS,
//       useClass: MsalInterceptor,
//       multi: true,
//     },
//   ];
// }
