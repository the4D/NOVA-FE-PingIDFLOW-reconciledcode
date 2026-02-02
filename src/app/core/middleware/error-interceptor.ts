// import { forEach } from 'lodash';
import { inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MessageComponent } from '../components/message/message.component';
import { Store } from '@ngrx/store';
import { selectErrorMessage } from '@store/core/component/message/message.selector';
import { setErrorMessage } from '@store/core/component/message/message.actions';

interface iErrorValues {
  value: string;
  desc: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ErrorNoticeInterceptor implements HttpInterceptor {
  private dialog = inject(MatDialog);
  private store = inject(Store);

  intercept(request: HttpRequest<any>, next: HttpHandler): any {
    //will not show CORS error
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
      var state = false;
      this.store.select(selectErrorMessage).subscribe((data) => {
        state = data;
      });
      if (state) return next.handle(request); // show only one error message at a time

      return next.handle(request).pipe(
        catchError((error: HttpErrorResponse) => {
          let errorMessage: any[] = [];
          errorMessage = this.getServerErrorMessage(error);

          const title = errorMessage.length > 0 ? errorMessage[1] : '';
          this.messageDialog('warning', errorMessage[0], title)
            .afterClosed()
            .subscribe(() => {
              this.store.dispatch(setErrorMessage({ status: false }));
            });
          throw error;
        })
      );
    } else {
      return next.handle(request);
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

  private getType(value: string) {
    if (value.includes('[')) {
      const expression = value
        .substring(value.lastIndexOf('['), value.lastIndexOf(']') + 1)
        .replace('[', '')
        .replace(']', '');

      switch (expression) {
        case '0':
          return 'Primary';
        case '1':
          return 'Secondary';
        case '2':
          return 'Tertiary';
        case '3':
          return 'Quaternary';
        default:
          return '';
      }
    }

    return '';
  }

  private getServerErrorMessage(error: any): any[] {
    switch (error.status) {
      case 404: {
        return [`Not Found: ${error.message}`];
      }

      case 403: {
        return [`Access Denied: ${error.message}`];
      }

      case 500: {
        return [`Internal Server Error: ${error.message}`];
      }

      case 400: {
        const errorString: any = error.error.errors;
        const errorVal: iErrorValues[] = [];

        for (const keyName in errorString) {
          const keys = keyName.split('.');
          if (keys.length > 2) {
            const type = this.getType(keys[keys.length - 2]);
            const firstValue = keys[keys.length - 2].substring(0, keys[keys.length - 2].indexOf('[') - 1);
            const secondValue = keys[keys.length - 1]
              .substring(0, keys[keys.length - 1].indexOf('['))
              .replace(firstValue, '');
            const value = keys[keys.length - 2].includes('[')
              ? `<strong>${type} ${firstValue} ${secondValue}</strong><br/>`
              : `<strong>${keys[keys.length - 2]}</strong>`;
            let descriptions: string[] = [];
            errorString[keyName].forEach((description: string) => {
              descriptions.push(description);
            });

            errorVal.push({ value: value, desc: descriptions });
          }

          if (keys.length === 2) {
            const type = this.getType(keys[1]);
            const firstValue = keys[1].includes('[')
              ? keys[1].substring(0, keys[1].indexOf('[') - 1)
              : `<strong>${keys[1]}</strong>`;
            const value = `<strong>${type} ${firstValue}</strong><br/>`;
            const descriptions: string[] = [];
            errorString[keyName].forEach((description: string) => {
              descriptions.push(description);
            });
            errorVal.push({ value: value, desc: descriptions });
          }

          if (keys.length === 1) {
            const value = `<strong>${keys[0]}</strong><br/>`;
            const descriptions: string[] = [];
            errorString[keyName].forEach((description: string) => {
              descriptions.push(description);
            });
            errorVal.push({ value: value, desc: descriptions });
          }
        }

        if (errorVal.length > 0) {
          return [errorVal, 'Validation Errors'];
        }

        return [`Validation Errors: ${error.message}`];
      }

      default: {
        return [`Unknown Server Error: ${error.message}`];
      }
    }
  }
}
