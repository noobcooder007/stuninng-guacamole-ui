import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
    BeneficientService,
    BeneficientDetail,
    UpdatePersonalDto,
    UpdateAddressDto,
    UpdateContactDto,
    UpdateChurchDto,
    UpdateTaxDto,
    UpdatePrivacyDto,
} from '@app/core/services/beneficient.service';
import { Church, ChurchService } from '@app/core/services/church.service';
import { GenderPipe } from '@app/shared/pipes/gender.pipe';
import { Observable } from 'rxjs';

const atMostOneAddressField: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const neighborhood = control.get('neighborhood')?.value;
    const locality = control.get('locality')?.value;
    return neighborhood && locality ? { exclusiveFields: true } : null;
};

@Component({
    selector: 'beneficient-detail',
    standalone: true,
    templateUrl: './beneficient-detail.component.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DatePipe,
        GenderPipe,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatCheckboxModule,
        MatAutocompleteModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
    ],
})
export class BeneficientDetailComponent implements OnInit {
    private readonly beneficientService = inject(BeneficientService);
    private readonly churchService = inject(ChurchService);
    private readonly route = inject(ActivatedRoute);
    beneficient = signal<BeneficientDetail | null>(null);
    isLoading = signal(true);
    editingSection = signal<string | null>(null);
    isSaving = signal(false);
    churchList: Church[] = [];

    personalForm = new FormGroup({
        title: new FormControl('', [Validators.required]),
        firstname: new FormControl('', [Validators.required]),
        firstLastname: new FormControl('', [Validators.required]),
        secondLastname: new FormControl(''),
        birthday: new FormControl<Date | null>(null, [Validators.required]),
        genre: new FormControl('', [Validators.required]),
        maritalStatus: new FormControl('', [Validators.required]),
        weddingAnniversary: new FormControl<Date | null>({ value: null, disabled: true }),
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

    contactForm = new FormGroup({
        email: new FormControl('', [Validators.email]),
        phoneNumber: new FormControl(''),
    });

    churchForm = new FormGroup({
        church: new FormControl<Church | null>(null, [Validators.required]),
    });

    taxForm = new FormGroup({
        person: new FormControl<string | null>(null),
        registeredName: new FormControl(''),
        rfc: new FormControl(''),
    });

    privacyForm = new FormGroup({
        keepPrivate: new FormControl(false),
    });

    ngOnInit() {
        this.loadData();
        this.churchService.getChurches(1, 100).subscribe(r => { this.churchList = r.data.items; });

        const maritalCtrl = this.personalForm.get('maritalStatus');
        const weddingCtrl = this.personalForm.get('weddingAnniversary');
        maritalCtrl?.valueChanges.pipe(debounceTime(300)).subscribe(() => {
            if (maritalCtrl.value === 'Casado') {
                weddingCtrl?.enable();
            } else {
                weddingCtrl?.reset();
                weddingCtrl?.disable();
            }
        });

        const personCtrl = this.taxForm.get('person');
        const rfcCtrl = this.taxForm.get('rfc');
        personCtrl?.valueChanges.pipe(debounceTime(300)).subscribe(() => {
            rfcCtrl?.clearValidators();
            if (personCtrl.value === 'FISICA') rfcCtrl?.addValidators([Validators.minLength(13), Validators.maxLength(13)]);
            if (personCtrl.value === 'MORAL') rfcCtrl?.addValidators([Validators.minLength(12), Validators.maxLength(12)]);
            rfcCtrl?.updateValueAndValidity();
        });
    }

    loadData() {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.isLoading.set(true);
        this.beneficientService.getBeneficent(id).subscribe({
            next: (r) => { this.beneficient.set(r.data); this.isLoading.set(false); },
            error: () => this.isLoading.set(false),
        });
    }

    startEdit(section: string) {
        const b = this.beneficient();
        if (!b) return;
        this.editingSection.set(section);
        switch (section) {
            case 'personal':
                this.personalForm.patchValue({
                    title: b.title,
                    firstname: b.firstname,
                    firstLastname: b.firstLastname,
                    secondLastname: b.secondLastname,
                    birthday: b.birthday ? new Date(b.birthday) : null,
                    genre: b.genre,
                    maritalStatus: b.maritalStatus,
                    weddingAnniversary: b.weddingAniversary ? new Date(b.weddingAniversary) : null,
                });
                if (b.maritalStatus === 'Casado') {
                    this.personalForm.get('weddingAnniversary')?.enable();
                } else {
                    this.personalForm.get('weddingAnniversary')?.disable();
                }
                break;
            case 'address':
                this.addressForm.patchValue({
                    street: b.address.street,
                    noExt: b.address.numeration.noExt,
                    noInt: b.address.numeration.noInt ?? '',
                    neighborhood: b.address.neighborhood ?? '',
                    locality: b.address.locality ?? '',
                    city: b.address.city,
                    state: b.address.state,
                    zipCode: b.address.zipCode,
                });
                break;
            case 'contact':
                this.contactForm.patchValue({ email: b.email ?? '', phoneNumber: b.phoneNumber ?? '' });
                break;
            case 'church':
                this.churchForm.reset();
                break;
            case 'tax':
                this.taxForm.patchValue({
                    person: b.person,
                    registeredName: b.registeredName ?? '',
                    rfc: b.rfc ?? '',
                });
                break;
            case 'privacy':
                this.privacyForm.patchValue({ keepPrivate: b.keepPrivate ?? false });
                break;
        }
    }

    cancelEdit() { this.editingSection.set(null); }

    savePersonal() {
        if (this.personalForm.invalid) return;
        const v = this.personalForm.getRawValue();
        const dto: UpdatePersonalDto = {
            title: v.title ?? undefined,
            firstname: v.firstname ?? undefined,
            firstLastname: v.firstLastname ?? undefined,
            secondLastname: v.secondLastname ?? undefined,
            birthday: v.birthday ?? undefined,
            genre: v.genre ?? undefined,
            maritalStatus: v.maritalStatus ?? undefined,
            weddingAnniversary: v.weddingAnniversary ?? null,
        };
        this.persist('personal', this.beneficientService.patchPersonal(this.beneficient()!.id, dto));
    }

    saveAddress() {
        if (this.addressForm.invalid) return;
        const v = this.addressForm.value;
        const dto: UpdateAddressDto = {
            street: v.street || undefined,
            noExt: v.noExt || undefined,
            noInt: v.noInt || undefined,
            neighborhood: v.neighborhood || undefined,
            locality: v.locality || undefined,
            city: v.city || undefined,
            state: v.state || undefined,
            zipCode: v.zipCode || undefined,
        };
        this.persist('address', this.beneficientService.patchAddress(this.beneficient()!.id, dto));
    }

    saveContact() {
        if (this.contactForm.invalid) return;
        const v = this.contactForm.value;
        const dto: UpdateContactDto = { email: v.email || null, phoneNumber: v.phoneNumber || null };
        this.persist('contact', this.beneficientService.patchContact(this.beneficient()!.id, dto));
    }

    saveChurch() {
        if (this.churchForm.invalid) return;
        const church = this.churchForm.get('church')?.value as Church;
        const dto: UpdateChurchDto = { churchId: church.id };
        this.persist('church', this.beneficientService.patchChurch(this.beneficient()!.id, dto));
    }

    saveTax() {
        if (this.taxForm.invalid) return;
        const v = this.taxForm.value;
        const dto: UpdateTaxDto = {
            person: (v.person as any) ?? null,
            registeredName: v.registeredName || undefined,
            rfc: v.rfc || undefined,
        };
        this.persist('tax', this.beneficientService.patchTax(this.beneficient()!.id, dto));
    }

    savePrivacy() {
        const v = this.privacyForm.value;
        this.persist('privacy', this.beneficientService.patchPrivacy(this.beneficient()!.id, { keepPrivate: v.keepPrivate ?? false }));
    }

    private persist(section: string, request: Observable<any>) {
        this.isSaving.set(true);
        request.subscribe({
            next: () => { this.isSaving.set(false); this.editingSection.set(null); this.loadData(); },
            error: () => this.isSaving.set(false),
        });
    }

    displayChurchFn(church: Church): string {
        return church?.ecclesialIdentity?.name ?? '';
    }
}
