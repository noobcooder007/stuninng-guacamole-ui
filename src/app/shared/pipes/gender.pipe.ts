import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'gender'
})
export class GenderPipe implements PipeTransform {
    transform(value: string): string {
        const gender: Record<string, string> = {
            'M': 'Masculino',
            'F': 'Femenino'
        };
        return gender[value] || value;
    }
}
