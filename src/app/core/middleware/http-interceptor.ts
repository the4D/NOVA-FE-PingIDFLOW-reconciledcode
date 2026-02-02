import { inject, Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { AppState } from '@store';
import { Store } from '@ngrx/store';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { setErrorMessage } from '@store/core/component/message/message.actions';
import { MessageComponent } from '../components/message/message.component';
import { setLoadingSpinner } from '@store/core/component/loading-spinner/loading-spinner.actions';
import { setApplicationLoading } from '@store/pages/new-policy/insurance-application/actions/insurance-application.actions';
import { SEVERITY_ERROR } from '@core/utils/enums/insurance-enums';

@Injectable()
export class HttpAppInterceptor implements HttpInterceptor {
  private config = inject(ConfigService);
  private store = inject(Store<AppState>);
  private dialog = inject(MatDialog);

  private loanIdentifier: string = '';
  private errorMessages: any[] = [];

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = sessionStorage.getItem('token') ? sessionStorage.getItem('token') : null;
   // console.log({ tokenInHttpInterceptor: token });
    // const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZmOGE0NDA5LTYyYjEtNDE2Yi04NzVkLWYzNjQ1NDRjZDE3OSIsImlzQWN0aXZlIjp0cnVlLCJjcmVhdGVkQnkiOiJmaWtyZXRAbm9ydGhlcm5jdS5jYSIsImNyZWF0ZWRPbiI6IjIwMjUtMDgtMDFUMTI6NTE6MzUuNDM2WiIsInRlbmFudElkIjoiM2U4OWVjOTktOGNiNC00NjI1LWE3ZGUtY2JmYzEyOWM1ZDA5IiwiYnJhbmNoSWQiOiJkMDg0OWY0ZS1hZWYwLTQxMTQtYTZlZi1lOWJmNjY0NmI4YWMiLCJlbWFpbCI6Im11c2hhcmFmLmhhcXVlQHNlY3VyaWFuY2FuYWRhLmNhIiwiZmlyc3ROYW1lIjoiTXVzaGFyYWYiLCJsYXN0TmFtZSI6IkhhcXVlIiwiZW1wbG95ZWVJZCI6IkVNUDUzNDIxIiwicm9sZSI6IkFkbWluaXN0cmF0b3IiLCJpYXQiOjE3NjI5NDIwNTQsImV4cCI6MTc5NDQ3ODA1NH0.jcVLEKQWQIKjKAO2qkv02rYlXSgiqIKsTHqLOo9hxuM`;


    const hasApiPlaceholder = request.url.includes('BORROWER_API/') ||
      request.url.includes('INSURANCE_API/') ||
      request.url.includes('TENANT_API/');

    if (hasApiPlaceholder && !this.config.settings?.apis) {
      console.warn('Config not loaded yet, skipping request:', request.url);

      return next.handle(request);
    }


    if (this.config.settings?.apis) {
      request = request.clone({
        url: request.url
          .replace('BORROWER_API/', `${this.config.settings.apis.borrowerApi.url}`)
          .replace('INSURANCE_API/', `${this.config.settings.apis.insuranceApi.url}`)
          .replace('TENANT_API/', `${this.config.settings.apis.tenantApi.url}`),
        setHeaders: {
          'X-Application-Origin': 'Insurance',
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
    } else {
      // If config is not loaded yet, just add the headers without URL replacement
      request = request.clone({
        setHeaders: {
          'X-Application-Origin': 'Insurance',
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
    }

    return next.handle(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse && request.method === 'POST' && event.body) {
          this.loanIdentifier = event.body.loanIdentifier;
          if (!this.loanIdentifier) {
            const urlIdentifier = window.location.href
              .substring(window.location.href.lastIndexOf('application/'), window.location.href.length)
              .replace('application/', '');

            if (urlIdentifier.includes('/')) {
              this.loanIdentifier = urlIdentifier.substring(0, urlIdentifier.indexOf('/'));
            } else {
              this.loanIdentifier = urlIdentifier;
            }
          }
          Object.keys(event.body).forEach((key) => {
            this.objectValidations(event.body, key);
          });
          this.callErrorMessages();
        }
      })
    );
  }

  private objectValidations(body: any, key: string) {
    if (key !== 'validations' && typeof body[key] === 'object') {
      if (body[key] && key !== 'validations') {
        Object.keys(body[key]).forEach((keyName) => {
          this.objectValidations(body[key], keyName);
        });
      }
    }

    if (key === 'validations') {
      if (body[key] && body[key].length) {
        body[key].forEach((validation: any) => {
          if (validation.severity === SEVERITY_ERROR.Error) {
            this.errorMessages.push({
              value: '<strong>Validation Error</strong><br/>',
              desc: [validation.errorMessage],
            });
          }
        });
      }
    }
  }

  private callErrorMessages() {
    if (this.errorMessages.length > 0) {
      this.messageDialog('warning', this.errorMessages, 'Validation Errors')
        .afterClosed()
        .subscribe(() => {
          this.store.dispatch(setErrorMessage({ status: false }));
          this.store.dispatch(setLoadingSpinner({ status: false }));
          this.store.dispatch(setApplicationLoading({ status: false }));
          if (window.location.href.lastIndexOf('/2') === window.location.href.length - 2) {
            window.location.href = `/new-policy/insurance-application/${this.loanIdentifier}/2`;
          } else {
            window.location.href = `/new-policy/insurance-application/${this.loanIdentifier}`;
          }
        });
    }
  }

  messageDialog(type: string, message: any, title?: string): MatDialogRef<MessageComponent> {
    return this.dialog.open(MessageComponent, {
      width: '500px',
      data: {
        type,
        message: message,
        title,
      },
    });
  }
}
