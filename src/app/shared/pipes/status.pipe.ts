import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'status'
})

export class StatusPipe implements PipeTransform {
    transform(value: any): any {
        const status: Record<any, string>= {
            true: 'Activo',
            false: 'Inactivo',
        };
        return status[value] || value;
    }
}