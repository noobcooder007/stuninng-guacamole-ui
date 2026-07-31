import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from 'environments/environment';

export interface User {
    id: string;
    username: string;
    isActive: boolean;
    gender: 'MALE' | 'FEMALE' | null;
    roleId: string;
    role: string;
    createdAt: string;
}

interface UserListResponse {
    statusCode: number;
    data: User[];
    timestamp: string;
}

interface UserActionResponse {
    statusCode: number;
    data: unknown;
    timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly snackBar = inject(MatSnackBar);
    private readonly apiUrl = `${environment.apiBaseUrl}/users`;

    getUsers(): Observable<User[]> {
        return this.http.get<UserListResponse>(this.apiUrl).pipe(
            map(res => res.data ?? []),
            catchError(error => {
                this.snackBar.open('Error al obtener usuarios', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    updateStatus(id: string, isActive: boolean): Observable<void> {
        return this.http.patch<UserActionResponse>(`${this.apiUrl}/${id}/status`, { isActive }).pipe(
            map(() => void 0),
            catchError(error => {
                this.snackBar.open('Error al actualizar el estado', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    updateUsername(id: string, username: string): Observable<void> {
        return this.http.patch<UserActionResponse>(`${this.apiUrl}/${id}/username`, { username }).pipe(
            map(() => void 0),
            catchError(error => {
                const message = error?.status === 409
                    ? 'El nombre de usuario ya está en uso'
                    : 'Error al actualizar el nombre de usuario';
                this.snackBar.open(message, 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }

    updatePassword(id: string, newPassword: string): Observable<void> {
        return this.http.patch<UserActionResponse>(`${this.apiUrl}/${id}/password`, { newPassword }).pipe(
            map(() => void 0),
            catchError(error => {
                this.snackBar.open('Error al cambiar la contraseña', 'Cerrar', { duration: 5000 });
                return throwError(() => error);
            })
        );
    }
}
