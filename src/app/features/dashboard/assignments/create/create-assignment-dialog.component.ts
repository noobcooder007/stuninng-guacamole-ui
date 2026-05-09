import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { BeneficientService } from '@app/core/services/beneficient.service';
import { CollectorService, Collector } from '@app/core/services/collector.service';

export interface AssignedDonor {
    beneficentId: number | null;
    collectorId: string | null;
    beneficentLabel: string;
    collectorLabel: string;
}

@Component({
    selector: 'create-assignment-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatTableModule,
        MatIconModule,
        MatListModule,
        MatCheckboxModule,
    ],
    templateUrl: './create-assignment-dialog.component.html',
})
export class CreateAssignmentDialogComponent implements OnInit {
    private readonly dialogRef = inject(MatDialogRef<CreateAssignmentDialogComponent>);
    private readonly beneficientService = inject(BeneficientService);
    private readonly collectorService = inject(CollectorService);

    public form = new FormGroup({
        beneficentId: new FormControl<number | null>(null, Validators.required),
        collectorId: new FormControl<string | null>(null, Validators.required),
        transferCollectorId: new FormControl<string | null>(null, Validators.required),
    });

    public beneficents: Array<{ id: number; firstname?: string; firstLastname?: string; secondLastname?: string }> = [];
    public collectors: Collector[] = [];
    public addedDonors: AssignedDonor[] = [];

    public availableDonors: Array<{ id: number; label: string }> = [];
    public selectedDonors: Array<{ id: number; label: string }> = [];

    public displayedColumns = ['donor', 'collector', 'actions'];

    ngOnInit() {
        this.loadBeneficents();
        this.loadCollectors();
    }

    loadBeneficents() {
        this.beneficientService.getBeneficents(1, 50).subscribe({
            next: ({ data }) => {
                this.beneficents = data.items.map((item: any) => ({
                    id: item.id,
                    firstname: item.firstname,
                    firstLastname: item.firstLastname,
                    secondLastname: item.secondLastname,
                }));
                this.availableDonors = this.beneficents.map((beneficent) => ({
                    id: beneficent.id,
                    label: `${beneficent.firstname ?? 'Sin nombre'} ${beneficent.firstLastname ?? ''} ${beneficent.secondLastname ?? ''}`.trim(),
                }));
            },
        });
    }

    loadCollectors() {
        this.collectorService.getCollectors(1, 50).subscribe({
            next: ({ data }) => {
                this.collectors = data.items;
            },
        });
    }

    get selectedBeneficent() {
        const id = this.form.get('beneficentId')?.value;
        return this.beneficents.find((item) => item.id === id);
    }

    get selectedCollector() {
        const id = this.form.get('collectorId')?.value;
        return this.collectors.find((item) => item.id === id);
    }

    addCollectorAndDonor() {
        if (this.form.invalid) return;

        const beneficent = this.selectedBeneficent;
        const collector = this.selectedCollector;
        if (!beneficent || !collector) return;

        const donatorLabel = `${beneficent.firstname ?? 'Sin nombre'} ${beneficent.firstLastname ?? ''} ${beneficent.secondLastname ?? ''}`.trim();
        const collectorLabel = `${collector.firstname} ${collector.firstLastname} ${collector.secondLastname ?? ''}`.trim();

        this.addedDonors.push({
            beneficentId: beneficent.id,
            collectorId: collector.id,
            beneficentLabel: donatorLabel,
            collectorLabel,
        });

        this.form.patchValue({ beneficentId: null, collectorId: null });
    }

    removeAddedDonor(index: number) {
        this.addedDonors.splice(index, 1);
    }

    transferRight(selection: any[]) {
        const selected = selection.map((option: any) => option.value as { id: number; label: string });
        selected.forEach((item) => {
            if (!this.selectedDonors.some((donor) => donor.id === item.id)) {
                this.selectedDonors.push(item);
            }
            this.availableDonors = this.availableDonors.filter((donor) => donor.id !== item.id);
        });
    }

    transferLeft(selection: any[]) {
        const selected = selection.map((option: any) => option.value as { id: number; label: string });
        selected.forEach((item) => {
            if (!this.availableDonors.some((donor) => donor.id === item.id)) {
                this.availableDonors.push(item);
            }
            this.selectedDonors = this.selectedDonors.filter((donor) => donor.id !== item.id);
        });
    }

    close() {
        this.dialogRef.close();
    }

    save() {
        // En este punto se puede integrar con un servicio de creación de asignaciones.
        this.dialogRef.close({ addedDonors: this.addedDonors, selectedDonors: this.selectedDonors });
    }
}
