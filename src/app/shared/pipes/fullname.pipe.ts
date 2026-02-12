import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'fullname'
})

export class FullnamePipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        return `${value.firstname} ${value.firstLastname} ${value.secondLastname ?? ''}`;
    }
}
