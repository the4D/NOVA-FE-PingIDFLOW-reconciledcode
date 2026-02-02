import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'orderObjectBy',
    standalone: true,
})
export class OrderedValuesPipe implements PipeTransform {
  transform(data: any, field: string): Array<any> {
    if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
      const values = Object.values(data);
      return values.sort((a: any, b: any) => {
        if (a[field] < b[field]) {
          return -1;
        }
        if (a[field] > b[field]) {
          return 1;
        }

        return 0;
      });
    } else if (Array.isArray(data)) {
      return data.sort((a: any, b: any) => {
        if (a[field] < b[field]) {
          return -1;
        }
        if (a[field] > b[field]) {
          return 1;
        }
        return 0;
      });
    }

    return data;
  }
}
