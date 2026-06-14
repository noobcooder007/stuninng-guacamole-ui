import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UploadsService } from '@app/core/services/uploads.service';

describe('UploadsService', () => {
  let service: UploadsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UploadsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(UploadsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const makeFile = (name: string) => new File(['data'], name, { type: 'text/csv' });

  describe('uploadDepositFile', () => {
    it('should POST FormData to /api/uploads/deposits with reportProgress', () => {
      service.uploadDepositFile(makeFile('deposits.csv')).subscribe();
      const req = httpMock.expectOne('/api/uploads/deposits');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      expect(req.request.reportProgress).toBe(true);
      req.flush({ success: true, message: 'OK' });
    });

    it('should append the file under the "file" key', () => {
      const file = makeFile('deposits.csv');
      service.uploadDepositFile(file).subscribe();
      const req = httpMock.expectOne('/api/uploads/deposits');
      const fd = req.request.body as FormData;
      expect(fd.get('file')).toBe(file);
      req.flush({ success: true, message: 'OK' });
    });
  });

  describe('uploadInformationFile', () => {
    it('should POST FormData to /api/uploads/information with reportProgress', () => {
      service.uploadInformationFile(makeFile('info.csv')).subscribe();
      const req = httpMock.expectOne('/api/uploads/information');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      expect(req.request.reportProgress).toBe(true);
      req.flush({ success: true, message: 'OK' });
    });

    it('should append the file under the "file" key', () => {
      const file = makeFile('info.csv');
      service.uploadInformationFile(file).subscribe();
      const req = httpMock.expectOne('/api/uploads/information');
      expect((req.request.body as FormData).get('file')).toBe(file);
      req.flush({ success: true, message: 'OK' });
    });
  });
});
