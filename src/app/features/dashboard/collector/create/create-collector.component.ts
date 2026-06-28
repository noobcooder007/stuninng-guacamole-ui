import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, merge } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CollectorService, CreateCollectorDto } from '@app/core/services/collector.service';
import { addressExclusiveFieldsValidator } from '@app/shared/validators/exclusive-fields-validators.validator';
import { passwordMatchValidator } from '@app/shared/validators/password-match-validator.validator';
import { PasswordFieldComponent } from '@app/shared/components/password-field/password-field.component';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

@Component({
    selector: 'create-collector',
    templateUrl: 'create-collector.component.html',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        PasswordFieldComponent,
        HasPermissionPipe,
    ]
})
export class CreateCollectorComponent implements OnInit {
    protected readonly Permissions = Permissions;
    public uploadingImage = signal(false);
    public isLoading = signal(false);
    private readonly collectorService = inject(CollectorService);
    private readonly snackbar = inject(MatSnackBar);
    private readonly cd = inject(ChangeDetectorRef);

    createCollectorForm = new FormGroup({
        profilePicture: new FormControl(null, [Validators.required]),
        firstname: new FormControl('', [Validators.required]),
        firstLastname: new FormControl('', [Validators.required]),
        secondLastname: new FormControl(''),
        nss: new FormControl('', [Validators.required, Validators.pattern(/^\d{11}$/)]),
        address: new FormGroup({
            street: new FormControl('', [Validators.required]),
            numeration: new FormGroup({
                noExt: new FormControl('', [Validators.required]),
                noInt: new FormControl(''),
            }),
            neighborhood: new FormControl(''),
            locality: new FormControl(''),
            city: new FormControl('', [Validators.required]),
            state: new FormControl('', [Validators.required]),
            zipCode: new FormControl('', [Validators.required, Validators.pattern(/^\d{5}$/)]),
        }, { validators: [addressExclusiveFieldsValidator] }),
        phoneNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{10}$/)]),
        telephoneNumber: new FormControl('', [Validators.pattern(/^\d{10}$/)]),
        commissionPercent: new FormControl(0, [Validators.required, Validators.min(0.01), Validators.max(100)]),
        bank: new FormControl('', [Validators.required]),
        reference: new FormControl('', [Validators.required]),
        notes: new FormControl(''),
        username: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]),
        confirmPassword: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]),
    }, {
        validators: [passwordMatchValidator],
    });
    imagePreview: string | ArrayBuffer | null = null;

    ngOnInit() {
        const nameCtrl = this.createCollectorForm.get('firstname');
        const lastNameCtrl = this.createCollectorForm.get('firstLastname');
        const nssCtrl = this.createCollectorForm.get('nss');

        if (nameCtrl && lastNameCtrl && nssCtrl) {
            merge(nameCtrl.valueChanges, lastNameCtrl.valueChanges, nssCtrl.valueChanges)
                .pipe(debounceTime(300))
                .subscribe(() => {
                    this.updateUsername();
                });
        }
    }

    private updateUsername() {
        const { firstname, firstLastname, nss } = this.createCollectorForm.value;
        const initial = firstname?.trim().at(0)?.toLowerCase();
        const lastName = firstLastname?.trim().toLowerCase();
        const last4NSS = nss?.substring(nss.length - 4);

        if (initial && lastName && last4NSS) {
            const suggestion = `${initial}${lastName}${last4NSS}`.normalize('NFD').replace(/\p{Diacritic}/gu, '');
            this.createCollectorForm.patchValue({ username: suggestion.toLowerCase() }, {
                emitEvent: false
            });
        }
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.uploadingImage.set(true);
            this.createCollectorForm.patchValue({ profilePicture: file });
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview = reader.result;
                this.uploadingImage.set(false);
                this.cd.detectChanges();
            };
            reader.onerror = () => {
                this.uploadingImage.set(false);
                this.cd.detectChanges();
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        }
    }

    createCollector() {
        if (this.createCollectorForm.invalid) return;
        const dto = this.createCollectorForm.value as any as CreateCollectorDto;
        this.isLoading.set(true);
        this.collectorService.create(dto).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.snackbar.open('Colector creado correctamente', 'Cerrar', { duration: 4000 });
                this.reset();
            },
            error: () => this.isLoading.set(false),
        });
    }

    reset() {
        this.createCollectorForm.reset();
        this.imagePreview = null;
    }
}
