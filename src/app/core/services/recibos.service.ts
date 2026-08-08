import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, from, Observable, of, switchMap, throwError } from 'rxjs';
import { environment } from 'environments/environment';
import { PaginatedMetadata } from './collector.service';
import { apiErrorMessage } from '@app/shared/utils/api-error';

export type ReceiptType = 'RECURRING' | 'SPECIAL';

export interface Recibo {
    id: string;
    folio: string;
    type: ReceiptType;
    origin: string;
    status: string;
    amount: string;
    currency: string;
    paymentMethod: string | null;
    externalReference: string | null;
    promiseDonationId: string | null;
    periodMonth: number;
    periodYear: number;
    beneficientId: string;
    collectorId: string;
    printCount: number;
    lastPrintedAt: string | null;
    voidReason: string | null;
    createdAt: string;
    updatedAt: string;
    paidAt: string | null;
}

export interface ReciboFilters {
    month?: string;
    year?: string;
    folio?: string;
    status?: string;
    type?: ReceiptType;
}

export interface ImpresionReciboFilters {
    month?: string | null;
    year?: string | null;
    firstname?: string | null;
    firstLastname?: string | null;
    secondLastname?: string | null;
    collectorNumber?: string | null;
    fromSequence?: number | null;
    toSequence?: number | null;
}

export interface ValidateReciboData {
    valid: boolean;
    folio: string;
    status: string;
    amount: string;
    currency: string;
    type?: ReceiptType;
}

export interface ValidateReciboResponse {
    statusCode: number;
    data: ValidateReciboData;
    timestamp: string;
}

export interface MarkAsPaidReceiptDto {
    receiptFolio: string;
    paymentMethod: string;
}

export interface MarkAsPaidDto {
    receipts: MarkAsPaidReceiptDto[];
}

export interface CreateSpecialReceiptDto {
    beneficientId: string | number;
    collectorId: string;
    amount: number;
    currency: 'MXN' | 'USD';
}

export interface ApiErrorBody {
    type?: string;
    message?: string;
}

// FileReader en vez de Blob.text(): jsdom (entorno de test) no implementa
// Blob.prototype.text(), pero sí FileReader; ambos son equivalentes en navegadores reales.
function readBlobAsText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });
}

// El request pide responseType: 'blob' (para recibir el PDF), así que Angular
// también entrega el body de un error como Blob en vez de JSON parseado —
// hay que leerlo manualmente para poder distinguir el tipo de error.
async function parseBlobErrorBody(error: HttpErrorResponse): Promise<ApiErrorBody> {
    if (error.error instanceof Blob) {
        try {
            return JSON.parse(await readBlobAsText(error.error)) as ApiErrorBody;
        } catch {
            return {};
        }
    }
    return (error.error as ApiErrorBody) ?? {};
}

export interface SpecialReceiptError extends HttpErrorResponse {
    apiError?: ApiErrorBody;
}

export interface RecibosPaginatedResponse {
    statusCode: number;
    data: {
        items: Recibo[];
        meta: PaginatedMetadata;
    };
    timestamp: string;
}

export interface ReciboResponse {
    statusCode: number;
    data: Recibo;
    timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class RecibosService {
    private readonly http = inject(HttpClient);
    private readonly snackbar = inject(MatSnackBar);

    getRecibos(page: number = 1, limit: number = 10, filters: ReciboFilters = {}): Observable<RecibosPaginatedResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value);
            }
        });

        return this.http.get<RecibosPaginatedResponse>(`${environment.apiBaseUrl}/receipts`, { params }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al obtener los recibos'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    validarFolio(folio: string): Observable<ValidateReciboResponse> {
        return this.http.get<ValidateReciboResponse>(
            `${environment.apiBaseUrl}/receipts/validate/${folio}`
        ).pipe(
            catchError(error => throwError(() => error))
        );
    }

    marcarComoPagados(dto: MarkAsPaidDto): Observable<void> {
        return this.http.post<void>(`${environment.apiBaseUrl}/receipts/mark-as-paid`, dto).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al marcar los recibos como pagados'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    imprimirRecibos(filters: ImpresionReciboFilters): Observable<Blob> {
        return this.http.get(`${environment.apiBaseUrl}/receipts/pdf`, {
            params: this.buildPrintParams(filters),
            responseType: 'blob',
        }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al generar los recibos'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    imprimirCartaActual(filters: ImpresionReciboFilters): Observable<Blob> {
        return this.http.get(`${environment.apiBaseUrl}/receipts/delivery-letter/pdf`, {
            params: this.buildPrintParams(filters),
            responseType: 'blob',
        }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al generar la carta de recibos actual'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    imprimirCartaAnterior(filters: ImpresionReciboFilters): Observable<Blob> {
        return this.http.get(`${environment.apiBaseUrl}/receipts/print/carta-anterior`, {
            params: this.buildPrintParams(filters),
            responseType: 'blob',
        }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al generar la carta de recibos anterior'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    getRecibo(folio: string): Observable<ReciboResponse> {
        return this.http.get<ReciboResponse>(`${environment.apiBaseUrl}/receipts/${folio}`).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al obtener el recibo'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    crearReciboEspecial(dto: CreateSpecialReceiptDto): Observable<Blob> {
        return this.http.post(`${environment.apiBaseUrl}/receipts/generate/special`, dto, { responseType: 'blob' }).pipe(
            catchError((error: HttpErrorResponse) => {
                // Leer el Blob es async; para cualquier otro caso (ej. error
                // de red, sin body) seguimos síncronos como antes.
                const apiError$ = error.error instanceof Blob
                    ? from(parseBlobErrorBody(error))
                    : of((error.error as ApiErrorBody) ?? {});
                return apiError$.pipe(
                    switchMap((apiError) => {
                        // El recibo ya se creó (solo falló el PDF): el
                        // componente muestra su propio diálogo en vez del
                        // snackbar genérico.
                        if (apiError.type !== 'PDF_GENERATION_FAILED') {
                            this.snackbar.open(apiError.message ?? 'Error al crear el recibo especial', 'Cerrar', { duration: 5000 });
                        }
                        const errorWithApiError: SpecialReceiptError = Object.assign(error, { apiError });
                        return throwError(() => errorWithApiError);
                    }),
                );
            }),
        );
    }

    cancelarRecibo(folio: string, reason: string): Observable<void> {
        return this.http.put<void>(`${environment.apiBaseUrl}/receipts/${folio}/cancel`, { reason }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al cancelar el recibo'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    reimprimirRecibo(folio: string): Observable<Blob> {
        return this.http.get(`${environment.apiBaseUrl}/receipts/${folio}/pdf`, { responseType: 'blob' }).pipe(
            catchError((error) => {
                this.snackbar.open(apiErrorMessage(error, 'Error al reimprimir el recibo'), 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    private buildPrintParams(filters: ImpresionReciboFilters): HttpParams {
        let params = new HttpParams();
        const includeSequence = filters.fromSequence != null && filters.toSequence != null;

        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'fromSequence' || key === 'toSequence') {
                if (includeSequence) params = params.set(key, String(value));
                return;
            }
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, String(value));
            }
        });
        return params;
    }
}
