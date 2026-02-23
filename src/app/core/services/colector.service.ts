import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'environments/environment.development';

// Interfaces y tipos
export interface Colector {
    id: number;
    noColector: string;
    nombre: string;
    apPaterno: string;
    apMaterno: string;
    rfc: string;
    numeroSeguroSocial?: string;
    activo: boolean;
    calle?: string;
    colonia?: string;
    delegacionMunicipio?: string;
    poblacionCiudad?: string;
    codigoPostal?: string;
    entidadFederativa?: string;
    telefono?: string;
    celular?: string;
    email?: string;
    porcentajeComision?: number;
    contactoEmergente?: string;
    referenciaBancaria?: string;
    referencia?: string;
    observaciones?: string;
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
        items: Colector[];
        meta: PaginatedMetadata;
    };
    timestamp: string;
}

export interface ColectorFilters {
    search?: string; // Busqueda general (nombre, id, rfc)
    status?: 'todos' | 'activo' | 'inactivo';
}

export interface CreateColectorDto {
    noColector: string;
    nombre: string;
    apPaterno: string;
    apMaterno: string;
    rfc: string;
    numeroSeguroSocial?: string;
    activo: boolean;
    calle?: string;
    colonia?: string;
    delegacionMunicipio?: string;
    poblacionCiudad?: string;
    codigoPostal?: string;
    entidadFederativa?: string;
    telefono?: string;
    celular?: string;
    email?: string;
    porcentajeComision?: number;
    contactoEmergente?: string;
    referenciaBancaria?: string;
    referencia?: string;
    observaciones?: string;
}

export interface UpdateColectorDto extends CreateColectorDto {
    id: number;
}

@Injectable({ providedIn: 'root' })
export class ColectorService {
    private readonly http = inject(HttpClient);
    private readonly snackbar = inject(MatSnackBar);

    /**
     * Obtiene la lista de colectores con paginación y filtros
     */
    getColectores(
        page: number = 1,
        limit: number = 5,
        filters: ColectorFilters = {}
    ): Observable<PaginatedResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (filters.search) {
            params = params.set('search', filters.search);
        }

        if (filters.status && filters.status !== 'todos') {
            params = params.set('status', filters.status === 'activo' ? 'true' : 'false');
        }

        return this.http
            .get<PaginatedResponse>(`${environment.apiBaseUrl}/colectores`, { params })
            .pipe(
                catchError((error) => {
                    this.snackbar.open('Error al obtener colectores', 'Cerrar', {
                        duration: 5000,
                    });
                    return throwError(() => error);
                })
            );
    }

    /**
     * Obtiene un colector específico por ID
     */
    getColector(id: number): Observable<{ statusCode: number; data: Colector }> {
        return this.http.get<{ statusCode: number; data: Colector }>(
            `${environment.apiBaseUrl}/colectores/${id}`
        ).pipe(
            catchError((error) => {
                this.snackbar.open('Error al obtener datos del colector', 'Cerrar', {
                    duration: 5000,
                });
                return throwError(() => error);
            })
        );
    }

    /**
     * Crea un nuevo colector
     */
    create(colector: CreateColectorDto): Observable<any> {
        return this.http
            .post(`${environment.apiBaseUrl}/colectores`, colector)
            .pipe(
                catchError((error) => {
                    this.snackbar.open('Error al crear colector', 'Cerrar', {
                        duration: 5000,
                    });
                    return throwError(() => error);
                })
            );
    }

    /**
     * Actualiza un colector existente
     */
    update(colector: UpdateColectorDto): Observable<any> {
        const { id, ...updateData } = colector;
        return this.http
            .put(`${environment.apiBaseUrl}/colectores/${id}`, updateData)
            .pipe(
                catchError((error) => {
                    this.snackbar.open('Error al actualizar colector', 'Cerrar', {
                        duration: 5000,
                    });
                    return throwError(() => error);
                })
            );
    }

    /**
     * Elimina un colector por ID
     */
    delete(id: number): Observable<any> {
        return this.http
            .delete(`${environment.apiBaseUrl}/colectores/${id}`)
            .pipe(
                catchError((error) => {
                    this.snackbar.open('Error al eliminar colector', 'Cerrar', {
                        duration: 5000,
                    });
                    return throwError(() => error);
                })
            );
    }
}
