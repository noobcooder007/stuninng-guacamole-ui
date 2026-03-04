import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'environments/environment.development';

export interface Address {
    street: string;
    numeration: {
        noExt: string;
        noInt?: string;
    };
    neighborhood?: string;
    locality?: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface Beneficient {
    id: number;
    
}

export interface PaginatedMetadata {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
    page: number;
    itemCount: number;
    pageCount: number;
}

export interface PaginatedResponse {
    statusCode: number;
    data: {
        items: Beneficient[];
        meta: PaginatedMetadata;
    };
    timestamp: string;
}

export interface BeneficientFilters {
    firstname?: string;
    firstLastname?: string;
    secondLastname?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}

export interface CreateBeneficientDto {
    title: string;
    firstname: string;
    firstLastname: string;
    secondLastname: string;
    birthday: Date;
    weddingAnniversary?: Date;
    genre: string;
    maritalStatus: string;
    email?: string;
    address: Address;
    churchId: string;
    person?: string;
    registeredName?: string;
    rfc?: string;
}

export interface UpdateBeneficientDto extends CreateBeneficientDto {
    id: number;
}

@Injectable({ providedIn: 'root' })
export class BeneficientService {
    private readonly http = inject(HttpClient);
    private readonly snackbar = inject(MatSnackBar);

    /**
     * Obtiene la lista de bienhechores con paginación y filtros
     * @param page Número de página (por defecto 1)
     * @param limit Límite de registros por página (por defecto 5)
     * @param filters Filtros a aplicar
     * @returns Observable con la respuesta paginada
     */
    getBeneficents(
        page: number = 1,
        limit: number = 5,
        filters: BeneficientFilters = {}
    ): Observable<PaginatedResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        // Agregar filtros dinámicamente
        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (value) {
                params = params.set(key, value);
            }
        });

        return this.http
            .get<PaginatedResponse>(`${environment.apiBaseUrl}/beneficient`, { params })
            .pipe(
                catchError((error) => {
                    this.snackbar.open('Error al obtener bienhechores', 'Cerrar', {
                        duration: 5000,
                    });
                    return throwError(() => error);
                })
            );
    }

    /**
     * Obtiene un bienhechor específico por ID
     * @param id ID del bienhechore
     * @returns Observable con los datos del bienhechore
     */
    getBeneficent(id: number): Observable<{ statusCode: number; data: Beneficient }> {
        return this.http.get<{ statusCode: number; data: Beneficient }>(
            `${environment.apiBaseUrl}/beneficents/${id}`
        ).pipe(
            catchError((error) => {
                this.snackbar.open('Error al obtener datos del bienhechore', 'Cerrar', {
                    duration: 5000,
                });
                return throwError(() => error);
            })
        );
    }

    /**
     * Crea un nuevo bienhechore
     * @param beneficent Datos del nuevo bienhechore
     * @returns Observable con el resultado de la creación
     */
    create(beneficent: CreateBeneficientDto): Observable<any> {
        return this.http
            .post(`${environment.apiBaseUrl}/beneficient`, beneficent)
            .pipe(
                catchError((error) => {
                    this.snackbar.open('Error al crear bienhechore', 'Cerrar', {
                        duration: 5000,
                    });
                    return throwError(() => error);
                })
            );
    }

    /**
     * Actualiza un bienhechore existente
     * @param beneficent Datos del bienhechore a actualizar (incluye ID)
     * @returns Observable con el resultado de la actualización
     */
    update(beneficent: UpdateBeneficientDto): Observable<any> {
        const { id, ...updateData } = beneficent;
        return this.http
            .put(`${environment.apiBaseUrl}/beneficents/${id}`, updateData)
            .pipe(
                catchError((error) => {
                    this.snackbar.open('Error al actualizar bienhechore', 'Cerrar', {
                        duration: 5000,
                    });
                    return throwError(() => error);
                })
            );
    }

    /**
     * Elimina un bienhechore por ID
     * @param id ID del bienhechore a eliminar
     * @returns Observable con el resultado de la eliminación
     */
    delete(id: number): Observable<any> {
        return this.http
            .delete(`${environment.apiBaseUrl}/beneficents/${id}`)
            .pipe(
                catchError((error) => {
                    this.snackbar.open('Error al eliminar bienhechore', 'Cerrar', {
                        duration: 5000,
                    });
                    return throwError(() => error);
                })
            );
    }
}
