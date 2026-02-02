import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  public parseError(error: HttpErrorResponse) {
    let errorMsg: string;

    if (error.error instanceof ErrorEvent) {
      errorMsg = `Error: ${error.error.message}`;
    } else {
      errorMsg = this.getServerErrorMessage(error);
    }

    return errorMsg;
  }

  private getServerErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 404: {
        return `Not Found: ${error.message}`;
      }

      case 403: {
        return `Access Denied: ${error.message}`;
      }

      case 500: {
        return `Internal Server Error: ${error.message}`;
      }

      default: {
        return `Unknown Server Error: ${error.message}`;
      }
    }
  }
}
