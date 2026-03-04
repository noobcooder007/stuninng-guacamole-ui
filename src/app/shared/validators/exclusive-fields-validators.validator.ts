import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const addressExclusiveFieldsValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const neighborhood = control.get('neighborhood')?.value;
    const locality = control.get('locality')?.value;
    if ((neighborhood && locality) || (!neighborhood && !locality)) {
        return { exclusiveFields: true };
    }
    return null;
}
