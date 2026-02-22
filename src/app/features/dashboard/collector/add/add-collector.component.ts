import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogTitle, MatDialogActions, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CollectorService, CreateCollectorDto } from '@app/core/services/collector.service';

@Component({
    selector: 'add-collector',
    templateUrl: 'add-collector.component.html',
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatDialogTitle,
        MatDialogActions,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
    ]
})
export class AddCollectorComponent {
    private readonly collectorService = inject(CollectorService);
    private readonly dialogRef = inject(MatDialogRef<AddCollectorComponent>);
    private isLoading = signal(false);

    createCollectorForm = new FormGroup({
        noColector: new FormControl('', [Validators.required]),
        nombre: new FormControl('', [Validators.required]),
        apPaterno: new FormControl(''),
        apMaterno: new FormControl(''),
        rfc: new FormControl(''),
        telefono: new FormControl('', [Validators.pattern(/^\d{10}$/)]),
        email: new FormControl('', [Validators.email]),
    });

    createCollector() {
        if (this.createCollectorForm.invalid) return;
        const dto: CreateCollectorDto = this.createCollectorForm.value as CreateCollectorDto;
        this.isLoading.set(true);
        this.collectorService.create(dto).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.dialogRef.close();
            },
            error: () => this.isLoading.set(false),
        });
    }

    close() {
        this.createCollectorForm.reset();
        this.dialogRef.close();
    }
}
