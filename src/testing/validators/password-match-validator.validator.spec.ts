import { FormControl, FormGroup } from '@angular/forms';
import { passwordMatchValidator } from '@app/shared/validators/password-match-validator.validator';

function buildGroup(password: string, confirmPassword: string): FormGroup {
  return new FormGroup(
    { password: new FormControl(password), confirmPassword: new FormControl(confirmPassword) },
    { validators: passwordMatchValidator }
  );
}

describe('passwordMatchValidator', () => {
  it('should return null when passwords match', () => {
    const group = buildGroup('abc123', 'abc123');
    expect(group.errors).toBeNull();
    expect(group.get('confirmPassword')?.errors).toBeNull();
  });

  it('should return error when passwords do not match', () => {
    const group = buildGroup('abc123', 'xyz789');
    expect(group.errors).toEqual({ passwordMismatch: true });
    expect(group.get('confirmPassword')?.hasError('passwordMismatch')).toBe(true);
  });

  it('should clear passwordMismatch error on confirmPassword after fixing mismatch', () => {
    const group = buildGroup('abc123', 'wrong');
    expect(group.get('confirmPassword')?.hasError('passwordMismatch')).toBe(true);

    group.get('confirmPassword')?.setValue('abc123');
    expect(group.get('confirmPassword')?.errors).toBeNull();
    expect(group.errors).toBeNull();
  });

  it('should return null when confirmPassword control is missing', () => {
    const group = new FormGroup(
      { password: new FormControl('abc123') },
      { validators: passwordMatchValidator }
    );
    expect(group.errors).toBeNull();
  });
});
