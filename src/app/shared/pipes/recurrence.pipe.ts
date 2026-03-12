import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'recurrence'
})

export class RecurrencePipe implements PipeTransform {
    transform(value: number | null | undefined): any {
        if (!value) return 'Pago único';

        switch (value) {
            case 1: return 'Mensual';
            case 2: return 'Bimensual';
            case 3: return 'Trimestral';
            case 4: return 'Cuatrimestral';
            case 6: return 'Semestral';
            case 12: return 'Anual';
            default: return `Cada ${value} meses`;
        }
    }
}