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
    CollectorService,
    Collector,
    UpdateCollectorPersonalDto,
    UpdateCollectorAddressDto,
    UpdateCollectorContactDto,
    UpdateCollectorPaymentDto,
    UpdateCollectorNotesDto,
} from '@app/core/services/collector.service';
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
    selector: 'app-colector-detail',
    standalone: true,
    templateUrl: './colector-detail.component.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
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
export class ColectorDetailComponent implements OnInit {
    protected readonly Permissions = Permissions;
    private readonly collectorService = inject(CollectorService);
    private readonly route = inject(ActivatedRoute);
    private readonly snackbar = inject(MatSnackBar);
    collector = signal<Collector | null>(null);
    isLoading = signal(true);
    editingSection = signal<string | null>(null);
    isSaving = signal(false);
    isGeneratingEfficiency = signal(false);

    personalForm = new FormGroup({
        firstname: new FormControl('', [Validators.required]),
        firstLastname: new FormControl('', [Validators.required]),
        secondLastname: new FormControl(''),
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
        phoneNumber: new FormControl('', [Validators.required]),
        telephoneNumber: new FormControl(''),
    });

    paymentForm = new FormGroup({
        commissionPercent: new FormControl<number | null>(null, [Validators.min(0), Validators.max(100)]),
        nomina: new FormControl<number | null>(null, [Validators.min(0)]),
        transportAllowance: new FormControl<number | null>(null, [Validators.min(0)]),
        bank: new FormControl(''),
        reference: new FormControl(''),
    });

    notesForm = new FormGroup({
        notes: new FormControl('', [Validators.required]),
    });

    ngOnInit() { this.loadData(); }

    generarEficiencia(): void {
        const id = this.collector()?.id;
        if (!id) return;
        this.isGeneratingEfficiency.set(true);
        this.collectorService.efficiencyPdf(id).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                this.isGeneratingEfficiency.set(false);
            },
            error: () => this.isGeneratingEfficiency.set(false),
        });
    }

    loadData() {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.isLoading.set(true);
        this.collectorService.getCollector(id).subscribe({
            next: (r) => { this.collector.set(r.data); this.isLoading.set(false); },
            error: () => this.isLoading.set(false),
        });
    }

    startEdit(section: string) {
        const c = this.collector();
        if (!c) return;
        this.editingSection.set(section);
        switch (section) {
            case 'personal':
                this.personalForm.patchValue({
                    firstname: c.firstname,
                    firstLastname: c.firstLastname,
                    secondLastname: c.secondLastname ?? '',
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
            case 'contact':
                this.contactForm.patchValue({
                    phoneNumber: c.phoneNumber ?? c.maskedPhoneNumber,
                    telephoneNumber: c.telephoneNumber ?? c.maskedTelephoneNumber ?? '',
                });
                break;
            case 'payment':
                this.paymentForm.patchValue({
                    commissionPercent: c.paymentData.commissionPercent,
                    nomina: c.paymentData.nomina ?? null,
                    transportAllowance: c.paymentData.transportAllowance ?? null,
                    bank: c.paymentData.bank,
                    reference: c.paymentData.reference,
                });
                break;
            case 'notes':
                this.notesForm.patchValue({ notes: c.notes ?? '' });
                break;
        }
    }

    cancelEdit() { this.editingSection.set(null); }

    savePersonal() {
        if (this.personalForm.invalid) return;
        const v = this.personalForm.value;
        const dto: UpdateCollectorPersonalDto = {
            firstname: v.firstname ?? undefined,
            firstLastname: v.firstLastname ?? undefined,
            secondLastname: v.secondLastname || null,
        };
        this.persist('personal', this.collectorService.patchPersonal(this.collector()!.id, dto));
    }

    saveAddress() {
        if (this.addressForm.invalid) return;
        const v = this.addressForm.value;
        const dto: UpdateCollectorAddressDto = {
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
        this.persist('address', this.collectorService.patchAddress(this.collector()!.id, dto));
    }

    saveContact() {
        if (this.contactForm.invalid) return;
        const v = this.contactForm.value;
        const dto: UpdateCollectorContactDto = {
            phoneNumber: v.phoneNumber ?? undefined,
            telephoneNumber: v.telephoneNumber || null,
        };
        this.persist('contact', this.collectorService.patchContact(this.collector()!.id, dto));
    }

    savePayment() {
        if (this.paymentForm.invalid) return;
        const v = this.paymentForm.value;
        const dto: UpdateCollectorPaymentDto = {
            commissionPercent: v.commissionPercent ?? undefined,
            nomina: v.nomina ?? undefined,
            transportAllowance: v.transportAllowance ?? undefined,
            bank: v.bank || undefined,
            reference: v.reference || undefined,
        };
        this.persist('payment', this.collectorService.patchPayment(this.collector()!.id, dto));
    }

    saveNotes() {
        if (this.notesForm.invalid) return;
        const dto: UpdateCollectorNotesDto = { notes: this.notesForm.value.notes! };
        this.persist('notes', this.collectorService.patchNotes(this.collector()!.id, dto));
    }

    private persist(section: string, request: Observable<any>) {
        this.isSaving.set(true);
        request.subscribe({
            next: () => { this.isSaving.set(false); this.snackbar.open('Cambios guardados correctamente', 'Cerrar', { duration: 4000 }); this.editingSection.set(null); this.loadData(); },
            error: () => this.isSaving.set(false),
        });
    }
}
