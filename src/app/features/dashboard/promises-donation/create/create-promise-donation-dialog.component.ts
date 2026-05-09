import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { CreatePromiseDonationDto, PromisesDonationService } from '@app/core/services/promise-donation.service';

@Component({
    selector: 'create-promise-donation-dialog',
    templateUrl: './create-promise-donation-dialog.component.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        MatTableModule,
    ],
})
export class CreatePromiseDonationDialogComponent {
    private dialogRef = inject(MatDialogRef<CreatePromiseDonationDialogComponent>);
    private promisesService = inject(PromisesDonationService);
    private cdr = inject(ChangeDetectorRef);

    public form = new FormGroup({
        amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
        currency: new FormControl<'MXN' | 'USD'>('MXN', Validators.required),
        method: new FormControl<string>('', Validators.required),
        startDate: new FormControl<Date | null>(null, Validators.required),
        recurrence: new FormControl<number>(1, Validators.required),
        availability: new FormArray<FormGroup<{
            day: FormControl<string>;
            time: FormControl<string>;
            note: FormControl<string>;
        }>>([]),
    });

    public currencies = [
        { value: 'MXN', label: 'Pesos' },
        { value: 'USD', label: 'Dólares' },
    ];

    public recurrences = [
        { value: 1, label: 'Mensual' },
        { value: 2, label: 'Bimestral' },
        { value: 3, label: 'Trimestral' },
        { value: 4, label: 'Cuatrimestral' },
        { value: 6, label: 'Semestral' },
        { value: 12, label: 'Anual' },
    ];

    public displayedColumns: string[] = ['day', 'time', 'note', 'actions'];

    get availability(): FormArray {
        return this.form.get('availability') as FormArray;
    }

    addAvailability() {
        this.availability.push(new FormGroup({
            day: new FormControl('', Validators.required),
            time: new FormControl('', Validators.required),
            note: new FormControl(''),
        }));
        this.cdr.detectChanges();
    }

    removeAvailability(index: number) {
        this.availability.removeAt(index);
        this.cdr.detectChanges();
    }

    onSubmit() {
        if (this.form.valid) {
            const dto: CreatePromiseDonationDto = {
                amount: this.form.value.amount!,
                currency: this.form.value.currency!,
                method: this.form.value.method!,
                startDate: this.form.value.startDate!.toISOString().split('T')[0],
                recurrence: this.form.value.recurrence!,
                availability: this.form.value.availability?.map(a => ({
                    day: a.day as string,
                    time: a.time as string,
                    note: a.note as string,
                })),
            };

            this.promisesService.create(dto).subscribe({
                next: () => {
                    this.dialogRef.close(true);
                },
                error: () => {
                    // Error handled in service
                },
            });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
}
