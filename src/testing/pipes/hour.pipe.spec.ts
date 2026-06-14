import { HourPipe } from '@app/shared/pipes/hour.pipe';

describe('HourPipe', () => {
  let pipe: HourPipe;

  beforeEach(() => {
    pipe = new HourPipe();
  });

  it('should return empty string for empty input', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should convert midnight (00:00) to 12:00 AM', () => {
    expect(pipe.transform('00:00')).toBe('12:00 AM');
  });

  it('should convert noon (12:00) to 12:00 PM', () => {
    expect(pipe.transform('12:00')).toBe('12:00 PM');
  });

  it('should convert morning hour to AM format', () => {
    expect(pipe.transform('09:30')).toBe('9:30 AM');
  });

  it('should convert afternoon hour to PM format', () => {
    expect(pipe.transform('15:45')).toBe('3:45 PM');
  });

  it('should pad single-digit minutes', () => {
    expect(pipe.transform('08:05')).toBe('8:05 AM');
  });

  it('should convert 23:59 to 11:59 PM', () => {
    expect(pipe.transform('23:59')).toBe('11:59 PM');
  });
});
