import { SpanishPaginatorIntl } from '@app/core/services/paginator-intl.service';

describe('SpanishPaginatorIntl', () => {
  let intl: SpanishPaginatorIntl;

  beforeEach(() => {
    intl = new SpanishPaginatorIntl();
  });

  describe('labels', () => {
    it('should have Spanish labels', () => {
      expect(intl.firstPageLabel).toBe('Primera página');
      expect(intl.lastPageLabel).toBe('Última página');
      expect(intl.nextPageLabel).toBe('Página siguiente');
      expect(intl.previousPageLabel).toBe('Página anterior');
      expect(intl.itemsPerPageLabel).toBe('Filas por página:');
    });

    it('should expose a changes Subject', () => {
      expect(intl.changes).toBeDefined();
    });
  });

  describe('getRangeLabel', () => {
    it('should return "Página 1 de 1" when list is empty', () => {
      expect(intl.getRangeLabel(0, 10, 0)).toBe('Página 1 de 1');
    });

    it('should return correct label for first page', () => {
      expect(intl.getRangeLabel(0, 10, 25)).toBe('Página 1 de 3');
    });

    it('should return correct label for last page', () => {
      expect(intl.getRangeLabel(2, 10, 25)).toBe('Página 3 de 3');
    });

    it('should return correct label for middle page', () => {
      expect(intl.getRangeLabel(1, 5, 20)).toBe('Página 2 de 4');
    });

    it('should handle exact page size multiples', () => {
      expect(intl.getRangeLabel(0, 10, 20)).toBe('Página 1 de 2');
      expect(intl.getRangeLabel(1, 10, 20)).toBe('Página 2 de 2');
    });
  });
});
