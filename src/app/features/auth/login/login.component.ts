import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'login-component',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  
  ngOnInit(): void {
    this._route.queryParams.subscribe((params) => {
      this._returnUrl = params['returnUrl'];
    });
  }

  constructor() {
    const username = localStorage.getItem('username');
    const rememberMe = localStorage.getItem('remmemberMe');
    if (username) {
      this.loginForm.patchValue({ username });
    }
    if (rememberMe) {
      this.loginForm.patchValue({ rememberMe: true });
    }
  }

  private _returnUrl: string | null = null;
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _snackbar = inject(MatSnackBar);
  public hide = signal(true)
  public loginForm = inject(FormBuilder).group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(9)]],
    rememberMe: [false]
  });

  public isLoading(): boolean {
    return this._authService.isLoading();
  }

  public getAuthStatus(): 'checking' | 'authenticated' | 'not-authenticated' {
    return this._authService.authStatus();
  }

  public showPassword(event: MouseEvent): void {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  public onSubmit(event: Event): void {
    event.preventDefault();
    if (this.isLoading()) {
        return;
    }
    if (this.loginForm.valid) {
      const { username, password, rememberMe } = this.loginForm.value;
      if (!username || !password) return;
      if (rememberMe) {
        localStorage.setItem('username', username);
        localStorage.setItem('remmemberMe', 'true');
      } else {
        localStorage.removeItem('username');
        localStorage.removeItem('remmemberMe');
      }
      this._authService
        .login({ username, password })
        .subscribe((isAuthenticated) => {
          if (isAuthenticated) {
            this._router.navigateByUrl(this._returnUrl ?? '/');
          } else {
            this._snackbar.open('Credenciales inválidas', 'Cerrar', { duration: 5000 });
          }
        });
    }
  }

}
