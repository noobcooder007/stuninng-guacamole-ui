import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';

describe('FullnamePipe', () => {
  let pipe: FullnamePipe;

  beforeEach(() => {
    pipe = new FullnamePipe();
  });

  it('should combine firstname, firstLastname and secondLastname', () => {
    const person = { firstname: 'Juan', firstLastname: 'García', secondLastname: 'López' };
    expect(pipe.transform(person)).toBe('Juan García López');
  });

  it('should omit secondLastname when null', () => {
    const person = { firstname: 'Ana', firstLastname: 'Martínez', secondLastname: null };
    const result = pipe.transform(person);
    expect(result).toBe('Ana Martínez ');
  });

  it('should omit secondLastname when undefined', () => {
    const person = { firstname: 'Pedro', firstLastname: 'Sánchez', secondLastname: undefined };
    const result = pipe.transform(person);
    expect(result).toBe('Pedro Sánchez ');
  });
});
