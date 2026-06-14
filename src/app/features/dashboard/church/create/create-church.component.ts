import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Address, ChurchService, CreateChurchDto, EcclesialIdentity, Priest } from '@app/core/services/church.service';

@Component({
    selector: 'create-church',
    templateUrl: 'create-church.component.html',
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ]
})

export class CreateChurchComponent {
    private readonly churchService = inject(ChurchService);
    public isLoading = signal(false);

    createChurchForm = new FormGroup({
        ecclesialIdentity: new FormGroup({
            name: new FormControl('', [Validators.required]),
            vicaria: new FormControl('', [Validators.required]),
            decanato: new FormControl('', [Validators.required]),
            parroquia: new FormControl('', [Validators.required]),
            capilla: new FormControl('', [Validators.required]),
        }),
        priest: new FormGroup({
            firstname: new FormControl('', [Validators.required]),
            firstLastname: new FormControl('', [Validators.required]),
            secondLastname: new FormControl(''),
        }),
        auxiliarPriest: new FormGroup({
            firstname: new FormControl('', [Validators.required]),
            firstLastname: new FormControl('', [Validators.required]),
            secondLastname: new FormControl(''),
        }),
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
        }),
        phoneNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{10}$/)]),
    });

    createChurch() {
        if (this.createChurchForm.invalid) return;
        const createChurchDto: CreateChurchDto = {
            ecclesialIdentity: this.createChurchForm.value.ecclesialIdentity as EcclesialIdentity,
            priest: this.createChurchForm.value.priest as Priest,
            auxiliarPriest: this.createChurchForm.value.auxiliarPriest as Priest,
            address: this.createChurchForm.value.address as Address,
            phoneNumber: this.createChurchForm.value.phoneNumber as string
        };
        this.isLoading.set(true);
        this.churchService.create(createChurchDto).subscribe({
            next: () => {
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
    }

    reset() {
        this.createChurchForm.reset();
    }
}
