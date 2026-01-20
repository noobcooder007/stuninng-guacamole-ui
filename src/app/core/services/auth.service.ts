import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from 'environments/environment.development';
import { LoginUsernamePasswordRequestDto }
    from '@app/features/auth/dto/login-username-password-request.dto';

export type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';

export interface AuthResponse {
    statusCode: number,
    data: {
        user: {
            username: string;
            role: string;
        };
        tokens: {
            accessToken: string;
            expiresIn: number;
            refreshToken: string;
            refreshExpiresIn: number;
            sessionId: string;
        }
    },
    timestamp: string;
}

export interface AuthToken {
    accessToken: string;
    expiresIn: number;
}

export interface AuthenticatedUser {
    username: string;
    role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient)
    private readonly _snackbar = inject(MatSnackBar);

    private _isLoading = signal(false);
    private _authStatus = signal<AuthStatus>('not-authenticated');
    private _authToken = signal<AuthToken | null>(null);
    private _authenticatedUser = signal<AuthenticatedUser | null>(null);

    public authStatus = computed<AuthStatus>(() => {
        if (this._authStatus() === 'checking') {
            return 'checking';
        }
        if (this._authToken()) {
            return 'authenticated';
        }
        return 'not-authenticated';
    });

    public login(user: LoginUsernamePasswordRequestDto): Observable<boolean> {
        const { username, password } = user;
        this._isLoading.set(true);
        this._authStatus.set('checking');

        return this.http.post(
            `${environment.apiBaseUrl}/auth/login`,
            { username: username.trim(), password: password.trim() },
            { withCredentials: true },
        )
            .pipe(
                map((response) => {
                    this._snackbar.open('Sesión iniciada correctamente', 'Cerrar', { duration: 5000 });
                    return this.handleAuthSuccess(response as AuthResponse);
                }),
                catchError((_) => {
                    this._isLoading.set(false);
                    this._snackbar.open('Oops credenciales invalidas', 'Cerrar', { duration: 5000 });
                    return of(false);
                })
            );
    }

    public refreshtoken(): Observable<boolean> {
        this._isLoading.set(true);
        this._authStatus.set('checking');
        return this.http.post<AuthResponse>(
            `${environment.apiBaseUrl}/auth/refresh`,
            {
                sessionId: localStorage.getItem('sessionId')
            },
            { withCredentials: true },
        ).pipe(
            map((response: AuthResponse) => this.handleAuthSuccess(response)),
            catchError(() => {
                this.logout();
                this._isLoading.set(false);
                return of(false);
            }),
        );
    }

    public logout(): Observable<void> {
        return this.http.post(
            `${environment.apiBaseUrl}/auth/logout`,
            {
                sessionId: localStorage.getItem('sessionId'),
            },
            { withCredentials: true },
        ).pipe(
            map(() => {
                this._snackbar.open('Sesion cerrada con exito', 'Cerrar', { duration: 5000 });
                this._authToken.set(null);
                this._authStatus.set('not-authenticated');
                localStorage.removeItem('refreshExpiresIn');
                localStorage.removeItem('sessionId');
            })
        );
    }

    public isAuthenticated(): boolean {
        const token = this.getAccessToken()
        return !!token;
    }

    public isAccessTokenExpired(threshold: number = 30): boolean {
        const token = this.getAccessToken();
        if (!token || !token.expiresIn ) {
            return true;
        }
        const now = Date.now();
        const expiresIn = new Date(token.expiresIn).getTime();
        return (expiresIn - now) < (threshold * 1000);
    }

    public getAuthenticatedUser(): AuthenticatedUser | null {
        return this._authenticatedUser();
    }

    public getAccessToken(): AuthToken | null {
        return this._authToken();
    }

    public handleAuthSuccess(response: AuthResponse) {
        this._authToken.set(
            {
                accessToken: response.data.tokens.accessToken,
                expiresIn: response.data.tokens.expiresIn
            });
        this._authenticatedUser.set(
            {
                username: response.data.user.username,
                role: response.data.user.role
            });
        this.saveAuthMetadata(response);
        this._isLoading.set(false);
        this._authStatus.set('authenticated');
        return true;
    }

    private saveAuthMetadata(authResponse: AuthResponse) {
        localStorage.setItem(
            'refreshExpiresIn', authResponse.data.tokens.refreshExpiresIn.toString());
        localStorage.setItem(
            'sessionId', authResponse.data.tokens.sessionId);
    }

    public isLoading(): boolean {
        return this._isLoading();
    }
}