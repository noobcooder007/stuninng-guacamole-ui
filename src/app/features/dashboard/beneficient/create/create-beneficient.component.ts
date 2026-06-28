import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BeneficientService, CreateBeneficientDto } from '@app/core/services/beneficient.service';
import { Church, ChurchService } from '@app/core/services/church.service';
import { addressExclusiveFieldsValidator } from '@app/shared/validators/exclusive-fields-validators.validator';
import { debounceTime } from 'rxjs';
import { AddressPipe } from '@app/shared/pipes/address.pipe';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

@Component({
    selector: 'create-beneficient',
    templateUrl: 'create-beneficient.component.html',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatSelectModule,
        MatDatepickerModule,
        MatButtonModule,
        MatCheckboxModule,
        MatIconModule,
        MatProgressSpinnerModule,
        AddressPipe,
        HasPermissionPipe,
    ]
})

export class CreateBeneficientComponent implements OnInit {
    protected readonly Permissions = Permissions;
    public isLoading = signal(false);
    private readonly beneficientService = inject(BeneficientService);
    private readonly churchService = inject(ChurchService);
    private readonly snackbar = inject(MatSnackBar);

    createBeneficientForm = new FormGroup({
        title: new FormControl(null, [Validators.required]),
        firstname: new FormControl(null, [Validators.required]),
        firstLastname: new FormControl(null, [Validators.required]),
        secondLastname: new FormControl(null),
        genre: new FormControl(null, [Validators.required]),
        birthday: new FormControl(null, [Validators.required]),
        maritalStatus: new FormControl(null, [Validators.required]),
        weddingAnniversary: new FormControl(null),
        email: new FormControl(null, [Validators.email]),
        phoneNumber: new FormControl(null),
        keepPrivate: new FormControl(false),
        address: new FormGroup({
            street: new FormControl(null, [Validators.required]),
            numeration: new FormGroup({
                noExt: new FormControl(null, [Validators.required]),
                noInt: new FormControl(null),
            }),
            neighborhood: new FormControl(null),
            locality: new FormControl(null),
            city: new FormControl(null, [Validators.required]),
            state: new FormControl(null, [Validators.required]),
            zipCode: new FormControl(null, [Validators.required, Validators.pattern(/^\d{5}$/)]),
        }, { validators: [addressExclusiveFieldsValidator] }),
        churchId: new FormControl(null, [Validators.required]),
        person: new FormControl(null),
        registeredName: new FormControl(null),
        rfc: new FormControl(null),
    });
    churchList: Church[] = [];

    ngOnInit() {
        this.churchService.getChurches().subscribe((response) => {
            this.churchList = [...response.data.items];
        });
        const martialStatusCtrl = this.createBeneficientForm.get('maritalStatus');
        const weddingAnniversaryCtrl = this.createBeneficientForm.get('weddingAnniversary');
        martialStatusCtrl?.valueChanges
            .pipe(debounceTime(300))
            .subscribe(() => {
                if (martialStatusCtrl.value === 'Casado') {
                    weddingAnniversaryCtrl?.reset();
                    weddingAnniversaryCtrl?.enable();
                } else {
                    weddingAnniversaryCtrl?.reset();
                    weddingAnniversaryCtrl?.disable();
                }
            });
        const personCtrl = this.createBeneficientForm.get('person');
        const rfcCtrl = this.createBeneficientForm.get('rfc');
        personCtrl?.valueChanges
            .pipe(debounceTime(300))
            .subscribe(() => {
                rfcCtrl?.clearValidators();
                switch(personCtrl.value!) {
                    case 'FISICA':
                        rfcCtrl?.addValidators([Validators.minLength(13), Validators.maxLength(13)]);
                        break;
                    case 'MORAL':
                        rfcCtrl?.addValidators([Validators.minLength(12), Validators.maxLength(12)]);
                        break;

                }
                rfcCtrl?.markAsTouched();
            })
    }

    createBeneficient() {
        if (this.createBeneficientForm.invalid) return;
        const dto = this.createBeneficientForm.value as any as CreateBeneficientDto;
        dto.churchId = (this.createBeneficientForm.get('churchId')?.value as any as Church).id;
        this.isLoading.set(true);
        this.beneficientService.create(dto).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.snackbar.open('Bienhechor creado correctamente', 'Cerrar', { duration: 4000 });
                this.reset();
            },
            error: () => this.isLoading.set(false),
        });
    }

    reset() {
        this.createBeneficientForm.reset();
    }

    displayFn(church: Church): string {
        return church && `${church.ecclesialIdentity.name}`;
    }
}