import { StatusPipe } from '@app/shared/pipes/status.pipe';

describe('StatusPipe', () => {
  let pipe: StatusPipe;

  beforeEach(() => {
    pipe = new StatusPipe();
  });

  it('should transform true to "Activo"', () => {
    expect(pipe.transform(true)).toBe('Activo');
  });

  it('should transform false to "Inactivo"', () => {
    expect(pipe.transform(false)).toBe('Inactivo');
  });

  it('should return original value for unknown input', () => {
    expect(pipe.transform('otro')).toBe('otro');
  });
});
