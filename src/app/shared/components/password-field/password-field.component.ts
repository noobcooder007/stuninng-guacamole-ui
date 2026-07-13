import { Component, Input, Optional, Self } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from "@angular/material/button";
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ErrorStateMatcher } from '@angular/material/core';

export class ParentErrorStateMatcher implements ErrorStateMatcher {
  constructor(private controlDir: NgControl) {}

  isErrorState(control: FormControl | null): boolean {
    // Se pone rojo si el control del padre es inválido y fue tocado/editado
    const parentInvalid = !!(this.controlDir && this.controlDir.invalid);
    const touched = !!(control && (control.dirty || control.touched));
    return parentInvalid && touched;
  }
}

@Component({
    selector: 'password-field',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule
    ],
    template: `
        <mat-form-field class="w-full" appearance="outline">
            <mat-label>{{ label }}</mat-label>
            <input matInput [type]="hide ? 'password' : 'text'" [placeholder]="placeholder" [formControl]="internalControl" [errorStateMatcher]="matcher" (blur)="onTouched()" />
            <button type="button" matIconButton matSuffix (click)="hide = !hide" data-cuelume-toggle>
                <mat-icon>{{ hide ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (controlDir.hasError('passwordMismatch')) {
                <mat-error>Las contraseñas no coinciden</mat-error>
            }
        </mat-form-field>
    `,
})

export class PasswordFieldComponent implements ControlValueAccessor {
    @Input() label: string = '';
    @Input() placeholder: string = '';

    hide = true;
    internalControl = new FormControl();

    onChange: any = (val: any) => { };
    onTouched: any = () => { };

    matcher!: ParentErrorStateMatcher;

    constructor(@Self() @Optional() public controlDir: NgControl) {
        if (controlDir) {
            controlDir.valueAccessor = this;
            this.matcher = new ParentErrorStateMatcher(this.controlDir);
        }
        this.internalControl.valueChanges.subscribe(value => {
            this.onChange(value);
        });
    }

    writeValue(obj: any): void {
        this.internalControl.setValue(obj, { emitEvent: false });
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
}
