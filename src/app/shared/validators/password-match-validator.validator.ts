import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword');
  
  if (!confirm) return null;

  if (password !== confirm.value) {
    // Si no coinciden, marcamos el error (Save se bloquea)
    confirm.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    // Si coinciden, limpiamos el error (Save se habilita)
    // Pero ojo: solo limpiamos SI el error era passwordMismatch
    if (confirm.hasError('passwordMismatch')) {
        confirm.setErrors(null);
    }
    return null; 
  }
};
