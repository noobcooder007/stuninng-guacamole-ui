import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'address'
})

export class AddressPipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        return `${value.street} ${value.numeration.noExt} ${value.numeration.noInt ?? ''} ${value.neighborhood ?? ''} ${value.locality ?? ''} ${value.city} ${value.state} ${value.zipCode}`;
    }
}
