import { GenderPipe } from '@app/shared/pipes/gender.pipe';

describe('GenderPipe', () => {
  let pipe: GenderPipe;

  beforeEach(() => {
    pipe = new GenderPipe();
  });

  it('should transform "M" to "Masculino"', () => {
    expect(pipe.transform('M')).toBe('Masculino');
  });

  it('should transform "F" to "Femenino"', () => {
    expect(pipe.transform('F')).toBe('Femenino');
  });

  it('should return the original value for unknown codes', () => {
    expect(pipe.transform('X')).toBe('X');
  });

  it('should return empty string for empty input', () => {
    expect(pipe.transform('')).toBe('');
  });
});
