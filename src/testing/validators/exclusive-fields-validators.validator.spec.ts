import { FormControl, FormGroup } from '@angular/forms';
import { addressExclusiveFieldsValidator } from '@app/shared/validators/exclusive-fields-validators.validator';

function buildGroup(neighborhood: string | null, locality: string | null): FormGroup {
  return new FormGroup(
    { neighborhood: new FormControl(neighborhood), locality: new FormControl(locality) },
    { validators: addressExclusiveFieldsValidator }
  );
}

describe('addressExclusiveFieldsValidator', () => {
  it('should be invalid when both fields are filled', () => {
    const group = buildGroup('Centro', 'Tlalpan');
    expect(group.errors).toEqual({ exclusiveFields: true });
  });

  it('should be invalid when both fields are empty', () => {
    const group = buildGroup(null, null);
    expect(group.errors).toEqual({ exclusiveFields: true });
  });

  it('should be valid when only neighborhood is filled', () => {
    const group = buildGroup('Polanco', null);
    expect(group.errors).toBeNull();
  });

  it('should be valid when only locality is filled', () => {
    const group = buildGroup(null, 'Coyoacán');
    expect(group.errors).toBeNull();
  });
});
