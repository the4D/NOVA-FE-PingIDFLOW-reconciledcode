import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { HttpLoaderFactory } from '@app.module';
import { MsalModule } from '@azure/msal-angular';
import { EffectsModule } from '@ngrx/effects';
import { AppStoreModule } from '@store/app-store.module';
import { securianRoutes } from '@app.routes';
import { MsalConfigDynamicModule } from '@core/auth/msal-config-dynamic.module';
import { ErrorNoticeInterceptor } from '@core/middleware/error-interceptor';
import { HttpAppInterceptor } from '@core/middleware/http-interceptor';
import { ConfigService } from '@core/config/config.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ApplicationEffects } from '@store/pages/new-policy/insurance-application/effects/insurance-application.effects';
import { TenantEffects } from '@store/tenant/store/tenant.effects';
import { NgxMaskModule } from 'ngx-mask';

export function initializeApp(configService: ConfigService) {
  return () => configService.init('assets/config/config.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(securianRoutes),
    importProvidersFrom(
      EffectsModule.forRoot([TenantEffects, ApplicationEffects]),

      NgxMaskModule.forRoot({}),
      TranslateModule.forRoot({
        defaultLanguage: 'en-US',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      }),
      AppStoreModule,

    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService],
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpAppInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorNoticeInterceptor,
      multi: true,
    },
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
  ],
};
