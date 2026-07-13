import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
    ChurchService,
    Church,
    UpdateIdentityDto,
    UpdateAddressDto,
    UpdatePriestDto,
    UpdatePhoneDto,
} from '@app/core/services/church.service';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

const atMostOneAddressField: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const neighborhood = control.get('neighborhood')?.value;
    const locality = control.get('locality')?.value;
    return neighborhood && locality ? { exclusiveFields: true } : null;
};

@Component({
    selector: 'church-detail',
    standalone: true,
    templateUrl: './church-detail.component.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FullnamePipe,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatTooltipModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        HasPermissionPipe,
    ],
})
export class ChurchDetailComponent implements OnInit {
    protected readonly Permissions = Permissions;
    private readonly churchService = inject(ChurchService);
    private readonly route = inject(ActivatedRoute);
    private readonly snackbar = inject(MatSnackBar);
    church = signal<Church | null>(null);
    isLoading = signal(true);
    editingSection = signal<string | null>(null);
    isSaving = signal(false);

    identityForm = new FormGroup({
        name: new FormControl('', [Validators.required]),
        vicaria: new FormControl(''),
        decanato: new FormControl(''),
        parroquia: new FormControl(''),
        capilla: new FormControl(''),
    });

    addressForm = new FormGroup({
        street: new FormControl(''),
        noExt: new FormControl(''),
        noInt: new FormControl(''),
        neighborhood: new FormControl(''),
        locality: new FormControl(''),
        city: new FormControl(''),
        state: new FormControl(''),
        zipCode: new FormControl('', [Validators.pattern(/^\d{5}$/)]),
    }, { validators: [atMostOneAddressField] });

    priestForm = new FormGroup({
        firstname: new FormControl('', [Validators.required]),
        firstLastname: new FormControl('', [Validators.required]),
        secondLastname: new FormControl(''),
    });

    auxiliarForm = new FormGroup({
        firstname: new FormControl('', [Validators.required]),
        firstLastname: new FormControl('', [Validators.required]),
        secondLastname: new FormControl(''),
    });

    phoneForm = new FormGroup({
        phoneNumber: new FormControl(''),
    });

    ngOnInit() { this.loadData(); }

    loadData() {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.isLoading.set(true);
        this.churchService.getChurch(id).subscribe({
            next: (r) => { this.church.set(r.data); this.isLoading.set(false); },
            error: () => this.isLoading.set(false),
        });
    }

    startEdit(section: string) {
        const c = this.church();
        if (!c) return;
        this.editingSection.set(section);
        switch (section) {
            case 'identity':
                this.identityForm.patchValue({
                    name: c.ecclesialIdentity.name,
                    vicaria: c.ecclesialIdentity.vicaria ?? '',
                    decanato: c.ecclesialIdentity.decanato ?? '',
                    parroquia: c.ecclesialIdentity.parroquia ?? '',
                    capilla: c.ecclesialIdentity.capilla ?? '',
                });
                break;
            case 'address':
                this.addressForm.patchValue({
                    street: c.address.street,
                    noExt: c.address.numeration?.noExt ?? '',
                    noInt: c.address.numeration?.noInt ?? '',
                    neighborhood: c.address.neighborhood ?? '',
                    locality: c.address.locality ?? '',
                    city: c.address.city,
                    state: c.address.state,
                    zipCode: c.address.zipCode,
                });
                break;
            case 'priest':
                this.priestForm.patchValue({
                    firstname: c.priest.firstname,
                    firstLastname: c.priest.firstLastname,
                    secondLastname: c.priest.secondLastname ?? '',
                });
                break;
            case 'auxiliar':
                this.auxiliarForm.patchValue({
                    firstname: c.auxiliarPriest.firstname,
                    firstLastname: c.auxiliarPriest.firstLastname,
                    secondLastname: c.auxiliarPriest.secondLastname ?? '',
                });
                break;
            case 'phone':
                this.phoneForm.patchValue({ phoneNumber: c.phoneNumber ?? '' });
                break;
        }
    }

    cancelEdit() { this.editingSection.set(null); }

    saveIdentity() {
        if (this.identityForm.invalid) return;
        const v = this.identityForm.value;
        const dto: UpdateIdentityDto = {
            name: v.name ?? undefined,
            vicaria: v.vicaria || undefined,
            decanato: v.decanato || undefined,
            parroquia: v.parroquia || undefined,
            capilla: v.capilla || undefined,
        };
        this.persist('identity', this.churchService.patchIdentity(this.church()!.id, dto));
    }

    saveAddress() {
        if (this.addressForm.invalid) return;
        const v = this.addressForm.value;
        const dto: UpdateAddressDto = {
            street: v.street || undefined,
            numeration: {
                noExt: v.noExt || undefined,
                noInt: v.noInt || undefined,
            },
            neighborhood: v.neighborhood || undefined,
            locality: v.locality || undefined,
            city: v.city || undefined,
            state: v.state || undefined,
            zipCode: v.zipCode || undefined,
        };
        this.persist('address', this.churchService.patchAddress(this.church()!.id, dto));
    }

    savePriest() {
        if (this.priestForm.invalid) return;
        const v = this.priestForm.value;
        const dto: UpdatePriestDto = {
            firstname: v.firstname ?? undefined,
            firstLastname: v.firstLastname ?? undefined,
            secondLastname: v.secondLastname || undefined,
        };
        this.persist('priest', this.churchService.patchPriest(this.church()!.id, dto));
    }

    saveAuxiliar() {
        if (this.auxiliarForm.invalid) return;
        const v = this.auxiliarForm.value;
        const dto: UpdatePriestDto = {
            firstname: v.firstname ?? undefined,
            firstLastname: v.firstLastname ?? undefined,
            secondLastname: v.secondLastname || undefined,
        };
        this.persist('auxiliar', this.churchService.patchAuxiliar(this.church()!.id, dto));
    }

    savePhone() {
        const v = this.phoneForm.value;
        const dto: UpdatePhoneDto = { phoneNumber: v.phoneNumber || undefined };
        this.persist('phone', this.churchService.patchPhone(this.church()!.id, dto));
    }

    private persist(section: string, request: Observable<any>) {
        this.isSaving.set(true);
        request.subscribe({
            next: () => { this.isSaving.set(false); this.snackbar.open('Cambios guardados correctamente', 'Cerrar', { duration: 4000 }); this.editingSection.set(null); this.loadData(); },
            error: () => this.isSaving.set(false),
        });
    }
}
