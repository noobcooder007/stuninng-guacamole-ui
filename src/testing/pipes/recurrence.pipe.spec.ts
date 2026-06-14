import { RecurrencePipe } from '@app/shared/pipes/recurrence.pipe';

describe('RecurrencePipe', () => {
  let pipe: RecurrencePipe;

  beforeEach(() => {
    pipe = new RecurrencePipe();
  });

  it('should return "Pago único" for null', () => {
    expect(pipe.transform(null)).toBe('Pago único');
  });

  it('should return "Pago único" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('Pago único');
  });

  it('should return "Pago único" for 0', () => {
    expect(pipe.transform(0)).toBe('Pago único');
  });

  it('should return "Mensual" for 1', () => {
    expect(pipe.transform(1)).toBe('Mensual');
  });

  it('should return "Bimensual" for 2', () => {
    expect(pipe.transform(2)).toBe('Bimensual');
  });

  it('should return "Trimestral" for 3', () => {
    expect(pipe.transform(3)).toBe('Trimestral');
  });

  it('should return "Cuatrimestral" for 4', () => {
    expect(pipe.transform(4)).toBe('Cuatrimestral');
  });

  it('should return "Semestral" for 6', () => {
    expect(pipe.transform(6)).toBe('Semestral');
  });

  it('should return "Anual" for 12', () => {
    expect(pipe.transform(12)).toBe('Anual');
  });

  it('should return "Cada N meses" for non-standard values', () => {
    expect(pipe.transform(5)).toBe('Cada 5 meses');
    expect(pipe.transform(9)).toBe('Cada 9 meses');
  });
});
