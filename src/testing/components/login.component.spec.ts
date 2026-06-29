import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { LoginComponent } from '@app/features/auth/login/login.component';
import { AuthService } from '@app/core/services/auth.service';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let snackbarSpy: { open: ReturnType<typeof vi.fn> };
    let routerSpy: { navigateByUrl: ReturnType<typeof vi.fn> };
    let authServiceSpy: {
        login: ReturnType<typeof vi.fn>;
        isLoading: ReturnType<typeof vi.fn>;
        authStatus: ReturnType<typeof vi.fn>;
    };

    const build = (queryParams: Record<string, string> = {}) => {
        TestBed.configureTestingModule({
            imports: [LoginComponent],
            providers: [
                provideAnimationsAsync(),
                { provide: AuthService, useValue: authServiceSpy },
                { provide: MatSnackBar, useValue: snackbarSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: { queryParams: of(queryParams) } },
            ],
        });
        return TestBed.createComponent(LoginComponent).componentInstance;
    };

    beforeEach(() => {
        snackbarSpy = { open: vi.fn() };
        routerSpy = { navigateByUrl: vi.fn() };
        authServiceSpy = {
            login: vi.fn().mockReturnValue(of(true)),
            isLoading: vi.fn().mockReturnValue(false),
            authStatus: vi.fn().mockReturnValue('not-authenticated'),
        };
        vi.stubGlobal('localStorage', {
            getItem: vi.fn().mockReturnValue(null),
            setItem: vi.fn(),
            removeItem: vi.fn(),
        });
        TestBed.resetTestingModule();
    });

    afterEach(() => vi.unstubAllGlobals());

    describe('constructor()', () => {
        it('should pre-fill username from localStorage when present', () => {
            (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) =>
                key === 'username' ? 'saved_user' : null
            );
            component = build();
            expect(component.loginForm.value.username).toBe('saved_user');
        });

        it('should set rememberMe to true when stored in localStorage', () => {
            (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) =>
                key === 'remmemberMe' ? 'true' : null
            );
            component = build();
            expect(component.loginForm.value.rememberMe).toBe(true);
        });

        it('should leave form empty when localStorage has no stored values', () => {
            component = build();
            expect(component.loginForm.value.username).toBe('');
            expect(component.loginForm.value.rememberMe).toBe(false);
        });
    });

    describe('ngOnInit()', () => {
        it('should read returnUrl from query params', () => {
            component = build({ returnUrl: '/dashboard' });
            component.ngOnInit();
            expect((component as any)._returnUrl).toBe('/dashboard');
        });
    });

    describe('showPassword()', () => {
        it('should toggle hide signal on each call', () => {
            component = build();
            expect(component.hide()).toBe(true);
            component.showPassword({ stopPropagation: vi.fn() } as any);
            expect(component.hide()).toBe(false);
            component.showPassword({ stopPropagation: vi.fn() } as any);
            expect(component.hide()).toBe(true);
        });
    });

    describe('isLoading()', () => {
        it('should delegate to authService.isLoading()', () => {
            authServiceSpy.isLoading.mockReturnValue(true);
            component = build();
            expect(component.isLoading()).toBe(true);
        });
    });

    describe('onSubmit()', () => {
        const event = { preventDefault: vi.fn() } as any;

        it('should do nothing when authService is loading', () => {
            authServiceSpy.isLoading.mockReturnValue(true);
            component = build();
            component.loginForm.patchValue({ username: 'user', password: 'password123' });
            component.onSubmit(event);
            expect(authServiceSpy.login).not.toHaveBeenCalled();
        });

        it('should not call login when form is invalid', () => {
            component = build();
            component.loginForm.patchValue({ username: '', password: '' });
            component.onSubmit(event);
            expect(authServiceSpy.login).not.toHaveBeenCalled();
        });

        it('should call login and navigate to returnUrl on success', () => {
            component = build({ returnUrl: '/home' });
            component.ngOnInit();
            component.loginForm.patchValue({ username: 'user', password: 'password123' });
            component.onSubmit(event);
            expect(authServiceSpy.login).toHaveBeenCalledWith({ username: 'user', password: 'password123' });
            expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home');
        });

        it('should navigate to "/" when no returnUrl is set', () => {
            component = build();
            component.ngOnInit();
            component.loginForm.patchValue({ username: 'user', password: 'password123' });
            component.onSubmit(event);
            expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/');
        });

        it('should show snackbar when login returns false', () => {
            authServiceSpy.login.mockReturnValue(of(false));
            component = build();
            component.ngOnInit();
            component.loginForm.patchValue({ username: 'user', password: 'password123' });
            component.onSubmit(event);
            expect(snackbarSpy.open).toHaveBeenCalledWith('Credenciales inválidas', 'Cerrar', { duration: 5000 });
        });

        it('should persist username and rememberMe in localStorage when checked', () => {
            component = build();
            component.loginForm.patchValue({ username: 'juan', password: 'password123', rememberMe: true });
            component.onSubmit(event);
            expect(localStorage.setItem).toHaveBeenCalledWith('username', 'juan');
            expect(localStorage.setItem).toHaveBeenCalledWith('remmemberMe', 'true');
        });

        it('should remove stored credentials from localStorage when rememberMe is unchecked', () => {
            component = build();
            component.loginForm.patchValue({ username: 'juan', password: 'password123', rememberMe: false });
            component.onSubmit(event);
            expect(localStorage.removeItem).toHaveBeenCalledWith('username');
            expect(localStorage.removeItem).toHaveBeenCalledWith('remmemberMe');
        });
    });
});
