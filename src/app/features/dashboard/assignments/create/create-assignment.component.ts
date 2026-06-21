import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, forkJoin, map, switchMap } from 'rxjs';
import { BeneficientService } from '@app/core/services/beneficient.service';
import { CollectorService, CollectorListItem } from '@app/core/services/collector.service';
import { AssignmentService, CreateAssignmentDto } from '@app/core/services/assignment.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

interface BeneficentOption { id: number; label: string; }

interface AssignedDonor {
    beneficentId: number;
    collectorId: string;
    beneficentLabel: string;
    collectorLabel: string;
}

@Component({
    selector: 'create-assignment',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        HasPermissionPipe,
    ],
    templateUrl: './create-assignment.component.html',
})
export class CreateAssignmentComponent implements OnInit {
    protected readonly Permissions = Permissions;
    private readonly router = inject(Router);
    private readonly beneficientService = inject(BeneficientService);
    private readonly collectorService = inject(CollectorService);
    private readonly assignmentService = inject(AssignmentService);

    public isSaving = signal(false);
    public isLoadingBeneficents = signal(true);
    public isLoadingCollectors = signal(true);

    public beneficentCtrl = new FormControl('');
    public collectorCtrl = new FormControl('');

    private allBeneficents: BeneficentOption[] = [];

    public filteredBeneficents = signal<BeneficentOption[]>([]);
    public filteredCollectors = signal<CollectorListItem[]>([]);

    private selectedBeneficent: BeneficentOption | null = null;
    private selectedCollector: CollectorListItem | null = null;

    public addedDonors: AssignedDonor[] = [];

    displayBeneficent = (option: BeneficentOption | null) => option?.label ?? '';
    displayCollector = (option: CollectorListItem | null) =>
        option ? `${option.firstname} ${option.firstLastname} ${option.secondLastname ?? ''}`.trim() : '';

    get canAddPair(): boolean {
        return this.selectedBeneficent !== null && this.selectedCollector !== null;
    }

    get addPairHint(): string {
        if (!this.selectedBeneficent && !this.selectedCollector) return 'Selecciona un donador y un colector';
        if (!this.selectedBeneficent) return 'Falta seleccionar un donador';
        return 'Falta seleccionar un colector';
    }

    ngOnInit() {
        this.loadBeneficents();
        this.setupCollectorSearch();

        this.beneficentCtrl.valueChanges.subscribe(v => {
            if (typeof v !== 'string') return;
            const term = v.toLowerCase();
            this.filteredBeneficents.set(
                term ? this.allBeneficents.filter(b => b.label.toLowerCase().includes(term))
                     : this.allBeneficents
            );
        });
    }

    private loadBeneficents() {
        this.isLoadingBeneficents.set(true);
        this.beneficientService.getUnassigned().pipe(map(r => r.data.items)).subscribe({
            next: items => {
                this.allBeneficents = (items as any[])
                    .map(b => ({
                        id: b.id,
                        label: `${b.firstname ?? 'Sin nombre'} ${b.firstLastname ?? ''} ${b.secondLastname ?? ''}`.trim(),
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
                this.filteredBeneficents.set(this.allBeneficents);
                this.isLoadingBeneficents.set(false);
            },
            error: () => this.isLoadingBeneficents.set(false),
        });
    }

    private setupCollectorSearch() {
        this.isLoadingCollectors.set(true);
        this.collectorService.getActiveList().subscribe({
            next: items => {
                this.filteredCollectors.set(items);
                this.isLoadingCollectors.set(false);
            },
            error: () => this.isLoadingCollectors.set(false),
        });

        this.collectorCtrl.valueChanges.pipe(
            filter(v => typeof v === 'string'),
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(v => {
                const term = (v as string).trim();
                this.isLoadingCollectors.set(true);
                return this.collectorService.getActiveList(term || undefined);
            }),
        ).subscribe({
            next: items => {
                this.filteredCollectors.set(items);
                this.isLoadingCollectors.set(false);
            },
            error: () => this.isLoadingCollectors.set(false),
        });
    }

    onBeneficientSelected(option: BeneficentOption) { this.selectedBeneficent = option; }
    onCollectorSelected(option: CollectorListItem) { this.selectedCollector = option; }

    clearBeneficent() {
        this.beneficentCtrl.reset('');
        this.selectedBeneficent = null;
    }

    clearCollector() {
        this.collectorCtrl.reset('');
        this.selectedCollector = null;
    }

    addPair() {
        if (!this.canAddPair) return;
        const alreadyAdded = this.addedDonors.some(
            d => d.beneficentId === this.selectedBeneficent!.id && d.collectorId === this.selectedCollector!.id
        );
        if (alreadyAdded) return;

        this.addedDonors = [...this.addedDonors, {
            beneficentId: this.selectedBeneficent!.id,
            collectorId: this.selectedCollector!.id,
            beneficentLabel: this.selectedBeneficent!.label,
            collectorLabel: this.displayCollector(this.selectedCollector),
        }];
        this.beneficentCtrl.reset('');
        this.collectorCtrl.reset('');
        this.selectedBeneficent = null;
        this.selectedCollector = null;
    }

    removePair(index: number) {
        this.addedDonors = this.addedDonors.filter((_, i) => i !== index);
    }

    save() {
        if (!this.addedDonors.length) return;
        this.isSaving.set(true);

        const byCollector = this.addedDonors.reduce((acc, d) => {
            if (!acc[d.collectorId]) acc[d.collectorId] = [];
            acc[d.collectorId].push(String(d.beneficentId));
            return acc;
        }, {} as Record<string, string[]>);

        forkJoin(
            Object.entries(byCollector).map(([collectorId, beneficientsIds]) =>
                this.assignmentService.create({ collectorId, beneficientsIds } as CreateAssignmentDto)
            )
        ).subscribe({
            next: () => { this.isSaving.set(false); this.addedDonors = []; },
            error: () => this.isSaving.set(false),
        });
    }

    cancel() { this.router.navigate(['/assignments']); }
}
