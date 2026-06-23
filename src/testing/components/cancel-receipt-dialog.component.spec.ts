import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { vi } from 'vitest';
import { CancelReceiptDialogComponent } from '@app/features/dashboard/recibos/detail/cancel-receipt-dialog.component';

const FOLIO = 'JUN2026-0001-R-0001';

describe('CancelReceiptDialogComponent', () => {
  let component: CancelReceiptDialogComponent;
  const dialogRefSpy = { close: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CancelReceiptDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { folio: FOLIO } },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    });
    component = TestBed.createComponent(CancelReceiptDialogComponent).componentInstance;
  });

  afterEach(() => vi.clearAllMocks());

  describe('canConfirm', () => {
    it('should be false when the form is empty', () => {
      expect(component.canConfirm).toBe(false);
    });

    it('should be false when only reason is filled', () => {
      component.form.get('reason')!.setValue('Duplicado');
      expect(component.canConfirm).toBe(false);
    });

    it('should be false when folioConfirm does not match', () => {
      component.form.get('reason')!.setValue('Duplicado');
      component.form.get('folioConfirm')!.setValue('FOLIO-INCORRECTO');
      expect(component.canConfirm).toBe(false);
    });

    it('should be false when reason is empty and folioConfirm matches', () => {
      component.form.get('folioConfirm')!.setValue(FOLIO);
      expect(component.canConfirm).toBe(false);
    });

    it('should be true when reason is filled and folioConfirm matches exactly', () => {
      component.form.get('reason')!.setValue('Duplicado');
      component.form.get('folioConfirm')!.setValue(FOLIO);
      expect(component.canConfirm).toBe(true);
    });
  });

  describe('confirm()', () => {
    it('should not close the dialog when canConfirm is false', () => {
      component.confirm();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should close the dialog with the reason when canConfirm is true', () => {
      component.form.get('reason')!.setValue('Recibo duplicado');
      component.form.get('folioConfirm')!.setValue(FOLIO);
      component.confirm();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ reason: 'Recibo duplicado' });
    });

    it('should not close the dialog when folio matches but reason is empty', () => {
      component.form.get('folioConfirm')!.setValue(FOLIO);
      component.confirm();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });
  });
});
