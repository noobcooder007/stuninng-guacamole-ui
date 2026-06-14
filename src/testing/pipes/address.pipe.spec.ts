import { AddressPipe } from '@app/shared/pipes/address.pipe';

describe('AddressPipe', () => {
  let pipe: AddressPipe;

  beforeEach(() => {
    pipe = new AddressPipe();
  });

  it('should format a complete address', () => {
    const address = {
      street: 'Av. Reforma',
      numeration: { noExt: '100', noInt: 'A' },
      neighborhood: 'Centro',
      locality: null,
      city: 'CDMX',
      state: 'Ciudad de México',
      zipCode: '06600',
    };
    expect(pipe.transform(address)).toBe('Av. Reforma 100 A Centro  CDMX Ciudad de México 06600');
  });

  it('should use noInt when provided and omit locality when null', () => {
    const address = {
      street: 'Calle 5',
      numeration: { noExt: '20', noInt: 'B' },
      neighborhood: 'Polanco',
      locality: null,
      city: 'CDMX',
      state: 'CDMX',
      zipCode: '11560',
    };
    const result = pipe.transform(address);
    expect(result).toContain('B');
    expect(result).toContain('Polanco');
  });

  it('should handle missing noInt and neighborhood', () => {
    const address = {
      street: 'Insurgentes',
      numeration: { noExt: '55', noInt: undefined },
      neighborhood: null,
      locality: 'Tlalpan',
      city: 'CDMX',
      state: 'CDMX',
      zipCode: '14000',
    };
    const result = pipe.transform(address);
    expect(result).toContain('Insurgentes');
    expect(result).toContain('55');
    expect(result).toContain('Tlalpan');
  });
});
