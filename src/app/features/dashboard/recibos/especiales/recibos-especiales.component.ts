import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import { BeneficientService, Beneficient } from '@app/core/services/beneficient.service';
import { CollectorService, CollectorListItem } from '@app/core/services/collector.service';
import { CreateSpecialReceiptDto, RecibosService, SpecialReceiptError } from '@app/core/services/recibos.service';
import { SpecialReceiptWarningDialogComponent } from './special-receipt-warning-dialog.component';

@Component({
    selector: 'app-recibos-especiales',
    standalone: true,
    templateUrl: './recibos-especiales.component.html',
    styleUrl: './recibos-especiales.component.scss',
    imports: [
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
    ],
})
export class RecibosEspecialesComponent implements OnInit {
    private readonly beneficientService = inject(BeneficientService);
    private readonly collectorService = inject(CollectorService);
    private readonly recibosService = inject(RecibosService);
    private readonly snackbar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);

    isSaving = signal(false);
    isLoadingBeneficients = signal(false);
    isLoadingCollectors = signal(false);

    filteredBeneficients = signal<Beneficient[]>([]);
    filteredCollectors = signal<CollectorListItem[]>([]);

    private selectedBeneficient: Beneficient | null = null;
    private selectedCollector: CollectorListItem | null = null;

    readonly currencies: { value: 'MXN' | 'USD'; label: string }[] = [
        { value: 'MXN', label: 'MXN' },
        { value: 'USD', label: 'USD' },
    ];

    beneficientCtrl = new FormControl('');
    collectorCtrl = new FormControl('');

    form = new FormGroup({
        amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
        currency: new FormControl<'MXN' | 'USD'>('MXN', Validators.required),
    });

    get canSave(): boolean {
        return this.form.valid && this.selectedBeneficient !== null && this.selectedCollector !== null;
    }

    displayBeneficient = (b: Beneficient | null): string =>
        b ? `${b.firstname} ${b.firstLastname} ${b.secondLastname ?? ''}`.trim() : '';

    displayCollector = (c: CollectorListItem | null): string =>
        c ? `${c.firstname} ${c.firstLastname} ${c.secondLastname ?? ''}`.trim() : '';

    ngOnInit(): void {
        this.setupBeneficientSearch();
        this.setupCollectorSearch();
    }

    private setupBeneficientSearch(): void {
        this.isLoadingBeneficients.set(true);
        this.beneficientService.getActiveList().subscribe({
            next: items => { this.filteredBeneficients.set(items); this.isLoadingBeneficients.set(false); },
            error: () => this.isLoadingBeneficients.set(false),
        });

        this.beneficientCtrl.valueChanges.pipe(
            filter(v => typeof v === 'string'),
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(v => {
                const term = (v as string).trim();
                this.isLoadingBeneficients.set(true);
                return this.beneficientService.getActiveList(term || undefined);
            }),
        ).subscribe({
            next: items => { this.filteredBeneficients.set(items); this.isLoadingBeneficients.set(false); },
            error: () => this.isLoadingBeneficients.set(false),
        });
    }

    private setupCollectorSearch(): void {
        this.isLoadingCollectors.set(true);
        this.collectorService.getActiveList().subscribe({
            next: items => { this.filteredCollectors.set(items); this.isLoadingCollectors.set(false); },
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
            next: items => { this.filteredCollectors.set(items); this.isLoadingCollectors.set(false); },
            error: () => this.isLoadingCollectors.set(false),
        });
    }

    onBeneficientSelected(b: Beneficient): void {
        this.selectedBeneficient = b;
    }

    onCollectorSelected(c: CollectorListItem): void {
        this.selectedCollector = c;
    }

    clearBeneficient(): void {
        this.beneficientCtrl.reset('');
        this.selectedBeneficient = null;
    }

    clearCollector(): void {
        this.collectorCtrl.reset('');
        this.selectedCollector = null;
    }

    onSave(): void {
        if (!this.canSave) return;

        const { amount, currency } = this.form.value;
        const dto: CreateSpecialReceiptDto = {
            beneficientId: this.selectedBeneficient!.id,
            collectorId: this.selectedCollector!.id,
            amount: amount!,
            currency: currency!,
        };

        this.isSaving.set(true);
        this.recibosService.crearReciboEspecial(dto).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                this.snackbar.open('Recibo especial creado correctamente', 'Cerrar', { duration: 5000 });
                this.isSaving.set(false);
                this.resetForm();
            },
            error: (err: SpecialReceiptError) => {
                this.isSaving.set(false);
                if (err.apiError?.type === 'PDF_GENERATION_FAILED') {
                    // El recibo sí se creó del lado del servidor: se limpia el
                    // formulario igual que en el caso exitoso, solo avisando
                    // que el PDF no se pudo generar.
                    this.dialog.open(SpecialReceiptWarningDialogComponent, {
                        data: { message: err.apiError.message ?? 'El recibo se creó, pero no se pudo generar el PDF.' },
                    });
                    this.resetForm();
                }
            },
        });
    }

    resetForm(): void {
        this.form.reset({ currency: 'MXN' });
        this.clearBeneficient();
        this.clearCollector();
    }
}
